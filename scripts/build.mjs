// Single build step. Everything a reviewer sees is derived from data/ + models/ + src/:
//  1. BPMN 2.0 XML + SVG per process model      → <case>/bpmn/*.bpmn|svg and site/assets/bpmn/
//  2. all KPI and business-case numbers         → site/data/facts.json + site/data/model.json
//  3. the shared engines and datasets           → site/assets/lib/ and site/data/
//  4. every <!--n:key-->…<!--/n--> marker in Markdown and HTML gets the current value, and every
//     <!--actions:HV-XX-NN-->…<!--/actions--> marker the step list of that Power Automate flow.
// CI runs this and fails if the working tree changes (a document drifted from the model).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { toXml, toSvg } from "./bpmn.mjs";
import { compute, NOW } from "../src/metrics.mjs";
import { RULES } from "../src/documents.mjs";
import { FLOWS, NOT_BUILT } from "../power-platform/flows/definitions.mjs";
import { RULEBOOK } from "../src/rules.mjs";
import { benefitsOverTime } from "../src/benefits.mjs";
import { nl } from "../src/common.mjs";
import { describeFlow } from "../power-platform/flows/describe.mjs";

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

// benefits over time (simulation): site/data/benefits.json + facts for the texts
const benefits = benefitsOverTime(model, assumptions);
const eurSigned = (n) => (n < 0 ? `−${nl.eur(-n)}` : nl.eur(n));
{
  const exp = benefits.scenarios.verwacht;
  const end = exp.total.at(-1);
  facts["ben.horizon"] = String(benefits.horizonMonths);
  facts["ben.breakEven"] = exp.breakEven === null ? "niet binnen de horizon" : `maand ${exp.breakEven + 1}`;
  facts["ben.lowest"] = nl.eur(-exp.lowest.cum);
  facts["ben.lowestMonth"] = `maand ${exp.lowest.m + 1}`;
  facts["ben.cumNet"] = eurSigned(end.cum);
  facts["ben.cumHours"] = nl.int(end.cumHours);
  for (const [k, sc] of Object.entries(benefits.scenarios)) {
    facts[`ben.${k}.cumNet`] = eurSigned(sc.total.at(-1).cum);
    facts[`ben.${k}.breakEven`] = sc.breakEven === null ? "niet binnen de horizon" : `maand ${sc.breakEven + 1}`;
  }
  for (const [key, c] of Object.entries(exp.cases)) {
    const id = key.replace("case0", "c");
    facts[`ben.${id}.goLive`] = `maand ${c.goLive + 1}`;
    facts[`ben.${id}.breakEven`] = c.breakEven === null ? "niet binnen de horizon" : `maand ${c.breakEven + 1}`;
    facts[`ben.${id}.cumNet`] = eurSigned(c.rows.at(-1).cum);
  }
}

const round = (_k, v) => (typeof v === "number" && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v === Infinity ? null : v);
write("site/data/benefits.json", JSON.stringify(benefits, round) + "\n");
write("site/data/model.json", JSON.stringify({ now: NOW, models: modelIndex, case01: { ...model.case01, results: undefined }, case02: model.case02, case03: model.case03, platform: model.platform }, round, 2) + "\n");

// 3. engines + data for the browser
for (const f of readdirSync(join(ROOT, "src"))) copyFileSync(join(ROOT, "src", f), join(ROOT, "site/assets/lib", f));
for (const f of ["master-data.json", "documents.json", "claims-history.json", "requests-history.json", "assumptions.json"]) copyFileSync(join(ROOT, "data", f), join(ROOT, "site/data", f));

// generated rule table for case 01 (between markers <!--rules:c1-->…<!--/rules-->)
const ruleTable = ["| Regel | Controle | Bij falen | Waarom |", "|---|---|---|---|", ...RULES.map((r) => `| ${r.id} | ${r.title} | ${{ review: "nazicht door administratie", block: "escalatie milieucoördinator", reject: "weigeren als dubbel" }[r.severity]} | ${r.why} |`)].join("\n");
const fired = ["| Regel | Afgegaan op testset |", "|---|---|", ...RULES.map((r) => `| ${r.id} ${r.title} | ${model.case01.rulesFired[r.id]} |`)].join("\n");

