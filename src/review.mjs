// Case 01 — review ("nakijken") of weighing tickets that the rules sent to Nazicht or Escalatie.
// Pure functions shared by the review app (power-platform/reviewapp) and the tests: map a Dataverse
// row to the engine's document shape, apply corrections, re-run the rules, decide what a role may do.

import { buildContext, checkDocument } from "./documents.mjs";

export const STATUS = { ontvangen: 100000000, nazicht: 100000002, escalatie: 100000003, geboekt: 100000004, dubbel: 100000005, goedgekeurd: 100000006, afgewezen: 100000007, fout: 100000009 };
export const ROLES = ["administratie", "milieucoördinator"];

/** Engine field → Dataverse column on hv_document. */
export const FIELD_COLUMN = {
  ticketNo: "hv_bonnummer", date: "hv_datum", plate: "hv_plaat", customerNo: "hv_klantnummer", direction: "hv_richting",
  material: "hv_materiaal", gross: "hv_bruto", tare: "hv_tarra", net: "hv_netto", idFormNo: "hv_idformulier", soilRef: "hv_traceerbaarheid",
};
export const FIELD_LABEL = { ticketNo: "Bonnummer", date: "Datum", plate: "Nummerplaat", customerNo: "Klantnummer", direction: "Richting", material: "Materiaal", gross: "Bruto (kg)", tare: "Tarra (kg)", net: "Netto (kg)", idFormNo: "ID-formulier", soilRef: "Traceerbaarheid" };
const NUMERIC = new Set(["gross", "tare", "net"]);

/** Master data in the engine's shape, built from the Dataverse tables Klant, Nummerplaat and Materiaalcode. */
export function masterFromDataverse(klanten, platen, codes) {
  const byKlant = {};
  for (const p of platen) if (p._hv_klant_value) (byKlant[p._hv_klant_value] ??= []).push(p.hv_plaat);
  return {
    customers: klanten.map((k) => ({ customerNo: k.hv_klantnr, name: k.hv_naam, active: !!k.hv_actief, plates: byKlant[k.hv_klantid] ?? [] })),
    hauliers: [{ haulierNo: "V", name: "vervoerders", plates: platen.filter((p) => p.hv_vervoerder).map((p) => p.hv_plaat) }],
    acceptance: {
      accepted: codes.filter((c) => c.hv_soort === 100000000).map((c) => ({ code: c.hv_code, label: c.hv_omschrijving, pricePerTonne: c.hv_prijsperton, needsSoilRef: !!c.hv_bodemref })),
      refused: codes.filter((c) => c.hv_soort === 100000001).map((c) => ({ code: c.hv_code, label: c.hv_omschrijving })),
      products: codes.filter((c) => c.hv_soort === 100000002).map((c) => ({ code: c.hv_code, label: c.hv_omschrijving, pricePerTonne: c.hv_prijsperton })),
    },
  };
}

/** A Dataverse Weegbon row → the document shape checkDocument() expects. */
export function documentFromRow(row) {
  let conf = [];
  try { conf = JSON.parse(row.hv_confidence ?? "[]"); } catch { conf = []; }
  const confidence = Object.fromEntries(conf.map((c) => [c.veld, Number(c.confidence)]));
  const value = (f) => {
    const v = row[FIELD_COLUMN[f]];
    if (f === "direction") return v === 100000000 ? "in" : v === 100000001 ? "uit" : null;
    if (f === "date") return v ? String(v).slice(0, 10) : null;
    return v ?? null;
  };
  const extracted = Object.fromEntries(Object.keys(FIELD_COLUMN).map((f) => [f, { value: value(f), confidence: confidence[f] ?? 1 }]));
  return { id: row.hv_documentnr, received: String(row.hv_ontvangen ?? new Date().toISOString()).slice(0, 16), extracted };
}

/** Apply the reviewer's edits ({field: newValue}); corrected fields count as certain (confidence 1). */
export function applyCorrections(doc, edits) {
  const next = structuredClone(doc);
  for (const [f, raw] of Object.entries(edits)) {
    const v = NUMERIC.has(f) ? (raw === "" || raw === null ? null : Number(raw)) : raw === "" ? null : raw;
    next.extracted[f] = { value: v, confidence: 1 };
  }
  return next;
}

/** Only the edits that really change a value, as an audit trail entry per field. */
export function corrections(doc, edits, { by, at }) {
  return Object.entries(edits)
    .map(([f, raw]) => [f, NUMERIC.has(f) ? Number(raw) : raw, doc.extracted[f]?.value])
    .filter(([, nieuw, oud]) => String(nieuw ?? "") !== String(oud ?? ""))
    .map(([f, nieuw, oud]) => ({ veld: f, oud, nieuw, door: by, op: at }));
}

/** Re-run the rules on the (corrected) document. The duplicate check stays on the server (flow HV-DI-02). */
export function recheck(doc, master) {
  return checkDocument(doc, buildContext(master));
}

/** What a role may do with a ticket in a given status, after the corrections were re-checked. */
export function allowedActions(status, role, result, { acknowledged = false } = {}) {
  const hard = result.findings.filter((f) => f.severity !== "review");
  const soft = result.findings.filter((f) => f.severity === "review");
  if (status === STATUS.escalatie) {
    return role === "milieucoördinator"
      ? { approve: false, reject: true, reason: "Geweigerd materiaal: alleen weigeren. Aanvaarden kan niet via deze app, ook niet na een correctie." }
      : { approve: false, reject: false, reason: "Alleen de milieucoördinator behandelt escalaties." };
  }
  if (status !== STATUS.nazicht) return { approve: false, reject: false, reason: "Deze bon staat niet in nazicht." };
  if (role !== "administratie") return { approve: false, reject: false, reason: "Nazicht is voor de administratie." };
  if (hard.length) return { approve: false, reject: true, reason: `Na correctie nog blokkerend: ${hard.map((f) => f.rule).join(", ")}` };
  if (soft.length && !acknowledged) return { approve: false, reject: true, reason: `Nog open: ${soft.map((f) => f.rule).join(", ")}. Corrigeer, of bevestig dat je het nakeek.` };
  return { approve: true, reject: true, reason: "" };
}

/** The Dataverse update the app sends on approval: corrected columns + status + audit. */
export function approvalPatch(doc, edits, { by, at, note }) {
  const patch = {};
  for (const [f, raw] of Object.entries(edits)) {
    if (f === "direction") patch[FIELD_COLUMN[f]] = raw === "in" ? 100000000 : 100000001;
    else patch[FIELD_COLUMN[f]] = NUMERIC.has(f) ? Number(raw) : raw === "" ? null : raw;
  }
  return { ...patch, hv_status: STATUS.goedgekeurd, hv_reviewer: by, hv_gereviewdop: at, hv_correcties: JSON.stringify(corrections(doc, edits, { by, at })), hv_reviewopmerking: note ?? null };
}
