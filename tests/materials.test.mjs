import { test } from "node:test";
import assert from "node:assert/strict";
import { json, master, NOW } from "./helpers.mjs";
import { validateRequest, evaluate, erpMessages, deliverOutbox, replay, baseline, isRush, SAMPLE_REQUESTS, RETRY_MINUTES } from "../src/materials.mjs";

const [granulate, rush, signage, primary] = SAMPLE_REQUESTS;

test("sample requests are valid", () => {
  for (const r of SAMPLE_REQUESTS) assert.ok(validateRequest(r, master, NOW).ok, r.requestNo);
});

test("a rush request (< 48 h) needs a reason", () => {
  assert.ok(isRush(rush, NOW));
  const v = validateRequest({ ...rush, rushReason: undefined }, master, NOW);
  assert.ok(v.errors.some((e) => e.field === "rushReason"));
});

test("granulate is taken from the nearest depot first", () => {
  const e = evaluate(granulate, master, NOW);
  const mg = e.lines.find((l) => l.itemNo === "MG-031");
  assert.equal(mg.allocations[0].depotNo, "DEP-OOST"); // 4 km
  assert.equal(mg.allocations[0].qty, 160);
  assert.equal(mg.allocations[1].depotNo, "REC-BRK"); // 6 km
  assert.equal(mg.allocations[1].qty, 80);
  assert.equal(mg.shortfall, 0);
});

test("decision table DT-03: auto, project manager, department", () => {
  assert.equal(evaluate(signage, master, NOW).approval.route, "automatisch");
  assert.deepEqual(evaluate(granulate, master, NOW).approval.approvers, ["Projectleider"]);
  const p = evaluate(primary, master, NOW);
  assert.deepEqual(p.approval.approvers, ["Projectleider", "Afdelingsverantwoordelijke"]);
  assert.match(p.approval.rule, /budget/);
});

test("primary aggregate gets a recycled alternative with its saving", () => {
  const p = evaluate(primary, master, NOW);
  assert.equal(p.alternatives.length, 1);
  assert.equal(p.alternatives[0].itemNo, "MG-031");
  assert.equal(p.alternatives[0].saving, (24 - 11) * 180);
});

test("external pipes create a purchase requisition and inform purchasing", () => {
  const e = evaluate(rush, master, NOW);
  assert.ok(e.purchase);
  assert.ok(e.informs.includes("Aankoop"));
  const msgs = erpMessages(e, rush);
  assert.ok(msgs.some((m) => m.type === "purchaseRequisition" && m.body.itemNo === "RB-315"));
});

test("asphalt cannot be delivered on a weekend", () => {
  const e = evaluate({ requestNo: "X", projectNo: "W-2601", deliverAt: "2026-10-17T07:00", lines: [{ itemNo: "AB-4C", qty: 40 }] }, master, NOW);
  assert.ok(e.lines[0].notes.some((n) => /weekend/.test(n)));
});

test("idempotency keys are stable for the same request", () => {
  const a = erpMessages(evaluate(granulate, master, NOW), granulate).map((m) => m.idempotencyKey);
  const b = erpMessages(evaluate(granulate, master, NOW), granulate).map((m) => m.idempotencyKey);
  assert.deepEqual(a, b);
  assert.equal(new Set(a).size, a.length);
});

test("outbox retries while the ERP is down and books once it is back", () => {
  const msgs = erpMessages(evaluate(granulate, master, NOW), granulate);
  const out = deliverOutbox(msgs, (minute) => minute >= 20);
  assert.equal(out.delivered.length, msgs.length);
  assert.ok(out.delivered.every((m) => m.attempts === 4 && m.minute === 21));
});

test("after the last retry a message goes to dead-letter for functional support", () => {
  const msgs = erpMessages(evaluate(signage, master, NOW), signage);
  const out = deliverOutbox(msgs, () => false);
  assert.equal(out.delivered.length, 0);
  assert.equal(out.dead.length, msgs.length);
  assert.equal(out.dead[0].attempts, RETRY_MINUTES.length + 1);
});

test("a retry after a lost response is not booked twice", () => {
  const msgs = erpMessages(evaluate(signage, master, NOW), signage);
  const seen = new Set();
  deliverOutbox(msgs, () => true, { erpSeen: seen });
  const again = deliverOutbox(msgs, () => true, { erpSeen: seen });
  assert.ok(again.log.every((l) => /idempotent/.test(l.result)));
});

test("replay of the AS-IS history through the TO-BE rules", () => {
  const r = replay(json("data/requests-history.json").requests, master, NOW);
  assert.equal(r.n, 60);
  assert.equal(r.auto + r.pl + r.plAndDept, 60);
  assert.equal(r.auto, 26);
  assert.equal(r.rush, 20);
});

test("AS-IS baseline", () => {
  const b = baseline(json("data/requests-history.json").requests);
  assert.equal(b.n, 60);
  assert.equal(b.byChannel.telefoon, 32);
});

test("repeated identical article lines produce separate ERP instructions, not colliding keys", () => {
  const req = { ...signage, lines: [{ itemNo: 'HK-350', qty: 2 }, { itemNo: 'HK-350', qty: 2 }] };
  const msgs = erpMessages(evaluate(req, master, NOW), req);
  assert.equal(msgs.length, 2);
  assert.equal(new Set(msgs.map(m => m.idempotencyKey)).size, 2);
  assert.equal(msgs.reduce((sum, m) => sum + m.body.quantity, 0), 4);
});

test("invalid dates and non-finite quantities are rejected before evaluation", () => {
  assert.equal(validateRequest({ ...signage, deliverAt: 'invalid' }, master, NOW).ok, false);
  for (const qty of [Infinity, NaN, -1, 0]) {
    assert.equal(validateRequest({ ...signage, lines: [{ itemNo: 'HK-350', qty }] }, master, NOW).ok, false);
  }
});
