import { test } from "node:test";
import assert from "node:assert/strict";
import { json, master } from "./helpers.mjs";
import { processBatch, fieldAccuracy, silentErrors, erpPayload, buildContext, checkDocument, RULES } from "../src/documents.mjs";

const docs = json("data/documents.json").documents;
const results = processBatch(docs, master);
const byId = Object.fromEntries(results.map((r) => [r.id, r]));
const scenario = (s) => docs.filter((d) => d.scenario === s).map((d) => byId[d.id]);

test("the test set has 30 documents with the designed outcome mix", () => {
  const count = (d) => results.filter((r) => r.decision === d).length;
  assert.equal(results.length, 30);
  assert.deepEqual({ auto: count("auto"), review: count("review"), escalate: count("escalate"), reject: count("reject") }, { auto: 20, review: 8, escalate: 1, reject: 1 });
});

test("every clean ticket goes straight through", () => {
  for (const r of [...scenario("clean"), ...scenario("haulier"), ...scenario("soil-with-ref")]) {
    assert.equal(r.decision, "auto", `${r.id}: ${JSON.stringify(r.findings)}`);
  }
});

const expectations = {
  "low-confidence": ["review", "R02"],
  "net-misread": ["review", "R03"],
  "unknown-customer": ["review", "R04"],
  "plate-not-linked": ["review", "R05"],
  "asbestos": ["escalate", "R06"],
  "missing-idform": ["review", "R07"],
  "soil-without-ref": ["review", "R08"],
  "duplicate": ["reject", "R09"],
  "old-ticket": ["review", "R10"],
  "overload": ["review", "R11"],
};
for (const [s, [decision, rule]] of Object.entries(expectations)) {
  test(`${s} → ${decision} via ${rule}`, () => {
    const [r] = scenario(s);
    assert.equal(r.decision, decision);
    assert.ok(r.findings.some((f) => f.rule === rule), JSON.stringify(r.findings));
  });
}

test("a confident misread (8 read as 3) is caught by the arithmetic rule, not by confidence", () => {
  const [r] = scenario("net-misread");
  assert.deepEqual(r.findings.map((f) => f.rule), ["R03"]);
});

test("asbestos is never posted automatically and does not also ask for an ID form", () => {
  const [r] = scenario("asbestos");
  assert.deepEqual(r.findings.map((f) => f.rule), ["R06"]);
});

test("field accuracy and the one silent error are reported honestly", () => {
  const acc = fieldAccuracy(docs);
  assert.equal(acc.total, 330);
  assert.equal(acc.wrong.length, 4);
  const silent = silentErrors(docs, results);
  assert.deepEqual(silent, [{ id: "DOC-025", field: "plate" }]);
});

test("the duplicate check remembers tickets in arrival order", () => {
  const ctx = buildContext(master);
  const first = checkDocument(docs[3], ctx);
  ctx.seenTickets.add(first.values.ticketNo);
  assert.equal(checkDocument(docs[3], ctx).decision, "reject");
});

test("ERP payload carries tonnes, price and traceability references", () => {
  const soil = docs.find((d) => d.scenario === "soil-with-ref");
  const p = erpPayload(byId[soil.id].values, master);
  assert.equal(p.direction, "INBOUND_WASTE");
  assert.equal(p.itemCode, "17 05 04");
  assert.equal(p.soilTraceRef, "TR-2026-018342");
  assert.equal(p.quantityTonnes, soil.truth.net / 1000);
  assert.equal(p.unitPrice, 14);
  assert.equal(p.correlationId, `wb-${soil.truth.ticketNo}`);
});

test("every rule fires at least once on the test set", () => {
  for (const rule of RULES) assert.ok(results.some((r) => r.findings.some((f) => f.rule === rule.id)) || rule.id === "R01", rule.id);
});

test("a missing field triggers R01", () => {
  const d = structuredClone(docs[0]);
  d.extracted.plate = { value: null, confidence: 0 };
  const r = checkDocument(d, buildContext(master));
  assert.equal(r.decision, "review");
  assert.ok(r.findings.some((f) => f.rule === "R01"));
});
