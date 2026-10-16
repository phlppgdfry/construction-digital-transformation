// Model-driven app "Halverdijk Backoffice": main forms (fields + subgrids), default views, sitemap and app module.
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { get, post, patch, CONFIG } from "./dv.mjs";
const DASHBOARD = "Halverdijk — Overzicht"; // same name as in provision-dashboard.mjs

const model = JSON.parse(readFileSync(new URL("../model.json", import.meta.url)));
const byName = Object.fromEntries(model.tables.map((t) => [t.name, t]));
const CLASS = { text: "{4273EDBD-AC1D-40d3-9FB2-095C621B552D}", memo: "{E0DECE4B-6FC8-4a8f-A065-082708572369}", int: "{C6D124CA-7EDA-4a60-AEA9-7FB8D318B68F}", decimal: "{C3EFE0C3-0EC6-42be-8349-CBD9079DFD8E}", bool: "{67FAC785-CD58-4f9f-ABB3-4B7DDC6ED5ED}", datetime: "{5B773807-9FB2-42db-97C3-7A91EFF8ADFF}", date: "{5B773807-9FB2-42db-97C3-7A91EFF8ADFF}", choice: "{3EF39988-22BB-4f0b-BBBE-64B5A3748AEE}", lookup: "{270BD3DB-D9AF-4782-9025-509E298DEC0A}" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const g = () => `{${randomUUID()}}`;

// columns shown in the default "Active" view, per table
const VIEW = {
  hv_document: ["hv_documentnr", "hv_status", "hv_beslissing", "hv_bonnummer", "hv_klantnummer", "hv_materiaal", "hv_netto", "hv_minconfidence", "hv_erpreferentie"],
  hv_schadeclaim: ["hv_dossiernummer", "hv_status", "hv_ernst", "hv_categorie", "hv_werf", "hv_geschatbedrag", "hv_eigenaar", "hv_goedkeuringsketen", "hv_deadlinebeoordeling", "hv_deadlineverzekeraar"],
  hv_materiaalaanvraag: ["hv_aanvraagnr", "hv_status", "hv_werf", "hv_leverenop", "hv_spoed", "hv_waarde", "hv_route", "hv_regel", "hv_budgetoverschreden"],
  hv_outbox: ["hv_idempotencykey", "hv_status", "hv_endpoint", "hv_pogingen", "hv_volgendepoging", "hv_laatstefout", "hv_referentie"],
  hv_erpboeking: ["hv_idempotencykey", "hv_soort", "hv_referentie", "hv_bedrag", "createdon"],
  hv_tijdlijn: ["hv_gebeurtenis", "hv_schadeclaim", "hv_door", "hv_opmerking", "createdon"],
  hv_aanvraaglijn: ["hv_naam", "hv_aanvraag", "hv_artikel", "hv_hoeveelheid", "hv_toewijzing", "hv_tekort", "hv_waarde"],
  hv_voorraad: ["hv_naam", "hv_artikel", "hv_depot", "hv_opvoorraad", "hv_gereserveerd"],
  hv_artikel: ["hv_artikelnr", "hv_omschrijving", "hv_eenheid", "hv_eenheidsprijs", "hv_categorie", "hv_bron", "hv_alternatief"],
};
// subgrids on main forms: [child table, relationship schema name, label]
const SUBGRIDS = {
  hv_schadeclaim: [["hv_tijdlijn", "hv_schadeclaim_tijdlijn_schadeclaim", "Tijdlijn (audit)"]],
  hv_materiaalaanvraag: [["hv_aanvraaglijn", "hv_materiaalaanvraag_aanvraaglijn_aanvraag", "Aanvraaglijnen en toewijzing"], ["hv_outbox", "hv_materiaalaanvraag_outbox_aanvraag", "ERP-berichten (outbox)"]],
  hv_werf: [["hv_werfbudget", "hv_werf_werfbudget_werf", "Budgetlijnen"], ["hv_afstand", "hv_werf_afstand_werf", "Afstand tot depots"]],
};

function columnsOf(t) {
  const cols = [[t.primary[0], "text", t.primary[1]], ...(t.lookups ?? []).map(([n, , d]) => [n, "lookup", d]), ...(t.columns ?? []).filter((c) => c[1] !== "image")];
  return cols;
}
const cell = ([name, type, display]) => `<cell id="${g()}"><labels><label description="${esc(display)}" languagecode="1033" /></labels><control id="${name}" classid="${CLASS[type]}" datafieldname="${name}" /></cell>`;
const section = (title, cols) => `<section showlabel="true" showbar="false" IsUserDefined="0" id="${g()}"><labels><label description="${esc(title)}" languagecode="1033" /></labels><rows>${cols.map((c) => `<row>${cell(c)}</row>`).join("")}</rows></section>`;

async function subgridXml(child, rel, label) {
  const view = (await get(`savedqueries?$select=savedqueryid&$filter=returnedtypecode eq '${child}' and querytype eq 2`, { solution: null })).json.value[0];
  const vid = `{${view.savedqueryid}}`;
  return `<section showlabel="true" showbar="false" IsUserDefined="0" id="${g()}"><labels><label description="${esc(label)}" languagecode="1033" /></labels><rows><row><cell id="${g()}" rowspan="6" colspan="1"><labels><label description="${esc(label)}" languagecode="1033" /></labels><control id="sg_${child}" classid="{E7A81278-8635-4d9e-8D4D-59480B391C5B}" indicationOfSubgrid="true" uniqueid="${g()}"><parameters><RecordsPerPage>10</RecordsPerPage><AutoExpand>Fixed</AutoExpand><EnableQuickFind>false</EnableQuickFind><EnableViewPicker>false</EnableViewPicker><EnableJumpBar>false</EnableJumpBar><ChartGridMode>Grid</ChartGridMode><VisualizationId /><IsUserView>false</IsUserView><ViewId>${vid}</ViewId><TargetEntityType>${child}</TargetEntityType><ViewIds>${vid}</ViewIds><RelationshipName>${rel}</RelationshipName></parameters></control></cell></row><row /><row /><row /><row /><row /></rows></section>`;
}

for (const t of model.tables) {
  const cols = columnsOf(t);
  const half = Math.ceil(cols.length / 2);
  const subs = await Promise.all((SUBGRIDS[t.name] ?? []).map(([c, r, l]) => subgridXml(c, r, l)));
  const formxml = `<form><tabs><tab verticallayout="true" id="${g()}" IsUserDefined="1"><labels><label description="${esc(t.display)}" languagecode="1033" /></labels><columns><column width="50%"><sections>${section("Gegevens", cols.slice(0, half))}</sections></column><column width="50%"><sections>${section("Details", cols.slice(half))}</sections></column></columns></tab>${subs.length ? `<tab verticallayout="true" id="${g()}" IsUserDefined="1"><labels><label description="Gerelateerd" languagecode="1033" /></labels><columns><column width="100%"><sections>${subs.join("")}</sections></column></columns></tab>` : ""}</tabs></form>`;
  const form = (await get(`systemforms?$select=formid&$filter=objecttypecode eq '${t.name}' and type eq 2`, { solution: null })).json.value[0];
  await patch(`systemforms(${form.formid})`, { formxml, name: t.display });

  const viewCols = VIEW[t.name] ?? cols.slice(0, 6).map((c) => c[0]);
  const q = (await get(`savedqueries?$select=savedqueryid,layoutxml&$filter=returnedtypecode eq '${t.name}' and querytype eq 0 and isdefault eq true`, { solution: null })).json.value[0];
  const object = q.layoutxml.match(/object="(\d+)"/)[1];
  const layoutxml = `<grid name="resultset" object="${object}" jump="${t.primary[0]}" select="1" icon="1" preview="1"><row name="result" id="${t.name}id">${viewCols.map((c) => `<cell name="${c}" width="${c === t.primary[0] ? 160 : 130}" />`).join("")}</row></grid>`;
  const fetchxml = `<fetch version="1.0" mapping="logical"><entity name="${t.name}">${viewCols.map((c) => `<attribute name="${c}" />`).join("")}<attribute name="${t.name}id" /><order attribute="createdon" descending="true" /><filter type="and"><condition attribute="statecode" operator="eq" value="0" /></filter></entity></fetch>`;
  await patch(`savedqueries(${q.savedqueryid})`, { layoutxml, fetchxml });
  console.log(`form + view ${t.name}`);
}

// sitemap
const AREAS = [
  ["hv_area_c1", "01 Weegbonnen", [["Recyclage", ["hv_document", "hv_erpboeking"]], ["Stamgegevens", ["hv_klant", "hv_nummerplaat", "hv_materiaalcode"]]]],
  ["hv_area_c2", "02 Schadeclaims", [["Dossiers", ["hv_schadeclaim", "hv_tijdlijn"]], ["Instellingen", ["hv_goedkeurder", "hv_werf"]]]],
  ["hv_area_c3", "03 Materiaal", [["Aanvragen", ["hv_materiaalaanvraag", "hv_aanvraaglijn", "hv_outbox"]], ["ERP-sandbox", ["hv_artikel", "hv_voorraad", "hv_depot", "hv_afstand", "hv_werfbudget"]]]],
];
const T = (s) => `<Titles><Title LCID="1033" Title="${esc(s)}" /></Titles>`;
// KPI dashboard (provision-dashboard.mjs) as the first page, when it exists
const dash = (await get(`systemforms?$select=formid&$filter=type eq 0 and name eq '${DASHBOARD}'`, { solution: null })).json.value[0];
const dashArea = dash ? `<Area Id="hv_area_overzicht" ShowGroups="true">${T("Overzicht")}<Group Id="hv_area_overzicht_g0" IsProfile="false">${T("KPI's")}<SubArea Id="hv_dashboard" Url="/main.aspx?pagetype=dashboard&amp;id=${dash.formid}&amp;type=system" DefaultDashboard="${dash.formid}">${T("KPI-dashboard")}</SubArea></Group></Area>` : "";
const sitemapxml = `<SiteMap IntroducedVersion="7.0.0.0">${dashArea}${AREAS.map(([id, title, groups]) => `<Area Id="${id}" ShowGroups="true">${T(title)}${groups.map(([gt, ents], i) => `<Group Id="${id}_g${i}" IsProfile="false">${T(gt)}${ents.map((e) => `<SubArea Id="${id}_${e}" Entity="${e}">${T(byName[e].plural)}</SubArea>`).join("")}</Group>`).join("")}</Area>`).join("")}</SiteMap>`;
let sm = (await get(`sitemaps?$select=sitemapid&$filter=sitemapnameunique eq 'hv_backoffice'`, { solution: null })).json.value[0];
if (sm) await patch(`sitemaps(${sm.sitemapid})`, { sitemapxml });
else { const r = await post("sitemaps", { sitemapname: "Halverdijk Backoffice", sitemapnameunique: "hv_backoffice", sitemapxml, isappaware: true }); sm = { sitemapid: r.headers.get("OData-EntityId").match(/\(([0-9a-f-]{36})\)/)[1] }; }

let app = (await get(`appmodules?$select=appmoduleid&$filter=uniquename eq 'hv_HalverdijkBackoffice'`, { solution: null })).json.value[0];
if (!app) {
  const r = await post("appmodules", { name: "Halverdijk Backoffice", uniquename: "hv_HalverdijkBackoffice", description: "Backoffice voor de drie cases (fictief): weegbonnen nakijken, schadeclaims beoordelen, materiaalaanvragen en ERP-outbox opvolgen.", clienttype: 4, navigationtype: 0, formfactor: 1, webresourceid: "953b9fac-1e5e-e611-80d6-00155ded156f" });
  app = { appmoduleid: r.headers.get("OData-EntityId").match(/\(([0-9a-f-]{36})\)/)[1] };
}
const entities = [];
for (const t of model.tables) entities.push({ "@odata.type": "Microsoft.Dynamics.CRM.entity", entityid: (await get(`EntityDefinitions(LogicalName='${t.name}')?$select=MetadataId`)).json.MetadataId });
const charts = (await get(`savedqueryvisualizations?$select=savedqueryvisualizationid&$filter=startswith(name,'KPI 0')`, { solution: null })).json.value.map((c) => ({ "@odata.type": "Microsoft.Dynamics.CRM.savedqueryvisualization", savedqueryvisualizationid: c.savedqueryvisualizationid }));
await post("AddAppComponents", { AppId: app.appmoduleid, Components: [{ "@odata.type": "Microsoft.Dynamics.CRM.sitemap", sitemapid: sm.sitemapid }, ...entities, ...(dash ? [{ "@odata.type": "Microsoft.Dynamics.CRM.systemform", formid: dash.formid }] : []), ...charts] });
const v = await get(`ValidateApp(AppModuleId=${app.appmoduleid})`, { solution: null });
console.log("validate:", v.json.AppValidationResponse?.ValidationSuccess, (v.json.AppValidationResponse?.ValidationIssueList ?? []).map((i) => i.Message).slice(0, 5));
await post("PublishXml", { ParameterXml: `<importexportxml><appmodules><appmodule>${app.appmoduleid}</appmodule></appmodules><sitemaps><sitemap>${sm.sitemapid}</sitemap></sitemaps><entities>${model.tables.map((t) => `<entity>${t.name}</entity>`).join("")}</entities></importexportxml>` });
// a changed sitemap only reaches the app after a full publish
await post("PublishAllXml", {}, { solution: null });
console.log(`app ${app.appmoduleid} published: ${CONFIG.url}/main.aspx?appid=${app.appmoduleid}`);
