// Cancels the runs that are still waiting (e.g. on an approval) for the HV flows, so a replay starts clean.
// Usage: node cancel-runs.mjs [prefix, default "HV-"]
import { execSync } from "node:child_process";
import { get, CONFIG } from "./dv.mjs";

const prefix = process.argv[2] ?? "HV-";
const tok = execSync(`az account get-access-token --tenant ${CONFIG.tenantId} --resource https://service.flow.microsoft.com/ --query accessToken -o tsv`, { encoding: "utf8" }).trim();
const H = { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
for (const wf of (await get(`workflows?$select=workflowid,name&$filter=startswith(name,'${prefix}') and category eq 5`, { solution: null })).json.value) {
  const base = `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/${CONFIG.environmentId}/flows/${wf.workflowid}`;
  const runs = (await (await fetch(`${base}/runs?api-version=2016-11-01&$filter=Status eq 'Running'`, { headers: H })).json()).value ?? [];
  for (const r of runs) {
    const res = await fetch(`${base}/runs/${r.name}/cancel?api-version=2016-11-01`, { method: "POST", headers: H });
    console.log(`${wf.name} ${r.name.slice(-6)} cancel → ${res.status}`);
  }
}
