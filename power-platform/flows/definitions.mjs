// Power Automate cloud flow definitions for the Halverdijk solution, generated as code so they can be
// reviewed, diffed and re-deployed. scripts/provision-flows.mjs writes them into Dataverse (workflow table).
// The business rules mirror src/*.mjs (the tested reference engines).

const DVAPI = "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps";
const APAPI = "/providers/Microsoft.PowerApps/apis/shared_approvals";
const AUTH = "@parameters('$authentication')";

export const CONNECTION_REFERENCES = {
  shared_commondataserviceforapps: { runtimeSource: "embedded", connection: { connectionReferenceLogicalName: "hv_dataverse" }, api: { name: "shared_commondataserviceforapps" } },
  shared_approvals: { runtimeSource: "embedded", connection: { connectionReferenceLogicalName: "hv_approvals" }, api: { name: "shared_approvals" } },
};

const dv = (operationId, parameters, runAfter = {}, extra = {}) => ({ type: "OpenApiConnection", inputs: { host: { connectionName: "shared_commondataserviceforapps", operationId, apiId: DVAPI }, parameters, authentication: AUTH }, runAfter, ...extra });
const trigger = (entity, message, extra = {}) => ({ type: "OpenApiConnectionWebhook", inputs: { host: { connectionName: "shared_commondataserviceforapps", operationId: "SubscribeWebhookTrigger", apiId: DVAPI }, parameters: { "subscriptionRequest/message": message, "subscriptionRequest/entityname": entity, "subscriptionRequest/scope": 4, ...extra }, authentication: AUTH } });
const approval = (title, assignedTo, details, runAfter = {}) => ({ type: "OpenApiConnectionWebhook", inputs: { host: { connectionName: "shared_approvals", operationId: "StartAndWaitForAnApproval", apiId: APAPI }, parameters: { approvalType: "Basic", "WebhookApprovalCreationInput/title": title, "WebhookApprovalCreationInput/assignedTo": assignedTo, "WebhookApprovalCreationInput/details": details, "WebhookApprovalCreationInput/enableNotifications": true, "WebhookApprovalCreationInput/enableReassignment": true }, authentication: AUTH }, runAfter });
const compose = (inputs, runAfter = {}) => ({ type: "Compose", inputs, runAfter });
const init = (name, type, value, runAfter = {}) => ({ type: "InitializeVariable", inputs: { variables: [{ name, type, value }] }, runAfter });
const setVar = (name, value, runAfter = {}) => ({ type: "SetVariable", inputs: { name, value }, runAfter });
const ok = (...names) => Object.fromEntries(names.map((n) => [n, ["Succeeded"]]));
const any = (...names) => Object.fromEntries(names.map((n) => [n, ["Succeeded", "Failed", "Skipped", "TimedOut"]]));
const envParam = (display, schema, type, defaultValue) => ({ [`${display} (${schema})`]: { defaultValue, type, metadata: { schemaName: schema } } });
const P = (display, schema) => `parameters('${display} (${schema})')`;

function definition(triggers, actions, parameters = {}) {
  return {
    $schema: "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    contentVersion: "1.0.0.0",
    parameters: { $connections: { defaultValue: {}, type: "Object" }, $authentication: { defaultValue: {}, type: "SecureObject" }, ...parameters },
    triggers,
    actions,
  };
}

