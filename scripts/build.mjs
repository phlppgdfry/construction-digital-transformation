// Single build step. Everything a reviewer sees is derived from data/ + models/ + src/:
//  1. BPMN 2.0 XML + SVG per process model      → <case>/bpmn/*.bpmn|svg and site/assets/bpmn/
//  2. all KPI and business-case numbers         → site/data/facts.json + site/data/model.json
//  3. the shared engines and datasets           → site/assets/lib/ and site/data/
//  4. every <!--n:key-->…<!--/n--> marker in Markdown and HTML gets the current value.
// CI runs this and fails if the working tree changes (a document drifted from the model).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { toXml, toSvg } from "./bpmn.mjs";
import { compute, NOW } from "../src/metrics.mjs";
import { RULES } from "../src/documents.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const j = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const write = (p, s) => { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), s); };

// 1. process models
const models = readdirSync(join(ROOT, "models")).filter((f) => f.endsWith(".json")).sort();
const modelIndex = [];
for (const f of models) {
  const spec = j(`models/${f}`);
  const xml = toXml(spec);
  const svg = toSvg(spec);
  write(`${spec.case}/bpmn/${spec.file}.bpmn`, xml);
  write(`${spec.case}/bpmn/${spec.file}.svg`, svg);
  write(`site/assets/bpmn/${spec.id}.svg`, svg);
  modelIndex.push({ id: spec.id, case: spec.case, file: spec.file, name: spec.name, tasks: spec.nodes.filter((n) => /Task$/.test(n.type)).length, automated: spec.nodes.filter((n) => ["serviceTask", "businessRuleTask", "sendTask"].includes(n.type)).length });
}

// 2. numbers
const master = j("data/master-data.json");
const documents = j("data/documents.json").documents;
const claimsHistory = j("data/claims-history.json").claims;
const requestsHistory = j("data/requests-history.json").requests;
const assumptions = j("data/assumptions.json");
const { model, facts } = compute({ master, documents, claimsHistory, requestsHistory, assumptions });
for (const m of modelIndex) {
  facts[`bpmn.${m.id}.tasks`] = String(m.tasks);
  facts[`bpmn.${m.id}.automated`] = String(m.automated);
}
facts["bpmn.models"] = String(modelIndex.length);

const round = (_k, v) => (typeof v === "number" && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v === Infinity ? null : v);
write("site/data/facts.json", JSON.stringify(facts, null, 2) + "\n");
write("site/data/model.json", JSON.stringify({ now: NOW, models: modelIndex, case01: { ...model.case01, results: undefined }, case02: model.case02, case03: model.case03, platform: model.platform }, round, 2) + "\n");

// 3. engines + data for the browser
for (const f of readdirSync(join(ROOT, "src"))) copyFileSync(join(ROOT, "src", f), join(ROOT, "site/assets/lib", f));
for (const f of ["master-data.json", "documents.json", "claims-history.json", "requests-history.json", "assumptions.json"]) copyFileSync(join(ROOT, "data", f), join(ROOT, "site/data", f));

// generated rule table for case 01 (between markers <!--rules:c1-->…<!--/rules-->)
const ruleTable = ["| Regel | Controle | Bij falen | Waarom |", "|---|---|---|---|", ...RULES.map((r) => `| ${r.id} | ${r.title} | ${{ review: "nazicht door administratie", block: "escalatie milieucoördinator", reject: "weigeren als dubbel" }[r.severity]} | ${r.why} |`)].join("\n");
const fired = ["| Regel | Afgegaan op testset |", "|---|---|", ...RULES.map((r) => `| ${r.id} ${r.title} | ${model.case01.rulesFired[r.id]} |`)].join("\n");

// 4. markers
const SKIP = new Set(["node_modules", ".git", "lib", "data"]);
function* files(dir) {
  for (const f of readdirSync(dir)) {
    if (SKIP.has(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(md|html)$/.test(f)) yield p;
  }
}
const unknown = [];
let touched = 0;
for (const p of files(ROOT)) {
  const before = readFileSync(p, "utf8");
  let after = before.replace(/<!--n:([\w.]+)-->(.*?)<!--\/n-->/g, (_m, key) => {
    if (!(key in facts)) { unknown.push(`${relative(ROOT, p)}: ${key}`); return _m; }
    return `<!--n:${key}-->${facts[key]}<!--/n-->`;
  });
  after = after.replace(/<!--rules:c1-->[\s\S]*?<!--\/rules-->/g, `<!--rules:c1-->\n${ruleTable}\n<!--/rules-->`);
  after = after.replace(/<!--fired:c1-->[\s\S]*?<!--\/fired-->/g, `<!--fired:c1-->\n${fired}\n<!--/fired-->`);
  if (after !== before) { writeFileSync(p, after); touched += 1; }
}
if (unknown.length) {
  console.error(`Unknown fact keys:\n  ${unknown.join("\n  ")}`);
  process.exit(1);
}
console.log(`build: ${modelIndex.length} BPMN models, ${Object.keys(facts).length} facts, ${touched} file(s) updated`);
