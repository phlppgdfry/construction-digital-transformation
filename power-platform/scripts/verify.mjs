// Reads what the real Power Automate flows wrote into Dataverse and compares it with the tested
// reference engines in src/. Writes ../VERIFICATION.md. Run after seed-scenarios.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { get, CONFIG } from "./dv.mjs";
import { processBatch } from "../../src/documents.mjs";
import { triage, SAMPLE_REPORTS } from "../../src/claims.mjs";
import { evaluate, SAMPLE_REQUESTS } from "../../src/materials.mjs";
import { RULEBOOK } from "../../src/rules.mjs";

const md = JSON.parse(readFileSync(new URL("../../data/master-data.json", import.meta.url)));
const docs = JSON.parse(readFileSync(new URL("../../data/documents.json", import.meta.url))).documents;
const o = { solution: null };
const out = [];
const row = (...c) => `| ${c.join(" | ")} |`;

// ---------------------------------------------------------------- case 01
const expected = Object.fromEntries(processBatch(docs, md).map((r) => [r.id, r]));
const DEC = { 100000000: "auto", 100000001: "review", 100000002: "escalate", 100000003: "reject" };
const STAT = { 100000000: "Ontvangen", 100000002: "Nazicht", 100000003: "Escalatie", 100000004: "Geboekt", 100000005: "Dubbel", 100000006: "Goedgekeurd", 100000007: "Afgewezen", 100000008: "In wachtrij ERP", 100000009: "Fout" };
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
const RSTAT = { 100000000: "Concept", 100000001: "Ingediend", 100000002: "Ter goedkeuring", 100000003: "Goedgekeurd", 100000004: "Gepland", 100000005: "Geleverd", 100000006: "Ontvangen", 100000007: "Afgesloten", 100000009: "Afgewezen", 100000010: "Fout" };
const rRows = (await get("hv_materiaalaanvraags?$select=hv_aanvrager,hv_aanvraagnr,hv_waarde,hv_route,hv_regel,hv_status,hv_budgetoverschreden&$orderby=createdon asc", o)).json.value;
let rSame = 0;
const rTable = rRows.filter((x) => SAMPLE_REQUESTS.some((s) => x.hv_aanvrager.includes(s.requestNo))).map((x) => {
  const s = SAMPLE_REQUESTS.find((y) => x.hv_aanvrager.includes(y.requestNo));
  const e = evaluate(s, md, "2026-10-12T08:00");
  const route = e.approval.approvers.length ? e.approval.approvers.join(">") : "automatisch";
  const ok = Math.round(x.hv_waarde) === Math.round(e.value) && x.hv_route === route && x.hv_budgetoverschreden === e.overBudget;
  if (ok) rSame++;
  return row(s.requestNo, x.hv_aanvraagnr, `€${Math.round(x.hv_waarde)} / €${Math.round(e.value)}`, x.hv_route, x.hv_regel, RSTAT[x.hv_status] ?? "—", ok ? "ja" : "**NEE**");
});
const lines = (await get("hv_aanvraaglijns?$select=hv_naam,hv_toewijzing&$orderby=createdon asc", o)).json.value;
const outbox = (await get("hv_outboxes?$select=hv_idempotencykey,hv_status,hv_pogingen,hv_laatstefout,hv_endpoint&$filter=hv_endpoint ne 100000000&$orderby=createdon asc", o)).json.value;
const OB = { 100000000: "Wachtend", 100000001: "Verzonden", 100000009: "Dead-letter" };
const EP = { 100000000: "weighing-tickets", 100000001: "reservations", 100000002: "purchase-requisitions", 100000003: "goods-issues", 100000004: "project-costs" };
out.push(`## Case 03 — materiaalaanvragen (flows HV-MA-01 tot HV-MA-04)\n\n**${rSame}/${rTable.length} identiek** (waarde, DT-03-route, budgetcontrole). De status toont waar elke aanvraag nu staat: automatisch goedgekeurd en uitgevoerd, of wachtend op een mens.\n`, row("Testaanvraag", "Dossier", "Waarde flow / motor", "Route", "Regel", "Status", "Gelijk"), row(...Array(7).fill("---")), ...rTable, "",
  "### Toewijzing per depot (door de flow)\n", row("Lijn", "Toewijzing"), row("---", "---"), ...lines.map((l) => row(l.hv_naam, l.hv_toewijzing ?? "")), "",
  "### ERP-outbox van case 02 en 03 (door HV-IN-01 naar de ERP-sandbox)\n", row("Idempotency-key", "Endpoint", "Status", "Pogingen", "Laatste resultaat"), row("---", "---", "---", "---", "---"), ...outbox.map((b) => row(b.hv_idempotencykey, EP[b.hv_endpoint], OB[b.hv_status], b.hv_pogingen ?? 0, b.hv_laatstefout ?? "")), "");

