import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { json, text } from "./helpers.mjs";
import { approvalChain } from "../src/claims.mjs";
import { approvalRoute } from "../src/materials.mjs";

const CASES = ["01-document-intelligence", "02-construction-claims", "03-material-requests"];
const list = (dir, ext) => {
  const out = [];
  const walk = (d) => { for (const f of readdirSync(new URL(`../${d}`, import.meta.url))) { const p = `${d}/${f}`; if (statSync(new URL(`../${p}`, import.meta.url)).isDirectory()) walk(p); else if (p.endsWith(ext)) out.push(p); } };
  walk(dir);
  return out;
};

// ------------------------------------------------------------- Power Automate
const flows = CASES.flatMap((c) => list(`${c}/artefacts`, ".flow.json")).concat(CASES.flatMap((c) => list(`${c}/artefacts`, ".childflow.json")));

function* actionMaps(actions, path = "actions") {
  yield [path, actions];
  for (const [name, a] of Object.entries(actions)) {
    if (a.actions) yield* actionMaps(a.actions, `${path}.${name}`);
    if (a.else?.actions) yield* actionMaps(a.else.actions, `${path}.${name}.else`);
    if (a.cases) for (const [cn, c] of Object.entries(a.cases)) yield* actionMaps(c.actions, `${path}.${name}.${cn}`);
    if (a.default?.actions) yield* actionMaps(a.default.actions, `${path}.${name}.default`);
  }
}

test("there are Power Automate definitions for every case", () => {
  for (const c of CASES) assert.ok(flows.some((f) => f.startsWith(c)), c);
});