// before/after comparison for the site: text from data/before-after.json, numbers from facts, steps from the BPMN models
const KIND = { manualTask: "manueel", userTask: "mens", receiveTask: "wachten", serviceTask: "automatisch", businessRuleTask: "automatisch", sendTask: "automatisch" };
const fill = (str, where) => str.replace(/\{([\w.]+)\}/g, (_m, key) => {
  if (!(key in facts)) { unknownFacts.push(`${where}: ${key}`); return _m; }
  return facts[key];
});
const unknownFacts = [];
const ba = j("data/before-after.json");
const side = (s, where) => {
  const spec = j(`models/${models.find((f) => j(`models/${f}`).id === s.model)}`);
  const steps = spec.nodes.filter((n) => n.type in KIND).map((n) => ({ name: n.name, kind: KIND[n.type] }));
  const ends = spec.nodes.filter((n) => n.type === "endEvent");
  return {
    headline: fill(s.headline, where), list: (s.pains ?? s.gains).map((x) => fill(x, where)), model: s.model, title: spec.name,
    steps, lanes: spec.lanes.length, end: ends.at(-1).name,
    counts: { manual: steps.filter((x) => x.kind === "manueel" || x.kind === "mens").length, auto: steps.filter((x) => x.kind === "automatisch").length },
  };
};
write("site/data/before-after.json", JSON.stringify({ cases: ba.cases.map((c) => ({
  id: c.id, tab: c.tab, asis: side(c.asis, `${c.id}.asis`), tobe: side(c.tobe, `${c.id}.tobe`),
  kpis: c.kpis.map((k) => Object.fromEntries(Object.entries(k).map(([key, v]) => [key, fill(v, `${c.id}.kpis`)]))),
})) }, null, 2) + "\n");
if (unknownFacts.length) { console.error(`Unknown fact keys in data/before-after.json:\n  ${unknownFacts.join("\n  ")}`); process.exit(1); }

// generated step list per Power Automate flow (between markers <!--actions:HV-XX-NN-->…<!--/actions-->)
const pp = j("power-platform/model.json");
const sets = Object.fromEntries(pp.tables.map((t) => [t.name, t.name.endsWith("x") ? `${t.name}es` : `${t.name}s`]));
const flowSteps = Object.fromEntries(FLOWS.map((f) => [f.id, describeFlow(f.build(sets), pp.tables)]));

// flow inventory and BPMN coverage (power-platform/flows/README.md)
const triggerOf = (def) => {
  const t = Object.values(def.triggers)[0];
  if (t.type === "Recurrence") return `schema, elke ${t.recurrence.interval} ${{ Minute: "min", Hour: "uur" }[t.recurrence.frequency]}`;
  const p = t.inputs.parameters;
  const table = pp.tables.find((x) => x.name === p["subscriptionRequest/entityname"]);
  const how = { 1: "toegevoegd", 3: "gewijzigd", 4: "toegevoegd of gewijzigd" }[p["subscriptionRequest/message"]];
  const cond = p["subscriptionRequest/filterexpression"]?.match(/hv_status eq (\d+)/)?.[1];
  const label = cond ? table.columns.find((c) => c[0] === "hv_status")[3][cond] : null;
  return `${table.display} ${how}${label ? ` → *${label}*` : ""}`;
};
const inventory = ["| Flow | Case | Trigger | Van | Naar | Eigenaar | Spec |", "|---|---|---|---|---|---|---|",
  ...FLOWS.map((f) => `| **${f.id}** ${f.name.slice(f.id.length + 1)} | ${f.case} | ${triggerOf(f.build(sets))} | ${f.in} | ${f.out} | ${f.owner} | [${f.id}.md](${f.id}.md) |`)].join("\n");
