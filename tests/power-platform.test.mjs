import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { json, text } from "./helpers.mjs";
import { FLOWS, CONNECTION_REFERENCES, NOT_BUILT } from "../power-platform/flows/definitions.mjs";
import { RULEBOOK } from "../src/rules.mjs";
import { CHARTS } from "../power-platform/scripts/dashboard-charts.mjs";

const model = json("power-platform/model.json");
const S = Object.fromEntries(model.tables.map((t) => [t.name, `${t.name}s`]));
const SYSTEM_SETS = new Set(["systemusers", "appnotifications"]);

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

test("every flow has a spec with a generated step list, and every spec belongs to a flow", () => {
  const specs = readdirSync(new URL("../power-platform/flows/", import.meta.url)).filter((f) => /^HV-.*\.md$/.test(f));
  assert.deepEqual(specs.map((f) => f.replace(/\.md$/, "")).sort(), FLOWS.map((f) => f.id).sort());
  for (const f of FLOWS) {
    const id = f.id;
    assert.ok(f.name.startsWith(`${id} `), `${f.name} starts with its id`);
    const md = text(`power-platform/flows/${id}.md`);
    assert.match(md, new RegExp(`^# ${f.name}$`, "m"), `${id}.md title matches the flow name`);
    assert.match(md, new RegExp(`<!--actions:${id}-->\\n\\*Gegenereerd[\\s\\S]+?<!--/actions-->`), `${id}.md has the generated step list (run npm run build)`);
    const def = f.build(S);
    const top = def.actions.Probeer ? { ...def.actions.Probeer.actions, ...def.actions } : def.actions;
    for (const name of Object.keys(top)) assert.ok(md.includes(`\`${name}\``), `${id}.md lists ${name}`);
  }
});

test("the design flows in the cases point to the built flows", () => {
  for (const dir of ["01-document-intelligence", "02-construction-claims", "03-material-requests"]) {
    const base = new URL(`../${dir}/artefacts/power-automate/`, import.meta.url);
    for (const f of readdirSync(base).filter((x) => x.endsWith(".json"))) {
      const flow = json(`${dir}/artefacts/power-automate/${f}`);
      assert.match(flow.status ?? "", /^Ontwerp/, `${f}: status`);
      for (const m of flow.status.matchAll(/power-platform\/flows\/(HV-[A-Z]{2}-\d{2})\.md/g)) assert.ok(existsSync(new URL(`../power-platform/flows/${m[1]}.md`, import.meta.url)), m[1]);
    }
  }
});

test("the exported solution is in the repo, unpacked and as managed/unmanaged zip", () => {
  assert.ok(existsSync(new URL("../power-platform/solution/release/HalverdijkTransformatie_managed.zip", import.meta.url)));
  assert.ok(existsSync(new URL("../power-platform/solution/release/HalverdijkTransformatie_unmanaged.zip", import.meta.url)));
  const flows = readdirSync(new URL("../power-platform/solution/src/Workflows/", import.meta.url)).filter((f) => f.endsWith(".json"));
  assert.equal(flows.length, FLOWS.length);
  assert.match(text("power-platform/solution/src/Other/Solution.xml"), /<UniqueName>HalverdijkTransformatie<\/UniqueName>/);
});

test("the KPI dashboard and all its charts are in the solution export", () => {
  const src = new URL("../power-platform/solution/src/", import.meta.url);
  assert.equal(readdirSync(new URL("Dashboards/", src)).filter((f) => f.endsWith(".xml")).length, 1);
  const charts = readdirSync(new URL("Entities/", src)).flatMap((e) => { try { return readdirSync(new URL(`Entities/${e}/Visualizations/`, src)); } catch { return []; } });
  assert.equal(charts.length, CHARTS.length);
  assert.match(text("power-platform/solution/src/AppModuleSiteMaps/hv_backoffice/AppModuleSiteMap.xml"), /pagetype=dashboard/);
});

test("VERIFICATION.md records identical results for all three cases", () => {
  const v = text("power-platform/VERIFICATION.md");
  assert.match(v, /\*\*30\/30 identiek\*\*/);
  assert.match(v, /\*\*5\/5 identiek\*\*/);
  assert.match(v, /\*\*4\/4 identiek\*\*/);
  assert.match(v, /\*\*3\/3 zoals verwacht\.\*\*/);
  assert.match(v, /\*\*5\/5 zoals verwacht\.\*\*/);
  assert.match(v, /\*\*17\/17 parameters gelijk\.\*\*/);
  assert.match(v, /\*\*1\/1 zoals verwacht:\*\*/);
  assert.match(v, /0 mislukt, 0 nog niet verwerkt/);
});

test("every flow only touches tables of the model (or the two system tables it needs)", () => {
  const sets = new Set([...Object.values(S), ...SYSTEM_SETS]);
  for (const f of FLOWS) for (const m of JSON.stringify(f.build(S)).matchAll(/"entityName":"([^"]+)"/g)) assert.ok(sets.has(m[1]), `${f.id}: ${m[1]}`);
});

