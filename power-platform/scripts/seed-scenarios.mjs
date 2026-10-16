// Creates the demo scenarios in Dataverse, which triggers the real flows:
//   30 weighing tickets (case 01) → HV-DI-01, 5 damage reports (case 02) → HV-CL-01,
//   4 material requests (case 03) → HV-MA-01 → outbox → HV-MA-02.
// Usage: node seed-scenarios.mjs [documents|claims|requests]
import { readFileSync } from "node:fs";
import { get, post, patch, idFrom } from "./dv.mjs";
import { SAMPLE_REPORTS } from "../../src/claims.mjs";
import { SAMPLE_REQUESTS } from "../../src/materials.mjs";

const which = process.argv[2] ?? "all";
const docs = JSON.parse(readFileSync(new URL("../../data/documents.json", import.meta.url))).documents;
const set = async (t) => (await get(`EntityDefinitions(LogicalName='${t}')?$select=EntitySetName`)).json.EntitySetName;
const opts = { solution: null };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (which === "all" || which === "documents") {
  const es = await set("hv_document");
  for (const d of docs) {
    const exists = await get(`${es}?$select=hv_documentid&$filter=hv_documentnr eq '${d.id}'`, opts);
    if (exists.json.value.length) continue;
    const e = d.extracted;
    const conf = Object.entries(e).filter(([k]) => !["idFormNo", "soilRef"].includes(k)).map(([veld, v]) => ({ veld, confidence: v.confidence }));
    await post(es, {
      hv_documentnr: d.id, hv_scenario: d.scenario, hv_kanaal: d.channel === "scan weegbrug" ? 100000000 : 100000001, hv_ontvangen: `${d.received}:00Z`,
      hv_bonnummer: e.ticketNo.value, hv_datum: e.date.value, hv_plaat: e.plate.value, hv_klantnummer: e.customerNo.value,
      hv_richting: e.direction.value === "in" ? 100000000 : 100000001, hv_materiaal: e.material.value,
      hv_bruto: e.gross.value, hv_tarra: e.tare.value, hv_netto: e.net.value, hv_idformulier: e.idFormNo.value, hv_traceerbaarheid: e.soilRef.value,
      hv_confidence: JSON.stringify(conf), hv_minconfidence: Math.min(...conf.map((c) => c.confidence)), hv_status: 100000000,
    }, opts);
    console.log(`document ${d.id}`);
    await sleep(1500);
  }
}

if (which === "all" || which === "claims") {
  const es = await set("hv_schadeclaim");
  const werf = await set("hv_werf");
  const CAT = { "eigen-materieel": 100000000, "gehuurd-materieel": 100000001, "derden-schade": 100000002, nutsleiding: 100000003, "eigen-werf": 100000004 };
  const UT = { gas: 100000000, elektriciteit: 100000001, water: 100000002, telecom: 100000003, riolering: 100000004 };
  for (const r of SAMPLE_REPORTS) {
    const exists = await get(`${es}?$select=hv_schadeclaimid&$filter=hv_clientid eq '${r.clientId}'`, opts);
    if (exists.json.value.length) continue;
    await post(es, {
      hv_clientid: r.clientId, hv_melder: r.reporter, hv_categorie: CAT[r.category], hv_status: 100000000, hv_tijdstipschade: `${r.occurredAt}:00Z`,
      hv_locatie: r.location.text, hv_gps: r.location.gps ?? null, hv_omschrijving: r.description, hv_geschatbedrag: r.estimatedAmount,
      hv_typeleiding: r.utilityType ? UT[r.utilityType] : null, hv_klipreferentie: r.klipRef ?? null, hv_leidingbeheerder: r.utilityOwner ?? null, hv_beheerderverwittigd: !!r.ownerNotified,
      hv_huurreferentie: r.rentalRef ?? null, hv_derdebetrokken: !!r.thirdParty, hv_naamderde: r.thirdPartyName ?? null, hv_derdeaansprakelijk: !!r.thirdPartyLiable,
      hv_letsel: false, hv_aantalfotos: r.photos.length,
      "hv_Werf@odata.bind": `/${werf}(hv_werfnr='${r.projectNo}')`,
    }, opts);
    console.log(`claim ${r.clientId}`);
  }
}

if (which === "all" || which === "requests") {
  const es = await set("hv_materiaalaanvraag");
  const lines = await set("hv_aanvraaglijn");
  const werf = await set("hv_werf");
  const art = await set("hv_artikel");
  const REASON = { "onvoorziene werfsituatie": 100000000, "planning gewijzigd door opdrachtgever": 100000001, "eerdere levering onvolledig": 100000002, "vergeten te bestellen": 100000003 };
  for (const r of SAMPLE_REQUESTS) {
    const exists = await get(`${es}?$select=hv_materiaalaanvraagid&$filter=hv_aanvrager eq '${r.requester} (${r.requestNo})'`, opts);
    if (exists.json.value.length) continue;
    // keep the same lead time as in the tests: requested delivery relative to "now"
    const leadHours = (new Date(`${r.deliverAt}Z`) - new Date("2026-10-12T08:00Z")) / 3_600_000;
    const deliver = new Date(Date.now() + leadHours * 3_600_000).toISOString();
    const res = await post(es, { hv_aanvrager: `${r.requester} (${r.requestNo})`, hv_leverenop: deliver, hv_spoedreden: r.rushReason ? REASON[r.rushReason] : null, hv_status: 100000000, "hv_Werf@odata.bind": `/${werf}(hv_werfnr='${r.projectNo}')` }, opts);
    const id = idFrom(res);
    for (const l of r.lines) {
      await post(lines, { hv_naam: `${l.qty} × ${l.itemNo}`, hv_hoeveelheid: l.qty, "hv_Aanvraag@odata.bind": `/${es}(${id})`, "hv_Artikel@odata.bind": `/${art}(hv_artikelnr='${l.itemNo}')` }, opts);
    }
    await patch(`${es}(${id})`, { hv_status: 100000001 }, opts);
    console.log(`request ${r.requestNo} ingediend`);
  }
}