// ============================================================================ case 01
export function weegbonControleren(S) {
  const t = (c) => `triggerOutputs()?['body/${c}']`;
  const conf = P("Confidence-drempel weegbonnen", "hv_ConfidenceThreshold");
  const klant = "outputs('Klant_zoeken')?['body/value']";
  const plaat = "outputs('Nummerplaat_zoeken')?['body/value']";
  const code = "outputs('Materiaalcode_zoeken')?['body/value']";
  const isIn = `equals(${t("hv_richting")}, 100000000)`;
  const empty = (c) => `empty(string(coalesce(${t(c)}, '')))`;
  const f = (cond, regel, ernst, bericht) => `if(${cond}, createArray(addProperty(addProperty(addProperty(json('{}'), 'regel', '${regel}'), 'ernst', '${ernst}'), 'bericht', ${bericht})), json('[]'))`;
  const rules = [
    f(`or(${empty("hv_bonnummer")}, ${empty("hv_datum")}, ${empty("hv_plaat")}, ${empty("hv_klantnummer")}, ${empty("hv_materiaal")}, ${empty("hv_bruto")}, ${empty("hv_tarra")}, ${empty("hv_netto")})`, "R01", "review", "'Verplicht veld ontbreekt'"),
    f(`greater(length(body('Onzekere_velden')), 0)`, "R02", "review", `concat('Onder drempel: ', join(body('Veldnamen'), ', '))`),
    f(`greater(max(sub(sub(${t("hv_bruto")}, ${t("hv_tarra")}), ${t("hv_netto")}), sub(${t("hv_netto")}, sub(${t("hv_bruto")}, ${t("hv_tarra")}))), 20)`, "R03", "review", `concat('Netto ', string(${t("hv_netto")}), ' kg <> bruto - tarra = ', string(sub(${t("hv_bruto")}, ${t("hv_tarra")})), ' kg')`),
    f(`or(equals(length(${klant}), 0), equals(first(${klant})?['hv_actief'], false))`, "R04", "review", `concat('Klant ', ${t("hv_klantnummer")}, ' onbekend of geblokkeerd')`),
    f(`and(greater(length(${klant}), 0), or(equals(length(${plaat}), 0), and(not(equals(first(${plaat})?['_hv_klant_value'], first(${klant})?['hv_klantid'])), not(equals(first(${plaat})?['hv_vervoerder'], true)))))`, "R05", "review", `concat('Nummerplaat ', ${t("hv_plaat")}, ' niet gekend bij klant of vervoerder')`),
    f(`if(${isIn}, or(equals(length(${code}), 0), not(equals(first(${code})?['hv_soort'], 100000000))), or(equals(length(${code}), 0), not(equals(first(${code})?['hv_soort'], 100000002))))`, "R06", "block", `concat('Materiaal ', ${t("hv_materiaal")}, ' niet toegelaten volgens de vergunning')`),
    f(`and(${isIn}, ${empty("hv_idformulier")}, not(equals(first(${code})?['hv_soort'], 100000001)))`, "R07", "review", "'Geen nummer identificatieformulier'"),
    f(`and(${isIn}, equals(first(${code})?['hv_bodemref'], true), ${empty("hv_traceerbaarheid")})`, "R08", "review", "'Bodem zonder traceerbaarheidsreferentie'"),
    f(`greater(length(outputs('Eerder_ontvangen')?['body/value']), 0)`, "R09", "reject", `concat('Bon ', ${t("hv_bonnummer")}, ' is al ontvangen')`),
    f(`or(less(outputs('Ouderdom_dagen'), 0), greater(outputs('Ouderdom_dagen'), 30))`, "R10", "review", `concat('Bon is ', string(outputs('Ouderdom_dagen')), ' dagen oud')`),
    f(`greater(${t("hv_bruto")}, 44000)`, "R11", "review", `concat('Bruto ', string(${t("hv_bruto")}), ' kg > 44.000 kg')`),
  ];
  const bev = "outputs('Bevindingen')";
  const decision = `if(contains(string(${bev}), '"ernst":"reject"'), 'dubbel', if(contains(string(${bev}), '"ernst":"block"'), 'escalatie', if(greater(length(${bev}), 0), 'nazicht', 'automatisch')))`;
  return definition(
    { Weegbon_toegevoegd: trigger("hv_document", 1) },
    {
      Klant_zoeken: dv("ListRecords", { entityName: S.hv_klant, $filter: `hv_klantnr eq '@{${t("hv_klantnummer")}}'`, $top: 1 }),
      Nummerplaat_zoeken: dv("ListRecords", { entityName: S.hv_nummerplaat, $filter: `hv_plaat eq '@{${t("hv_plaat")}}'`, $top: 1 }),
      Materiaalcode_zoeken: dv("ListRecords", { entityName: S.hv_materiaalcode, $filter: `hv_code eq '@{${t("hv_materiaal")}}'`, $top: 1 }),
      Eerder_ontvangen: dv("ListRecords", { entityName: S.hv_document, $filter: `hv_bonnummer eq '@{${t("hv_bonnummer")}}' and hv_documentid ne @{${t("hv_documentid")}} and createdon lt @{${t("createdon")}} and hv_status ne 100000005`, $top: 1 }),
      Onzekere_velden: { type: "Query", inputs: { from: `@json(coalesce(${t("hv_confidence")}, '[]'))`, where: `@less(float(item()?['confidence']), ${conf})` }, runAfter: {} },
      Veldnamen: { type: "Select", inputs: { from: "@body('Onzekere_velden')", select: "@item()?['veld']" }, runAfter: ok("Onzekere_velden") },
      Ouderdom_dagen: compose(`@div(sub(ticks(${t("hv_ontvangen")}), ticks(${t("hv_datum")})), 864000000000)`),
      Bevindingen: compose(`@union(${rules.join(", ")})`, ok("Klant_zoeken", "Nummerplaat_zoeken", "Materiaalcode_zoeken", "Eerder_ontvangen", "Veldnamen", "Ouderdom_dagen")),
      Beslissing: compose(`@${decision}`, ok("Bevindingen")),
      Weegbon_bijwerken: dv("UpdateOnlyRecord", {
        entityName: S.hv_document, recordId: `@${t("hv_documentid")}`,
        "item/hv_beslissing": `@if(equals(outputs('Beslissing'), 'automatisch'), 100000000, if(equals(outputs('Beslissing'), 'nazicht'), 100000001, if(equals(outputs('Beslissing'), 'escalatie'), 100000002, 100000003)))`,
        "item/hv_status": `@if(equals(outputs('Beslissing'), 'automatisch'), 100000000, if(equals(outputs('Beslissing'), 'nazicht'), 100000002, if(equals(outputs('Beslissing'), 'escalatie'), 100000003, 100000005)))`,
        "item/hv_bevindingen": `@{string(${bev})}`,
      }, ok("Beslissing")),
      Automatisch_boeken: {
        type: "If", runAfter: ok("Weegbon_bijwerken"),
        expression: { equals: ["@outputs('Beslissing')", "automatisch"] },
        actions: {
          ERP_boeking: dv("CreateRecord", {
            entityName: S.hv_erpboeking, "item/hv_idempotencykey": `wb-@{${t("hv_bonnummer")}}`, "item/hv_soort": 100000000,
            "item/hv_referentie": `@${t("hv_documentnr")}`, "item/hv_bedrag": `@mul(div(float(${t("hv_netto")}), 1000), float(coalesce(first(${code})?['hv_prijsperton'], 0)))`,
            "item/hv_payload": `@{string(json(concat('{"weighingTicket":"', ${t("hv_bonnummer")}, '","customerNo":"', ${t("hv_klantnummer")}, '","itemCode":"', ${t("hv_materiaal")}, '","netKg":', string(${t("hv_netto")}), ',"approvedBy":"auto"}')))}`,
          }),
          Status_geboekt: dv("UpdateOnlyRecord", { entityName: S.hv_document, recordId: `@${t("hv_documentid")}`, "item/hv_status": 100000004, "item/hv_erpreferentie": `@{if(equals(actions('ERP_boeking')?['status'], 'Succeeded'), concat('wb-', ${t("hv_bonnummer")}), concat('wb-', ${t("hv_bonnummer")}, ' (al geboekt, idempotent)'))}` }, any("ERP_boeking")),
        },
        else: { actions: {} },
      },
    },
    envParam("Confidence-drempel weegbonnen", "hv_ConfidenceThreshold", "Float", 0.85),
  );
}

