import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { json, text } from "./helpers.mjs";
import { FLOWS, CONNECTION_REFERENCES } from "../power-platform/flows/definitions.mjs";

const model = json("power-platform/model.json");
const S = Object.fromEntries(model.tables.map((t) => [t.name, `${t.name}s`]));

test("model: every table has the hv_ prefix, a primary column and unique column names", () => {
  for (const t of model.tables) {
    assert.match(t.name, /^hv_/);
    const names = [t.primary[0], ...(t.columns ?? []).map((c) => c[0]), ...(t.lookups ?? []).map((l) => l[0])];
    assert.equal(new Set(names).size, names.length, t.name);
    for (const [, target] of t.lookups ?? []) assert.ok(model.tables.some((x) => x.name === target), `${t.name} → ${target}`);
  }
});

test("model: choice values use the publisher option prefix (10000 → 100000000+)", () => {
  for (const t of model.tables) for (const c of t.columns ?? []) if (c[1] === "choice") {
    const options = typeof c[3] === "string" ? model.choices[c[3]] : c[3];
    for (const v of Object.keys(options)) assert.ok(Number(v) >= 100000000 && Number(v) < 100010000, `${t.name}.${c[0]} ${v}`);
  }
});

for (const f of FLOWS) {
  test(`flow ${f.name}: builds, one trigger, valid runAfter and declared parameters`, () => {
    const def = f.build(S);
    assert.equal(Object.keys(def.triggers).length, 1);
    const all = JSON.stringify(def);
    assert.ok(!all.includes("createArray()"), "createArray() without arguments is rejected by Power Automate");
    for (const m of all.matchAll(/"connectionName":"([^"]+)"/g)) assert.ok(m[1] in CONNECTION_REFERENCES, m[1]);
    for (const m of all.matchAll(/parameters\('([^']+)'\)/g)) assert.ok(m[1] in def.parameters, m[1]);
    const walk = (actions, path) => {
      for (const [name, a] of Object.entries(actions)) {
        for (const dep of Object.keys(a.runAfter ?? {})) assert.ok(dep in actions, `${path}.${name} runs after unknown ${dep}`);
        assert.ok(!(a.type === "Terminate" && /Foreach|Until/.test(path)), `${name}: Terminate inside a loop`);
        if (a.actions) walk(a.actions, `${path}>${a.type}`);
        if (a.else?.actions) walk(a.else.actions, `${path}>${a.type}`);
        if (a.cases) for (const c of Object.values(a.cases)) walk(c.actions, `${path}>${a.type}`);
      }
    };
    walk(def.actions, "root");
  });
}

test("the exported solution is in the repo, unpacked and as managed/unmanaged zip", () => {
  assert.ok(existsSync(new URL("../power-platform/solution/release/HalverdijkTransformatie_managed.zip", import.meta.url)));
  assert.ok(existsSync(new URL("../power-platform/solution/release/HalverdijkTransformatie_unmanaged.zip", import.meta.url)));
  const flows = readdirSync(new URL("../power-platform/solution/src/Workflows/", import.meta.url)).filter((f) => f.endsWith(".json"));
  assert.equal(flows.length, FLOWS.length);
  assert.match(text("power-platform/solution/src/Other/Solution.xml"), /<UniqueName>HalverdijkTransformatie<\/UniqueName>/);
});

test("VERIFICATION.md records identical results for all three cases", () => {
  const v = text("power-platform/VERIFICATION.md");
  assert.match(v, /\*\*30\/30 identiek\*\*/);
  assert.match(v, /\*\*5\/5 identiek\*\*/);
  assert.match(v, /\*\*4\/4 identiek\*\*/);
  assert.match(v, /\*\*3\/3 zoals verwacht\.\*\*/);
  assert.match(v, /\*\*3\/3 zoals verwacht\.\*\*/);
});
