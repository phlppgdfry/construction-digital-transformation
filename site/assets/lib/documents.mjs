// Case 01 — document intelligence for weighing tickets (weegbonnen) at the recycling yard.
// The extraction step (OCR/AI) is simulated by data/documents.json; this module is the part an
// analyst specifies: which checks run after extraction and what happens to each document.

import { daysBetween } from "./common.mjs";
import { RULEBOOK, param } from "./rules.mjs";

// Thresholds and rule texts come from the rulebook (src/rules.mjs), the single source for engine, flows and docs.
export const CONFIDENCE_THRESHOLD = param("R02");
export const NET_TOLERANCE_KG = param("R03");
export const MAX_GROSS_KG = param("R11");
export const MAX_AGE_DAYS = param("R10");
export const CRITICAL_FIELDS = ["ticketNo", "date", "plate", "customerNo", "direction", "material", "gross", "tare", "net"];

const fmt = (r) => (typeof r.value === "number" ? `${r.name} (${r.value.toLocaleString("nl-BE")}${r.unit.startsWith("confidence") ? "" : ` ${r.unit}`})` : r.name);
export const RULES = RULEBOOK.filter((r) => r.case === "01").map((r) => ({ id: r.code, title: fmt(r), severity: r.severity, why: r.why }));

const SEVERITY_ORDER = { reject: 3, block: 2, review: 1 };

/** Index the master data once so rules stay cheap. */
export function buildContext(master) {
  const customers = new Map(master.customers.map((c) => [c.customerNo, c]));
  const haulierPlates = new Set(master.hauliers.flatMap((h) => h.plates));
  const accepted = new Map(master.acceptance.accepted.map((a) => [a.code, a]));
  const refused = new Map(master.acceptance.refused.map((a) => [a.code, a]));
  const products = new Map(master.acceptance.products.map((a) => [a.code, a]));
  return { customers, haulierPlates, accepted, refused, products, seenTickets: new Set() };
}

const valueOf = (doc, f) => doc.extracted[f]?.value ?? null;
const isEmpty = (v) => v === null || v === undefined || v === "";

/** Run all rules on one document. Pure apart from reading ctx.seenTickets. */
export function checkDocument(doc, ctx) {
  const v = Object.fromEntries(Object.keys(doc.extracted).map((f) => [f, valueOf(doc, f)]));
  const findings = [];
  const add = (rule, message, field = null) => {
    const r = RULES.find((x) => x.id === rule);
    findings.push({ rule, severity: r.severity, message, field });
  };

  const missing = CRITICAL_FIELDS.filter((f) => isEmpty(v[f]));
  if (missing.length) add("R01", `Ontbrekend: ${missing.join(", ")}`, missing[0]);

  for (const f of CRITICAL_FIELDS) {
    const c = doc.extracted[f]?.confidence ?? 0;
    if (!isEmpty(v[f]) && c < CONFIDENCE_THRESHOLD) add("R02", `${f} gelezen met confidence ${c.toFixed(2)}`, f);
  }

  if (![v.gross, v.tare, v.net].some(isEmpty) && Math.abs(v.gross - v.tare - v.net) > NET_TOLERANCE_KG) {
    add("R03", `Netto ${v.net} kg ≠ bruto ${v.gross} − tarra ${v.tare} = ${v.gross - v.tare} kg`, "net");
  }

  const customer = ctx.customers.get(v.customerNo);
  if (!isEmpty(v.customerNo) && !customer) add("R04", `Klantnummer ${v.customerNo} bestaat niet`, "customerNo");
  else if (customer && !customer.active) add("R04", `Klant ${v.customerNo} is geblokkeerd`, "customerNo");

  if (customer && !isEmpty(v.plate) && !customer.plates.includes(v.plate) && !ctx.haulierPlates.has(v.plate)) {
    add("R05", `Nummerplaat ${v.plate} niet gekend bij ${customer.name} of een vervoerder`, "plate");
  }

  if (!isEmpty(v.material)) {
    if (v.direction === "in") {
      if (ctx.refused.has(v.material)) add("R06", `${v.material} (${ctx.refused.get(v.material).label}) wordt niet aanvaard`, "material");
      else if (!ctx.accepted.has(v.material)) add("R06", `${v.material} staat niet op de acceptatielijst`, "material");
    } else if (!ctx.products.has(v.material)) {
      add("R06", `Uitgaand product ${v.material} onbekend`, "material");
    }
  }

  if (v.direction === "in" && isEmpty(v.idFormNo) && !ctx.refused.has(v.material)) {
    add("R07", "Geen nummer van het identificatieformulier", "idFormNo");
  }

  if (v.direction === "in" && ctx.accepted.get(v.material)?.needsSoilRef && isEmpty(v.soilRef)) {
    add("R08", "Bodem zonder traceerbaarheidsreferentie", "soilRef");
  }

  if (!isEmpty(v.ticketNo) && ctx.seenTickets.has(v.ticketNo)) add("R09", `Bon ${v.ticketNo} is al ontvangen`, "ticketNo");

  if (!isEmpty(v.date)) {
    const age = daysBetween(v.date, doc.received.slice(0, 10));
    if (age < 0) add("R10", `Datum ${v.date} ligt na ontvangst`, "date");
    else if (age > MAX_AGE_DAYS) add("R10", `Bon is ${age} dagen oud`, "date");
  }

  if (!isEmpty(v.gross) && v.gross > MAX_GROSS_KG) add("R11", `Bruto ${v.gross} kg > ${MAX_GROSS_KG} kg`, "gross");

  const worst = findings.reduce((w, f) => Math.max(w, SEVERITY_ORDER[f.severity]), 0);
  const decision = worst === 3 ? "reject" : worst === 2 ? "escalate" : worst === 1 ? "review" : "auto";
  return { id: doc.id, values: v, findings, decision };
}