// ---------------------------------------------------------------- case 01: review (nakijken)
const rv = (await get("hv_documents?$select=hv_documentnr,hv_status,hv_netto,hv_correcties,hv_erpreferentie&$filter=hv_documentnr eq 'DOC-006' or hv_documentnr eq 'DOC-013' or hv_documentnr eq 'DOC-019'&$orderby=hv_documentnr asc", o)).json.value;
const keys = { "DOC-006": "wb-WB-26-04222", "DOC-013": "wb-WB-26-04271", "DOC-019": "wb-WB-26-04208" };
const bookings = (await get("hv_erpboekings?$select=hv_idempotencykey,hv_bedrag", o)).json.value;
const expect = { "DOC-006": [100000004, "gecorrigeerd en geboekt"], "DOC-013": [100000003, "terug naar escalatie, niet geboekt"], "DOC-019": [100000005, "dubbel, niet opnieuw geboekt"] };
let rvOk = 0;
const rvRows = rv.map((r) => {
  const n = bookings.filter((b) => b.hv_idempotencykey === keys[r.hv_documentnr]).length;
  const corr = (() => { try { return JSON.parse(r.hv_correcties ?? "[]").map((c) => `${c.veld}: ${c.oud} → ${c.nieuw}`).join(", "); } catch { return ""; } })();
  const ok = r.hv_status === expect[r.hv_documentnr][0] && n === (r.hv_documentnr === "DOC-013" ? 0 : 1);
  if (ok) rvOk++;
  return row(r.hv_documentnr, expect[r.hv_documentnr][1], STAT[r.hv_status], corr || "—", String(n), r.hv_documentnr === "DOC-006" ? String(r.hv_netto) : "—", ok ? "ja" : "**NEE**");
});
out.push(`## Case 01 — nakijken (app "Weegbon Nakijken" + flow HV-DI-02)\n\n**${rvOk}/${rvRows.length} zoals verwacht.** DOC-006 werd gecorrigeerd en goedgekeurd met exact de wijziging die de app bij *Goedkeuren* stuurt (\`approvalPatch()\` uit \`src/review.mjs\`), via de Web API (\`scripts/review-scenario.mjs\`). Het scherm met dezelfde correctie staat in de screenshots. DOC-013 (asbest) en DOC-019 (dubbel) werden bewust buiten de app om op *Goedgekeurd* gezet, om de servercontrole in de flow te testen.\n`, row("Document", "Verwacht", "Status nu", "Correcties", "ERP-boekingen voor dit bonnummer", "Geboekt netto (kg)", "Gelijk"), row(...Array(7).fill("---")), ...rvRows, "");

