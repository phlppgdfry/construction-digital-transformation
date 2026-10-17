// Loads the benefits simulation (site/data/benefits.json, built from src/benefits.mjs) into the Dataverse
// table KPI-meting, scenario "verwacht", with bron = Simulatie. The backoffice dashboard charts read it.
// After a real go-live, measured rows (bron = Meting) take their place; the charts stay the same.
// Usage: node seed-kpi.mjs [startmaand, default 2027-01]
import { readFileSync } from "node:fs";
import { api, get } from "./dv.mjs";

const start = process.argv[2] ?? "2027-01";
const b = JSON.parse(readFileSync(new URL("../../site/data/benefits.json", import.meta.url)));
const sc = b.scenarios.verwacht;
const es = (await get("EntityDefinitions(LogicalName='hv_kpimeting')?$select=EntitySetName")).json.EntitySetName;
const monthOf = (m) => { const [y, mo] = start.split("-").map(Number); const d = new Date(Date.UTC(y, mo - 1 + m, 1)); return d.toISOString().slice(0, 10); };
const KPIS = [["Uren vrijgekomen", "hours", "uur"], ["Baten (€)", "benefit", "€"], ["Netto cumulatief (€)", "cum", "€"]];
let n = 0;
for (const [key, c] of Object.entries(sc.cases)) {
  const id = key.replace("case", "");
  for (const r of c.rows) {
    for (const [kpi, field, unit] of KPIS) {
      const naam = `${id}-${String(r.m + 1).padStart(2, "0")}-${field}`;
      await api("PATCH", `${es}(hv_naam='${naam}')`, { hv_maand: monthOf(r.m), hv_case: id, hv_kpi: kpi, hv_waarde: Math.round(r[field] * 100) / 100, hv_eenheid: unit, hv_bron: 100000000 }, { solution: null });
      n++;
    }
  }
}
console.log(`KPI-meting: ${n} rijen (simulatie, scenario verwacht, vanaf ${start})`);