const AUTOMATED = new Set(["serviceTask", "businessRuleTask", "sendTask"]);
const coverageRows = [];
for (const f of models) {
  const spec = j(`models/${f}`);
  if (!spec.id.endsWith("_tobe")) continue;
  for (const n of spec.nodes.filter((x) => AUTOMATED.has(x.type))) {
    const key = `${spec.id}:${n.id}`;
    const flows = FLOWS.filter((x) => x.bpmn.includes(key)).map((x) => `[${x.id}](${x.id}.md)`);
    coverageRows.push({ key, row: `| ${spec.case.slice(0, 2)} | ${n.name.replace(/\n/g, " ")} | ${flows.length ? flows.join(", ") : "—"} | ${flows.length ? "gebouwd" : NOT_BUILT[key] ? `niet gebouwd: ${NOT_BUILT[key]}` : "**ONTBREEKT**"} |` });
  }
}
const coverage = ["| Case | Geautomatiseerde taak (TO-BE) | Flow | Stand |", "|---|---|---|---|", ...coverageRows.map((r) => r.row)].join("\n");
const missing = coverageRows.filter((r) => r.row.includes("**ONTBREEKT**")).map((r) => r.key);
if (missing.length) { console.error(`BPMN tasks without a flow or reason: ${missing.join(", ")}`); process.exit(1); }
write("site/data/flows.json", JSON.stringify({ flows: FLOWS.map((f) => ({ id: f.id, name: f.name, case: f.case, owner: f.owner, in: f.in, out: f.out, description: f.description })), coverage: coverageRows.length, built: coverageRows.filter((r) => r.row.includes("gebouwd |")).length }, null, 2) + "\n");
facts["pp.flows"] = String(FLOWS.length);
facts["pp.tables"] = String(pp.tables.length);
facts["pp.screenshots"] = String(readdirSync(join(ROOT, "power-platform/screenshots")).filter((f) => /\.(jpg|png)$/.test(f)).length);
facts["pp.bpmnAutomated"] = String(coverageRows.length);
facts["pp.bpmnBuilt"] = String(coverageRows.filter((r) => r.row.endsWith("| gebouwd |")).length);
facts["rules.count"] = String(RULEBOOK.length);
facts["rules.params"] = String(RULEBOOK.filter((r) => typeof r.value === "number").length);