// ---------------------------------------------------------------- one integration pattern
const allOutbox = (await get("hv_outboxes?$select=hv_idempotencykey,hv_status,hv_endpoint", o)).json.value;
const allBookings = (await get("hv_erpboekings?$select=hv_idempotencykey,hv_soort", o)).json.value;
const perKey = new Map();
for (const bk of allBookings) perKey.set(bk.hv_idempotencykey, (perKey.get(bk.hv_idempotencykey) ?? 0) + 1);
const sent = allOutbox.filter((b) => b.hv_status === 100000001);
const exactlyOnce = sent.filter((b) => perKey.get(b.hv_idempotencykey) === 1).length;
const epRows = Object.entries(EP).map(([v, name]) => {
  const ofEp = allOutbox.filter((b) => b.hv_endpoint === Number(v));
  return row(name, ofEp.length, ofEp.filter((b) => b.hv_status === 100000001).length, ofEp.filter((b) => b.hv_status === 100000000).length, ofEp.filter((b) => b.hv_status === 100000009).length, allBookings.filter((bk) => bk.hv_soort === Number(v)).length);
});
const directBookings = allBookings.filter((bk) => !allOutbox.some((b) => b.hv_idempotencykey === bk.hv_idempotencykey)).length;
const booked = dRows.filter((r) => r.hv_status === 100000004).length;
const queued = dRows.filter((r) => r.hv_status === 100000008).length;
const expBooked = Object.values(expected).filter((e) => e.decision === "auto").length + 1; // + DOC-006 after review
const c4 = (await get("hv_schadeclaims?$select=hv_schadeclaimid,hv_dossiernummer,hv_status&$filter=hv_clientid eq 'c-004'", o)).json.value[0];
const c4Lines = c4 ? (await get(`hv_tijdlijns?$select=hv_gebeurtenis&$filter=_hv_schadeclaim_value eq ${c4.hv_schadeclaimid}`, o)).json.value.map((t) => t.hv_gebeurtenis) : [];
const recv = rRows.find((x) => x.hv_route === "automatisch");
const lifecycle = [
  row("Weegbonnen automatisch of na nazicht naar het ERP", `${expBooked} *Geboekt*`, `${booked} *Geboekt*, ${queued} nog *In wachtrij ERP*`, booked === expBooked ? "ja" : "**NEE**"),
  row("Elke verzonden sleutel precies één keer geboekt", `${sent.length}/${sent.length}`, `${exactlyOnce}/${sent.length}`, exactlyOnce === sent.length ? "ja" : "**NEE**"),
  row("Geen boeking buiten de outbox om", "0", String(directBookings), directBookings === 0 ? "ja" : "**NEE**"),
  row(`Schadeclaim ${c4?.hv_dossiernummer ?? "c-004"} afgesloten (HV-CL-04 → HV-IN-02)`, "tijdlijn: kosten geboekt + recuperatie gestart", c4Lines.filter((l) => /kosten geboekt|recuperatie/.test(l)).join(", ") || "—", c4Lines.some((l) => /kosten geboekt op project/.test(l)) && c4Lines.includes("recuperatie gestart") ? "ja" : "**NEE**"),
  row(`Aanvraag ${recv?.hv_aanvraagnr ?? "—"} ontvangen op de werf (HV-MA-04 → HV-IN-02)`, "*Afgesloten*", RSTAT[recv?.hv_status] ?? "—", recv?.hv_status === 100000007 ? "ja" : "**NEE**"),
];
const lifeOk = lifecycle.filter((l) => l.endsWith("| ja |")).length;
out.push(`## Één integratiepatroon: alles via de outbox\n\nAlle drie de cases sturen hun ERP-berichten via de outbox (HV-IN-01), en HV-IN-02 werkt de bron bij. **${lifeOk}/${lifecycle.length} zoals verwacht.**\n`, row("Controle", "Verwacht", "In Dataverse", "Gelijk"), row(...Array(4).fill("---")), ...lifecycle, "", "### Outbox en ERP-sandbox per endpoint\n", row("Endpoint", "Berichten", "Verzonden", "Wachtend", "Dead-letter", "ERP-boekingen"), row(...Array(6).fill("---")), ...epRows, "");

// ---------------------------------------------------------------- rules: table = repo
const regels = (await get("hv_regels?$select=hv_code,hv_waarde", o)).json.value;
const ruleRows = RULEBOOK.filter((r) => typeof r.value === "number").map((r) => {
  const dv = regels.find((x) => x.hv_code === r.code);
  const same = dv && Math.abs(Number(dv.hv_waarde) - r.value) < 1e-9;
  return { same, row: row(r.code, r.name, `${r.value} ${r.unit}`, dv ? String(dv.hv_waarde) : "ontbreekt", same ? "ja" : "**VERSCHIL**") };
});
const rulesSame = ruleRows.filter((r) => r.same).length;
out.push(`## Regels: tabel Bedrijfsregel en repo\n\nDe flows lezen hun drempels uit de tabel *Bedrijfsregel*; de geteste motor leest ze uit \`src/rules.mjs\`. **${rulesSame}/${ruleRows.length} parameters gelijk.** Een verschil betekent dat iemand een drempel in de backoffice wijzigde: dan volgt de repo, met een test.\n`, row("Code", "Regel", "Repo", "Dataverse", "Gelijk"), row(...Array(5).fill("---")), ...ruleRows.map((r) => r.row), "");

