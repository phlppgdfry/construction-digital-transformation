// Deletes demo rows of the given tables so scenarios can be replayed through the flows.
import { get, api } from "./dv.mjs";
for (const t of process.argv.slice(2)) {
  const es = (await get(`EntityDefinitions(LogicalName='${t}')?$select=EntitySetName`)).json.EntitySetName;
  const rows = (await get(`${es}?$select=${t}id`, { solution: null })).json.value;
  for (const r of rows) await api("DELETE", `${es}(${r[`${t}id`]})`, undefined, { solution: null });
  console.log(`${t}: ${rows.length} deleted`);
}