export function weegbonNaNazicht(S) {
  const t = (c) => `triggerOutputs()?['body/${c}']`;
  return definition(
    { Weegbon_goedgekeurd: trigger("hv_document", 3, { "subscriptionRequest/filteringattributes": "hv_status", "subscriptionRequest/filterexpression": "hv_status eq 100000006" }) },
    {
      ERP_boeking: dv("CreateRecord", { entityName: S.hv_erpboeking, "item/hv_idempotencykey": `wb-@{${t("hv_bonnummer")}}`, "item/hv_soort": 100000000, "item/hv_referentie": `@${t("hv_documentnr")}`, "item/hv_payload": `@{concat('{"weighingTicket":"', ${t("hv_bonnummer")}, '","netKg":', string(${t("hv_netto")}), ',"approvedBy":"', coalesce(${t("hv_reviewer")}, 'reviewer'), '"}')}` }),
      Status_geboekt: dv("UpdateOnlyRecord", { entityName: S.hv_document, recordId: `@${t("hv_documentid")}`, "item/hv_status": 100000004, "item/hv_erpreferentie": `wb-@{${t("hv_bonnummer")}}` }, any("ERP_boeking")),
    },
  );
}

// ============================================================================ case 02
export function schadeclaimIntake(S) {
  const t = (c) => `triggerOutputs()?['body/${c}']`;
  const cat = t("hv_categorie");
  const amount = `float(coalesce(${t("hv_geschatbedrag")}, 0))`;
  const ins = P("Drempel verzekeringsaangifte schade (€)", "hv_InsurerThreshold");
  const severity = `if(and(equals(${cat}, 100000003), or(equals(${t("hv_typeleiding")}, 100000000), equals(${t("hv_typeleiding")}, 100000001), not(equals(${t("hv_beheerderverwittigd")}, true)))), 100000003, if(greaterOrEquals(${amount}, float(${ins})), 100000002, if(or(greaterOrEquals(${amount}, 2500), equals(${t("hv_derdebetrokken")}, true)), 100000001, 100000000)))`;
  const chain = `concat(if(or(equals(${cat}, 100000000), equals(${cat}, 100000001)), 'Fleetmanager>', if(or(equals(${cat}, 100000002), equals(${cat}, 100000003)), 'Claims & verzekeringen>', '')), if(lessOrEquals(${amount}, 2500), 'Projectleider', if(lessOrEquals(${amount}, 15000), 'Projectleider>Afdelingsverantwoordelijke', 'Projectleider>Afdelingsverantwoordelijke>Directie')))`;
  const owner = `if(or(equals(${cat}, 100000000), equals(${cat}, 100000001)), 'Fleetmanager', if(or(equals(${cat}, 100000002), equals(${cat}, 100000003)), 'Claims & verzekeringen', outputs('Werf')?['body/hv_projectleider']))`;
  const insurer = `or(greaterOrEquals(${amount}, float(${ins})), equals(${cat}, 100000002), equals(${cat}, 100000003), equals(${t("hv_derdebetrokken")}, true))`;
  const notify = `join(union(createArray(outputs('Werf')?['body/hv_projectleider']), if(or(equals(${cat}, 100000002), equals(${cat}, 100000003), equals(${t("hv_derdebetrokken")}, true)), createArray('Claims & verzekeringen'), json('[]')), if(equals(${cat}, 100000001), createArray('Verhuurder (extern)'), json('[]')), if(equals(${cat}, 100000003), createArray('Leidingbeheerder (extern)', 'Preventieadviseur'), json('[]')), if(equals(outputs('Ernst'), 100000003), createArray('Afdelingsverantwoordelijke'), json('[]'))), ', ')`;
  const line = (gebeurtenis, door, opmerking, after) => dv("CreateRecord", { entityName: S.hv_tijdlijn, "item/hv_gebeurtenis": gebeurtenis, "item/hv_door": door, "item/hv_opmerking": opmerking, [`item/hv_Schadeclaim@odata.bind`]: `/${S.hv_schadeclaim}(@{${t("hv_schadeclaimid")}})` }, ok(after));
  return definition(
    { Schadeclaim_gemeld: trigger("hv_schadeclaim", 1) },
    {
      Werf: dv("GetItem", { entityName: S.hv_werf, recordId: `@${t("_hv_werf_value")}`, $select: "hv_werfnr,hv_projectleider,hv_actief" }),
      Ernst: compose(`@${severity}`),
      SLA_uren: compose(`@if(equals(outputs('Ernst'), 100000003), 2, if(equals(outputs('Ernst'), 100000002), 24, if(equals(outputs('Ernst'), 100000001), 48, 72)))`, ok("Ernst")),
      Verwittigd: compose(`@${notify}`, ok("Werf", "Ernst")),
      Dossier_bijwerken: dv("UpdateOnlyRecord", {
        entityName: S.hv_schadeclaim, recordId: `@${t("hv_schadeclaimid")}`,
        "item/hv_status": 100000001, "item/hv_ernst": "@outputs('Ernst')", "item/hv_goedkeuringsketen": `@${chain}`, "item/hv_goedkeuringsniveau": 0,
        "item/hv_eigenaar": `@${owner}`, "item/hv_verwittigd": "@outputs('Verwittigd')",
        "item/hv_deadlinebeoordeling": "@addHours(utcNow(), outputs('SLA_uren'))",
        "item/hv_deadlineverzekeraar": `@if(${insurer}, addDays(coalesce(${t("hv_tijdstipschade")}, utcNow()), 8), null)`,
      }, ok("SLA_uren", "Verwittigd")),
      Tijdlijn_gemeld: line("gemeld", `@{coalesce(${t("hv_melder")}, 'werfapp')}`, "via werfapp", "Dossier_bijwerken"),
      Tijdlijn_dossier: line("dossier aangemaakt", "Power Automate", `@{concat(outputs('Dossier_bijwerken')?['body/hv_dossiernummer'], ' · ernst ', string(outputs('Ernst')), ' · eigenaar ', ${owner}, ' · keten ', ${chain})}`, "Tijdlijn_gemeld"),
      Tijdlijn_verwittigd: line("verwittigd", "Power Automate", "@{outputs('Verwittigd')}", "Tijdlijn_dossier"),
    },
    envParam("Drempel verzekeringsaangifte schade (€)", "hv_InsurerThreshold", "Float", 15000),
  );
}

