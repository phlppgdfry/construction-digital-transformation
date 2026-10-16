// Runs the Power Fx decision tables with the real Power Fx engine (`pac power-fx run`) and
// compares every case with the JavaScript engines in src/. Writes power-fx/RESULTS.md per case.
// Needs the Power Platform CLI (pac) locally; CI checks the recorded RESULTS.md instead.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { approvalChain } from "../src/claims.mjs";
import { approvalRoute } from "../src/materials.mjs";
import { checkDocument, buildContext } from "../src/documents.mjs";

const master = JSON.parse(readFileSync(new URL("../data/master-data.json", import.meta.url)));

function runFx(file) {
  const out = execFileSync("pac", ["power-fx", "run", "--file", file, "--echo"], { env: { ...process.env, DOTNET_SYSTEM_GLOBALIZATION_INVARIANT: "1" }, encoding: "utf8", timeout: 120000 }).replace(/\0/g, "");
  const version = execFileSync("pac", ["help"], { encoding: "utf8" }).match(/Version: ([^\s]+)/)?.[1] ?? "?";
  const last = out.trim().split("\n").filter((l) => l.startsWith('"')).at(-1);
  if (!last) throw new Error(`no result from ${file}:\n${out}`);
  return { pairs: JSON.parse(last).split(";").map((p) => p.split("=")), version };
}

const checks = [
  {
    file: "01-document-intelligence/artefacts/power-fx/controles.fx",
    title: "R02 / R03 / R11 — controles na extractie",
    js: (key) => {
      const cases = { A: [31290, 13240, 18050, 0.97], B: [31590, 13240, 13350, 0.96], C: [39340, 13262, 26678, 0.62], D: [46380, 15100, 31280, 0.95], E: [20000, 12000, 8015, 0.85], F: [20000, 12000, 8021, 0.849] };
      const [gross, tare, net, conf] = cases[key];
      const base = { ticketNo: "T", date: "2026-10-08", plate: "1-DHK-101", customerNo: "K-1001", direction: "uit", material: "MG-031", gross, tare, net };
      const extracted = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, { value: v, confidence: k === "net" ? conf : 0.99 }]));
      const r = checkDocument({ id: key, received: "2026-10-08T10:00", extracted }, buildContext(master));
      return r.findings.filter((f) => ["R02", "R03", "R11"].includes(f.rule)).map((f) => `${f.rule} `).join("") + ".";
    },
  },
  {
    file: "02-construction-claims/artefacts/power-fx/dt-02-goedkeuringsketen.fx",
    title: "DT-02 — goedkeuringsketen schadeclaim",
    js: (key) => { const [a, c] = key.split("|"); return approvalChain({ estimatedAmount: Number(a), category: c }).join(">"); },
  },
  {
    file: "03-material-requests/artefacts/power-fx/dt-03-route.fx",
    title: "DT-03 — route materiaalaanvraag",
    js: (key) => { const [v, flags] = key.split("|"); const r = approvalRoute({ value: Number(v), overBudget: flags[0] === "1", purchase: flags[1] === "1" }); return r.approvers.length ? r.approvers.join(">") : "automatisch"; },
  },
];

let failed = 0;
for (const c of checks) {
  const { pairs, version } = runFx(c.file);
  const rows = pairs.map(([key, fx]) => { const js = c.js(key); if (js !== fx) failed += 1; return { key, fx, js, ok: js === fx }; });
  const dir = c.file.replace(/[^/]+$/, "");
  const md = [
    `# Resultaten — ${c.title}`,
    "",
    `Uitgevoerd met de echte Power Fx-engine (\`pac power-fx run\`, Power Platform CLI ${version}) en vergeleken met de JavaScript-regelmotor in \`src/\`. Gegenereerd door \`node scripts/check-powerfx.mjs\`; niet met de hand aanpassen.`,
    "",
    `**${rows.filter((r) => r.ok).length}/${rows.length} gevallen identiek.**`,
    "",
    "| Geval | Power Fx | JavaScript | Gelijk |",
    "|---|---|---|---|",
    ...rows.map((r) => `| \`${r.key}\` | ${r.fx} | ${r.js} | ${r.ok ? "ja" : "**NEE**"} |`),
    "",
  ].join("\n");
  writeFileSync(new URL(`../${dir}RESULTS.md`, import.meta.url), md);
  console.log(`${c.file}: ${rows.filter((r) => r.ok).length}/${rows.length}`);
}
process.exit(failed ? 1 : 0);