// ---------------------------------------------------------------- notifications
const SOORT = { 100000000: "Info", 100000001: "Actie", 100000002: "Waarschuwing", 100000003: "Fout" };
const MST = { 100000000: "Nieuw", 100000001: "Verstuurd (in-app)", 100000002: "Extern: niet aangesloten", 100000003: "Mislukt" };
const meldingen = (await get("hv_meldings?$select=hv_bron,hv_soort,hv_status,hv_rol", o)).json.value;
const groups = new Map();
for (const m of meldingen) { const k = `${m.hv_bron}|${SOORT[m.hv_soort]}|${MST[m.hv_status]}`; groups.set(k, (groups.get(k) ?? 0) + 1); }
const mRows = [...groups.entries()].sort().map(([k, n]) => row(...k.split("|"), n));
const delivered = meldingen.filter((m) => m.hv_status === 100000001).length;
const failedDelivery = meldingen.filter((m) => m.hv_status === 100000003).length;
const stuck = meldingen.filter((m) => m.hv_status === 100000000).length;
out.push(`## Meldingen\n\nElke flow die iemand verwittigt, schrijft een melding; HV-OP-01 levert ze af. **${meldingen.length} meldingen: ${delivered} als in-app-notificatie verstuurd, ${meldingen.filter((m) => m.hv_status === 100000002).length} naar een extern kanaal dat in de demo niet aangesloten is, ${failedDelivery} mislukt, ${stuck} nog niet verwerkt.**\n`, row("Bron", "Soort", "Status", "Aantal"), row(...Array(4).fill("---")), ...mRows, "");
const concepts = (await get("hv_schadeclaims?$select=hv_dossiernummer,hv_deadlineverzekeraar,hv_aangifteconcept&$filter=hv_deadlineverzekeraar ne null", o)).json.value;
out.push(`### Aangifte-concepten\n\n**${concepts.filter((c) => c.hv_aangifteconcept).length}/${concepts.length}** dossiers met een verzekeringsdeadline hebben een aangifte-concept.\n`);

// ---------------------------------------------------------------- error handling
const fout = (await get("hv_schadeclaims?$select=hv_status&$filter=hv_clientid eq 'c-fout-001'", o)).json.value[0];
const foutMelding = meldingen.some((m) => m.hv_bron === "HV-CL-01" && m.hv_soort === 100000003);
const errOk = fout?.hv_status === 100000009 && foutMelding;
out.push(`## Foutafhandeling\n\nEen melding zonder werf werd bewust aangemaakt, zodat HV-CL-01 faalt. **${errOk ? "1/1 zoals verwacht" : "0/1"}:** de claim kreeg status ${fout?.hv_status === 100000009 ? "*Fout*" : "**geen Fout**"}, en functioneel beheer kreeg ${foutMelding ? "een *Fout*-melding met de mislukte stap en de run-link" : "**geen** melding"}.\n`);

writeFileSync(new URL("../VERIFICATION.md", import.meta.url), `# Verificatie in Power Platform

Wat de echte Power Automate-flows in de ontwikkelomgeving **${CONFIG.name}** in Dataverse schreven, naast de uitkomst van de geteste regelmotor in \`src/\`. Gegenereerd door \`node power-platform/scripts/verify.mjs\` op ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC. Niet met de hand aanpassen.

${out.join("\n")}
`);
console.log(`docs ${dSame}/${dRows.length}, claims ${cSame}/${cTable.length}, requests ${rSame}/${rTable.length}, review ${rvOk}/${rvRows.length}, lifecycle ${lifeOk}/${lifecycle.length}, rules ${rulesSame}/${ruleRows.length}, meldingen ${meldingen.length} (${delivered} in-app), errors ${errOk ? 1 : 0}/1`);
