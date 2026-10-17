// Case 02 — end-to-end damage claims (schadeclaims) for a construction contractor.
// Validation of the field report, triage, routing, approval chain, state machine, SLA's and
// the offline queue of the site app. Same code runs in the tests and in the browser demo.

import { addHours, hoursBetween, median, mean } from "./common.mjs";
import { param } from "./rules.mjs";

export const CATEGORIES = {
  "eigen-materieel": { label: "Schade aan eigen materieel", assessor: "Fleetmanager" },
  "gehuurd-materieel": { label: "Schade aan gehuurd materieel", assessor: "Fleetmanager", needs: ["rentalRef"] },
  "derden-schade": { label: "Schade aan eigendom van derden", assessor: "Claims & verzekeringen", liability: true },
  "nutsleiding": { label: "Schade aan kabel of leiding", assessor: "Claims & verzekeringen", liability: true, needs: ["klipRef", "utilityType", "utilityOwner"] },
  "eigen-werf": { label: "Schade aan eigen werk of werfinrichting", assessor: "Projectleider" },
};

export const UTILITY_TYPES = ["gas", "elektriciteit", "water", "telecom", "riolering"];

/** Approval thresholds (decision table DT-02). Amounts in euro, estimated cost to Halverdijk. */
export const APPROVAL_TABLE = [
  { max: param("DT-02.1"), chain: ["Projectleider"] },
  { max: param("DT-02.2"), chain: ["Projectleider", "Afdelingsverantwoordelijke"] },
  { max: Infinity, chain: ["Projectleider", "Afdelingsverantwoordelijke", "Directie"] },
];
export const INSURER_THRESHOLD = param("VZ-01");
export const INSURER_DEADLINE_DAYS = param("VZ-02");
export const MEDIUM_FROM = param("ER-02");
export const SLA_HOURS = { kritiek: param("SLA-K"), hoog: param("SLA-H"), middel: param("SLA-M"), laag: param("SLA-L") };

export const STATES = ["gemeld", "in-beoordeling", "info-gevraagd", "ter-goedkeuring", "goedgekeurd", "afgewezen", "in-afhandeling", "afgesloten"];
export const TRANSITIONS = {
  "gemeld": { assign: "in-beoordeling" },
  "in-beoordeling": { requestInfo: "info-gevraagd", submitForApproval: "ter-goedkeuring", reject: "afgewezen" },
  "info-gevraagd": { infoReceived: "in-beoordeling" },
  "ter-goedkeuring": { approve: "ter-goedkeuring|goedgekeurd", reject: "afgewezen" },
  "goedgekeurd": { startHandling: "in-afhandeling" },
  "in-afhandeling": { close: "afgesloten" },
  "afgewezen": { close: "afgesloten" },
  "afgesloten": {},
};

/** Field validation of the report from the site app. Returns blocking errors and warnings. */
export function validateReport(r, master) {
  const errors = [];
  const warnings = [];
  const err = (field, msg) => errors.push({ field, msg });
  const project = master.projects.find((p) => p.projectNo === r.projectNo);
  if (!project) err("projectNo", "Kies een werf");
  else if (!project.active) err("projectNo", `Werf ${project.projectNo} is afgesloten; meld via de afdelingsverantwoordelijke`);
  if (!r.occurredAt) err("occurredAt", "Tijdstip van de schade ontbreekt");
  if (!r.location || (!r.location.text && !r.location.gps)) err("location", "Locatie ontbreekt (GPS of omschrijving)");
  if (!CATEGORIES[r.category]) err("category", "Kies een categorie");
  if (!r.description || r.description.trim().length < 20) err("description", "Beschrijf in minstens 20 tekens wat er gebeurde");
  if (!r.photos || r.photos.length < 1) err("photos", "Minstens één foto");
  if (r.estimatedAmount === undefined || r.estimatedAmount === null || r.estimatedAmount < 0) err("estimatedAmount", "Geef een ruwe schatting (mag 0 zijn als onbekend)");
  if (r.injuries) err("injuries", "Personenletsel: stop hier en volg de procedure arbeidsongeval (preventieadviseur). Dit formulier is enkel voor materiële schade.");
  if (r.thirdParty && !r.thirdPartyName) err("thirdPartyName", "Naam van de betrokken derde ontbreekt");
  for (const f of CATEGORIES[r.category]?.needs ?? []) if (!r[f]) err(f, `Verplicht voor deze categorie: ${f}`);
  if (r.category === "nutsleiding" && r.utilityType && !UTILITY_TYPES.includes(r.utilityType)) err("utilityType", "Onbekend type leiding");
  if (r.category === "nutsleiding" && !r.ownerNotified) warnings.push({ field: "ownerNotified", msg: "Verwittig de leidingbeheerder nu telefonisch. De melding wordt als kritiek opgevolgd tot dat bevestigd is." });
  if (r.category === "gehuurd-materieel") warnings.push({ field: "rentalRef", msg: "Verhuurder wordt automatisch op de hoogte gebracht na beoordeling." });
  return { ok: errors.length === 0, errors, warnings };
}