export function schadeclaimGoedkeuring(S) {
  const t = (c) => `triggerOutputs()?['body/${c}']`;
  const role = "variables('keten')[variables('niveau')]";
  return definition(
    { Ter_goedkeuring: trigger("hv_schadeclaim", 3, { "subscriptionRequest/filteringattributes": "hv_status", "subscriptionRequest/filterexpression": "hv_status eq 100000003" }) },
    {
      Keten: init("keten", "array", `@split(${t("hv_goedkeuringsketen")}, '>')`),
      Niveau: init("niveau", "integer", 0, ok("Keten")),
      Afgewezen: init("afgewezen", "boolean", false, ok("Niveau")),
      Per_niveau: {
        type: "Until", runAfter: ok("Afgewezen"),
        expression: "@or(variables('afgewezen'), greaterOrEquals(variables('niveau'), length(variables('keten'))))",
        limit: { count: 6, timeout: "P14D" },
        actions: {
          Goedkeurder: dv("ListRecords", { entityName: S.hv_goedkeurder, $filter: `hv_rol eq '@{${role}}'`, $top: 1 }),
          Goedkeuring: approval(`Schadeclaim @{${t("hv_dossiernummer")}} — niveau @{add(variables('niveau'), 1)}/@{length(variables('keten'))}: @{${role}}`, `@{first(outputs('Goedkeurder')?['body/value'])?['hv_email']}`, `Raming €@{${t("hv_geschatbedrag")}} · @{${t("hv_omschrijving")}} · keten @{${t("hv_goedkeuringsketen")}}`, ok("Goedkeurder")),
          Tijdlijn: dv("CreateRecord", { entityName: S.hv_tijdlijn, "item/hv_gebeurtenis": `@{if(equals(body('Goedkeuring')?['outcome'], 'Approve'), 'goedgekeurd', 'afgewezen')} (@{${role}})`, "item/hv_door": "@{first(body('Goedkeuring')?['responses'])?['responder/email']}", "item/hv_opmerking": "@{first(body('Goedkeuring')?['responses'])?['comments']}", "item/hv_Schadeclaim@odata.bind": `/${S.hv_schadeclaim}(@{${t("hv_schadeclaimid")}})` }, ok("Goedkeuring")),
          Uitkomst: {
            type: "If", runAfter: ok("Tijdlijn"),
            expression: { equals: ["@body('Goedkeuring')?['outcome']", "Approve"] },
            actions: {
              Volgend_niveau: { type: "IncrementVariable", inputs: { name: "niveau", value: 1 }, runAfter: {} },
              Niveau_bewaren: dv("UpdateOnlyRecord", { entityName: S.hv_schadeclaim, recordId: `@${t("hv_schadeclaimid")}`, "item/hv_goedkeuringsniveau": "@variables('niveau')" }, ok("Volgend_niveau")),
            },
            else: { actions: { Markeer_afgewezen: setVar("afgewezen", true) } },
          },
        },
      },
      Eindstatus: dv("UpdateOnlyRecord", { entityName: S.hv_schadeclaim, recordId: `@${t("hv_schadeclaimid")}`, "item/hv_status": "@if(variables('afgewezen'), 100000005, 100000004)" }, ok("Per_niveau")),
    },
  );
}

