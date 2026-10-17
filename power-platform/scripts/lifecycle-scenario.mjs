// Drives the rest of the lifecycle through the real flows, after seed-scenarios.mjs and review-scenario.mjs:
//  1. a weighing ticket in Nazicht is rejected                        → HV-DI-03 notifies customer and carrier
//  2. claim c-002 is put on Ter goedkeuring                            → HV-CL-02 asks the approval chain (waits for a person)
//  3. claim c-004 (third party liable) is closed with its real cost    → HV-CL-04 → outbox → ERP → HV-IN-02 timeline
//  4. the automatically approved material request is received on site  → HV-MA-04 → outbox → ERP → HV-IN-02 Afgesloten
//  5. a claim without a site is created on purpose                     → HV-CL-01 fails → Bij_fout: status Fout + Fout-melding
// Steps 3 and 4 bypass the approvals on purpose (a test, logged as such), so the closing flows can be proven
// without waiting for a person. Usage: node lifecycle-scenario.mjs [1-5 ...]
import { get, patch, post } from "./dv.mjs";
import { SAMPLE_REQUESTS } from "../../src/materials.mjs";

const o = { solution: null };
const steps = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [1, 2, 3, 4, 5];
const one = async (q) => (await get(q, o)).json.value[0];

if (steps.includes(1)) {
  const d = await one("hv_documents?$select=hv_documentid,hv_documentnr&$filter=hv_status eq 100000002 and hv_documentnr ne 'DOC-006'&$orderby=hv_documentnr asc&$top=1");
  if (d) {
    await patch(`hv_documents(${d.hv_documentid})`, { hv_status: 100000007, hv_reviewer: "Administratie (test)", hv_gereviewdop: new Date().toISOString(), hv_reviewopmerking: "Test: bon onleesbaar, klant moet een nieuwe weging laten doen." }, o);
    console.log(`1. ${d.hv_documentnr} afgewezen → HV-DI-03`);
  }
}
if (steps.includes(2)) {
  const c = await one("hv_schadeclaims?$select=hv_schadeclaimid,hv_dossiernummer,hv_status&$filter=hv_clientid eq 'c-002'");
  if (c && c.hv_status === 100000001) { await patch(`hv_schadeclaims(${c.hv_schadeclaimid})`, { hv_status: 100000003 }, o); console.log(`2. ${c.hv_dossiernummer} ter goedkeuring → HV-CL-02`); }
}
if (steps.includes(3)) {
  const c = await one("hv_schadeclaims?$select=hv_schadeclaimid,hv_dossiernummer,hv_status&$filter=hv_clientid eq 'c-004'");
  if (c && c.hv_status !== 100000007) {
    await patch(`hv_schadeclaims(${c.hv_schadeclaimid})`, { hv_werkelijkekost: 2350 }, o);
    await post("hv_tijdlijns", { hv_gebeurtenis: "test: afgesloten buiten de goedkeuring om", hv_door: "lifecycle-scenario.mjs", hv_opmerking: "Om HV-CL-04 te bewijzen zonder op Approvals te wachten.", "hv_Schadeclaim@odata.bind": `/hv_schadeclaims(${c.hv_schadeclaimid})` }, o);
    await patch(`hv_schadeclaims(${c.hv_schadeclaimid})`, { hv_status: 100000007 }, o);
    console.log(`3. ${c.hv_dossiernummer} afgesloten (kost €2.350) → HV-CL-04`);
  }
}
if (steps.includes(4)) {
  for (const s of SAMPLE_REQUESTS) {
    const r = await one(`hv_materiaalaanvraags?$select=hv_materiaalaanvraagid,hv_aanvraagnr,hv_status,hv_route&$filter=hv_aanvrager eq '${s.requester} (${s.requestNo})'`);
    if (r && r.hv_route === "automatisch" && [100000003, 100000004, 100000005].includes(r.hv_status)) {
      await patch(`hv_materiaalaanvraags(${r.hv_materiaalaanvraagid})`, { hv_status: 100000006 }, o);
      console.log(`4. ${r.hv_aanvraagnr} ontvangen → HV-MA-04`);
    }
  }
}
if (steps.includes(5)) {
  const exists = await one("hv_schadeclaims?$select=hv_schadeclaimid&$filter=hv_clientid eq 'c-fout-001'");
  if (!exists) {
    await post("hv_schadeclaims", { hv_clientid: "c-fout-001", hv_melder: "Test foutafhandeling", hv_categorie: 100000004, hv_status: 100000000, hv_omschrijving: "Test: melding zonder werf, zodat HV-CL-01 faalt en Bij_fout loopt.", hv_geschatbedrag: 100 }, o);
    console.log("5. claim zonder werf aangemaakt → HV-CL-01 faalt → Bij_fout");
  }
}
console.log("wacht ±10 minuten (de outbox loopt elke 5 minuten), dan verify.mjs");
