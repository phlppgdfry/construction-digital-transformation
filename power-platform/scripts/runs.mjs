// Shows recent runs of a flow and the failing actions (Power Automate management API).
import { execSync } from "node:child_process";
import { get, CONFIG } from "./dv.mjs";
const prefix = process.argv[2];
const n = Number(process.argv[3] ?? 3);
const tok = execSync(`az account get-access-token --tenant ${CONFIG.tenantId} --resource https://service.flow.microsoft.com/ --query accessToken -o tsv`, { encoding: "utf8" }).trim();
const wf = (await get(`workflows?$select=workflowid,name&$filter=startswith(name,'${prefix}')`, { solution: null })).json.value[0];
const base = `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/${CONFIG.environmentId}/flows/${wf.workflowid}`;
const H = { Authorization: `Bearer ${tok}` };
const runs = (await (await fetch(`${base}/runs?api-version=2016-11-01`, { headers: H })).json()).value ?? [];
console.log(wf.name, `${runs.length} runs:`, runs.map((r) => r.properties.status).join(" "));
for (const r of runs.slice(0, n)) {
  const acts = (await (await fetch(`${base}/runs/${r.name}/actions?api-version=2016-11-01`, { headers: H })).json()).value ?? [];
  for (const a of acts.filter((x) => x.properties.status === "Failed")) {
    let detail = a.properties.error?.message ?? "";
    if (a.properties.outputsLink?.uri) { try { const o = await (await fetch(a.properties.outputsLink.uri)).json(); detail += " | " + JSON.stringify(o.body ?? o).slice(0, 500); } catch {} }
    console.log(`  ${r.name.slice(-6)} ✗ ${a.name}: ${detail.slice(0, 700)}`);
  }
}
