// Reads what the real Power Automate flows wrote into Dataverse and compares it with the tested
// reference engines in src/. Writes ../VERIFICATION.md. Run after seed-scenarios.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { get, CONFIG } from "./dv.mjs";
import { processBatch } from "../../src/documents.mjs";
import { triage, SAMPLE_REPORTS } from "../../src/claims.mjs";
import { evaluate, SAMPLE_REQUESTS } from "../../src/materials.mjs";

const md = JSON.parse(readFileSync(new URL("../../data/master-data.json", import.meta.url)));
const docs = JSON.parse(readFileSync(new URL("../../data/documents.json", import.meta.url))).documents;
const o = { solution: null };
const out = [];
const row = (...c) => `| ${c.join(" | ")} |`;

// ---------------------------------------------------------------- case 01
const expected = Object.fromEntries(processBatch(docs, md).map((r) => [r.id, r]));
const DEC = { 100000000: "auto", 100000001: "review", 100000002: "escalate", 100000003: "reject" };
const STAT = { 100000000: "Ontvangen", 100000002: "Nazicht", 100000003: "Escalatie", 100000004: "Geboekt", 100000005: "Dubbel", 100000006: "Goedgekeurd", 100000007: "Afgewezen", 100000009: "Fout" };
const dRows = (await get("hv_documents?$select=hv_documentnr,hv_beslissing,hv_status,hv_bevindingen,hv_erpreferentie&$orderby=hv_documentnr asc", o)).json.value;
let dSame = 0;
const dTable = dRows.map((r) => {
  const exp = expected[r.hv_documentnr];
  const rules = (() => { try { return JSON.parse(r.hv_bevindingen ?? "[]").map((b) => b.regel).sort().join(", "); } catch { return "?"; } })();
  const expRules = [...new Set(exp.findings.map((f) => f.rule))].sort().join(", ");
  const ok = DEC[r.hv_beslissing] === exp.decision && rules === expRules;
  if (ok) dSame++;
  return row(r.hv_documentnr, DEC[r.hv_beslissing] ?? "—", exp.decision, rules || "—", expRules || "—", STAT[r.hv_status] ?? "—", r.hv_erpreferentie ?? "", ok ? "ja" : "**NEE**");
});
out.push(`## Case 01 — weegbonnen (flow HV-DI-01)\n\n**${dSame}/${dRows.length} identiek** (beslissing én afgegane regels).\n`, row("Document", "Flow", "Motor", "Regels flow", "Regels motor", "Status", "ERP-referentie", "Gelijk"), row(...Array(8).fill("---")), ...dTable, "");

// ---------------------------------------------------------------- case 02
const SEV = { 100000000: "laag", 100000001: "middel", 100000002: "hoog", 100000003: "kritiek" };
const cRows = (await get("hv_schadeclaims?$select=hv_dossiernummer,hv_clientid,hv_ernst,hv_eigenaar,hv_goedkeuringsketen,hv_deadlineverzekeraar,hv_goedkeuringsniveau,hv_status&$orderby=hv_clientid asc", o)).json.value;
let cSame = 0;
const cTable = cRows.filter((c) => SAMPLE_REPORTS.some((r) => r.clientId === c.hv_clientid)).map((c) => {
  const r = SAMPLE_REPORTS.find((x) => x.clientId === c.hv_clientid);
  const t = triage(r, md);
  const ok = SEV[c.hv_ernst] === t.severity && c.hv_eigenaar === t.owner && c.hv_goedkeuringsketen === t.approvalChain.join(">") && !!c.hv_deadlineverzekeraar === t.insurerDeclaration;
  if (ok) cSame++;
  return row(c.hv_dossiernummer, r.category, `€${r.estimatedAmount}`, `${SEV[c.hv_ernst]} / ${t.severity}`, c.hv_eigenaar, c.hv_goedkeuringsketen, c.hv_deadlineverzekeraar ? "ja" : "nee", ok ? "ja" : "**NEE**");
});
out.push(`## Case 02 — schadeclaims (flow HV-CL-01, triage + DT-02)\n\n**${cSame}/${cTable.length} identiek** (ernst, eigenaar, goedkeuringsketen, verzekeringsaangifte).\n`, row("Dossier", "Categorie", "Raming", "Ernst flow / motor", "Eigenaar", "Keten (DT-02)", "Aangifte", "Gelijk"), row(...Array(8).fill("---")), ...cTable, "");

// ---------------------------------------------------------------- case 03
const rRows = (await get("hv_materiaalaanvraags?$select=hv_aanvrager,hv_waarde,hv_route,hv_regel,hv_status,hv_budgetoverschreden&$orderby=createdon asc", o)).json.value;
let rSame = 0;
const rTable = rRows.filter((x) => SAMPLE_REQUESTS.some((s) => x.hv_aanvrager.includes(s.requestNo))).map((x) => {
  const s = SAMPLE_REQUESTS.find((y) => x.hv_aanvrager.includes(y.requestNo));
  const e = evaluate(s, md, "2026-10-12T08:00");
  const route = e.approval.approvers.length ? e.approval.approvers.join(">") : "automatisch";
  const ok = Math.round(x.hv_waarde) === Math.round(e.value) && x.hv_route === route && x.hv_budgetoverschreden === e.overBudget;
  if (ok) rSame++;
  return row(s.requestNo, `€${Math.round(x.hv_waarde)} / €${Math.round(e.value)}`, x.hv_route, x.hv_regel, ok ? "ja" : "**NEE**");
});
const lines = (await get("hv_aanvraaglijns?$select=hv_naam,hv_toewijzing&$orderby=createdon asc", o)).json.value;
const outbox = (await get("hv_outboxes?$select=hv_idempotencykey,hv_status,hv_pogingen,hv_laatstefout&$orderby=createdon asc", o)).json.value;
const OB = { 100000000: "Wachtend", 100000001: "Verzonden", 100000009: "Dead-letter" };
out.push(`## Case 03 — materiaalaanvragen (flows HV-MA-01 en HV-MA-02)\n\n**${rSame}/${rTable.length} identiek** (waarde, DT-03-route, budgetcontrole).\n`, row("Aanvraag", "Waarde flow / motor", "Route", "Regel", "Gelijk"), row(...Array(5).fill("---")), ...rTable, "",
  "### Toewijzing per depot (door de flow)\n", row("Lijn", "Toewijzing"), row("---", "---"), ...lines.map((l) => row(l.hv_naam, l.hv_toewijzing ?? "")), "",
  "### ERP-outbox (door HV-MA-02 naar de ERP-sandbox)\n", row("Idempotency-key", "Status", "Pogingen", "Laatste resultaat"), row("---", "---", "---", "---"), ...outbox.map((b) => row(b.hv_idempotencykey, OB[b.hv_status], b.hv_pogingen ?? 0, b.hv_laatstefout ?? "")), "");

writeFileSync(new URL("../VERIFICATION.md", import.meta.url), `# Verificatie in Power Platform

Wat de echte Power Automate-flows in de ontwikkelomgeving **${CONFIG.name}** in Dataverse schreven, naast de uitkomst van de geteste regelmotor in \`src/\`. Gegenereerd door \`node power-platform/scripts/verify.mjs\` op ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC. Niet met de hand aanpassen.

${out.join("\n")}
`);
console.log(`docs ${dSame}/${dRows.length}, claims ${cSame}/${cTable.length}, requests ${rSame}/${rTable.length}`);
