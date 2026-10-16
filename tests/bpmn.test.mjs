import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import BpmnModdle from "bpmn-moddle";
import { text, json } from "./helpers.mjs";
import { toXml } from "../scripts/bpmn.mjs";

const specs = readdirSync(new URL("../models/", import.meta.url)).filter((f) => f.endsWith(".json")).map((f) => json(`models/${f}`));

for (const spec of specs) {
  test(`${spec.case}/${spec.file}.bpmn is valid BPMN 2.0 and up to date`, async () => {
    const xml = text(`${spec.case}/bpmn/${spec.file}.bpmn`);
    assert.equal(xml, toXml(spec), "regenerate with npm run build");
    const { rootElement, warnings } = await new BpmnModdle().fromXML(xml);
    assert.deepEqual(warnings.map((w) => w.message), []);
    const process = rootElement.rootElements.find((e) => e.$type === "bpmn:Process");
    assert.ok(process.laneSets[0].lanes.length >= 3);
  });

  test(`${spec.id}: every node is reachable from a start event and can reach an end`, () => {
    const out = new Map(spec.nodes.map((n) => [n.id, []]));
    const inc = new Map(spec.nodes.map((n) => [n.id, []]));
    for (const f of spec.flows) { out.get(f.from).push(f.to); inc.get(f.to).push(f.from); }
    const walk = (starts, edges) => { const seen = new Set(starts); const stack = [...starts]; while (stack.length) for (const n of edges.get(stack.pop())) if (!seen.has(n)) { seen.add(n); stack.push(n); } return seen; };
    const fromStart = walk(spec.nodes.filter((n) => n.type === "startEvent").map((n) => n.id), out);
    const toEnd = walk(spec.nodes.filter((n) => n.type === "endEvent").map((n) => n.id), inc);
    for (const n of spec.nodes) {
      assert.ok(fromStart.has(n.id), `${n.id} unreachable`);
      assert.ok(toEnd.has(n.id), `${n.id} cannot reach an end`);
    }
  });

  test(`${spec.id}: exclusive splits name every outgoing flow and have one default`, () => {
    for (const g of spec.nodes.filter((n) => n.type === "exclusiveGateway")) {
      const outs = spec.flows.filter((f) => f.from === g.id);
      if (outs.length < 2) continue;
      assert.ok(g.name, `${g.id} has no question`);
      assert.ok(outs.every((f) => f.name), `${g.id}: unnamed outgoing flow`);
      assert.ok(outs.filter((f) => f.default).length <= 1, `${g.id}: more than one default`);
    }
  });
}

test("TO-BE models automate more than the AS-IS models", () => {
  const auto = (s) => s.nodes.filter((n) => ["serviceTask", "businessRuleTask", "sendTask"].includes(n.type)).length;
  for (const c of ["c1", "c2", "c3"]) {
    const asis = specs.find((s) => s.id === `${c}_asis`);
    const tobe = specs.find((s) => s.id === `${c}_tobe`);
    assert.ok(auto(tobe) > auto(asis), c);
  }
});
