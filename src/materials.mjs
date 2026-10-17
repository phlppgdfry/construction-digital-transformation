// Case 03 — material requests from site managers: validation, stock allocation over depots,
// budget check, approval routing (decision table DT-03), ERP messages and a retrying outbox.

import { hoursBetween, stableKey, addHours, parse } from "./common.mjs";
import { param } from "./rules.mjs";

export const RUSH_HOURS = param("SP-01");
export const AUTO_APPROVE_MAX = param("DT-03.3");
export const PL_APPROVE_MAX = param("DT-03.2");
const eur = (n) => `€${n.toLocaleString("nl-BE")}`;
export const RETRY_MINUTES = [1, 5, 15, 60, 240];
export const RUSH_REASONS = ["onvoorziene werfsituatie", "planning gewijzigd door opdrachtgever", "eerdere levering onvolledig", "vergeten te bestellen"];

export function index(master) {
  return {
    catalog: new Map(master.catalog.map((c) => [c.itemNo, c])),
    projects: new Map(master.projects.map((p) => [p.projectNo, p])),
  };
}

/** Available quantity per depot: on hand minus reservations. */
export function stockState(master) {
  return master.stock.map((s) => ({ ...s, available: s.madeToOrder ? Infinity : s.onHand - s.reserved }));
}

export function validateRequest(req, master, now) {
  const ix = index(master);
  const errors = [];
  const project = ix.projects.get(req.projectNo);
  if (!project) errors.push({ field: "projectNo", msg: "Onbekende werf" });
  else if (!project.active) errors.push({ field: "projectNo", msg: `Werf ${req.projectNo} is afgesloten` });
  if (!req.deliverAt) errors.push({ field: "deliverAt", msg: "Gewenste leverdatum ontbreekt" });
  else if (hoursBetween(now, req.deliverAt) < 0) errors.push({ field: "deliverAt", msg: "Leverdatum ligt in het verleden" });
  if (!req.lines?.length) errors.push({ field: "lines", msg: "Minstens één lijn" });
  for (const [i, l] of (req.lines ?? []).entries()) {
    if (!ix.catalog.has(l.itemNo)) errors.push({ field: `lines[${i}].itemNo`, msg: `Artikel ${l.itemNo} niet in catalogus` });
    if (!(l.qty > 0)) errors.push({ field: `lines[${i}].qty`, msg: "Hoeveelheid moet groter zijn dan 0" });
  }
  if (isRush(req, now) && !RUSH_REASONS.includes(req.rushReason)) errors.push({ field: "rushReason", msg: "Spoedaanvraag: kies een reden" });
  return { ok: errors.length === 0, errors };
}

export function isRush(req, now) {
  return !!req.deliverAt && hoursBetween(now, req.deliverAt) < RUSH_HOURS;
}

const isWeekend = (iso) => [0, 6].includes(parse(iso).getUTCDay());

/** Allocate one line over depots, nearest first. Mutates `stock` (the caller passes a copy). */
export function allocateLine(line, project, master, stock, deliverAt) {
  const item = master.catalog.find((c) => c.itemNo === line.itemNo);
  const out = { ...line, label: item.label, unit: item.unit, unitCost: item.unitCost, category: item.category, allocations: [], shortfall: 0, purchase: 0, notes: [] };
  if (item.weekdaysOnly && deliverAt && isWeekend(deliverAt)) out.notes.push("Asfaltcentrale draait niet in het weekend: kies een weekdag");
  if (item.source === "extern") {
    out.purchase = line.qty;
    if (item.leadDays) out.notes.push(`Externe levertijd ${item.leadDays} werkdag(en)`);
  } else {
    let need = line.qty;
    const depots = stock
      .filter((s) => s.itemNo === line.itemNo && s.available > 0)
      .sort((a, b) => (project.depotKm[a.depotNo] ?? 99) - (project.depotKm[b.depotNo] ?? 99));
    for (const s of depots) {
      if (need <= 0) break;
      const take = Math.min(need, s.available);
      s.available -= take;
      need -= take;
      out.allocations.push({ depotNo: s.depotNo, qty: take, km: project.depotKm[s.depotNo] });
    }
    out.shortfall = need;
    if (need > 0) out.notes.push(`Tekort ${need} ${item.unit}: aanvullen via aankoop of productieplanning`);
  }
  if (item.recycledAlternative) {
    const alt = master.catalog.find((c) => c.itemNo === item.recycledAlternative);
    const altAvail = stock.filter((s) => s.itemNo === alt.itemNo).reduce((a, s) => a + s.available, 0);
    if (altAvail >= line.qty) out.alternative = { itemNo: alt.itemNo, label: alt.label, saving: Math.round((item.unitCost - alt.unitCost) * line.qty), note: "Alleen gebruiken als het bestek dit toelaat (beslissing projectleider)." };
  }
  out.value = Math.round(line.qty * item.unitCost * 100) / 100;
  return out;
}