// numbers from the real Power Platform run (power-platform/VERIFICATION.md, written by verify.mjs)
{
  const v = readFileSync(join(ROOT, "power-platform/VERIFICATION.md"), "utf8");
  const section = (title) => v.split(/^## /m).find((x) => x.startsWith(title)) ?? "";
  const score = (title) => section(title).match(/\*\*(\d+\/\d+) (?:identiek|zoals verwacht|parameters gelijk)/)?.[1] ?? "—";
  facts["pp.v.docs"] = score("Case 01 — weegbonnen");
  facts["pp.v.claims"] = score("Case 02 — schadeclaims");
  facts["pp.v.requests"] = score("Case 03 — materiaalaanvragen");
  facts["pp.v.review"] = score("Case 01 — nakijken");
  facts["pp.v.lifecycle"] = score("Één integratiepatroon");
  facts["pp.v.rules"] = score("Regels: tabel");
  facts["pp.v.errors"] = section("Foutafhandeling").match(/\*\*(\d+\/\d+) zoals verwacht/)?.[1] ?? "—";
  facts["pp.v.meldingen"] = section("Meldingen").match(/\*\*(\d+) meldingen/)?.[1] ?? "—";
  facts["pp.v.date"] = v.match(/op (\d{4}-\d\d-\d\d)/)?.[1] ?? "—";
}

// requirements register + traceability (data/requirements.json): every link must exist, or the build fails
const REQ = j("data/requirements.json");
const slug = (h) => h.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, "").replace(/ /g, "-");
const testNames = readdirSync(join(ROOT, "tests")).filter((f) => f.endsWith(".mjs")).flatMap((f) => [...readFileSync(join(ROOT, "tests", f), "utf8").matchAll(/test\(\s*[`"]([^`"]+)[`"]/g)].map((m) => m[1]));
const TYPE = { business: "Business", stakeholder: "Stakeholder", functional: "Solution · functioneel", nonfunctional: "Solution · niet-functioneel", transition: "Transition" };
const reqErrors = [];
const registers = {};
const traces = {};
for (const [cid, c] of Object.entries(REQ.cases)) {
  const discover = readFileSync(join(ROOT, c.dir, "01-discover.md"), "utf8");
  const design = readFileSync(join(ROOT, c.dir, "03-design.md"), "utf8");
  const measure = readFileSync(join(ROOT, c.dir, "07-measure-improve.md"), "utf8");
  const pains = new Set([...discover.matchAll(/^\| (P-\d\d) \|/gm)].map((m) => m[1]));
  const stories = Object.fromEntries([...design.matchAll(/^### (US-\d\d)( .+)$/gm)].map((m) => [m[1], `${m[1]}${m[2]}`]));
  const kpis = new Set([...measure.matchAll(/^\| (C\d-K\d+) \|/gm)].map((m) => m[1]));
  const model = j(`models/${models.find((f) => j(`models/${f}`).id === c.model)}`);
  const tasks = Object.fromEntries(model.nodes.map((n) => [n.id, n.name]));
  const ids = new Set();
  for (const r of c.requirements) {
    const where = `${cid} ${r.id}`;
    if (ids.has(r.id)) reqErrors.push(`${where}: duplicate id`);
    ids.add(r.id);
    if (!TYPE[r.type]) reqErrors.push(`${where}: type ${r.type}`);
    if (r.objective && !REQ.objectives[r.objective]) reqErrors.push(`${where}: objective ${r.objective}`);
    for (const p of r.pains ?? []) if (!pains.has(p)) reqErrors.push(`${where}: pain ${p}`);
    for (const st of r.stories ?? []) if (!stories[st]) reqErrors.push(`${where}: story ${st}`);
    for (const k of r.kpis ?? []) if (!kpis.has(k)) reqErrors.push(`${where}: KPI ${k}`);
    for (const t of r.bpmn ?? []) if (!tasks[t]) reqErrors.push(`${where}: BPMN task ${t}`);
    for (const fl of r.flows ?? []) if (!FLOWS.some((x) => x.id === fl)) reqErrors.push(`${where}: flow ${fl}`);
    for (const t of r.tests ?? []) if (!testNames.some((n) => n.startsWith(t))) reqErrors.push(`${where}: test "${t}"`);
    if (r.type === "functional" && ["Must", "Should"].includes(r.priority) && r.status === "gebouwd" && !(r.stories ?? []).length && !(r.flows ?? []).length && !(r.tests ?? []).length) reqErrors.push(`${where}: built but no story, flow or test`);
    if (["ontworpen", "gesimuleerd", "buiten scope"].includes(r.status) && r.type !== "transition" && !r.why && r.priority !== "Could") reqErrors.push(`${where}: status ${r.status} needs a "why"`);
  }
  // coverage: every pain and every story is traced by at least one requirement
  for (const p of pains) if (!c.requirements.some((r) => (r.pains ?? []).includes(p))) reqErrors.push(`${cid}: pain ${p} has no requirement`);
  for (const st of Object.keys(stories)) if (!c.requirements.some((r) => (r.stories ?? []).includes(st))) reqErrors.push(`${cid}: story ${st} is traced by no requirement`);
  const storyLink = (st) => (stories[st] ? `[${st}](03-design.md#${slug(stories[st])})` : st);
  registers[cid] = Object.entries(TYPE).map(([type, label]) => {
    const rows = c.requirements.filter((r) => r.type === type);
    return [`#### ${label}`, "", "| ID | Requirement | Bron | Eigenaar | Prioriteit | Stabiliteit | Status |", "|---|---|---|---|---|---|---|",
      ...rows.map((r) => `| ${r.id} | ${r.text}${r.objective ? ` *(doel ${r.objective}: ${REQ.objectives[r.objective]})*` : ""}${r.why ? ` *(${r.why})*` : ""} | ${r.source} | ${r.owner} | ${r.priority} | ${r.stability} | ${r.status} |`)].join("\n");
  }).join("\n\n");
  traces[cid] = ["| ID | Soort | Pijn | Story | BPMN-taak (TO-BE) | Flow | Test | KPI | Status |", "|---|---|---|---|---|---|---|---|---|",
    ...c.requirements.map((r) => `| ${r.id} | ${TYPE[r.type].replace("Solution · ", "")} | ${(r.pains ?? []).join(", ") || "—"} | ${(r.stories ?? []).map(storyLink).join(", ") || "—"} | ${(r.bpmn ?? []).map((t) => tasks[t]).join("; ") || "—"} | ${(r.flows ?? []).map((fl) => `[${fl}](../power-platform/flows/${fl}.md)`).join(", ") || "—"} | ${(r.tests ?? []).length ? `${r.tests.length} ✓` : "—"} | ${(r.kpis ?? []).map((k) => `[${k}](07-measure-improve.md#kpi-kaarten)`).join(", ") || "—"} | ${r.status} |`)].join("\n");
  const built = c.requirements.filter((r) => ["functional", "nonfunctional"].includes(r.type) && r.status === "gebouwd").length;
  const sol = c.requirements.filter((r) => ["functional", "nonfunctional"].includes(r.type)).length;
  facts[`req.${cid}.count`] = String(c.requirements.length);
  facts[`req.${cid}.solution`] = String(sol);
  facts[`req.${cid}.built`] = String(built);
  facts[`req.${cid}.tested`] = String(c.requirements.filter((r) => (r.tests ?? []).length).length);
}
if (reqErrors.length) { console.error(`data/requirements.json:\n  ${reqErrors.join("\n  ")}`); process.exit(1); }
facts["req.total"] = String(Object.values(REQ.cases).reduce((a, c) => a + c.requirements.length, 0));

// flow table for the site (site/index.html, between <!--flowtable-->…<!--/flowtable-->)
const escHtml = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*/g, "");
const flowTable = FLOWS.map((f) => `            <tr><td><b>${f.id}</b> ${escHtml(f.name.slice(f.id.length + 1))}</td><td>${f.case}</td><td>${escHtml(triggerOf(f.build(sets)))}</td><td>${escHtml(f.description.replace(/^(Case \d\d|Alle cases): /, ""))}</td><td><a href="https://github.com/phlppgdfry/construction-digital-transformation/blob/main/power-platform/flows/${f.id}.md">spec</a></td></tr>`).join("\n");

// rule catalogue (shared-methodology/regelcatalogus.md), one table per case
const CASES = { "01": "Case 01 — weegbonnen", "02": "Case 02 — schadeclaims", "03": "Case 03 — materiaalaanvragen" };
const OUTCOME = { review: "nazicht", block: "escalatie", reject: "weigeren (dubbel)" };
const nlnum = (v) => (typeof v === "number" ? v.toLocaleString("nl-BE") : "—");
const rulebook = Object.entries(CASES).map(([c, title]) => [`### ${title}`, "", "| Code | Regel | Parameter | Eigenaar | Bij falen | Waarom |", "|---|---|---|---|---|---|",
  ...RULEBOOK.filter((r) => r.case === c).map((r) => `| ${r.code} | **${r.name}.** ${r.rule} | ${typeof r.value === "number" ? `${nlnum(r.value)} ${r.unit}` : "—"} | ${r.owner} | ${OUTCOME[r.severity] ?? "—"} | ${r.why} |`)].join("\n")).join("\n\n");

write("site/data/facts.json", JSON.stringify(facts, null, 2) + "\n");

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
  after = after.replace(/<!--inventory-->[\s\S]*?<!--\/inventory-->/g, `<!--inventory-->\n${inventory}\n<!--/inventory-->`);
  after = after.replace(/<!--bpmn-coverage-->[\s\S]*?<!--\/bpmn-coverage-->/g, `<!--bpmn-coverage-->\n${coverage}\n<!--/bpmn-coverage-->`);
  after = after.replace(/<!--requirements:(c\d)-->[\s\S]*?<!--\/requirements-->/g, (_m, c) => `<!--requirements:${c}-->\n${registers[c]}\n<!--/requirements-->`);
  after = after.replace(/<!--trace:(c\d)-->[\s\S]*?<!--\/trace-->/g, (_m, c) => `<!--trace:${c}-->\n${traces[c]}\n<!--/trace-->`);
  after = after.replace(/<!--flowtable-->[\s\S]*?<!--\/flowtable-->/g, `<!--flowtable-->\n${flowTable}\n<!--/flowtable-->`);
  after = after.replace(/<!--rulebook-->[\s\S]*?<!--\/rulebook-->/g, `<!--rulebook-->\n${rulebook}\n<!--/rulebook-->`);
  after = after.replace(/<!--actions:(HV-[A-Z]{2}-\d{2})-->[\s\S]*?<!--\/actions-->/g, (_m, id) => {
    if (!(id in flowSteps)) { unknown.push(`${relative(ROOT, p)}: flow ${id}`); return _m; }
    return `<!--actions:${id}-->\n${flowSteps[id]}\n<!--/actions-->`;
  });
  if (after !== before) { writeFileSync(p, after); touched += 1; }
}
if (unknown.length) {
  console.error(`Unknown fact keys:\n  ${unknown.join("\n  ")}`);
  process.exit(1);
}
console.log(`build: ${modelIndex.length} BPMN models, ${Object.keys(facts).length} facts, ${touched} file(s) updated`);
