// Writes the connection references and the cloud flows from ../flows/definitions.mjs into the
// solution. Existing flows are matched by their id (the "HV-XX-NN " prefix) and updated in place, also
// when the name changed. Use --activate to turn them on (needs authenticated connections; see
// connections.json) and --prune to remove HV flows and environment variables that no longer exist.
import { readFileSync } from "node:fs";
import { get, post, api, patch } from "./dv.mjs";
import { FLOWS, CONNECTION_REFERENCES } from "../flows/definitions.mjs";

const conns = JSON.parse(readFileSync(new URL("../connections.json", import.meta.url)));
const activate = process.argv.includes("--activate");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const prune = process.argv.includes("--prune");

// entity set names for the definitions
const S = {};
const model = JSON.parse(readFileSync(new URL("../model.json", import.meta.url)));
for (const t of model.tables) {
  S[t.name] = (await get(`EntityDefinitions(LogicalName='${t.name}')?$select=EntitySetName`)).json.EntitySetName;
}

for (const [logical, ref] of Object.entries({ hv_dataverse: "shared_commondataserviceforapps", hv_approvals: "shared_approvals" })) {
  const found = await get(`connectionreferences?$select=connectionreferenceid,connectionid&$filter=connectionreferencelogicalname eq '${logical}'`);
  const body = { connectionreferencelogicalname: logical, connectionreferencedisplayname: logical === "hv_dataverse" ? "Halverdijk — Microsoft Dataverse" : "Halverdijk — Approvals", connectorid: `/providers/Microsoft.PowerApps/apis/${ref}`, connectionid: conns[ref] };
  if (found.json.value.length) await patch(`connectionreferences(${found.json.value[0].connectionreferenceid})`, { connectionid: conns[ref] });
  else await post("connectionreferences", body);
  console.log(`connection reference ${logical} → ${conns[ref]}`);
}

for (const f of FLOWS) {
  if (only && !f.id.startsWith(only)) continue;
  const clientdata = JSON.stringify({ properties: { connectionReferences: CONNECTION_REFERENCES, definition: f.build(S) }, schemaVersion: "1.0.0.0" });
  const found = await get(`workflows?$select=workflowid,statecode&$filter=startswith(name,'${f.id} ') and category eq 5`);
  let id = found.json.value[0]?.workflowid;
  if (id) {
    if (found.json.value[0].statecode === 1) await patch(`workflows(${id})`, { statecode: 0, statuscode: 1 });
    await patch(`workflows(${id})`, { clientdata, description: f.description, name: f.name });
    console.log(`updated ${f.name}`);
  } else {
    const res = await post("workflows", { category: 5, type: 1, primaryentity: "none", name: f.name, description: f.description, clientdata });
    id = res.headers.get("OData-EntityId").match(/\(([0-9a-f-]{36})\)/)[1];
    console.log(`created ${f.name}`);
  }
  if (activate) {
    try {
      await patch(`workflows(${id})`, { statecode: 1, statuscode: 2 });
      console.log(`  ✓ on`);
    } catch (e) {
      console.log(`  ✗ ${e.message.slice(0, 400)}`);
    }
  }
}

if (prune) {
  const ids = new Set(FLOWS.map((f) => f.id));
  for (const w of (await get("workflows?$select=workflowid,name,statecode&$filter=startswith(name,'HV-') and category eq 5")).json.value) {
    if (ids.has(w.name.split(" ")[0])) continue;
    if (w.statecode === 1) await patch(`workflows(${w.workflowid})`, { statecode: 0, statuscode: 1 });
    await api("DELETE", `workflows(${w.workflowid})`);
    console.log(`removed flow ${w.name}`);
  }
  const keep = new Set(model.environmentVariables.map((v) => v.schemaName));
  for (const v of (await get("environmentvariabledefinitions?$select=environmentvariabledefinitionid,schemaname&$filter=startswith(schemaname,'hv_')")).json.value) {
    if (keep.has(v.schemaname)) continue;
    for (const val of (await get(`environmentvariablevalues?$select=environmentvariablevalueid&$filter=_environmentvariabledefinitionid_value eq ${v.environmentvariabledefinitionid}`)).json.value) await api("DELETE", `environmentvariablevalues(${val.environmentvariablevalueid})`);
    await api("DELETE", `environmentvariabledefinitions(${v.environmentvariabledefinitionid})`);
    console.log(`removed environment variable ${v.schemaname} (now a row in Bedrijfsregel)`);
  }
}
