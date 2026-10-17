// Loads the fictional master data from ../../data/master-data.json into Dataverse.
// Upserts on alternate keys (PATCH entityset(key='value')), so re-running never creates duplicates.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { api, get } from "./dv.mjs";
import { RULEBOOK } from "../../src/rules.mjs";

const md = JSON.parse(readFileSync(new URL("../../data/master-data.json", import.meta.url)));
const CAT = { granulaten: 100000000, asfalt: 100000001, riolering: 100000002, signalisatie: 100000003, kleinmateriaal: 100000004 };
const esc = (s) => encodeURIComponent(String(s).replace(/'/g, "''"));
const sets = {};
async function set(table) {
  if (!sets[table]) sets[table] = (await get(`EntityDefinitions(LogicalName='${table}')?$select=EntitySetName`)).json.EntitySetName;
  return sets[table];
}
async function upsert(table, keyCol, keyVal, body) {
  const es = await set(table);
  if (!/[&#%+]/.test(keyVal)) { await api("PATCH", `${es}(${keyCol}='${esc(keyVal)}')`, body, { solution: null }); return; }
  // IIS refuses '&' in the URL path, even encoded: look the row up with a filter instead.
  const found = await get(`${es}?$select=${table}id&$filter=${keyCol} eq '${esc(keyVal)}'`, { solution: null });
  const id = found.json.value[0]?.[`${table}id`];
  if (id) await api("PATCH", `${es}(${id})`, body, { solution: null });
  else await api("POST", es, { [keyCol]: keyVal, ...body }, { solution: null });
}
const bind = async (nav, table, keyCol, keyVal) => ({ [`${nav}@odata.bind`]: `/${await set(table)}(${keyCol}='${esc(keyVal)}')` });

let n = 0;
for (const p of md.projects) {
  await upsert("hv_werf", "hv_werfnr", p.projectNo, { hv_naam: p.name, hv_type: p.type, hv_actief: p.active, hv_projectleider: p.manager, hv_afdeling: p.department }); n++;
}
for (const d of md.depots) { await upsert("hv_depot", "hv_depotnr", d.depotNo, { hv_naam: d.name }); n++; }
for (const p of md.projects) {
  for (const [depot, km] of Object.entries(p.depotKm)) {
    await upsert("hv_afstand", "hv_naam", `${p.projectNo}→${depot}`, { hv_km: km, ...(await bind("hv_Werf", "hv_werf", "hv_werfnr", p.projectNo)), ...(await bind("hv_Depot", "hv_depot", "hv_depotnr", depot)) }); n++;
  }
  for (const [cat, amount] of Object.entries(p.budget)) {
    await upsert("hv_werfbudget", "hv_naam", `${p.projectNo} ${cat}`, { hv_categorie: CAT[cat], hv_budget: amount, ...(await bind("hv_Werf", "hv_werf", "hv_werfnr", p.projectNo)) }); n++;
  }
}
const madeToOrder = new Set(md.stock.filter((s) => s.madeToOrder).map((s) => s.itemNo));
for (const c of md.catalog) {
  await upsert("hv_artikel", "hv_artikelnr", c.itemNo, {
    hv_omschrijving: c.label, hv_eenheid: c.unit, hv_eenheidsprijs: c.unitCost, hv_categorie: CAT[c.category], hv_bron: c.source === "intern" ? 100000000 : 100000001,
    hv_gerecycleerd: !!c.recycled, hv_levertijddagen: c.leadDays ?? 0, hv_alternatief: c.recycledAlternative ?? null, hv_alleenweekdagen: !!c.weekdaysOnly, hv_opbestelling: madeToOrder.has(c.itemNo),
  }); n++;
}
for (const s of md.stock) {
  await upsert("hv_voorraad", "hv_naam", `${s.itemNo}@${s.depotNo}`, { hv_opvoorraad: s.madeToOrder ? 99999 : s.onHand, hv_gereserveerd: s.reserved, ...(await bind("hv_Artikel", "hv_artikel", "hv_artikelnr", s.itemNo)), ...(await bind("hv_Depot", "hv_depot", "hv_depotnr", s.depotNo)) }); n++;
}
for (const c of md.customers) {
  await upsert("hv_klant", "hv_klantnr", c.customerNo, { hv_naam: c.name, hv_actief: c.active }); n++;
  for (const plate of c.plates) { await upsert("hv_nummerplaat", "hv_plaat", plate, { hv_vervoerder: false, ...(await bind("hv_Klant", "hv_klant", "hv_klantnr", c.customerNo)) }); n++; }
}
for (const h of md.hauliers) for (const plate of h.plates) { await upsert("hv_nummerplaat", "hv_plaat", plate, { hv_vervoerder: true }); n++; }
for (const a of md.acceptance.accepted) { await upsert("hv_materiaalcode", "hv_code", a.code, { hv_omschrijving: a.label, hv_soort: 100000000, hv_prijsperton: a.pricePerTonne, hv_bodemref: !!a.needsSoilRef }); n++; }
for (const a of md.acceptance.refused) { await upsert("hv_materiaalcode", "hv_code", a.code, { hv_omschrijving: a.label, hv_soort: 100000001, hv_bodemref: false }); n++; }
for (const a of md.acceptance.products) { await upsert("hv_materiaalcode", "hv_code", a.code, { hv_omschrijving: a.label, hv_soort: 100000002, hv_prijsperton: a.pricePerTonne, hv_bodemref: false }); n++; }
// The rulebook (src/rules.mjs) as rows in Bedrijfsregel: the flows read their thresholds from here.
for (const r of RULEBOOK) {
  await upsert("hv_regel", "hv_code", r.code, { hv_naam: r.name, hv_regeltekst: r.rule, hv_waarde: r.value ?? null, hv_eenheid: r.unit ?? null, hv_case: r.case, hv_eigenaar: r.owner, hv_waarom: r.why }); n++;
}
// Every role (approver or receiver of a melding) points to the signed-in maker in a single-user dev environment.
const ROLES = ["Projectleider", "Afdelingsverantwoordelijke", "Directie", "Fleetmanager", "Claims & verzekeringen", "Administratie recyclage", "Milieucoördinator", "Functioneel beheer", "Werfleider", "Werfplanning", "Preventieadviseur", ...new Set(md.projects.map((p) => p.manager))];
const approver = process.env.HV_APPROVER ?? execSync("az account show --query user.name -o tsv", { encoding: "utf8" }).trim();
for (const rol of ROLES) {
  await upsert("hv_goedkeurder", "hv_rol", rol, { hv_email: approver, hv_vervanger: approver }); n++;
}
console.log(`seeded ${n} master rows`);