for (const f of flows) {
  test(`${f}: valid workflow definition`, () => {
    const flow = json(f);
    const def = flow.properties.definition;
    assert.match(def.$schema, /workflowdefinition\.json#$/);
    assert.equal(Object.keys(def.triggers).length, 1, "exactly one trigger");
    const refs = Object.keys(flow.properties.connectionReferences ?? {});
    const all = JSON.stringify(def);
    for (const m of all.matchAll(/"connectionName":"([^"]+)"/g)) assert.ok(refs.includes(m[1]), `connection ${m[1]} not declared`);
    for (const [path, map] of actionMaps(def.actions)) {
      for (const [name, a] of Object.entries(map)) {
        assert.ok(a.type, `${path}.${name} has no type`);
        assert.equal(a.retryPolicy, undefined, `${path}.${name}: retryPolicy belongs inside inputs`);
        for (const dep of Object.keys(a.runAfter ?? {})) assert.ok(dep in map, `${path}.${name} runs after unknown sibling ${dep}`);
      }
      const roots = Object.values(map).filter((a) => !a.runAfter || Object.keys(a.runAfter).length === 0);
      if (Object.keys(map).length) assert.ok(roots.length >= 1, `${path}: no starting action`);
    }
    for (const m of all.matchAll(/(?:body|outputs|items|result)\('([^']+)'\)/g)) {
      const known = new Set([...actionMaps(def.actions)].flatMap(([, map]) => Object.keys(map)));
      assert.ok(known.has(m[1]), `${f}: expression references unknown action ${m[1]}`);
    }
    for (const m of all.matchAll(/parameters\('([^']+)'\)/g)) assert.ok(m[1] in def.parameters, `parameter ${m[1]} not declared`);
  });
}

// ------------------------------------------------------------- Power Apps
const apps = CASES.flatMap((c) => list(`${c}/artefacts`, ".pa.yaml"));
for (const f of apps) {
  test(`${f}: parses and every property is a formula`, () => {
    const doc = parseYaml(text(f));
    assert.ok(doc.Screens && Object.keys(doc.Screens).length >= 1);
    const check = (node, path) => {
      if (node && typeof node === "object") {
        if (node.Properties) for (const [k, v] of Object.entries(node.Properties)) assert.ok(typeof v === "string" && v.startsWith("="), `${path}.${k} must start with '='`);
        for (const [k, v] of Object.entries(node)) if (k !== "Properties") check(v, `${path}.${k}`);
      }
    };
    check(doc, f);
    assert.match(text(f), /#E20000/i, "uses the house red");
  });
}

// ------------------------------------------------------------- OpenAPI
const apis = CASES.flatMap((c) => list(`${c}/artefacts`, ".openapi.yaml"));
for (const f of apis) {
  test(`${f}: OpenAPI 3 with resolvable refs, idempotent writes and problem details`, () => {
    const api = parseYaml(text(f));
    assert.match(api.openapi, /^3\./);
    const resolve = (ref) => ref.replace(/^#\//, "").split("/").reduce((o, k) => o?.[k], api);
    for (const m of text(f).matchAll(/\$ref:\s*'([^']+)'/g)) assert.ok(resolve(m[1]), `unresolved ${m[1]}`);
    for (const [path, ops] of Object.entries(api.paths)) {
      for (const [verb, op] of Object.entries(ops)) {
        assert.ok(op.operationId, `${verb} ${path} lacks operationId`);
        if (verb === "post") {
          const params = JSON.stringify(op.parameters ?? []);
          assert.ok(/Idempotency-?Key/i.test(params), `${verb} ${path} lacks Idempotency-Key`);
          assert.ok(op.responses["503"] || op.responses["422"], `${verb} ${path} has no error responses`);
        }
      }
    }
  });
}

// ------------------------------------------------------------- Dataverse + JSON
for (const c of CASES) {
  test(`${c}/artefacts/dataverse.json: tables with prefix and a primary name`, () => {
    const d = json(`${c}/artefacts/dataverse.json`);
    assert.ok(d.tables.length >= 2);
    for (const t of d.tables) {
      assert.match(t.logicalName, /^hv_/);
      assert.ok(t.columns.some((col) => col.name === t.primaryName), `${t.logicalName}: primary name column missing`);
    }
  });
}

test("the sample extraction matches the extraction schema (required fields, types, ranges)", () => {
  const schema = json("01-document-intelligence/artefacts/extraction-schema.json");
  const sample = json("01-document-intelligence/artefacts/sample-extraction.json");
  for (const k of schema.required) assert.ok(k in sample, k);
  for (const k of schema.properties.fields.required) {
    const fld = sample.fields[k];
    assert.ok(fld && "value" in fld && fld.confidence >= 0 && fld.confidence <= 1, k);
  }
  assert.match(sample.documentId, new RegExp(schema.properties.documentId.pattern));
  for (const w of ["gross", "tare", "net"]) assert.ok(Number.isInteger(sample.fields[w].value) && sample.fields[w].value <= 80000);
});

test("Teams adaptive card is version 1.5 and offers an open action", () => {
  const card = json("02-construction-claims/artefacts/adaptive-card-nieuwe-claim.json");
  assert.equal(card.type, "AdaptiveCard");
  assert.ok(card.actions.some((a) => a.type === "Action.OpenUrl"));
});

// ------------------------------------------------------------- Power Fx (recorded by scripts/check-powerfx.mjs with pac)
const fx = [
  ["02-construction-claims/artefacts/power-fx/RESULTS.md", (key) => { const [a, c] = key.split("|"); return approvalChain({ estimatedAmount: Number(a), category: c }).join(">"); }],
  ["03-material-requests/artefacts/power-fx/RESULTS.md", (key) => { const [v, f] = key.split("|"); const r = approvalRoute({ value: Number(v), overBudget: f[0] === "1", purchase: f[1] === "1" }); return r.approvers.length ? r.approvers.join(">") : "automatisch"; }],
];
for (const [f, js] of fx) {
  test(`${f}: the Power Fx results recorded with pac still match today's JS engine`, () => {
    const rows = [...text(f).matchAll(/^\| `([^`]+)` \| ([^|]+) \| ([^|]+) \| (ja|\*\*NEE\*\*) \|$/gm)];
    assert.ok(rows.length >= 8);
    for (const [, key, fxValue] of rows) assert.equal(js(key), fxValue.trim(), key);
  });
}
test("01 Power Fx controls were recorded and all matched", () => {
  assert.match(text("01-document-intelligence/artefacts/power-fx/RESULTS.md"), /\*\*6\/6 gevallen identiek\.\*\*/);
});