export function slaBewaking(S) {
  return definition(
    { Elk_uur: { type: "Recurrence", recurrence: { frequency: "Hour", interval: 1 } } },
    {
      Te_laat: dv("ListRecords", { entityName: S.hv_schadeclaim, $filter: "(hv_status eq 100000001 or hv_status eq 100000002) and hv_deadlinebeoordeling lt @{utcNow()} and hv_geescaleerd ne true" }),
      Per_claim: {
        type: "Foreach", foreach: "@outputs('Te_laat')?['body/value']", runAfter: ok("Te_laat"),
        actions: {
          Markeer: dv("UpdateOnlyRecord", { entityName: S.hv_schadeclaim, recordId: "@items('Per_claim')?['hv_schadeclaimid']", "item/hv_geescaleerd": true }),
          Tijdlijn: dv("CreateRecord", { entityName: S.hv_tijdlijn, "item/hv_gebeurtenis": "SLA overschreden — geëscaleerd", "item/hv_door": "Power Automate (HV-CL-03)", "item/hv_opmerking": "Beoordeling niet vóór de deadline; afdelingsverantwoordelijke verwittigd.", "item/hv_Schadeclaim@odata.bind": `/${S.hv_schadeclaim}(@{items('Per_claim')?['hv_schadeclaimid']})` }, ok("Markeer")),
        },
      },
    },
  );
}

