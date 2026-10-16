import { test } from "node:test";
import assert from "node:assert/strict";
import { json, master, NOW } from "./helpers.mjs";
import { validateReport, triage, approvalChain, createClaim, transition, syncQueue, slaStatus, baseline, SAMPLE_REPORTS } from "../src/claims.mjs";

const [gas, machine, neighbour, rental, dumper] = SAMPLE_REPORTS;

test("all sample reports are valid", () => {
  for (const r of SAMPLE_REPORTS) assert.ok(validateReport(r, master).ok, r.clientId);
});

test("a report without photo, description or location is refused with a reason per field", () => {
  const v = validateReport({ ...machine, photos: [], description: "kapot", location: null }, master);
  assert.deepEqual(v.errors.map((e) => e.field).sort(), ["description", "location", "photos"]);
});

test("personal injury stops the claim form and points to the accident procedure", () => {
  const v = validateReport({ ...machine, injuries: true }, master);
  assert.ok(v.errors.some((e) => e.field === "injuries" && /arbeidsongeval/.test(e.msg)));
});

test("utility damage needs the KLIP reference, utility type and owner", () => {
  const v = validateReport({ ...gas, klipRef: "", utilityOwner: "" }, master);
  assert.deepEqual(v.errors.map((e) => e.field).sort(), ["klipRef", "utilityOwner"]);
});

test("a closed site cannot receive new claims", () => {
  const v = validateReport({ ...machine, projectNo: "W-2605" }, master);
  assert.ok(v.errors.some((e) => e.field === "projectNo"));
});

test("gas line damage is critical, owned by claims, and triggers an insurer declaration", () => {
  const t = triage(gas, master);
  assert.equal(t.severity, "kritiek");
  assert.equal(t.owner, "Claims & verzekeringen");
  assert.equal(t.slaHours, 2);
  assert.ok(t.insurerDeclaration);
  assert.ok(t.notify.includes("Leidingbeheerder (extern)"));
});

test("decision table DT-02 boundaries", () => {
  const chain = (amount, category = "eigen-werf") => approvalChain({ estimatedAmount: amount, category });
  assert.deepEqual(chain(2500), ["Projectleider"]);
  assert.deepEqual(chain(2501), ["Projectleider", "Afdelingsverantwoordelijke"]);
  assert.deepEqual(chain(15000), ["Projectleider", "Afdelingsverantwoordelijke"]);
  assert.deepEqual(chain(15001), ["Projectleider", "Afdelingsverantwoordelijke", "Directie"]);
  assert.deepEqual(chain(1900, "eigen-materieel"), ["Fleetmanager", "Projectleider"]);
});

test("a third party that caused the damage opens a recovery track", () => {
  assert.equal(triage(rental, master).recoveryTrack, true);
  assert.equal(triage(neighbour, master).recoveryTrack, false);
});

test("approvals must follow the chain in order, then the claim is approved", () => {
  let c = createClaim(dumper, master, { now: NOW, seq: 1 });
  c = transition(c, "submitForApproval", { by: "Fleetmanager", at: NOW });
  assert.throws(() => transition(c, "approve", { by: "Directie", at: NOW }), /verwacht van Fleetmanager/);
  for (const by of c.approvalChain) c = transition(c, "approve", { by, at: NOW });
  assert.equal(c.state, "goedgekeurd");
  c = transition(c, "startHandling", { by: "Fleetmanager", at: NOW });
  c = transition(c, "close", { by: "Fleetmanager", at: NOW });
  assert.equal(c.state, "afgesloten");
  assert.ok(c.timeline.length >= 9);
});

test("illegal transitions are refused", () => {
  const c = createClaim(machine, master, { now: NOW, seq: 2 });
  assert.throws(() => transition(c, "close", { by: "x", at: NOW }), /kan niet/);
});

test("offline queue sync is idempotent on client id", () => {
  const server = { claims: [], nextSeq: 10 };
  const first = syncQueue([machine, neighbour], server, master, { now: NOW });
  const again = syncQueue([machine, neighbour, rental], server, master, { now: NOW });
  assert.deepEqual(first.map((r) => r.status), ["aangemaakt", "aangemaakt"]);
  assert.deepEqual(again.map((r) => r.status), ["al ontvangen", "al ontvangen", "aangemaakt"]);
  assert.equal(server.claims.length, 3);
});

test("SLA status turns red after the assessment deadline", () => {
  const c = createClaim(gas, master, { now: NOW, seq: 3 });
  assert.equal(slaStatus(c, NOW).status, "op tijd");
  assert.equal(slaStatus(c, "2026-10-12T11:00").status, "overschreden");
});

test("AS-IS baseline from the Excel register", () => {
  const b = baseline(json("data/claims-history.json").claims);
  assert.equal(b.n, 40);
  assert.equal(b.insuredCount, 24);
  assert.equal(b.lateInsurerCount, 13);
  assert.equal(b.medianDaysToRegister, 3);
});