/** Decision table DT-03 (first matching row wins). Mirrored in artefacts/power-fx/dt-03-route.fx. */
export function approvalRoute({ value, overBudget, purchase }) {
  if (overBudget) return { approvers: ["Projectleider", "Afdelingsverantwoordelijke"], rule: "DT-03.1 budget overschreden" };
  if (value > PL_APPROVE_MAX) return { approvers: ["Projectleider", "Afdelingsverantwoordelijke"], rule: `DT-03.2 waarde > ${eur(PL_APPROVE_MAX)}` };
  if (value > AUTO_APPROVE_MAX || purchase) return { approvers: ["Projectleider"], rule: purchase ? "DT-03.3 aankoop nodig" : `DT-03.3 waarde > ${eur(AUTO_APPROVE_MAX)}` };
  return { approvers: [], rule: `DT-03.4 automatisch: ≤ ${eur(AUTO_APPROVE_MAX)}, binnen budget, op voorraad` };
}

/** Full evaluation of a request: allocation, budget, rush, approval route. */
export function evaluate(req, master, now, stock = stockState(master)) {
  const ix = index(master);
  const project = ix.projects.get(req.projectNo);
  const lines = req.lines.map((l) => allocateLine(l, project, master, stock, req.deliverAt));
  const value = Math.round(lines.reduce((a, l) => a + l.value, 0) * 100) / 100;
  const byCat = {};
  for (const l of lines) byCat[l.category] = (byCat[l.category] ?? 0) + l.value;
  const budget = Object.entries(byCat).map(([category, requested]) => {
    const remaining = project.budget[category] ?? 0;
    return { category, requested: Math.round(requested), remaining, over: requested > remaining };
  });
  const overBudget = budget.some((b) => b.over);
  const purchase = lines.some((l) => l.purchase > 0 || l.shortfall > 0);
  const rush = isRush(req, now);

  const { approvers, rule } = approvalRoute({ value, overBudget, purchase });

  const informs = ["Werfplanning"];
  if (purchase) informs.push("Aankoop");
  if (rush) informs.push("Transportplanning (spoed)");

  return {
    requestNo: req.requestNo,
    projectNo: req.projectNo,
    lines, value, budget, overBudget, purchase, rush,
    approval: { route: approvers.length ? "goedkeuring" : "automatisch", approvers, rule },
    informs,
    alternatives: lines.filter((l) => l.alternative).map((l) => ({ itemNo: l.itemNo, ...l.alternative })),
  };
}

/** ERP messages once the request is approved: one reservation per depot allocation, one purchase requisition per external line. */
export function erpMessages(evaluation, req) {
  const msgs = [];
  for (const l of evaluation.lines) {
    for (const a of l.allocations) {
      msgs.push({ type: "reservation", idempotencyKey: stableKey(req.requestNo, l.itemNo, a.depotNo, a.qty), body: { requestNo: req.requestNo, projectNo: req.projectNo, itemNo: l.itemNo, depotNo: a.depotNo, quantity: a.qty, unit: l.unit, requiredDate: req.deliverAt } });
    }
    const buy = l.purchase + l.shortfall;
    if (buy > 0) msgs.push({ type: "purchaseRequisition", idempotencyKey: stableKey(req.requestNo, l.itemNo, "PR", buy), body: { requestNo: req.requestNo, projectNo: req.projectNo, itemNo: l.itemNo, quantity: buy, unit: l.unit, requiredDate: req.deliverAt } });
  }
  return msgs;
}

/**
 * Outbox delivery against an ERP that may be down. `erpUp(minute)` tells whether the ERP answers
 * at a given minute. Each message is retried on RETRY_MINUTES; after the last attempt it goes to
 * the dead-letter list, which opens a ticket for functional support. The ERP de-duplicates on the
 * idempotency key, so a retry after a lost response never books twice.
 */