// ============================================================================ case 03
export function aanvraagVerwerken(S) {
  const t = (c) => `triggerOutputs()?['body/${c}']`;
  const line = "items('Per_lijn')";
  const art = `${line}?['hv_Artikel']`;
  const autoMax = P("Max bedrag automatische goedkeuring materiaal (€)", "hv_AutoApproveMax");
  const plMax = P("Max bedrag projectleider materiaal (€)", "hv_PlApproveMax");
  const cats = ["100000000", "100000001", "100000002", "100000003", "100000004"];
  const msg = (endpoint, key, body) => ({ type: "AppendToArrayVariable", inputs: { name: "berichten", value: { key, endpoint, body } } });
  const catIncrement = {
    type: "Switch", runAfter: ok("Lijnwaarde"),
    expression: `@string(${art}?['hv_categorie'])`,
    cases: Object.fromEntries(cats.map((c) => [`Cat_${c}`, { case: c, actions: { [`Tel_${c}`]: { type: "IncrementVariable", inputs: { name: `cat_${c}`, value: "@outputs('Lijnwaarde')" }, runAfter: {} } } }])),
    default: { actions: {} },
  };
  const perDepot = {
    type: "Foreach", foreach: "@outputs('Afstanden')?['body/value']", runAfter: ok("Rest_init"),
    runtimeConfiguration: { concurrency: { repetitions: 1 } },
    actions: {
      Voorraad: dv("ListRecords", { entityName: S.hv_voorraad, $filter: `_hv_artikel_value eq @{${art}?['hv_artikelid']} and _hv_depot_value eq @{items('Per_depot')?['_hv_depot_value']}`, $top: 1 }),
      Beschikbaar: compose("@sub(float(coalesce(first(outputs('Voorraad')?['body/value'])?['hv_opvoorraad'], 0)), float(coalesce(first(outputs('Voorraad')?['body/value'])?['hv_gereserveerd'], 0)))", ok("Voorraad")),
      Neem: compose("@min(variables('rest'), max(outputs('Beschikbaar'), 0))", ok("Beschikbaar")),
      Iets_te_nemen: {
        type: "If", runAfter: ok("Neem"),
        expression: { greater: ["@outputs('Neem')", 0] },
        actions: {
          Toewijzing_tekst: { type: "AppendToStringVariable", inputs: { name: "toewijzing", value: "@{outputs('Neem')} uit @{last(split(items('Per_depot')?['hv_naam'], '→'))} (@{items('Per_depot')?['hv_km']} km); " }, runAfter: {} },
          Reservatie_bericht: { ...msg("reservations", `@{concat(${t("hv_aanvraagnr")}, '-', ${art}?['hv_artikelnr'], '-', last(split(items('Per_depot')?['hv_naam'], '→')))}`, { voorraad: `@{concat(${art}?['hv_artikelnr'], '@', last(split(items('Per_depot')?['hv_naam'], '→')))}`, artikel: `@{${art}?['hv_artikelnr']}`, hoeveelheid: "@outputs('Neem')", werf: "@{outputs('Werf')?['body/hv_werfnr']}" }), runAfter: ok("Toewijzing_tekst") },
          Rest_bijwerken: { type: "DecrementVariable", inputs: { name: "rest", value: "@outputs('Neem')" }, runAfter: ok("Reservatie_bericht") },
        },
        else: { actions: {} },
      },
    },
  };
  return definition(
    { Aanvraag_ingediend: trigger("hv_materiaalaanvraag", 4, { "subscriptionRequest/filteringattributes": "hv_status", "subscriptionRequest/filterexpression": "hv_status eq 100000001" }) },
    {
      Werf: dv("GetItem", { entityName: S.hv_werf, recordId: `@${t("_hv_werf_value")}`, $select: "hv_werfnr,hv_naam,hv_actief" }),
      Lijnen: dv("ListRecords", { entityName: S.hv_aanvraaglijn, $filter: `_hv_aanvraag_value eq @{${t("hv_materiaalaanvraagid")}}`, $expand: "hv_Artikel($select=hv_artikelid,hv_artikelnr,hv_eenheid,hv_eenheidsprijs,hv_categorie,hv_bron,hv_alternatief,hv_opbestelling)" }),
      Afstanden: dv("ListRecords", { entityName: S.hv_afstand, $filter: `_hv_werf_value eq @{${t("_hv_werf_value")}}`, $orderby: "hv_km asc" }),
      Budgetten: dv("ListRecords", { entityName: S.hv_werfbudget, $filter: `_hv_werf_value eq @{${t("_hv_werf_value")}}` }),
      Berichten: init("berichten", "array", []),
      Waarde: init("waarde", "float", 0, ok("Berichten")),
      Aankoop: init("aankoop", "boolean", false, ok("Waarde")),
      Rest: init("rest", "float", 0, ok("Aankoop")),
      Toewijzing: init("toewijzing", "string", "", ok("Rest")),
      Afgewezen_init: init("afgewezen", "boolean", false, ok("Toewijzing")),
      ...Object.fromEntries(cats.map((c, i) => [`Cat_init_${c}`, init(`cat_${c}`, "float", 0, ok(i === 0 ? "Afgewezen_init" : `Cat_init_${cats[i - 1]}`))])),
      Per_lijn: {
        type: "Foreach", foreach: "@outputs('Lijnen')?['body/value']", runAfter: ok("Werf", "Lijnen", "Afstanden", "Budgetten", `Cat_init_${cats.at(-1)}`),
        runtimeConfiguration: { concurrency: { repetitions: 1 } },
        actions: {
          Lijnwaarde: compose(`@mul(float(${line}?['hv_hoeveelheid']), float(${art}?['hv_eenheidsprijs']))`),
          Waarde_tellen: { type: "IncrementVariable", inputs: { name: "waarde", value: "@outputs('Lijnwaarde')" }, runAfter: ok("Lijnwaarde") },
          Categorie_tellen: catIncrement,
          Toewijzing_leeg: setVar("toewijzing", "", ok("Waarde_tellen")),
          Bron: {
            type: "If", runAfter: ok("Toewijzing_leeg", "Categorie_tellen"),
            expression: { equals: [`@${art}?['hv_bron']`, 100000001] },
            actions: {
              Extern_markeren: setVar("aankoop", true),
              Extern_bericht: { ...msg("purchase-requisitions", `@{concat(${t("hv_aanvraagnr")}, '-', ${art}?['hv_artikelnr'], '-PR')}`, { artikel: `@{${art}?['hv_artikelnr']}`, hoeveelheid: `@${line}?['hv_hoeveelheid']`, werf: "@{outputs('Werf')?['body/hv_werfnr']}" }), runAfter: ok("Extern_markeren") },
              Lijn_extern: dv("UpdateOnlyRecord", { entityName: S.hv_aanvraaglijn, recordId: `@${line}?['hv_aanvraaglijnid']`, "item/hv_waarde": "@outputs('Lijnwaarde')", "item/hv_aankoop": `@${line}?['hv_hoeveelheid']`, "item/hv_tekort": 0, "item/hv_toewijzing": "Extern artikel: aankoopaanvraag", "item/hv_alternatief": `@{if(empty(coalesce(${art}?['hv_alternatief'], '')), '', concat('Gerecycleerd alternatief ', ${art}?['hv_alternatief'], ' — projectleider beslist'))}` }, ok("Extern_bericht")),
            },
            else: {
              actions: {
                Rest_init: setVar("rest", `@float(${line}?['hv_hoeveelheid'])`),
                Per_depot: perDepot,
                Tekort: {
                  type: "If", runAfter: ok("Per_depot"),
                  expression: { greater: ["@variables('rest')", 0] },
                  actions: {
                    Tekort_markeren: setVar("aankoop", true),
                    Tekort_bericht: { ...msg("purchase-requisitions", `@{concat(${t("hv_aanvraagnr")}, '-', ${art}?['hv_artikelnr'], '-PR')}`, { artikel: `@{${art}?['hv_artikelnr']}`, hoeveelheid: "@variables('rest')", werf: "@{outputs('Werf')?['body/hv_werfnr']}" }), runAfter: ok("Tekort_markeren") },
                  },
                  else: { actions: {} },
                },
                Lijn_intern: dv("UpdateOnlyRecord", { entityName: S.hv_aanvraaglijn, recordId: `@${line}?['hv_aanvraaglijnid']`, "item/hv_waarde": "@outputs('Lijnwaarde')", "item/hv_tekort": "@variables('rest')", "item/hv_aankoop": "@variables('rest')", "item/hv_toewijzing": "@{if(empty(variables('toewijzing')), 'Geen voorraad: aankoop', variables('toewijzing'))}" }, ok("Tekort")),
              },
            },
          },
        },
      },
      Budget_overschreden: compose(`@or(${cats.map((c) => `greater(variables('cat_${c}'), float(coalesce(first(body('Budget_${c}'))?['hv_budget'], 0)))`).join(", ")})`, ok(...cats.map((c) => `Budget_${c}`))),
      ...Object.fromEntries(cats.map((c) => [`Budget_${c}`, { type: "Query", inputs: { from: "@outputs('Budgetten')?['body/value']", where: `@equals(item()?['hv_categorie'], ${c})` }, runAfter: ok("Per_lijn") }])),
      Route: compose(`@if(outputs('Budget_overschreden'), 'Projectleider>Afdelingsverantwoordelijke', if(greater(variables('waarde'), float(${plMax})), 'Projectleider>Afdelingsverantwoordelijke', if(or(greater(variables('waarde'), float(${autoMax})), variables('aankoop')), 'Projectleider', 'automatisch')))`, ok("Budget_overschreden")),
      Regel: compose(`@if(outputs('Budget_overschreden'), 'DT-03.1 budget overschreden', if(greater(variables('waarde'), float(${plMax})), 'DT-03.2 waarde > €10.000', if(variables('aankoop'), 'DT-03.3 aankoop nodig', if(greater(variables('waarde'), float(${autoMax})), 'DT-03.3 waarde > €1.000', 'DT-03.4 automatisch'))))`, ok("Route")),
      Aanvraag_evaluatie: dv("UpdateOnlyRecord", {
        entityName: S.hv_materiaalaanvraag, recordId: `@${t("hv_materiaalaanvraagid")}`,
        "item/hv_waarde": "@variables('waarde')", "item/hv_aankoopnodig": "@variables('aankoop')", "item/hv_budgetoverschreden": "@outputs('Budget_overschreden')",
        "item/hv_route": "@outputs('Route')", "item/hv_regel": "@outputs('Regel')",
        "item/hv_spoed": `@less(div(sub(ticks(coalesce(${t("hv_leverenop")}, utcNow())), ticks(utcNow())), 36000000000), 48)`,
        "item/hv_status": "@if(equals(outputs('Route'), 'automatisch'), 100000003, 100000002)",
      }, ok("Regel")),
      Goedkeuring_nodig: {
        type: "If", runAfter: ok("Aanvraag_evaluatie"),
        expression: { not: { equals: ["@outputs('Route')", "automatisch"] } },
        actions: {
          Per_goedkeurder: {
            type: "Foreach", foreach: "@split(outputs('Route'), '>')", runtimeConfiguration: { concurrency: { repetitions: 1 } },
            actions: {
              Nog_niet_afgewezen: {
                type: "If", runAfter: {},
                expression: { equals: ["@variables('afgewezen')", false] },
                actions: {
                  Goedkeurder: dv("ListRecords", { entityName: S.hv_goedkeurder, $filter: "hv_rol eq '@{items('Per_goedkeurder')}'", $top: 1 }),
                  Goedkeuring: approval(`Materiaalaanvraag @{${t("hv_aanvraagnr")}} — €@{formatNumber(variables('waarde'), 'N0', 'nl-BE')} (@{items('Per_goedkeurder')})`, "@{first(outputs('Goedkeurder')?['body/value'])?['hv_email']}", `@{outputs('Regel')} · werf @{outputs('Werf')?['body/hv_werfnr']}`, ok("Goedkeurder")),
                  Afwijzing_onthouden: {
                    type: "If", runAfter: ok("Goedkeuring"),
                    expression: { equals: ["@body('Goedkeuring')?['outcome']", "Reject"] },
                    actions: { Markeer_afgewezen: setVar("afgewezen", true) },
                    else: { actions: {} },
                  },
                },
                else: { actions: {} },
              },
            },
          },
          Uitkomst: {
            type: "If", runAfter: ok("Per_goedkeurder"),
            expression: { equals: ["@variables('afgewezen')", true] },
            actions: {
              Status_afgewezen: dv("UpdateOnlyRecord", { entityName: S.hv_materiaalaanvraag, recordId: `@${t("hv_materiaalaanvraagid")}`, "item/hv_status": 100000009 }),
              Stoppen: { type: "Terminate", inputs: { runStatus: "Succeeded" }, runAfter: ok("Status_afgewezen") },
            },
            else: { actions: { Status_goedgekeurd: dv("UpdateOnlyRecord", { entityName: S.hv_materiaalaanvraag, recordId: `@${t("hv_materiaalaanvraagid")}`, "item/hv_status": 100000003 }) } },
          },
        },
        else: { actions: {} },
      },
      Naar_outbox: {
        type: "Foreach", foreach: "@variables('berichten')", runAfter: ok("Goedkeuring_nodig"),
        actions: {
          Outbox_rij: dv("CreateRecord", {
            entityName: S.hv_outbox, "item/hv_idempotencykey": "@items('Naar_outbox')?['key']",
            "item/hv_endpoint": "@if(equals(items('Naar_outbox')?['endpoint'], 'reservations'), 100000001, 100000002)",
            "item/hv_body": "@{string(items('Naar_outbox')?['body'])}", "item/hv_status": 100000000, "item/hv_pogingen": 0,
            "item/hv_volgendepoging": "@utcNow()", "item/hv_referentie": `@${t("hv_aanvraagnr")}`,
            "item/hv_Aanvraag@odata.bind": `/${S.hv_materiaalaanvraag}(@{${t("hv_materiaalaanvraagid")}})`,
          }),
        },
      },
    },
    { ...envParam("Max bedrag automatische goedkeuring materiaal (€)", "hv_AutoApproveMax", "Float", 1000), ...envParam("Max bedrag projectleider materiaal (€)", "hv_PlApproveMax", "Float", 10000) },
  );
}