test("every flow except the notifier runs inside Probeer with a Bij_fout that reports and fails the run", () => {
  for (const f of FLOWS.filter((x) => x.id !== "HV-OP-01")) {
    const a = f.build(S).actions;
    assert.deepEqual(Object.keys(a).filter((n) => a[n].type !== "InitializeVariable"), ["Probeer", "Bij_fout"], f.id);
    for (const n of Object.keys(a.Probeer.actions)) assert.notEqual(a.Probeer.actions[n].type, "InitializeVariable", `${f.id}: ${n} initialises a variable inside a scope`);
    assert.deepEqual(a.Bij_fout.runAfter, { Probeer: ["Failed", "TimedOut"] }, f.id);
    assert.equal(a.Bij_fout.actions.Foutmelding.inputs.parameters["item/hv_rol"], "Functioneel beheer", f.id);
    assert.equal(a.Bij_fout.actions.Run_mislukt.inputs.runStatus, "Failed", f.id);
  }
});

test("scheduled flows never overlap (trigger concurrency 1)", () => {
  for (const f of FLOWS) {
    const t = Object.values(f.build(S).triggers)[0];
    if (t.type === "Recurrence") assert.equal(t.runtimeConfiguration?.concurrency?.runs, 1, f.id);
  }
});

test("one integration pattern: only the outbox sender writes ERP bookings, every outbox insert is checked for a real failure", () => {
  for (const f of FLOWS) {
    const json = JSON.stringify(f.build(S));
    const writesBooking = /"operationId":"CreateRecord","apiId":"[^"]+"},"parameters":\{"entityName":"hv_erpboekings"/.test(json);
    assert.equal(writesBooking, f.id === "HV-IN-01", `${f.id} writes ERP bookings`);
    const inserts = [...json.matchAll(/"([A-Za-z_]+)":\{"type":"OpenApiConnection","inputs":\{"host":\{"connectionName":"shared_commondataserviceforapps","operationId":"CreateRecord","apiId":"[^"]+"},"parameters":\{"entityName":"hv_outboxs"/g)].map((m) => m[1]);
    for (const name of inserts) assert.ok(json.includes(`"${name}_controle"`), `${f.id}: ${name} has a duplicate-or-failure check`);
  }
});

test("no business threshold is hard-coded in a flow: every rule a flow reads exists in the rulebook", () => {
  const codes = new Set(RULEBOOK.filter((r) => typeof r.value === "number").map((r) => r.code));
  for (const f of FLOWS) {
    const json = JSON.stringify(f.build(S));
    for (const m of json.matchAll(/outputs\('Parameters'\)\?\['([^']+)'\]/g)) assert.ok(codes.has(m[1]), `${f.id}: ${m[1]}`);
    for (const n of ["44000", "2500", "15000", "10000", "0.85"]) assert.ok(!new RegExp(`(?<![\\d.])${n.replace(".", "\\.")}(?![\\d])`).test(json), `${f.id} contains the literal ${n}`);
  }
});

test("every automated task in a TO-BE BPMN model has a flow, or a stated reason why not", () => {
  for (const file of ["c1-to-be", "c2-to-be", "c3-to-be"]) {
    const m = json(`models/${file}.json`);
    for (const n of m.nodes.filter((x) => ["serviceTask", "businessRuleTask", "sendTask"].includes(x.type))) {
      const key = `${m.id}:${n.id}`;
      assert.ok(FLOWS.some((f) => f.bpmn.includes(key)) || NOT_BUILT[key], key);
    }
  }
  for (const f of FLOWS) for (const key of f.bpmn) {
    const [id, node] = key.split(":");
    const m = json(`models/${id.replace("_tobe", "-to-be")}.json`);
    assert.ok(m.nodes.some((x) => x.id === node), `${f.id} points to an unknown BPMN task ${key}`);
  }
});

test("statuses the flows set exist in the model", () => {
  const options = (table, col) => Object.keys(model.tables.find((t) => t.name === table).columns.find((c) => c[0] === col)[3]).map(Number);
  for (const f of FLOWS) {
    const def = f.build(S);
    const walk = (actions) => {
      for (const a of Object.values(actions)) {
        const p = a.inputs?.parameters;
        if (p?.entityName && typeof p["item/hv_status"] === "number") {
          const table = model.tables.find((t) => S[t.name] === p.entityName);
          assert.ok(options(table.name, "hv_status").includes(p["item/hv_status"]), `${f.id}: ${table.name} status ${p["item/hv_status"]}`);
        }
        for (const nested of [a.actions, a.else?.actions, ...Object.values(a.cases ?? {}).map((c) => c.actions), a.default?.actions]) if (nested) walk(nested);
      }
    };
    walk(def.actions);
  }
});

test("action names are unique within each flow (Power Automate rejects duplicates anywhere in a definition)", () => {
  for (const f of FLOWS) {
    const seen = new Map();
    const walk = (actions) => {
      for (const [name, a] of Object.entries(actions)) {
        seen.set(name, (seen.get(name) ?? 0) + 1);
        for (const nested of [a.actions, a.else?.actions, ...Object.values(a.cases ?? {}).map((c) => c.actions), a.default?.actions]) if (nested) walk(nested);
      }
    };
    walk(f.build(S).actions);
    const dup = [...seen].filter(([, n]) => n > 1).map(([k]) => k);
    assert.deepEqual(dup, [], `${f.id}: ${dup.join(", ")}`);
  }
});

test("no expression nests @{…} inside another expression", () => {
  for (const f of FLOWS) {
    for (const m of JSON.stringify(f.build(S)).matchAll(/"(@[^"]*)"/g)) {
      const v = m[1];
      if (v.startsWith("@{")) continue;
      assert.ok(!v.slice(1).includes("@{"), `${f.id}: ${v.slice(0, 80)}`);
    }
  }
});