export function severityOf(r) {
  if (r.category === "nutsleiding" && (["gas", "elektriciteit"].includes(r.utilityType) || !r.ownerNotified)) return "kritiek";
  if (r.estimatedAmount >= INSURER_THRESHOLD) return "hoog";
  if (r.estimatedAmount >= MEDIUM_FROM || r.thirdParty) return "middel";
  return "laag";
}

export function approvalChain(r) {
  const base = APPROVAL_TABLE.find((row) => r.estimatedAmount <= row.max).chain;
  const assessor = CATEGORIES[r.category].assessor;
  return assessor === "Projectleider" ? base : [assessor, ...base];
}

/** Triage: who owns the file, who must be informed, which deadlines run. */
export function triage(r, master) {
  const project = master.projects.find((p) => p.projectNo === r.projectNo);
  const cat = CATEGORIES[r.category];
  const severity = severityOf(r);
  const notify = [project?.manager ?? "Projectleider"];
  if (cat.liability || r.thirdParty) notify.push("Claims & verzekeringen");
  if (r.category === "gehuurd-materieel") notify.push("Verhuurder (extern)");
  if (r.category === "nutsleiding") notify.push("Leidingbeheerder (extern)", "Preventieadviseur");
  if (severity === "kritiek") notify.push("Afdelingsverantwoordelijke");
  const insurer = r.estimatedAmount >= INSURER_THRESHOLD || !!cat.liability || !!r.thirdParty;
  return {
    severity,
    owner: cat.assessor === "Projectleider" ? project?.manager ?? "Projectleider" : cat.assessor,
    notify: [...new Set(notify)],
    approvalChain: approvalChain(r),
    insurerDeclaration: insurer,
    recoveryTrack: !!r.thirdPartyLiable,
    slaHours: SLA_HOURS[severity],
  };
}

/** Create the claim file from a valid report: number, triage, deadlines and the first timeline events. */
export function createClaim(r, master, { now, seq }) {
  const v = validateReport(r, master);
  if (!v.ok) throw new Error(`Ongeldige melding: ${v.errors.map((e) => e.field).join(", ")}`);
  const t = triage(r, master);
  const claimNo = `SCH-26-${String(seq).padStart(4, "0")}`;
  return {
    claimNo,
    clientId: r.clientId,
    report: r,
    ...t,
    state: "in-beoordeling",
    approvals: [],
    deadlines: {
      assessment: addHours(now, t.slaHours),
      insurer: t.insurerDeclaration ? addHours(r.occurredAt, INSURER_DEADLINE_DAYS * 24) : null,
    },
    timeline: [
      { at: now, event: "gemeld", by: r.reporter, note: `via ${r.channel ?? "werfapp"}` },
      { at: now, event: "dossier aangemaakt", by: "Power Automate", note: `${claimNo}, ernst ${t.severity}, eigenaar ${t.owner}` },
      { at: now, event: "verwittigd", by: "Power Automate", note: t.notify.join(", ") },
    ],
  };
}

/** Apply an action by a role. Returns a new claim object; throws on an illegal transition. */
export function transition(claim, action, { by, at, note } = {}) {
  const target = TRANSITIONS[claim.state]?.[action];
  if (!target) throw new Error(`Actie '${action}' kan niet in status '${claim.state}'`);
  const next = { ...claim, approvals: [...claim.approvals], timeline: [...claim.timeline] };
  if (action === "approve") {
    const expected = claim.approvalChain[claim.approvals.length];
    if (by !== expected) throw new Error(`Goedkeuring verwacht van ${expected}, niet van ${by}`);
    next.approvals.push({ by, at });
    next.state = next.approvals.length === claim.approvalChain.length ? "goedgekeurd" : "ter-goedkeuring";
  } else {
    if (action === "submitForApproval" && !claim.report.photos?.length) throw new Error("Geen foto's: eerst info opvragen");
    next.state = target;
  }
  next.timeline.push({ at, event: action, by, note: note ?? "" });
  return next;
}

export function slaStatus(claim, now) {
  const left = hoursBetween(now, claim.deadlines.assessment);
  if (!["in-beoordeling", "info-gevraagd"].includes(claim.state)) return { status: "n.v.t.", hoursLeft: null };
  return { status: left < 0 ? "overschreden" : left < claim.slaHours * 0.25 ? "dreigt" : "op tijd", hoursLeft: Math.round(left) };
}