export function deliverOutbox(messages, erpUp, { erpSeen = new Set() } = {}) {
  const log = [];
  const delivered = [];
  const dead = [];
  for (const m of messages) {
    let t = 0;
    let done = false;
    for (let attempt = 0; attempt <= RETRY_MINUTES.length; attempt++) {
      if (erpUp(t)) {
        const duplicate = erpSeen.has(m.idempotencyKey);
        erpSeen.add(m.idempotencyKey);
        log.push({ key: m.idempotencyKey, minute: t, attempt: attempt + 1, result: duplicate ? "200 al geboekt (idempotent)" : "201 geboekt" });
        delivered.push({ ...m, minute: t, attempts: attempt + 1 });
        done = true;
        break;
      }
      log.push({ key: m.idempotencyKey, minute: t, attempt: attempt + 1, result: "503 ERP niet bereikbaar" });
      if (attempt < RETRY_MINUTES.length) t += RETRY_MINUTES[attempt];
    }
    if (!done) dead.push({ ...m, attempts: RETRY_MINUTES.length + 1, action: "ticket functioneel beheer" });
  }
  return { delivered, dead, log };
}

/** Replay the AS-IS history through the TO-BE rules, each request against the opening stock. */
export function replay(history, master, now) {
  const results = history.map((h) => {
    const req = { requestNo: h.requestNo, projectNo: h.projectNo, lines: h.lines, deliverAt: addHours(now, h.noticeHours) };
    return { history: h, evaluation: evaluate(req, master, now) };
  });
  const lines = results.flatMap((r) => r.evaluation.lines);
  const internalLines = lines.filter((l) => master.catalog.find((c) => c.itemNo === l.itemNo).source === "intern");
  return {
    n: results.length,
    auto: results.filter((r) => r.evaluation.approval.route === "automatisch").length,
    pl: results.filter((r) => r.evaluation.approval.approvers.length === 1).length,
    plAndDept: results.filter((r) => r.evaluation.approval.approvers.length === 2).length,
    rush: results.filter((r) => r.evaluation.rush).length,
    withPurchase: results.filter((r) => r.evaluation.purchase).length,
    overBudget: results.filter((r) => r.evaluation.overBudget).length,
    lines: lines.length,
    internalLines: internalLines.length,
    internalCoveredLines: internalLines.filter((l) => l.shortfall === 0).length,
    alternatives: lines.filter((l) => l.alternative).length,
    alternativeSaving: lines.filter((l) => l.alternative).reduce((a, l) => a + l.alternative.saving, 0),
    results,
  };
}

export function baseline(history) {
  const n = history.length;
  const sorted = history.map((h) => h.handlingHours).sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  return {
    n,
    byChannel: Object.fromEntries(["telefoon", "mail", "whatsapp"].map((c) => [c, history.filter((h) => h.channel === c).length])),
    rushShare: history.filter((h) => h.noticeHours < RUSH_HOURS).length / n,
    medianHandlingHours: median,
    wrongShare: history.filter((h) => h.wrongItemOrQty).length / n,
    lateShare: history.filter((h) => h.deliveredLate).length / n,
    lateRushShare: history.filter((h) => h.deliveredLate && h.noticeHours < RUSH_HOURS).length / Math.max(1, history.filter((h) => h.noticeHours < RUSH_HOURS).length),
  };
}

export const SAMPLE_REQUESTS = [
  { requestNo: "MA-26-0101", projectNo: "W-2604", requester: "Werfleider W-2604", deliverAt: "2026-10-15T07:00", lines: [{ itemNo: "MG-031", qty: 240 }, { itemNo: "KB-160", qty: 60 }] },
  { requestNo: "MA-26-0102", projectNo: "W-2602", requester: "Werfleider W-2602", deliverAt: "2026-10-13T07:00", rushReason: "eerdere levering onvolledig", lines: [{ itemNo: "RB-315", qty: 24 }, { itemNo: "ZS-02", qty: 30 }] },
  { requestNo: "MA-26-0103", projectNo: "W-2601", requester: "Werfleider W-2601", deliverAt: "2026-10-16T06:30", lines: [{ itemNo: "SB-F45", qty: 12 }, { itemNo: "HK-350", qty: 20 }] },
  { requestNo: "MA-26-0104", projectNo: "W-2603", requester: "Werfleider W-2603", deliverAt: "2026-10-19T07:00", lines: [{ itemNo: "PG-031", qty: 180 }] },
];
