// End-to-end check of the review step (case 01) against the real flows:
//  1. DOC-006: the reviewer corrects net 13350 → 18350 and approves (same patch the review app sends).
//  2. DOC-013 (asbestos) is forced to Goedgekeurd directly, bypassing the app: flow HV-DI-02 must refuse.
//  3. DOC-019 (duplicate of DOC-004) is forced to Goedgekeurd: flow HV-DI-02 must not book twice.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { get, patch } from "./dv.mjs";
import { documentFromRow, approvalPatch } from "../../src/review.mjs";

const o = { solution: null };
const by = process.env.HV_APPROVER ?? execSync("az account show --query user.name -o tsv", { encoding: "utf8" }).trim();
const row = async (nr) => (await get(`hv_documents?$filter=hv_documentnr eq '${nr}'`, o)).json.value[0];

const d6 = await row("DOC-006");
if (d6.hv_status === 100000002) {
  await patch(`hv_documents(${d6.hv_documentid})`, approvalPatch(documentFromRow(d6), { net: "18350" }, { by, at: new Date().toISOString(), note: "Netto verkeerd gelezen (8 als 3); gecorrigeerd volgens de scan." }), o);
  console.log("DOC-006 approved with correction");
}
for (const nr of ["DOC-013", "DOC-019"]) {
  const d = await row(nr);
  if (![100000006, 100000004].includes(d.hv_status)) {
    await patch(`hv_documents(${d.hv_documentid})`, { hv_status: 100000006, hv_reviewer: `${by} (test: app omzeild)`, hv_reviewopmerking: "Test: rechtstreeks op Goedgekeurd gezet, buiten de app om." }, o);
    console.log(`${nr} forced to Goedgekeurd`);
  }
}
console.log("wait ~1 min, then run verify.mjs");
JSON.parse(readFileSync(new URL("../environment.json", import.meta.url)));