/** Process documents in arrival order; every non-rejected ticket number is remembered. */
export function processBatch(docs, master) {
  const ctx = buildContext(master);
  return docs.map((doc) => {
    const result = checkDocument(doc, ctx);
    if (result.decision !== "reject" && result.values.ticketNo) ctx.seenTickets.add(result.values.ticketNo);
    return result;
  });
}

/** Fields read correctly versus the ground truth, over every field of every document. */
export function fieldAccuracy(docs) {
  let total = 0;
  let correct = 0;
  const wrong = [];
  for (const d of docs) {
    for (const f of Object.keys(d.truth)) {
      total += 1;
      if (d.extracted[f]?.value === d.truth[f]) correct += 1;
      else wrong.push({ id: d.id, field: f, read: d.extracted[f]?.value, truth: d.truth[f] });
    }
  }
  return { total, correct, rate: correct / total, wrong };
}

/** Documents that would be posted automatically while holding a wrong value: the residual risk. */
export function silentErrors(docs, results) {
  return results
    .filter((r) => r.decision === "auto")
    .flatMap((r) => {
      const d = docs.find((x) => x.id === r.id);
      return Object.keys(d.truth).filter((f) => d.extracted[f]?.value !== d.truth[f]).map((f) => ({ id: d.id, field: f }));
    });
}

/** The ERP posting the flow sends once a ticket is approved (automatically or by a reviewer). */
export function erpPayload(values, master, { approvedBy = "auto", correlationId } = {}) {
  const ctx = buildContext(master);
  const priceRow = values.direction === "in" ? ctx.accepted.get(values.material) : ctx.products.get(values.material);
  const tonnes = Math.round(values.net) / 1000;
  return {
    correlationId: correlationId ?? `wb-${values.ticketNo}`,
    weighingTicket: values.ticketNo,
    postingDate: values.date,
    customerNo: values.customerNo,
    vehiclePlate: values.plate,
    direction: values.direction === "in" ? "INBOUND_WASTE" : "OUTBOUND_PRODUCT",
    itemCode: values.material,
    quantityTonnes: tonnes,
    unitPrice: priceRow?.pricePerTonne ?? null,
    lineAmount: priceRow ? Math.round(tonnes * priceRow.pricePerTonne * 100) / 100 : null,
    wasteIdForm: values.idFormNo ?? null,
    soilTraceRef: values.soilRef ?? null,
    approvedBy,
    source: "document-intelligence",
  };
}