export function outboxVerzenden(S) {
  const it = "items('Per_bericht')";
  const erpUp = P("ERP-sandbox bereikbaar", "hv_ErpBeschikbaar");
  return definition(
    { Elke_5_minuten: { type: "Recurrence", recurrence: { frequency: "Minute", interval: 5 } } },
    {
      Klaar: dv("ListRecords", { entityName: S.hv_outbox, $filter: "hv_status eq 100000000 and hv_volgendepoging le @{utcNow()}", $orderby: "createdon asc", $top: 50 }),
      Per_bericht: {
        type: "Foreach", foreach: "@outputs('Klaar')?['body/value']", runAfter: ok("Klaar"),
        runtimeConfiguration: { concurrency: { repetitions: 1 } },
        actions: {
          ERP_bereikbaar: {
            type: "If", runAfter: {},
            expression: { equals: [`@${erpUp}`, true] },
            actions: {
              ERP_boeking: dv("CreateRecord", { entityName: S.hv_erpboeking, "item/hv_idempotencykey": `@${it}?['hv_idempotencykey']`, "item/hv_soort": `@if(equals(${it}?['hv_endpoint'], 100000001), 100000001, if(equals(${it}?['hv_endpoint'], 100000002), 100000002, if(equals(${it}?['hv_endpoint'], 100000003), 100000003, 100000004)))`, "item/hv_payload": `@${it}?['hv_body']`, "item/hv_referentie": `@${it}?['hv_referentie']` }),
              Reservatie: {
                type: "If", runAfter: ok("ERP_boeking"),
                expression: { equals: [`@${it}?['hv_endpoint']`, 100000001] },
                actions: {
                  Voorraad: dv("ListRecords", { entityName: S.hv_voorraad, $filter: `hv_naam eq '@{json(${it}?['hv_body'])?['voorraad']}'`, $top: 1 }),
                  Reserveren: dv("UpdateOnlyRecord", { entityName: S.hv_voorraad, recordId: "@first(outputs('Voorraad')?['body/value'])?['hv_voorraadid']", "item/hv_gereserveerd": `@add(float(coalesce(first(outputs('Voorraad')?['body/value'])?['hv_gereserveerd'], 0)), float(json(${it}?['hv_body'])?['hoeveelheid']))` }, ok("Voorraad")),
                },
                else: { actions: {} },
              },
              Verzonden: dv("UpdateOnlyRecord", { entityName: S.hv_outbox, recordId: `@${it}?['hv_outboxid']`, "item/hv_status": 100000001, "item/hv_pogingen": `@add(coalesce(${it}?['hv_pogingen'], 0), 1)`, "item/hv_laatstefout": "@{if(equals(actions('ERP_boeking')?['status'], 'Succeeded'), '201 geboekt', '200 al geboekt (idempotent)')}" }, any("Reservatie")),
            },
            else: {
              actions: {
                Nog_pogingen: {
                  type: "If", runAfter: {},
                  expression: { less: [`@coalesce(${it}?['hv_pogingen'], 0)`, 5] },
                  actions: { Opnieuw_plannen: dv("UpdateOnlyRecord", { entityName: S.hv_outbox, recordId: `@${it}?['hv_outboxid']`, "item/hv_pogingen": `@add(coalesce(${it}?['hv_pogingen'], 0), 1)`, "item/hv_volgendepoging": `@addMinutes(utcNow(), createArray(1, 5, 15, 60, 240)[coalesce(${it}?['hv_pogingen'], 0)])`, "item/hv_laatstefout": "503 ERP niet bereikbaar (sandbox uitgeschakeld via hv_ErpBeschikbaar)" }) },
                  else: { actions: { Dead_letter: dv("UpdateOnlyRecord", { entityName: S.hv_outbox, recordId: `@${it}?['hv_outboxid']`, "item/hv_status": 100000009, "item/hv_pogingen": `@add(coalesce(${it}?['hv_pogingen'], 0), 1)`, "item/hv_laatstefout": "Dead-letter na 6 pogingen — ticket functioneel beheer (runbook)" }) } },
                },
              },
            },
          },
        },
      },
    },
    envParam("ERP-sandbox bereikbaar", "hv_ErpBeschikbaar", "Bool", true),
  );
}

