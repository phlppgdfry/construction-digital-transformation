import { test } from "node:test";
import assert from "node:assert/strict";
import { json, master } from "./helpers.mjs";
import { documentFromRow, applyCorrections, corrections, recheck, allowedActions, approvalPatch, masterFromDataverse, STATUS } from "../src/review.mjs";

const docs = json("data/documents.json").documents;
// A Dataverse row as flow HV-DI-01 leaves it, built from the test document.
const rowOf = (d) => ({
  hv_documentnr: d.id, hv_ontvangen: `${d.received}:00Z`, hv_bonnummer: d.extracted.ticketNo.value, hv_datum: d.extracted.date.value, hv_plaat: d.extracted.plate.value,
  hv_klantnummer: d.extracted.customerNo.value, hv_richting: d.extracted.direction.value === "in" ? 100000000 : 100000001, hv_materiaal: d.extracted.material.value,
  hv_bruto: d.extracted.gross.value, hv_tarra: d.extracted.tare.value, hv_netto: d.extracted.net.value, hv_idformulier: d.extracted.idFormNo.value, hv_traceerbaarheid: d.extracted.soilRef.value,
  hv_confidence: JSON.stringify(Object.entries(d.extracted).map(([veld, v]) => ({ veld, confidence: v.confidence }))),
});
const doc = (id) => documentFromRow(rowOf(docs.find((d) => d.id === id)));

test("a Dataverse row maps back to the engine document and gives the same findings", () => {
  for (const d of docs.filter((x) => !["duplicate"].includes(x.scenario))) {
    const r = recheck(documentFromRow(rowOf(d)), master);
    const direct = recheck(d, master);
    assert.deepEqual(r.findings.map((f) => f.rule), direct.findings.map((f) => f.rule), d.id);
  }
});

test("DOC-006: correcting net 13350 → 18350 clears R03 and allows approval", () => {
  const d = doc("DOC-006");
  assert.ok(recheck(d, master).findings.some((f) => f.rule === "R03"));
  const fixed = recheck(applyCorrections(d, { net: "18350" }), master);
  assert.deepEqual(fixed.findings, []);
  assert.equal(allowedActions(STATUS.nazicht, "administratie", fixed).approve, true);
});

test("an unresolved soft finding needs an explicit acknowledgement", () => {
  const d = doc("DOC-021"); // 45-day-old ticket: R10, not fixable by correction
  const r = recheck(d, master);
  assert.equal(allowedActions(STATUS.nazicht, "administratie", r).approve, false);
  assert.equal(allowedActions(STATUS.nazicht, "administratie", r, { acknowledged: true }).approve, true);
});

test("asbestos can never be approved in the app, not even by the environmental coordinator", () => {
  const r = recheck(doc("DOC-013"), master);
  assert.deepEqual(allowedActions(STATUS.escalatie, "milieucoördinator", r), { approve: false, reject: true, reason: allowedActions(STATUS.escalatie, "milieucoördinator", r).reason });
  assert.equal(allowedActions(STATUS.escalatie, "administratie", r).reject, false);
});

test("correcting a material code to a refused one blocks approval", () => {
  const r = recheck(applyCorrections(doc("DOC-015"), { material: "17 06 05*" }), master);
  const a = allowedActions(STATUS.nazicht, "administratie", r);
  assert.equal(a.approve, false);
  assert.match(a.reason, /R06/);
});

test("corrections record only real changes, with old value, new value, who and when", () => {
  const c = corrections(doc("DOC-006"), { net: "18350", plate: "1-KSL-110" }, { by: "admin@halverdijk.example", at: "2026-10-16T10:00:00Z" });
  assert.deepEqual(c, [{ veld: "net", oud: 13350, nieuw: 18350, door: "admin@halverdijk.example", op: "2026-10-16T10:00:00Z" }]);
});

test("approval patch sets corrected columns, status Goedgekeurd and the audit trail", () => {
  const p = approvalPatch(doc("DOC-006"), { net: "18350" }, { by: "r@x", at: "2026-10-16T10:00:00Z" });
  assert.equal(p.hv_netto, 18350);
  assert.equal(p.hv_status, STATUS.goedgekeurd);
  assert.equal(JSON.parse(p.hv_correcties)[0].veld, "net");
});

test("master data rebuilt from Dataverse rows behaves like the JSON master data", () => {
  const klanten = master.customers.map((c, i) => ({ hv_klantid: `k${i}`, hv_klantnr: c.customerNo, hv_naam: c.name, hv_actief: c.active }));
  const platen = [...master.customers.flatMap((c, i) => c.plates.map((p) => ({ hv_plaat: p, _hv_klant_value: `k${i}`, hv_vervoerder: false }))), ...master.hauliers.flatMap((h) => h.plates.map((p) => ({ hv_plaat: p, _hv_klant_value: null, hv_vervoerder: true })))];
  const codes = [...master.acceptance.accepted.map((a) => ({ hv_code: a.code, hv_soort: 100000000, hv_prijsperton: a.pricePerTonne, hv_bodemref: !!a.needsSoilRef })), ...master.acceptance.refused.map((a) => ({ hv_code: a.code, hv_soort: 100000001 })), ...master.acceptance.products.map((a) => ({ hv_code: a.code, hv_soort: 100000002, hv_prijsperton: a.pricePerTonne }))];
  const m2 = masterFromDataverse(klanten, platen, codes);
  for (const d of docs) assert.deepEqual(recheck(documentFromRow(rowOf(d)), m2).findings.map((f) => f.rule), recheck(documentFromRow(rowOf(d)), master).findings.map((f) => f.rule), d.id);
});