/** Offline queue of the site app: reports are stored with a client id and synced later, idempotently. */
export function syncQueue(queue, server, master, { now }) {
  const results = [];
  for (const r of queue) {
    const existing = server.claims.find((c) => c.clientId === r.clientId);
    if (existing) {
      results.push({ clientId: r.clientId, status: "al ontvangen", claimNo: existing.claimNo });
      continue;
    }
    const claim = createClaim(r, master, { now, seq: server.nextSeq++ });
    server.claims.push(claim);
    results.push({ clientId: r.clientId, status: "aangemaakt", claimNo: claim.claimNo });
  }
  return results;
}

/** Baseline KPIs from the AS-IS Excel register (data/claims-history.json). */
export function baseline(history) {
  const n = history.length;
  const insured = history.filter((c) => c.daysToInsurer !== null);
  return {
    n,
    byChannel: Object.fromEntries(["telefoon", "mail", "papier"].map((ch) => [ch, history.filter((c) => c.channel === ch).length])),
    medianDaysToRegister: median(history.map((c) => c.daysToRegister)),
    incompleteShare: history.filter((c) => c.incompleteFirstReport).length / n,
    avgFollowUps: mean(history.map((c) => c.followUpContacts)),
    withoutPhotoShare: history.filter((c) => c.photos === 0).length / n,
    medianDaysToClose: median(history.map((c) => c.daysToClose)),
    insuredCount: insured.length,
    lateInsurerCount: insured.filter((c) => c.daysToInsurer > INSURER_DEADLINE_DAYS).length,
    totalAmount: history.reduce((a, c) => a + c.amount, 0),
    recoverableCount: history.filter((c) => ["derden-schade", "nutsleiding"].includes(c.category)).length,
  };
}

/** Sample reports used by the demo and the tests (one per route). */
export const SAMPLE_REPORTS = [
  { clientId: "c-001", reporter: "Werfleider W-2602", projectNo: "W-2602", occurredAt: "2026-10-12T09:40", location: { gps: "51.1702,2.8361", text: "Kreekstraat ter hoogte van nr. 14" }, category: "nutsleiding", utilityType: "gas", utilityOwner: "Distributienetbeheerder (fictief)", klipRef: "KLIP-2026-0412-7781", ownerNotified: true, description: "Graafmachine raakte een lagedruk-gasleiding op 60 cm diepte, 40 cm naast de ligging op het KLIP-plan. Zone afgezet.", photos: ["foto-1.jpg", "foto-2.jpg"], estimatedAmount: 6800, thirdParty: true, thirdPartyName: "Distributienetbeheerder (fictief)", thirdPartyLiable: false, injuries: false },
  { clientId: "c-002", reporter: "Werfleider W-2604", projectNo: "W-2604", occurredAt: "2026-10-11T14:05", location: { text: "Bedrijventerrein Haven-Oost, kavel 7" }, category: "eigen-materieel", description: "Hydraulische leiding van rupskraan RK-14 gescheurd bij het laden van breekpuin. Machine stilgelegd.", photos: ["foto-1.jpg"], estimatedAmount: 1900, thirdParty: false, injuries: false },
  { clientId: "c-003", reporter: "Werfleider W-2603", projectNo: "W-2603", occurredAt: "2026-10-10T11:20", location: { text: "Schoolstraat 3, IJzermonde" }, category: "derden-schade", description: "Bij selectieve sloop is een stuk gevelsteen op de carport van de buren gevallen. Dak beschadigd, geen personen in de buurt.", photos: ["foto-1.jpg", "foto-2.jpg", "foto-3.jpg"], estimatedAmount: 4200, thirdParty: true, thirdPartyName: "Bewoner Schoolstraat 5", thirdPartyLiable: false, injuries: false },
  { clientId: "c-004", reporter: "Werfleider W-2601", projectNo: "W-2601", occurredAt: "2026-10-09T07:55", location: { text: "Zeedijk, werfzone 2" }, category: "gehuurd-materieel", rentalRef: "HUUR-88213", description: "Gehuurde trilplaat in de nacht beschadigd door een vrachtwagen van een onderaannemer die achteruit reed.", photos: ["foto-1.jpg"], estimatedAmount: 2100, thirdParty: true, thirdPartyName: "Onderaannemer Transport (fictief)", thirdPartyLiable: true, injuries: false },
  { clientId: "c-005", reporter: "Werfleider W-2604", projectNo: "W-2604", occurredAt: "2026-10-12T16:30", location: { text: "Haven-Oost, toegangsweg" }, category: "eigen-materieel", description: "Kantelde dumper bij het rijden over een niet-verdichte zone, cabine en hydrauliek zwaar beschadigd. Bestuurder ongedeerd.", photos: ["foto-1.jpg", "foto-2.jpg"], estimatedAmount: 27500, thirdParty: false, injuries: false },
];