export const FLOWS = [
  { name: "HV-DI-01 Weegbon controleren en boeken", build: weegbonControleren, description: "Case 01: elf regels R01–R11 op elke nieuwe weegbon; automatisch boeken in de ERP-sandbox, of nazicht / escalatie / dubbel." },
  { name: "HV-DI-02 Weegbon na nazicht boeken", build: weegbonNaNazicht, description: "Case 01: een door de reviewer goedgekeurde weegbon idempotent boeken." },
  { name: "HV-CL-01 Schadeclaim intake en triage", build: schadeclaimIntake, description: "Case 02: ernst, eigenaar, DT-02-goedkeuringsketen, deadlines en tijdlijn bij een nieuwe schademelding." },
  { name: "HV-CL-02 Schadeclaim goedkeuringsketen", build: schadeclaimGoedkeuring, description: "Case 02: goedkeuring per niveau via Approvals; één afwijzing stopt de keten." },
  { name: "HV-CL-03 SLA-bewaking", build: slaBewaking, description: "Case 02: elk uur claims escaleren waarvan de beoordelingsdeadline verstreken is." },
  { name: "HV-MA-01 Materiaalaanvraag verwerken", build: aanvraagVerwerken, description: "Case 03: voorraad per depot (dichtste eerst), budget, DT-03, goedkeuring en ERP-berichten in de outbox." },
  { name: "HV-MA-02 ERP-outbox verzenden", build: outboxVerzenden, description: "Case 03: outbox naar de ERP-sandbox met retry 1-5-15-60-240 min, dead-letter en idempotency-key." },
];
