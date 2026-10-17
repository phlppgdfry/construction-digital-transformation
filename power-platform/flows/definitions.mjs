// Power Automate cloud flow definitions for the Halverdijk solution, generated as code so they can be
// reviewed, diffed and re-deployed. scripts/provision-flows.mjs writes them into Dataverse (workflow table).
// The business rules mirror src/*.mjs (the tested reference engines); their thresholds are not written
// here but read at run time from the table Bedrijfsregel (hv_regel), seeded from src/rules.mjs.
//
// Four patterns hold for every flow (flows/README.md, "Afspraken"):
//  1. Everything that goes to the ERP goes through the outbox (HV-IN-01 sends, HV-IN-02 writes back).
//  2. Waiting for a person is driven by a status: one flow sets "Ter goedkeuring", another one asks.
//  3. Every flow runs inside a "Probeer" scope. "Bij_fout" logs a Fout-melding with the run link for
//     functioneel beheer, marks the record (where the table has a status Fout) and fails the run.
//  4. Notifying someone means writing a row in Melding (hv_melding); HV-OP-01 delivers it.

const DVAPI = "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps";
const APAPI = "/providers/Microsoft.PowerApps/apis/shared_approvals";
const AUTH = "@parameters('$authentication')";

export const CONNECTION_REFERENCES = {
  shared_commondataserviceforapps: { runtimeSource: "embedded", connection: { connectionReferenceLogicalName: "hv_dataverse" }, api: { name: "shared_commondataserviceforapps" } },
  shared_approvals: { runtimeSource: "embedded", connection: { connectionReferenceLogicalName: "hv_approvals" }, api: { name: "shared_approvals" } },
};

// option values (power-platform/model.json)
export const ST = {
  doc: { ontvangen: 100000000, nazicht: 100000002, escalatie: 100000003, geboekt: 100000004, dubbel: 100000005, goedgekeurd: 100000006, afgewezen: 100000007, wachtrij: 100000008, fout: 100000009 },
  claim: { gemeld: 100000000, beoordeling: 100000001, info: 100000002, terGoedkeuring: 100000003, goedgekeurd: 100000004, afgewezen: 100000005, afhandeling: 100000006, afgesloten: 100000007, fout: 100000009 },
  req: { concept: 100000000, ingediend: 100000001, terGoedkeuring: 100000002, goedgekeurd: 100000003, gepland: 100000004, geleverd: 100000005, ontvangen: 100000006, afgesloten: 100000007, afgewezen: 100000009, fout: 100000010 },
  outbox: { wachtend: 100000000, verzonden: 100000001, dead: 100000009 },
  endpoint: { weegticket: 100000000, reservatie: 100000001, aankoop: 100000002, verbruik: 100000003, projectkost: 100000004 },
  soort: { info: 100000000, actie: 100000001, waarschuwing: 100000002, fout: 100000003 },
  kanaal: { inapp: 100000000, extern: 100000001 },
  melding: { nieuw: 100000000, verstuurd: 100000001, extern: 100000002, mislukt: 100000003 },
};

const dv = (operationId, parameters, runAfter = {}, extra = {}) => ({ type: "OpenApiConnection", inputs: { host: { connectionName: "shared_commondataserviceforapps", operationId, apiId: DVAPI }, parameters, authentication: AUTH }, runAfter, ...extra });
const trigger = (entity, message, extra = {}) => ({ type: "OpenApiConnectionWebhook", inputs: { host: { connectionName: "shared_commondataserviceforapps", operationId: "SubscribeWebhookTrigger", apiId: DVAPI }, parameters: { "subscriptionRequest/message": message, "subscriptionRequest/entityname": entity, "subscriptionRequest/scope": 4, ...extra }, authentication: AUTH } });
const onStatus = (entity, status) => trigger(entity, 3, { "subscriptionRequest/filteringattributes": "hv_status", "subscriptionRequest/filterexpression": `hv_status eq ${status}` });
// a schedule never overlaps itself: one run at a time
const every = (frequency, interval) => ({ type: "Recurrence", recurrence: { frequency, interval }, runtimeConfiguration: { concurrency: { runs: 1 } } });
const approval = (title, assignedTo, details, runAfter = {}) => ({ type: "OpenApiConnectionWebhook", inputs: { host: { connectionName: "shared_approvals", operationId: "StartAndWaitForAnApproval", apiId: APAPI }, parameters: { approvalType: "Basic", "WebhookApprovalCreationInput/title": title, "WebhookApprovalCreationInput/assignedTo": assignedTo, "WebhookApprovalCreationInput/details": details, "WebhookApprovalCreationInput/enableNotifications": true, "WebhookApprovalCreationInput/enableReassignment": true }, authentication: AUTH }, runAfter });
const compose = (inputs, runAfter = {}) => ({ type: "Compose", inputs, runAfter });
const init = (name, type, value, runAfter = {}) => ({ type: "InitializeVariable", inputs: { variables: [{ name, type, value }] }, runAfter });
const setVar = (name, value, runAfter = {}) => ({ type: "SetVariable", inputs: { name, value }, runAfter });
const iff = (expression, actions, elseActions = {}, runAfter = {}) => ({ type: "If", runAfter, expression, actions, else: { actions: elseActions } });
const ok = (...names) => Object.fromEntries(names.map((n) => [n, ["Succeeded"]]));
const any = (...names) => Object.fromEntries(names.map((n) => [n, ["Succeeded", "Failed", "Skipped", "TimedOut"]]));
const t = (c) => `triggerOutputs()?['body/${c}']`;

// ---------------------------------------------------------------------------- shared building blocks
/** Rule parameters from the table Bedrijfsregel, as one object: PX("R03") → 20. */
const params = (S, runAfter = {}) => ({
  Regels: dv("ListRecords", { entityName: S.hv_regel, $select: "hv_code,hv_waarde", $filter: "hv_waarde ne null" }, runAfter),
  Regelparen: { type: "Select", inputs: { from: "@outputs('Regels')?['body/value']", select: "@concat('\"', item()?['hv_code'], '\":', string(item()?['hv_waarde']))" }, runAfter: ok("Regels") },
  Parameters: compose("@json(concat('{', join(body('Regelparen'), ','), '}'))", ok("Regelparen")),
});
export const PX = (code) => `float(outputs('Parameters')?['${code}'])`;

const RUN_LINK = "concat('https://make.powerautomate.com/environments/', workflow()?['tags']?['environmentName'], '/flows/', workflow()?['name'], '/runs/', workflow()?['run']?['name'])";
const recordLink = (table, id) => `@{concat('/main.aspx?pagetype=entityrecord&etn=${table}&id=', ${id})}`;

/** A row in Melding; HV-OP-01 delivers it (in-app notification) or marks an external channel. */
function melding(S, flow, { titel, tekst, rol, soort = ST.soort.info, kanaal, ref = "", link = "" }, runAfter = {}) {
  return dv("CreateRecord", {
    entityName: S.hv_melding, "item/hv_titel": titel, "item/hv_tekst": tekst, "item/hv_rol": rol, "item/hv_soort": soort,
    "item/hv_kanaal": kanaal ?? ST.kanaal.inapp, "item/hv_status": ST.melding.nieuw, "item/hv_bron": flow, "item/hv_referentie": ref, "item/hv_link": link,
  }, runAfter);
}

/** Wrap a flow in Probeer / Bij_fout. `onFail` are extra actions (e.g. status Fout) that run before the run is failed. */
function guarded(S, flow, actions, { ref = "''", onFail = {} } = {}) {
  const failNames = Object.keys(onFail);
  return {
    Probeer: { type: "Scope", actions, runAfter: {} },
    Bij_fout: {
      type: "Scope", runAfter: { Probeer: ["Failed", "TimedOut"] },
      actions: {
        Mislukte_stappen: { type: "Query", inputs: { from: "@result('Probeer')", where: "@equals(item()?['status'], 'Failed')" }, runAfter: {} },
        Foutnamen: { type: "Select", inputs: { from: "@body('Mislukte_stappen')", select: "@item()?['name']" }, runAfter: ok("Mislukte_stappen") },
        Foutmelding: melding(S, flow, {
          titel: `@{concat('${flow} mislukt', if(empty(string(${ref})), '', concat(' · ', string(${ref}))))}`,
          tekst: "@{concat('Mislukte stap: ', join(body('Foutnamen'), ', '), '. ', coalesce(first(body('Mislukte_stappen'))?['error']?['message'], ''))}",
          rol: "Functioneel beheer", soort: ST.soort.fout, ref: `@{string(${ref})}`, link: `@{${RUN_LINK}}`,
        }, ok("Foutnamen")),
        ...Object.fromEntries(Object.entries(onFail).map(([n, a]) => [n, { ...a, runAfter: ok("Foutmelding") }])),
        Run_mislukt: { type: "Terminate", inputs: { runStatus: "Failed", runError: { code: "HV-FOUT", message: "Zie de Fout-melding in de backoffice (Beheer › Meldingen)." } }, runAfter: failNames.length ? any(...failNames) : ok("Foutmelding") },
      },
    },
  };
}

/** One message in the ERP outbox. The idempotency key is an alternate key: a second insert fails, which callers treat as "already queued". */
function outbox(S, endpoint, key, body, ref, binds, runAfter = {}) {
  return dv("CreateRecord", {
    entityName: S.hv_outbox, "item/hv_idempotencykey": key, "item/hv_endpoint": endpoint, "item/hv_body": body,
    "item/hv_status": ST.outbox.wachtend, "item/hv_pogingen": 0, "item/hv_volgendepoging": "@utcNow()", "item/hv_referentie": ref, ...binds,
  }, runAfter);
}

/** After an outbox insert: a duplicate key means "already queued" (fine); any other failure stops the run, so Bij_fout reports it. */
const duplicate = (name) => `or(contains(string(outputs('${name}')), 'already exists'), contains(string(outputs('${name}')), '0x80060892'))`;
const realFailure = (name) => `@and(equals(actions('${name}')?['status'], 'Failed'), not(${duplicate(name)}))`;
const stopUnlessDuplicate = (name) => ({
  [`${name}_controle`]: iff({ equals: [realFailure(name), true] }, { [`${name}_mislukt`]: { type: "Terminate", inputs: { runStatus: "Failed", runError: { code: "HV-OUTBOX", message: `${name}: bericht kon niet in de outbox` } }, runAfter: {} } }, {}, any(name)),
});
/** Same check inside a loop, where Terminate is not allowed: count real failures, stop after the loop. */
const countUnlessDuplicate = (name) => ({
  [`${name}_controle`]: iff({ equals: [realFailure(name), true] }, { [`${name}_tellen`]: { type: "IncrementVariable", inputs: { name: "outboxfouten", value: 1 }, runAfter: {} } }, {}, any(name)),
});
const stopIfCounted = (after) => ({
  Outbox_gelukt: iff({ greater: ["@variables('outboxfouten')", 0] }, { Outbox_mislukt: { type: "Terminate", inputs: { runStatus: "Failed", runError: { code: "HV-OUTBOX", message: "@{concat(string(variables('outboxfouten')), ' bericht(en) konden niet in de outbox')}" } }, runAfter: {} } }, {}, any(after)),
});

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
const weighingBody = (approvedBy, code) => `@{string(json(concat('{"weighingTicket":"', ${t("hv_bonnummer")}, '","customerNo":"', ${t("hv_klantnummer")}, '","itemCode":"', ${t("hv_materiaal")}, '","netKg":', string(${t("hv_netto")}), ',"bedrag":', string(mul(div(float(${t("hv_netto")}), 1000), float(coalesce(first(${code})?['hv_prijsperton'], 0)))), ',"approvedBy":"', ${approvedBy}, '"}')))}`;
const docRef = `${t("hv_documentnr")}`;
const docLink = recordLink("hv_document", t("hv_documentid"));

export function weegbonControleren(S) {
  const F = "HV-DI-01";
  const klant = "outputs('Klant_zoeken')?['body/value']";
  const plaat = "outputs('Nummerplaat_zoeken')?['body/value']";
  const code = "outputs('Materiaalcode_zoeken')?['body/value']";
  const isIn = `equals(${t("hv_richting")}, 100000000)`;
  const empty = (c) => `empty(string(coalesce(${t(c)}, '')))`;
  const f = (cond, regel, ernst, bericht) => `if(${cond}, createArray(addProperty(addProperty(addProperty(json('{}'), 'regel', '${regel}'), 'ernst', '${ernst}'), 'bericht', ${bericht})), json('[]'))`;
  const rules = [
    f(`or(${empty("hv_bonnummer")}, ${empty("hv_datum")}, ${empty("hv_plaat")}, ${empty("hv_klantnummer")}, ${empty("hv_materiaal")}, ${empty("hv_bruto")}, ${empty("hv_tarra")}, ${empty("hv_netto")})`, "R01", "review", "'Verplicht veld ontbreekt'"),
    f(`greater(length(body('Onzekere_velden')), 0)`, "R02", "review", `concat('Onder drempel: ', join(body('Veldnamen'), ', '))`),
    f(`greater(max(sub(sub(${t("hv_bruto")}, ${t("hv_tarra")}), ${t("hv_netto")}), sub(${t("hv_netto")}, sub(${t("hv_bruto")}, ${t("hv_tarra")}))), ${PX("R03")})`, "R03", "review", `concat('Netto ', string(${t("hv_netto")}), ' kg <> bruto - tarra = ', string(sub(${t("hv_bruto")}, ${t("hv_tarra")})), ' kg')`),
    f(`or(equals(length(${klant}), 0), equals(first(${klant})?['hv_actief'], false))`, "R04", "review", `concat('Klant ', ${t("hv_klantnummer")}, ' onbekend of geblokkeerd')`),
    f(`and(greater(length(${klant}), 0), or(equals(length(${plaat}), 0), and(not(equals(first(${plaat})?['_hv_klant_value'], first(${klant})?['hv_klantid'])), not(equals(first(${plaat})?['hv_vervoerder'], true)))))`, "R05", "review", `concat('Nummerplaat ', ${t("hv_plaat")}, ' niet gekend bij klant of vervoerder')`),
    f(`if(${isIn}, or(equals(length(${code}), 0), not(equals(first(${code})?['hv_soort'], 100000000))), or(equals(length(${code}), 0), not(equals(first(${code})?['hv_soort'], 100000002))))`, "R06", "block", `concat('Materiaal ', ${t("hv_materiaal")}, ' niet toegelaten volgens de vergunning')`),
    f(`and(${isIn}, ${empty("hv_idformulier")}, not(equals(first(${code})?['hv_soort'], 100000001)))`, "R07", "review", "'Geen nummer identificatieformulier'"),
    f(`and(${isIn}, equals(first(${code})?['hv_bodemref'], true), ${empty("hv_traceerbaarheid")})`, "R08", "review", "'Bodem zonder traceerbaarheidsreferentie'"),
    f(`greater(length(outputs('Eerder_ontvangen')?['body/value']), 0)`, "R09", "reject", `concat('Bon ', ${t("hv_bonnummer")}, ' is al ontvangen')`),
    f(`or(less(outputs('Ouderdom_dagen'), 0), greater(outputs('Ouderdom_dagen'), ${PX("R10")}))`, "R10", "review", `concat('Bon is ', string(outputs('Ouderdom_dagen')), ' dagen oud')`),
    f(`greater(${t("hv_bruto")}, ${PX("R11")})`, "R11", "review", `concat('Bruto ', string(${t("hv_bruto")}), ' kg boven de grens')`),
  ];
  const bev = "outputs('Bevindingen')";
  const decision = `if(contains(string(${bev}), '"ernst":"reject"'), 'dubbel', if(contains(string(${bev}), '"ernst":"block"'), 'escalatie', if(greater(length(${bev}), 0), 'nazicht', 'automatisch')))`;
  const regelsTekst = "join(body('Afgegane_regels'), ', ')";
  return definition(
    { Weegbon_toegevoegd: trigger("hv_document", 1) },
    guarded(S, F, {
      ...params(S),
      Klant_zoeken: dv("ListRecords", { entityName: S.hv_klant, $filter: `hv_klantnr eq '@{${t("hv_klantnummer")}}'`, $top: 1 }),
      Nummerplaat_zoeken: dv("ListRecords", { entityName: S.hv_nummerplaat, $filter: `hv_plaat eq '@{${t("hv_plaat")}}'`, $top: 1 }),
      Materiaalcode_zoeken: dv("ListRecords", { entityName: S.hv_materiaalcode, $filter: `hv_code eq '@{${t("hv_materiaal")}}'`, $top: 1 }),
      Eerder_ontvangen: dv("ListRecords", { entityName: S.hv_document, $filter: `hv_bonnummer eq '@{${t("hv_bonnummer")}}' and hv_documentid ne @{${t("hv_documentid")}} and createdon lt @{${t("createdon")}} and hv_status ne ${ST.doc.dubbel}`, $top: 1 }),
      Onzekere_velden: { type: "Query", inputs: { from: `@json(coalesce(${t("hv_confidence")}, '[]'))`, where: `@less(float(item()?['confidence']), ${PX("R02")})` }, runAfter: ok("Parameters") },
      Veldnamen: { type: "Select", inputs: { from: "@body('Onzekere_velden')", select: "@item()?['veld']" }, runAfter: ok("Onzekere_velden") },
      Ouderdom_dagen: compose(`@div(sub(ticks(${t("hv_ontvangen")}), ticks(${t("hv_datum")})), 864000000000)`),
      Bevindingen: compose(`@union(${rules.join(", ")})`, ok("Klant_zoeken", "Nummerplaat_zoeken", "Materiaalcode_zoeken", "Eerder_ontvangen", "Veldnamen", "Ouderdom_dagen")),
      Afgegane_regels: { type: "Select", inputs: { from: `@${bev}`, select: "@item()?['regel']" }, runAfter: ok("Bevindingen") },
      Beslissing: compose(`@${decision}`, ok("Bevindingen")),
      Weegbon_bijwerken: dv("UpdateOnlyRecord", {
        entityName: S.hv_document, recordId: `@${t("hv_documentid")}`,
        "item/hv_beslissing": `@if(equals(outputs('Beslissing'), 'automatisch'), 100000000, if(equals(outputs('Beslissing'), 'nazicht'), 100000001, if(equals(outputs('Beslissing'), 'escalatie'), 100000002, 100000003)))`,
        "item/hv_status": `@if(equals(outputs('Beslissing'), 'automatisch'), ${ST.doc.ontvangen}, if(equals(outputs('Beslissing'), 'nazicht'), ${ST.doc.nazicht}, if(equals(outputs('Beslissing'), 'escalatie'), ${ST.doc.escalatie}, ${ST.doc.dubbel})))`,
        "item/hv_bevindingen": `@{string(${bev})}`,
      }, ok("Beslissing", "Afgegane_regels")),
      Volgens_beslissing: {
        type: "Switch", runAfter: ok("Weegbon_bijwerken"), expression: "@outputs('Beslissing')",
        cases: {
          Automatisch: {
            case: "automatisch",
            actions: {
              ERP_bericht: outbox(S, ST.endpoint.weegticket, `wb-@{${t("hv_bonnummer")}}`, weighingBody("'auto'", code), `@${docRef}`, { "item/hv_Weegbon@odata.bind": `/${S.hv_document}(@{${t("hv_documentid")}})` }),
              ...stopUnlessDuplicate("ERP_bericht"),
              In_wachtrij: dv("UpdateOnlyRecord", { entityName: S.hv_document, recordId: `@${t("hv_documentid")}`, "item/hv_status": ST.doc.wachtrij, "item/hv_erpreferentie": `@{if(equals(actions('ERP_bericht')?['status'], 'Succeeded'), concat('wb-', ${t("hv_bonnummer")}, ' (in outbox)'), concat('wb-', ${t("hv_bonnummer")}, ' (al in outbox, idempotent)'))}` }, ok("ERP_bericht_controle")),
            },
          },
          Nazicht: { case: "nazicht", actions: { Melding_administratie: melding(S, F, { titel: `@{concat('Weegbon ', ${docRef}, ' nakijken')}`, tekst: `@{concat('Regels: ', ${regelsTekst}, '. Open de bon in Weegbon Nakijken.')}`, rol: "Administratie recyclage", soort: ST.soort.actie, ref: `@${docRef}`, link: docLink }) } },
          Escalatie: { case: "escalatie", actions: { Melding_milieu: melding(S, F, { titel: `@{concat('Escalatie weegbon ', ${docRef}, ': materiaal ', ${t("hv_materiaal")})}`, tekst: `@{concat('Regels: ', ${regelsTekst}, '. Alleen de milieucoördinator beslist (weigeren).')}`, rol: "Milieucoördinator", soort: ST.soort.actie, ref: `@${docRef}`, link: docLink }) } },
          Dubbel: { case: "dubbel", actions: { Melding_dubbel: melding(S, F, { titel: `@{concat('Dubbele bon ', ${t("hv_bonnummer")}, ' tegengehouden')}`, tekst: `@{concat(${docRef}, ' is niet geboekt: het bonnummer was al ontvangen.')}`, rol: "Administratie recyclage", ref: `@${docRef}`, link: docLink }) } },
        },
        default: { actions: {} },
      },
    }, { ref: docRef, onFail: { Status_fout: dv("UpdateOnlyRecord", { entityName: S.hv_document, recordId: `@${t("hv_documentid")}`, "item/hv_status": ST.doc.fout }) } }),
  );
}

export function weegbonNaNazicht(S) {
  const F = "HV-DI-02";
  const code = "outputs('Materiaalcode')?['body/value']";
  const isIn = `equals(${t("hv_richting")}, 100000000)`;
  // Server-side guard: whatever the app sent, never queue a duplicate or refused material.
  const verdict = `if(greater(length(outputs('Al_in_outbox')?['body/value']), 0), 'dubbel', if(or(equals(length(${code}), 0), and(${isIn}, not(equals(first(${code})?['hv_soort'], 100000000))), and(not(${isIn}), not(equals(first(${code})?['hv_soort'], 100000002)))), 'geweigerd', 'ok'))`;
  const upd = (status, note) => dv("UpdateOnlyRecord", { entityName: S.hv_document, recordId: `@${t("hv_documentid")}`, "item/hv_status": status, "item/hv_reviewopmerking": note });
  return definition(
    { Weegbon_goedgekeurd: onStatus("hv_document", ST.doc.goedgekeurd) },
    guarded(S, F, {
      Materiaalcode: dv("ListRecords", { entityName: S.hv_materiaalcode, $filter: `hv_code eq '@{${t("hv_materiaal")}}'`, $top: 1 }),
      Al_in_outbox: dv("ListRecords", { entityName: S.hv_outbox, $filter: `hv_idempotencykey eq 'wb-@{${t("hv_bonnummer")}}' and (_hv_weegbon_value eq null or _hv_weegbon_value ne @{${t("hv_documentid")}})`, $top: 1 }),
      Controle: compose(`@${verdict}`, ok("Materiaalcode", "Al_in_outbox")),
      Volgens_controle: {
        type: "Switch", runAfter: ok("Controle"), expression: "@outputs('Controle')",
        cases: {
          Dubbel: { case: "dubbel", actions: { Status_dubbel: upd(ST.doc.dubbel, "@{concat(coalesce(" + t("hv_reviewopmerking") + ", ''), ' | Server: bonnummer al geboekt of in de outbox, niet opnieuw geboekt.')}") } },
          Geweigerd: {
            case: "geweigerd",
            actions: {
              Status_escalatie: upd(ST.doc.escalatie, "@{concat(coalesce(" + t("hv_reviewopmerking") + ", ''), ' | Server: materiaal niet toegelaten, terug naar escalatie.')}"),
              Melding_milieu: melding(S, F, { titel: `@{concat('Weegbon ', ${docRef}, ' terug naar escalatie')}`, tekst: `@{concat('Goedgekeurd met materiaal ', ${t("hv_materiaal")}, ', dat niet toegelaten is. De server boekte niet.')}`, rol: "Milieucoördinator", soort: ST.soort.waarschuwing, ref: `@${docRef}`, link: docLink }, ok("Status_escalatie")),
            },
          },
          Boeken: {
            case: "ok",
            actions: {
              ERP_bericht: outbox(S, ST.endpoint.weegticket, `wb-@{${t("hv_bonnummer")}}`, weighingBody(`coalesce(${t("hv_reviewer")}, 'reviewer')`, code), `@${docRef}`, { "item/hv_Weegbon@odata.bind": `/${S.hv_document}(@{${t("hv_documentid")}})` }),
              ...stopUnlessDuplicate("ERP_bericht"),
              In_wachtrij: dv("UpdateOnlyRecord", { entityName: S.hv_document, recordId: `@${t("hv_documentid")}`, "item/hv_status": ST.doc.wachtrij, "item/hv_erpreferentie": `@{concat('wb-', ${t("hv_bonnummer")}, ' (in outbox)')}` }, ok("ERP_bericht_controle")),
            },
          },
        },
        default: { actions: {} },
      },
    }, { ref: docRef }),
  );
}

export function weigeringMelden(S) {
  const F = "HV-DI-03";
  const reden = `coalesce(${t("hv_reviewopmerking")}, 'geen reden opgegeven')`;
  const extern = (rol, wie) => melding(S, F, {
    titel: `@{concat('Lading geweigerd: bon ', ${t("hv_bonnummer")})}`,
    tekst: `@{concat('${wie}: de lading van ', ${t("hv_datum")}, ' (', ${t("hv_plaat")}, ', materiaal ', ${t("hv_materiaal")}, ') is geweigerd. Reden: ', ${reden})}`,
    rol, kanaal: ST.kanaal.extern, ref: `@${docRef}`,
  });
  return definition(
    { Weegbon_afgewezen: onStatus("hv_document", ST.doc.afgewezen) },
    guarded(S, F, {
      Klant_verwittigen: extern("Klant (extern)", `@{concat('Klant ', ${t("hv_klantnummer")})}`),
      Vervoerder_verwittigen: extern("Vervoerder (extern)", `@{concat('Vervoerder ', ${t("hv_plaat")})}`),
    }, { ref: docRef }),
  );
}

// ============================================================================ case 02
const claimRef = t("hv_dossiernummer");
const claimLink = recordLink("hv_schadeclaim", t("hv_schadeclaimid"));
const timeline = (S, gebeurtenis, door, opmerking, runAfter = {}, claimId = t("hv_schadeclaimid")) => dv("CreateRecord", { entityName: S.hv_tijdlijn, "item/hv_gebeurtenis": gebeurtenis, "item/hv_door": door, "item/hv_opmerking": opmerking, "item/hv_Schadeclaim@odata.bind": `/${S.hv_schadeclaim}(@{${claimId}})` }, runAfter);

export function schadeclaimIntake(S) {
  const F = "HV-CL-01";
  const cat = t("hv_categorie");
  const amount = `float(coalesce(${t("hv_geschatbedrag")}, 0))`;
  const severity = `if(and(equals(${cat}, 100000003), or(equals(${t("hv_typeleiding")}, 100000000), equals(${t("hv_typeleiding")}, 100000001), not(equals(${t("hv_beheerderverwittigd")}, true)))), 100000003, if(greaterOrEquals(${amount}, ${PX("VZ-01")}), 100000002, if(or(greaterOrEquals(${amount}, ${PX("ER-02")}), equals(${t("hv_derdebetrokken")}, true)), 100000001, 100000000)))`;
  const chain = `concat(if(or(equals(${cat}, 100000000), equals(${cat}, 100000001)), 'Fleetmanager>', if(or(equals(${cat}, 100000002), equals(${cat}, 100000003)), 'Claims & verzekeringen>', '')), if(lessOrEquals(${amount}, ${PX("DT-02.1")}), 'Projectleider', if(lessOrEquals(${amount}, ${PX("DT-02.2")}), 'Projectleider>Afdelingsverantwoordelijke', 'Projectleider>Afdelingsverantwoordelijke>Directie')))`;
  const owner = `if(or(equals(${cat}, 100000000), equals(${cat}, 100000001)), 'Fleetmanager', if(or(equals(${cat}, 100000002), equals(${cat}, 100000003)), 'Claims & verzekeringen', outputs('Werf')?['body/hv_projectleider']))`;
  const insurer = `or(greaterOrEquals(${amount}, ${PX("VZ-01")}), equals(${cat}, 100000002), equals(${cat}, 100000003), equals(${t("hv_derdebetrokken")}, true))`;
  const notify = `union(createArray(outputs('Werf')?['body/hv_projectleider']), if(or(equals(${cat}, 100000002), equals(${cat}, 100000003), equals(${t("hv_derdebetrokken")}, true)), createArray('Claims & verzekeringen'), json('[]')), if(equals(${cat}, 100000001), createArray('Verhuurder (extern)'), json('[]')), if(equals(${cat}, 100000003), createArray('Leidingbeheerder (extern)', 'Preventieadviseur'), json('[]')), if(equals(outputs('Ernst'), 100000003), createArray('Afdelingsverantwoordelijke'), json('[]')))`;
  const sla = `if(equals(outputs('Ernst'), 100000003), ${PX("SLA-K")}, if(equals(outputs('Ernst'), 100000002), ${PX("SLA-H")}, if(equals(outputs('Ernst'), 100000001), ${PX("SLA-M")}, ${PX("SLA-L")})))`;
  const deadline = `addDays(coalesce(${t("hv_tijdstipschade")}, utcNow()), int(${PX("VZ-02")}))`;
  const concept = `concat('Aangifte schadegeval ', ${claimRef}, ' (concept). Tijdstip: ', coalesce(${t("hv_tijdstipschade")}, ''), '. Plaats: ', coalesce(${t("hv_locatie")}, ''), '. Wat gebeurde: ', coalesce(${t("hv_omschrijving")}, ''), '. Raming: EUR ', string(${amount}), '. Derde: ', coalesce(${t("hv_naamderde")}, 'geen'), '. KLIP: ', coalesce(${t("hv_klipreferentie")}, 'n.v.t.'), '. Foto''s: ', string(coalesce(${t("hv_aantalfotos")}, 0)), '.')`;
  return definition(
    { Schadeclaim_gemeld: trigger("hv_schadeclaim", 1) },
    guarded(S, F, {
      ...params(S),
      Werf: dv("GetItem", { entityName: S.hv_werf, recordId: `@${t("_hv_werf_value")}`, $select: "hv_werfnr,hv_projectleider,hv_actief" }),
      Ernst: compose(`@${severity}`, ok("Parameters")),
      Ernst_tekst: compose("@if(equals(outputs('Ernst'), 100000003), 'kritiek', if(equals(outputs('Ernst'), 100000002), 'hoog', if(equals(outputs('Ernst'), 100000001), 'middel', 'laag')))", ok("Ernst")),
      SLA_uren: compose(`@${sla}`, ok("Ernst")),
      Aangifte_nodig: compose(`@${insurer}`, ok("Parameters")),
      Te_verwittigen: compose(`@${notify}`, ok("Werf", "Ernst")),
      Dossier_bijwerken: dv("UpdateOnlyRecord", {
        entityName: S.hv_schadeclaim, recordId: `@${t("hv_schadeclaimid")}`,
        "item/hv_status": ST.claim.beoordeling, "item/hv_ernst": "@outputs('Ernst')", "item/hv_goedkeuringsketen": `@${chain}`, "item/hv_goedkeuringsniveau": 0,
        "item/hv_eigenaar": `@${owner}`, "item/hv_verwittigd": "@{join(outputs('Te_verwittigen'), ', ')}",
        "item/hv_deadlinebeoordeling": "@addHours(utcNow(), int(outputs('SLA_uren')))",
        "item/hv_deadlineverzekeraar": `@if(outputs('Aangifte_nodig'), ${deadline}, null)`,
        "item/hv_aangifteconcept": `@if(outputs('Aangifte_nodig'), ${concept}, null)`,
      }, ok("SLA_uren", "Te_verwittigen", "Aangifte_nodig", "Ernst_tekst")),
      Tijdlijn_gemeld: timeline(S, "gemeld", `@{coalesce(${t("hv_melder")}, 'werfapp')}`, "via werfapp", ok("Dossier_bijwerken")),
      Tijdlijn_dossier: timeline(S, "dossier aangemaakt", "Power Automate", `@{concat(${claimRef}, ' · ernst ', outputs('Ernst_tekst'), ' · eigenaar ', ${owner}, ' · keten ', ${chain})}`, ok("Tijdlijn_gemeld")),
      Verwittigen: {
        type: "Foreach", foreach: "@outputs('Te_verwittigen')", runAfter: ok("Tijdlijn_dossier"),
        actions: {
          Melding_betrokkene: melding(S, F, {
            titel: `@{concat('Schade ', ${claimRef}, ' · ', outputs('Ernst_tekst'), ' · werf ', outputs('Werf')?['body/hv_werfnr'])}`,
            tekst: `@{concat(coalesce(${t("hv_omschrijving")}, ''), ' Eigenaar: ', ${owner}, '. Keten: ', ${chain}, '.')}`,
            rol: "@{items('Verwittigen')}", soort: `@if(equals(outputs('Ernst'), 100000003), ${ST.soort.actie}, ${ST.soort.info})`,
            kanaal: `@if(contains(items('Verwittigen'), '(extern)'), ${ST.kanaal.extern}, ${ST.kanaal.inapp})`, ref: `@${claimRef}`, link: claimLink,
          }),
        },
      },
      Tijdlijn_verwittigd: timeline(S, "verwittigd", "Power Automate", "@{join(outputs('Te_verwittigen'), ', ')}", ok("Verwittigen")),
      Aangifte: iff({ equals: ["@outputs('Aangifte_nodig')", true] }, {
        Melding_aangifte: melding(S, F, {
          titel: `@{concat('Aangifte verzekeraar klaarzetten: ', ${claimRef})}`,
          tekst: `@{concat('Het concept staat in het dossier. Versturen vóór ', formatDateTime(${deadline}, 'dd/MM/yyyy'), ' en daarna Aangifte verstuurd aanvinken.')}`,
          rol: "Claims & verzekeringen", soort: ST.soort.actie, ref: `@${claimRef}`, link: claimLink,
        }),
        Tijdlijn_aangifte: timeline(S, "aangifte-concept klaargezet", "Power Automate", `@{concat('deadline verzekeraar ', formatDateTime(${deadline}, 'dd/MM/yyyy'))}`, ok("Melding_aangifte")),
      }, {}, ok("Tijdlijn_dossier")),
    }, { ref: claimRef, onFail: { Status_fout: dv("UpdateOnlyRecord", { entityName: S.hv_schadeclaim, recordId: `@${t("hv_schadeclaimid")}`, "item/hv_status": ST.claim.fout }) } }),
  );
}

/** Approval chain on a status, shared by claims (HV-CL-02) and material requests (HV-MA-02). */
function approvalChain(S, { set, idCol, chainCol, levelCol, title, details, approved, rejected, timedOut, after }) {
  const role = "variables('keten')[variables('niveau')]";
  const id = t(idCol);
  return {
    Keten: init("keten", "array", `@split(${t(chainCol)}, '>')`),
    Niveau: init("niveau", "integer", `@coalesce(${t(levelCol)}, 0)`, ok("Keten")),
    Afgewezen: init("afgewezen", "boolean", false, ok("Niveau")),
    Per_niveau: {
      type: "Until", runAfter: ok("Afgewezen"),
      expression: "@or(variables('afgewezen'), greaterOrEquals(variables('niveau'), length(variables('keten'))))",
      limit: { count: 6, timeout: "P14D" },
      actions: {
        Goedkeurder: dv("ListRecords", { entityName: S.hv_goedkeurder, $filter: `hv_rol eq '@{${role}}'`, $top: 1 }),
        Goedkeuring: approval(`${title} — niveau @{add(variables('niveau'), 1)}/@{length(variables('keten'))}: @{${role}}`, `@{first(outputs('Goedkeurder')?['body/value'])?['hv_email']}`, details, ok("Goedkeurder")),
        ...after(role),
        Uitkomst: {
          type: "If", runAfter: ok("Goedkeuring", ...Object.keys(after(role))),
          expression: { equals: ["@body('Goedkeuring')?['outcome']", "Approve"] },
          actions: {
            Volgend_niveau: { type: "IncrementVariable", inputs: { name: "niveau", value: 1 }, runAfter: {} },
            Niveau_bewaren: dv("UpdateOnlyRecord", { entityName: set, recordId: `@${id}`, [`item/${levelCol}`]: "@variables('niveau')" }, ok("Volgend_niveau")),
          },
          else: { actions: { Markeer_afgewezen: setVar("afgewezen", true) } },
        },
      },
    },
    // a time-out of the loop (14 days) must still reach the "verlopen" branch
    Eindstatus: compose(`@if(variables('afgewezen'), 'afgewezen', if(greaterOrEquals(variables('niveau'), length(variables('keten'))), 'goedgekeurd', 'verlopen'))`, any("Per_niveau")),
    Volgens_uitkomst: {
      type: "Switch", runAfter: ok("Eindstatus"), expression: "@outputs('Eindstatus')",
      cases: {
        Goedgekeurd: { case: "goedgekeurd", actions: approved },
        Afgewezen: { case: "afgewezen", actions: rejected },
        Verlopen: { case: "verlopen", actions: timedOut },
      },
      default: { actions: {} },
    },
  };
}

export function schadeclaimGoedkeuring(S) {
  const F = "HV-CL-02";
  const upd = (status) => dv("UpdateOnlyRecord", { entityName: S.hv_schadeclaim, recordId: `@${t("hv_schadeclaimid")}`, "item/hv_status": status });
  const werfleider = (titel, soort = ST.soort.info) => melding(S, F, { titel, tekst: `@{concat('Raming EUR ', string(${t("hv_geschatbedrag")}), ' · keten ', ${t("hv_goedkeuringsketen")})}`, rol: "Werfleider", soort, ref: `@${claimRef}`, link: claimLink }, ok("Status"));
  const actions = approvalChain(S, {
    set: S.hv_schadeclaim, idCol: "hv_schadeclaimid", chainCol: "hv_goedkeuringsketen", levelCol: "hv_goedkeuringsniveau",
    title: `Schadeclaim @{${claimRef}}`,
    details: `Raming €@{${t("hv_geschatbedrag")}} · @{${t("hv_omschrijving")}} · keten @{${t("hv_goedkeuringsketen")}}`,
    after: (role) => ({ Tijdlijn: timeline(S, `@{if(equals(body('Goedkeuring')?['outcome'], 'Approve'), 'goedgekeurd', 'afgewezen')} (@{${role}})`, "@{first(body('Goedkeuring')?['responses'])?['responder/email']}", "@{first(body('Goedkeuring')?['responses'])?['comments']}", ok("Goedkeuring")) }),
    approved: { Status: upd(ST.claim.goedgekeurd), Melding_werfleider: werfleider(`@{concat('Schade ', ${claimRef}, ' goedgekeurd')}`) },
    rejected: { Status: upd(ST.claim.afgewezen), Melding_werfleider: werfleider(`@{concat('Schade ', ${claimRef}, ' afgewezen')}`) },
    timedOut: { Status: upd(ST.claim.beoordeling), Melding_eigenaar: melding(S, F, { titel: `@{concat('Goedkeuring ', ${claimRef}, ' verlopen na 14 dagen')}`, tekst: "Niemand antwoordde op tijd. Het dossier staat terug op In beoordeling; zet het opnieuw op Ter goedkeuring om de keten te hervatten.", rol: "Afdelingsverantwoordelijke", soort: ST.soort.waarschuwing, ref: `@${claimRef}`, link: claimLink }, ok("Status")) },
  });
  return definition({ Ter_goedkeuring: onStatus("hv_schadeclaim", ST.claim.terGoedkeuring) }, guarded(S, F, actions, { ref: claimRef }));
}

export function deadlineBewaking(S) {
  const F = "HV-CL-03";
  const it = (c) => `items('Per_claim')?['${c}']`;
  const ia = (c) => `items('Per_aangifte')?['${c}']`;
  return definition(
    { Elk_uur: every("Hour", 1) },
    guarded(S, F, {
      ...params(S),
      Te_laat: dv("ListRecords", { entityName: S.hv_schadeclaim, $filter: `(hv_status eq ${ST.claim.beoordeling} or hv_status eq ${ST.claim.info}) and hv_deadlinebeoordeling lt @{utcNow()} and hv_geescaleerd ne true` }),
      Per_claim: {
        type: "Foreach", foreach: "@outputs('Te_laat')?['body/value']", runAfter: ok("Te_laat"),
        actions: {
          Markeer: dv("UpdateOnlyRecord", { entityName: S.hv_schadeclaim, recordId: `@${it("hv_schadeclaimid")}`, "item/hv_geescaleerd": true }),
          Tijdlijn: timeline(S, "SLA overschreden — geëscaleerd", "Power Automate (HV-CL-03)", "Beoordeling niet vóór de deadline; afdelingsverantwoordelijke verwittigd.", ok("Markeer"), it("hv_schadeclaimid")),
          Melding_escalatie: melding(S, F, { titel: `@{concat('SLA overschreden: ', ${it("hv_dossiernummer")})}`, tekst: `@{concat('Eigenaar ', ${it("hv_eigenaar")}, ' beoordeelde niet vóór ', ${it("hv_deadlinebeoordeling")}, '.')}`, rol: "Afdelingsverantwoordelijke", soort: ST.soort.waarschuwing, ref: `@${it("hv_dossiernummer")}`, link: recordLink("hv_schadeclaim", it("hv_schadeclaimid")) }, ok("Markeer")),
        },
      },
      // the deadline with financial consequences: the declaration to the insurer
      Aangifte_dreigt: dv("ListRecords", { entityName: S.hv_schadeclaim, $filter: `hv_deadlineverzekeraar ne null and hv_aangifteverstuurd ne true and hv_aangiftegewaarschuwd ne true and hv_deadlineverzekeraar lt @{addDays(utcNow(), int(${PX("VZ-03")}))}` }, ok("Parameters")),
      Per_aangifte: {
        type: "Foreach", foreach: "@outputs('Aangifte_dreigt')?['body/value']", runAfter: ok("Aangifte_dreigt"),
        actions: {
          Markeer_gewaarschuwd: dv("UpdateOnlyRecord", { entityName: S.hv_schadeclaim, recordId: `@${ia("hv_schadeclaimid")}`, "item/hv_aangiftegewaarschuwd": true }),
          Tijdlijn_aangifte: timeline(S, "aangiftetermijn dreigt", "Power Automate (HV-CL-03)", `@{concat('Aangifte nog niet verstuurd; deadline ', ${ia("hv_deadlineverzekeraar")})}`, ok("Markeer_gewaarschuwd"), ia("hv_schadeclaimid")),
          Melding_aangifte: melding(S, F, { titel: `@{concat('Aangifte verzekeraar dreigt te laat: ', ${ia("hv_dossiernummer")})}`, tekst: `@{concat('Deadline ', ${ia("hv_deadlineverzekeraar")}, '. Te laat aangeven kan de dekking kosten.')}`, rol: "Claims & verzekeringen", soort: ST.soort.waarschuwing, ref: `@${ia("hv_dossiernummer")}`, link: recordLink("hv_schadeclaim", ia("hv_schadeclaimid")) }, ok("Markeer_gewaarschuwd")),
        },
      },
    }),
  );
}

export function schadeclaimAfsluiten(S) {
  const F = "HV-CL-04";
  const kost = `float(coalesce(${t("hv_werkelijkekost")}, ${t("hv_geschatbedrag")}, 0))`;
  return definition(
    { Afgesloten: onStatus("hv_schadeclaim", ST.claim.afgesloten) },
    guarded(S, F, {
      Werf: dv("GetItem", { entityName: S.hv_werf, recordId: `@${t("_hv_werf_value")}`, $select: "hv_werfnr" }),
      Kosten: iff({ greater: [`@${kost}`, 0] }, {
        Kost_naar_outbox: outbox(S, ST.endpoint.projectkost, `pk-@{${claimRef}}`, `@{string(json(concat('{"claimNo":"', ${claimRef}, '","projectNo":"', outputs('Werf')?['body/hv_werfnr'], '","bedrag":', string(${kost}), ',"categorie":', string(${t("hv_categorie")}), '}')))}`, `@${claimRef}`, { "item/hv_Schadeclaim@odata.bind": `/${S.hv_schadeclaim}(@{${t("hv_schadeclaimid")}})` }),
        ...stopUnlessDuplicate("Kost_naar_outbox"),
        Tijdlijn_kost: timeline(S, "kosten naar ERP (outbox)", "Power Automate (HV-CL-04)", `@{concat('EUR ', string(${kost}), ' op project ', outputs('Werf')?['body/hv_werfnr'])}`, ok("Kost_naar_outbox_controle")),
      }, {}, ok("Werf")),
      Recuperatie: iff({ equals: [`@${t("hv_derdeaansprakelijk")}`, true] }, {
        Melding_recuperatie: melding(S, F, { titel: `@{concat('Recupereren: ', ${claimRef})}`, tekst: `@{concat('Derde aansprakelijk: ', coalesce(${t("hv_naamderde")}, 'onbekend'), '. Kost EUR ', string(${kost}), '. Start het verhaal en noteer het bedrag in Recuperatie.')}`, rol: "Claims & verzekeringen", soort: ST.soort.actie, ref: `@${claimRef}`, link: claimLink }),
        Tijdlijn_recuperatie: timeline(S, "recuperatie gestart", "Power Automate (HV-CL-04)", `@{coalesce(${t("hv_naamderde")}, '')}`, ok("Melding_recuperatie")),
      }),
    }, { ref: claimRef }),
  );
}

// ============================================================================ case 03
const reqRef = t("hv_aanvraagnr");
const reqLink = recordLink("hv_materiaalaanvraag", t("hv_materiaalaanvraagid"));
const reqFail = (S) => ({ Status_fout: dv("UpdateOnlyRecord", { entityName: S.hv_materiaalaanvraag, recordId: `@${t("hv_materiaalaanvraagid")}`, "item/hv_status": ST.req.fout }) });

export function aanvraagVerwerken(S) {
  const F = "HV-MA-01";
  const line = "items('Per_lijn')";
  const art = `${line}?['hv_Artikel']`;
  const cats = ["100000000", "100000001", "100000002", "100000003", "100000004"];
  // the ERP messages are planned here and stored on the request; HV-MA-03 sends them once approved
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
      Iets_te_nemen: iff({ greater: ["@outputs('Neem')", 0] }, {
        Toewijzing_tekst: { type: "AppendToStringVariable", inputs: { name: "toewijzing", value: "@{outputs('Neem')} uit @{last(split(items('Per_depot')?['hv_naam'], '→'))} (@{items('Per_depot')?['hv_km']} km); " }, runAfter: {} },
        Reservatie_bericht: { ...msg("reservations", `@{concat(${reqRef}, '-', ${art}?['hv_artikelnr'], '-', last(split(items('Per_depot')?['hv_naam'], '→')))}`, { voorraad: `@{concat(${art}?['hv_artikelnr'], '@', last(split(items('Per_depot')?['hv_naam'], '→')))}`, artikel: `@{${art}?['hv_artikelnr']}`, hoeveelheid: "@outputs('Neem')", werf: "@{outputs('Werf')?['body/hv_werfnr']}", bedrag: `@mul(outputs('Neem'), float(${art}?['hv_eenheidsprijs']))` }), runAfter: ok("Toewijzing_tekst") },
        Rest_bijwerken: { type: "DecrementVariable", inputs: { name: "rest", value: "@outputs('Neem')" }, runAfter: ok("Reservatie_bericht") },
      }, {}, ok("Neem")),
    },
  };
  const autoMax = PX("DT-03.3");
  const plMax = PX("DT-03.2");
  return definition(
    { Aanvraag_ingediend: trigger("hv_materiaalaanvraag", 4, { "subscriptionRequest/filteringattributes": "hv_status", "subscriptionRequest/filterexpression": `hv_status eq ${ST.req.ingediend}` }) },
    guarded(S, F, {
      ...params(S),
      Werf: dv("GetItem", { entityName: S.hv_werf, recordId: `@${t("_hv_werf_value")}`, $select: "hv_werfnr,hv_naam,hv_actief" }),
      Lijnen: dv("ListRecords", { entityName: S.hv_aanvraaglijn, $filter: `_hv_aanvraag_value eq @{${t("hv_materiaalaanvraagid")}}`, $expand: "hv_Artikel($select=hv_artikelid,hv_artikelnr,hv_eenheid,hv_eenheidsprijs,hv_categorie,hv_bron,hv_alternatief,hv_opbestelling)" }),
      Afstanden: dv("ListRecords", { entityName: S.hv_afstand, $filter: `_hv_werf_value eq @{${t("_hv_werf_value")}}`, $orderby: "hv_km asc" }),
      Budgetten: dv("ListRecords", { entityName: S.hv_werfbudget, $filter: `_hv_werf_value eq @{${t("_hv_werf_value")}}` }),
      Berichten: init("berichten", "array", []),
      Waarde: init("waarde", "float", 0, ok("Berichten")),
      Aankoop: init("aankoop", "boolean", false, ok("Waarde")),
      Rest: init("rest", "float", 0, ok("Aankoop")),
      Toewijzing: init("toewijzing", "string", "", ok("Rest")),
      ...Object.fromEntries(cats.map((c, i) => [`Cat_init_${c}`, init(`cat_${c}`, "float", 0, ok(i === 0 ? "Toewijzing" : `Cat_init_${cats[i - 1]}`))])),
      Per_lijn: {
        type: "Foreach", foreach: "@outputs('Lijnen')?['body/value']", runAfter: ok("Werf", "Lijnen", "Afstanden", "Budgetten", "Parameters", `Cat_init_${cats.at(-1)}`),
        runtimeConfiguration: { concurrency: { repetitions: 1 } },
        actions: {
          Lijnwaarde: compose(`@mul(float(${line}?['hv_hoeveelheid']), float(${art}?['hv_eenheidsprijs']))`),
          Waarde_tellen: { type: "IncrementVariable", inputs: { name: "waarde", value: "@outputs('Lijnwaarde')" }, runAfter: ok("Lijnwaarde") },
          Categorie_tellen: catIncrement,
          Toewijzing_leeg: setVar("toewijzing", "", ok("Waarde_tellen")),
          Bron: iff({ equals: [`@${art}?['hv_bron']`, 100000001] }, {
            Extern_markeren: setVar("aankoop", true),
            Extern_bericht: { ...msg("purchase-requisitions", `@{concat(${reqRef}, '-', ${art}?['hv_artikelnr'], '-PR')}`, { artikel: `@{${art}?['hv_artikelnr']}`, hoeveelheid: `@${line}?['hv_hoeveelheid']`, werf: "@{outputs('Werf')?['body/hv_werfnr']}", bedrag: "@outputs('Lijnwaarde')" }), runAfter: ok("Extern_markeren") },
            Lijn_extern: dv("UpdateOnlyRecord", { entityName: S.hv_aanvraaglijn, recordId: `@${line}?['hv_aanvraaglijnid']`, "item/hv_waarde": "@outputs('Lijnwaarde')", "item/hv_aankoop": `@${line}?['hv_hoeveelheid']`, "item/hv_tekort": 0, "item/hv_toewijzing": "Extern artikel: aankoopaanvraag", "item/hv_alternatief": `@{if(empty(coalesce(${art}?['hv_alternatief'], '')), '', concat('Gerecycleerd alternatief ', ${art}?['hv_alternatief'], ' — projectleider beslist'))}` }, ok("Extern_bericht")),
          }, {
            Rest_init: setVar("rest", `@float(${line}?['hv_hoeveelheid'])`),
            Per_depot: perDepot,
            Tekort: iff({ greater: ["@variables('rest')", 0] }, {
              Tekort_markeren: setVar("aankoop", true),
              Tekort_bericht: { ...msg("purchase-requisitions", `@{concat(${reqRef}, '-', ${art}?['hv_artikelnr'], '-PR')}`, { artikel: `@{${art}?['hv_artikelnr']}`, hoeveelheid: "@variables('rest')", werf: "@{outputs('Werf')?['body/hv_werfnr']}", bedrag: `@mul(variables('rest'), float(${art}?['hv_eenheidsprijs']))` }), runAfter: ok("Tekort_markeren") },
            }, {}, ok("Per_depot")),
            Lijn_intern: dv("UpdateOnlyRecord", { entityName: S.hv_aanvraaglijn, recordId: `@${line}?['hv_aanvraaglijnid']`, "item/hv_waarde": "@outputs('Lijnwaarde')", "item/hv_tekort": "@variables('rest')", "item/hv_aankoop": "@variables('rest')", "item/hv_toewijzing": "@{if(empty(variables('toewijzing')), 'Geen voorraad: aankoop', variables('toewijzing'))}" }, ok("Tekort")),
          }, ok("Toewijzing_leeg", "Categorie_tellen")),
        },
      },
      ...Object.fromEntries(cats.map((c) => [`Budget_${c}`, { type: "Query", inputs: { from: "@outputs('Budgetten')?['body/value']", where: `@equals(item()?['hv_categorie'], ${c})` }, runAfter: ok("Per_lijn") }])),
      Budget_overschreden: compose(`@or(${cats.map((c) => `greater(variables('cat_${c}'), float(coalesce(first(body('Budget_${c}'))?['hv_budget'], 0)))`).join(", ")})`, ok(...cats.map((c) => `Budget_${c}`))),
      Route: compose(`@if(outputs('Budget_overschreden'), 'Projectleider>Afdelingsverantwoordelijke', if(greater(variables('waarde'), ${plMax}), 'Projectleider>Afdelingsverantwoordelijke', if(or(greater(variables('waarde'), ${autoMax}), variables('aankoop')), 'Projectleider', 'automatisch')))`, ok("Budget_overschreden")),
      Regel: compose(`@if(outputs('Budget_overschreden'), 'DT-03.1 budget overschreden', if(greater(variables('waarde'), ${plMax}), concat('DT-03.2 waarde > €', formatNumber(${plMax}, '#,0', 'nl-BE')), if(variables('aankoop'), 'DT-03.3 aankoop nodig', if(greater(variables('waarde'), ${autoMax}), concat('DT-03.3 waarde > €', formatNumber(${autoMax}, '#,0', 'nl-BE')), concat('DT-03.4 automatisch: ≤ €', formatNumber(${autoMax}, '#,0', 'nl-BE'), ', binnen budget, op voorraad')))))`, ok("Route")),
      Aanvraag_beslissen: dv("UpdateOnlyRecord", {
        entityName: S.hv_materiaalaanvraag, recordId: `@${t("hv_materiaalaanvraagid")}`,
        "item/hv_waarde": "@variables('waarde')", "item/hv_aankoopnodig": "@variables('aankoop')", "item/hv_budgetoverschreden": "@outputs('Budget_overschreden')",
        "item/hv_route": "@outputs('Route')", "item/hv_regel": "@outputs('Regel')", "item/hv_berichten": "@{string(variables('berichten'))}", "item/hv_goedkeuringsniveau": 0,
        "item/hv_spoed": `@less(div(sub(ticks(coalesce(${t("hv_leverenop")}, utcNow())), ticks(utcNow())), 36000000000), ${PX("SP-01")})`,
        "item/hv_status": `@if(equals(outputs('Route'), 'automatisch'), ${ST.req.goedgekeurd}, ${ST.req.terGoedkeuring})`,
      }, ok("Regel")),
    }, { ref: reqRef, onFail: reqFail(S) }),
  );
}

export function aanvraagGoedkeuren(S) {
  const F = "HV-MA-02";
  const upd = (status) => dv("UpdateOnlyRecord", { entityName: S.hv_materiaalaanvraag, recordId: `@${t("hv_materiaalaanvraagid")}`, "item/hv_status": status });
  const actions = approvalChain(S, {
    set: S.hv_materiaalaanvraag, idCol: "hv_materiaalaanvraagid", chainCol: "hv_route", levelCol: "hv_goedkeuringsniveau",
    title: `Materiaalaanvraag @{${reqRef}} — €@{formatNumber(float(${t("hv_waarde")}), 'N0', 'nl-BE')}`,
    details: `@{${t("hv_regel")}} · aanvrager @{${t("hv_aanvrager")}}`,
    after: () => ({}),
    approved: { Status: upd(ST.req.goedgekeurd) },
    rejected: { Status: upd(ST.req.afgewezen), Melding_werfleider: melding(S, F, { titel: `@{concat('Aanvraag ', ${reqRef}, ' afgewezen')}`, tekst: `@{concat(${t("hv_regel")}, '. Opmerking: ', coalesce(first(body('Goedkeuring')?['responses'])?['comments'], 'geen'))}`, rol: "Werfleider", soort: ST.soort.waarschuwing, ref: `@${reqRef}`, link: reqLink }, ok("Status")) },
    timedOut: { Melding_verlopen: melding(S, F, { titel: `@{concat('Goedkeuring aanvraag ', ${reqRef}, ' verlopen')}`, tekst: "Niemand antwoordde binnen 14 dagen. Zet de aanvraag opnieuw op Ter goedkeuring om te hervatten, of wijs ze af.", rol: "Afdelingsverantwoordelijke", soort: ST.soort.waarschuwing, ref: `@${reqRef}`, link: reqLink }) },
  });
  return definition({ Ter_goedkeuring: onStatus("hv_materiaalaanvraag", ST.req.terGoedkeuring) }, guarded(S, F, actions, { ref: reqRef, onFail: reqFail(S) }));
}

export function aanvraagUitvoeren(S) {
  const F = "HV-MA-03";
  const it = "items('Naar_outbox')";
  return definition(
    { Goedgekeurd: onStatus("hv_materiaalaanvraag", ST.req.goedgekeurd) },
    guarded(S, F, {
      Outboxfouten: init("outboxfouten", "integer", 0),
      Naar_outbox: {
        type: "Foreach", foreach: `@json(coalesce(${t("hv_berichten")}, '[]'))`, runAfter: ok("Outboxfouten"),
        actions: {
          Outbox_rij: outbox(S, `@if(equals(${it}?['endpoint'], 'reservations'), ${ST.endpoint.reservatie}, ${ST.endpoint.aankoop})`, `@${it}?['key']`, `@{string(${it}?['body'])}`, `@${reqRef}`, { "item/hv_Aanvraag@odata.bind": `/${S.hv_materiaalaanvraag}(@{${t("hv_materiaalaanvraagid")}})` }),
          ...countUnlessDuplicate("Outbox_rij"),
        },
      },
      ...stopIfCounted("Naar_outbox"),
      Melding_planning: melding(S, F, { titel: `@{concat('Levering inplannen: ', ${reqRef})}`, tekst: `@{concat('Goedgekeurd (', ${t("hv_regel")}, '). Leveren op ', ${t("hv_leverenop")}, '. Reservaties en aankoopaanvragen staan in de outbox.')}`, rol: "Werfplanning", soort: ST.soort.actie, ref: `@${reqRef}`, link: reqLink }, ok("Outbox_gelukt")),
      Melding_werfleider: melding(S, F, { titel: `@{concat('Aanvraag ', ${reqRef}, ' goedgekeurd')}`, tekst: `@{concat(${t("hv_regel")}, '. De werfplanning plant de levering.')}`, rol: "Werfleider", ref: `@${reqRef}`, link: reqLink }, ok("Outbox_gelukt")),
    }, { ref: reqRef }),
  );
}

export function ontvangstVerbruik(S) {
  const F = "HV-MA-04";
  const l = "items('Per_lijn')";
  return definition(
    { Ontvangen: onStatus("hv_materiaalaanvraag", ST.req.ontvangen) },
    guarded(S, F, {
      Werf: dv("GetItem", { entityName: S.hv_werf, recordId: `@${t("_hv_werf_value")}`, $select: "hv_werfnr" }),
      Lijnen: dv("ListRecords", { entityName: S.hv_aanvraaglijn, $filter: `_hv_aanvraag_value eq @{${t("hv_materiaalaanvraagid")}}`, $expand: "hv_Artikel($select=hv_artikelnr)" }),
      Outboxfouten: init("outboxfouten", "integer", 0),
      Per_lijn: {
        type: "Foreach", foreach: "@outputs('Lijnen')?['body/value']", runAfter: ok("Werf", "Lijnen", "Outboxfouten"),
        actions: {
          Verbruik_naar_outbox: outbox(S, ST.endpoint.verbruik, `@{concat('gi-', ${reqRef}, '-', ${l}?['hv_Artikel']?['hv_artikelnr'])}`, `@{string(json(concat('{"artikel":"', ${l}?['hv_Artikel']?['hv_artikelnr'], '","hoeveelheid":', string(${l}?['hv_hoeveelheid']), ',"werf":"', outputs('Werf')?['body/hv_werfnr'], '","aanvraag":"', ${reqRef}, '","bedrag":', string(coalesce(${l}?['hv_waarde'], 0)), '}')))}`, `@${reqRef}`, { "item/hv_Aanvraag@odata.bind": `/${S.hv_materiaalaanvraag}(@{${t("hv_materiaalaanvraagid")}})` }),
          ...countUnlessDuplicate("Verbruik_naar_outbox"),
        },
      },
      ...stopIfCounted("Per_lijn"),
    }, { ref: reqRef, onFail: reqFail(S) }),
  );
}

// ============================================================================ integration and operations
export function outboxVerzenden(S) {
  const F = "HV-IN-01";
  const it = "items('Per_bericht')";
  const erpUp = "parameters('ERP-sandbox bereikbaar (hv_ErpBeschikbaar)')";
  return definition(
    { Elke_5_minuten: every("Minute", 5) },
    guarded(S, F, {
      Klaar: dv("ListRecords", { entityName: S.hv_outbox, $filter: `hv_status eq ${ST.outbox.wachtend} and hv_volgendepoging le @{utcNow()}`, $orderby: "createdon asc", $top: 50 }),
      Per_bericht: {
        type: "Foreach", foreach: "@outputs('Klaar')?['body/value']", runAfter: ok("Klaar"),
        runtimeConfiguration: { concurrency: { repetitions: 1 } },
        actions: {
          ERP_bereikbaar: iff({ equals: [`@${erpUp}`, true] }, {
            // the ERP sandbox: one booking per idempotency key (alternate key), the type follows the endpoint
            ERP_boeking: dv("CreateRecord", { entityName: S.hv_erpboeking, "item/hv_idempotencykey": `@${it}?['hv_idempotencykey']`, "item/hv_soort": `@${it}?['hv_endpoint']`, "item/hv_payload": `@${it}?['hv_body']`, "item/hv_referentie": `@${it}?['hv_referentie']`, "item/hv_bedrag": `@float(coalesce(json(${it}?['hv_body'])?['bedrag'], 0))` }),
            Reservatie: iff({ equals: [`@${it}?['hv_endpoint']`, ST.endpoint.reservatie] }, {
              Voorraad: dv("ListRecords", { entityName: S.hv_voorraad, $filter: `hv_naam eq '@{json(${it}?['hv_body'])?['voorraad']}'`, $top: 1 }),
              Reserveren: dv("UpdateOnlyRecord", { entityName: S.hv_voorraad, recordId: "@first(outputs('Voorraad')?['body/value'])?['hv_voorraadid']", "item/hv_gereserveerd": `@add(float(coalesce(first(outputs('Voorraad')?['body/value'])?['hv_gereserveerd'], 0)), float(json(${it}?['hv_body'])?['hoeveelheid']))` }, ok("Voorraad")),
            }, {}, ok("ERP_boeking")),
            Verzonden: dv("UpdateOnlyRecord", { entityName: S.hv_outbox, recordId: `@${it}?['hv_outboxid']`, "item/hv_status": ST.outbox.verzonden, "item/hv_pogingen": `@add(coalesce(${it}?['hv_pogingen'], 0), 1)`, "item/hv_laatstefout": "@{if(equals(actions('ERP_boeking')?['status'], 'Succeeded'), '201 geboekt', '200 al geboekt (idempotent)')}" }, any("Reservatie")),
          }, {
            Nog_pogingen: iff({ less: [`@coalesce(${it}?['hv_pogingen'], 0)`, 5] }, {
              Opnieuw_plannen: dv("UpdateOnlyRecord", { entityName: S.hv_outbox, recordId: `@${it}?['hv_outboxid']`, "item/hv_pogingen": `@add(coalesce(${it}?['hv_pogingen'], 0), 1)`, "item/hv_volgendepoging": `@addMinutes(utcNow(), createArray(1, 5, 15, 60, 240)[coalesce(${it}?['hv_pogingen'], 0)])`, "item/hv_laatstefout": "503 ERP niet bereikbaar (sandbox uitgeschakeld via hv_ErpBeschikbaar)" }),
            }, {
              Dead_letter: dv("UpdateOnlyRecord", { entityName: S.hv_outbox, recordId: `@${it}?['hv_outboxid']`, "item/hv_status": ST.outbox.dead, "item/hv_pogingen": `@add(coalesce(${it}?['hv_pogingen'], 0), 1)`, "item/hv_laatstefout": "Dead-letter na 6 pogingen — functioneel beheer verwittigd (runbook)" }),
              Melding_dead_letter: melding(S, F, { titel: `@{concat('ERP-bericht in dead-letter: ', ${it}?['hv_idempotencykey'])}`, tekst: `@{concat('Zes pogingen mislukt voor ', ${it}?['hv_referentie'], '. Volg het runbook: oorzaak herstellen, daarna status op Wachtend en pogingen op 0.')}`, rol: "Functioneel beheer", soort: ST.soort.fout, ref: `@${it}?['hv_referentie']`, link: recordLink("hv_outbox", `${it}?['hv_outboxid']`) }, ok("Dead_letter")),
            }),
          }),
        },
      },
    }),
    { "ERP-sandbox bereikbaar (hv_ErpBeschikbaar)": { defaultValue: true, type: "Bool", metadata: { schemaName: "hv_ErpBeschikbaar" } } },
  );
}

export function erpBevestiging(S) {
  const F = "HV-IN-02";
  const idem = `contains(coalesce(${t("hv_laatstefout")}, ''), 'al geboekt')`;
  return definition(
    { Bericht_verzonden: onStatus("hv_outbox", ST.outbox.verzonden) },
    guarded(S, F, {
      Volgens_endpoint: {
        type: "Switch", runAfter: {}, expression: `@${t("hv_endpoint")}`,
        cases: {
          Weegticket: {
            case: ST.endpoint.weegticket,
            actions: { Weegbon_geboekt: dv("UpdateOnlyRecord", { entityName: S.hv_document, recordId: `@${t("_hv_weegbon_value")}`, "item/hv_status": ST.doc.geboekt, "item/hv_erpreferentie": `@{if(${idem}, concat(${t("hv_idempotencykey")}, ' (al geboekt, idempotent)'), ${t("hv_idempotencykey")})}` }) },
          },
          Projectkost: {
            case: ST.endpoint.projectkost,
            actions: { Tijdlijn_geboekt: timeline(S, "kosten geboekt op project (ERP)", "Power Automate (HV-IN-02)", `@{concat(${t("hv_idempotencykey")}, ' · ', coalesce(${t("hv_laatstefout")}, ''))}`, {}, t("_hv_schadeclaim_value")) },
          },
          Verbruik: {
            case: ST.endpoint.verbruik,
            actions: {
              Nog_open: dv("ListRecords", { entityName: S.hv_outbox, $filter: `_hv_aanvraag_value eq @{${t("_hv_aanvraag_value")}} and hv_endpoint eq ${ST.endpoint.verbruik} and hv_status ne ${ST.outbox.verzonden}`, $top: 1 }),
              Alles_geboekt: iff({ equals: ["@length(outputs('Nog_open')?['body/value'])", 0] }, {
                Aanvraag_afgesloten: dv("UpdateOnlyRecord", { entityName: S.hv_materiaalaanvraag, recordId: `@${t("_hv_aanvraag_value")}`, "item/hv_status": ST.req.afgesloten }),
              }, {}, ok("Nog_open")),
            },
          },
        },
        default: { actions: {} },
      },
    }, { ref: t("hv_idempotencykey") }),
  );
}

export function meldingenVersturen(S) {
  const status = (s, extra = {}, runAfter = {}) => dv("UpdateOnlyRecord", { entityName: S.hv_melding, recordId: `@${t("hv_meldingid")}`, "item/hv_status": s, ...extra }, runAfter);
  const icon = `@if(equals(${t("hv_soort")}, ${ST.soort.fout}), 100000002, if(equals(${t("hv_soort")}, ${ST.soort.waarschuwing}), 100000003, if(equals(${t("hv_soort")}, ${ST.soort.actie}), 100000004, 100000000)))`;
  return definition(
    { Melding_aangemaakt: trigger("hv_melding", 1) },
    {
      Kanaal: iff({ equals: [`@${t("hv_kanaal")}`, ST.kanaal.inapp] }, {
        Rol: dv("ListRecords", { entityName: S.hv_goedkeurder, $filter: `hv_rol eq '@{${t("hv_rol")}}'`, $top: 1 }),
        Gebruiker: dv("ListRecords", { entityName: "systemusers", $select: "systemuserid", $filter: `internalemailaddress eq '@{first(outputs('Rol')?['body/value'])?['hv_email']}' and isdisabled eq false`, $top: 1 }, ok("Rol")),
        Gevonden: iff({ greater: ["@length(outputs('Gebruiker')?['body/value'])", 0] }, {
          // in-app notification in the model-driven app (bell icon); in production also Teams or mail for urgent ones
          Notificatie: dv("CreateRecord", {
            entityName: "appnotifications", "item/title": `@{${t("hv_titel")}}`, "item/body": `@{coalesce(${t("hv_tekst")}, '')}`,
            "item/ownerid@odata.bind": "/systemusers(@{first(outputs('Gebruiker')?['body/value'])?['systemuserid']})",
            "item/icontype": icon, "item/toasttype": 200000000, "item/ttlinseconds": 1209600,
            "item/data": `@if(empty(coalesce(${t("hv_link")}, '')), null, string(json(concat('{"actions":[{"title":"Openen","data":{"url":"', ${t("hv_link")}, '","navigationTarget":"newWindow"}}]}'))))`,
          }),
          Verstuurd: status(ST.melding.verstuurd, {}, ok("Notificatie")),
        }, {
          Geen_gebruiker: status(ST.melding.mislukt, { "item/hv_tekst": `@{concat(coalesce(${t("hv_tekst")}, ''), ' [Niet verstuurd: geen actieve gebruiker voor rol ', ${t("hv_rol")}, ' in Goedkeurders.]')}` }),
        }, ok("Gebruiker")),
      }, {
        // external parties (insurer, carrier, utility owner): the channel is not connected in the demo environment
        Extern: status(ST.melding.extern),
      }),
      Bij_fout: { ...status(ST.melding.mislukt), runAfter: { Kanaal: ["Failed", "TimedOut"] } },
    },
  );
}

/** Flow catalogue: id, name, builder, and what a reviewer needs for the inventory (flows/README.md). */
export const FLOWS = [
  { id: "HV-DI-01", name: "HV-DI-01 Weegbon controleren", build: weegbonControleren, case: "01", owner: "Administratie recyclage", in: "Weegbon toegevoegd (status Ontvangen)", out: "In wachtrij ERP · Nazicht · Escalatie · Dubbel", bpmn: ["c1_tobe:t3", "c1_tobe:t4"], description: "Case 01: elf regels R01–R11 op elke nieuwe weegbon; een schone bon gaat naar de ERP-outbox, de rest naar nazicht, escalatie of dubbel, met een melding." },
  { id: "HV-DI-02", name: "HV-DI-02 Weegbon na nazicht boeken", build: weegbonNaNazicht, case: "01", owner: "Administratie recyclage", in: "Goedgekeurd (Weegbon Nakijken)", out: "In wachtrij ERP · Escalatie · Dubbel", bpmn: ["c1_tobe:t4"], description: "Case 01: een goedgekeurde weegbon opnieuw controleren (dubbel, geweigerd materiaal) en de gecorrigeerde waarden in de ERP-outbox zetten." },
  { id: "HV-DI-03", name: "HV-DI-03 Weigering melden", build: weigeringMelden, case: "01", owner: "Milieucoördinator", in: "Afgewezen", out: "Meldingen aan klant en vervoerder", bpmn: ["c1_tobe:t7"], description: "Case 01: bij een geweigerde lading de klant en de vervoerder verwittigen, met de reden." },
  { id: "HV-CL-01", name: "HV-CL-01 Schadeclaim intake en triage", build: schadeclaimIntake, case: "02", owner: "Claims & verzekeringen", in: "Schadeclaim gemeld", out: "In beoordeling (+ aangifte-concept)", bpmn: ["c2_tobe:t2", "c2_tobe:t3", "c2_tobe:t5", "c2_tobe:t7"], description: "Case 02: ernst, eigenaar, DT-02-keten, deadlines, aangifte-concept, tijdlijn en meldingen bij een nieuwe schademelding." },
  { id: "HV-CL-02", name: "HV-CL-02 Schadeclaim goedkeuringsketen", build: schadeclaimGoedkeuring, case: "02", owner: "Claims & verzekeringen", in: "Ter goedkeuring", out: "Goedgekeurd · Afgewezen · terug In beoordeling (verlopen)", bpmn: ["c2_tobe:t8"], description: "Case 02: goedkeuring per niveau via Approvals; één afwijzing stopt de keten; de werfleider hoort de uitkomst." },
  { id: "HV-CL-03", name: "HV-CL-03 SLA- en aangiftebewaking", build: deadlineBewaking, case: "02", owner: "Claims & verzekeringen", in: "elk uur", out: "Geëscaleerd · aangifte gewaarschuwd", bpmn: ["c2_tobe:t5"], description: "Case 02: elk uur te late beoordelingen escaleren en waarschuwen als de aangifte bij de verzekeraar te laat dreigt te vertrekken." },
  { id: "HV-CL-04", name: "HV-CL-04 Schadeclaim afsluiten: kosten en recuperatie", build: schadeclaimAfsluiten, case: "02", owner: "Claims & verzekeringen", in: "Afgesloten", out: "Projectkost in de outbox · recuperatie gestart", bpmn: ["c2_tobe:t11"], description: "Case 02: bij afsluiten de kost op het project boeken (via de outbox) en de recuperatie bij een aansprakelijke derde starten." },
  { id: "HV-MA-01", name: "HV-MA-01 Materiaalaanvraag verwerken en beslissen", build: aanvraagVerwerken, case: "03", owner: "Werfplanning", in: "Ingediend", out: "Goedgekeurd (DT-03.4) · Ter goedkeuring", bpmn: ["c3_tobe:t2", "c3_tobe:t3"], description: "Case 03: voorraad per depot (dichtste eerst), budget per categorie, spoed en DT-03; de ERP-berichten worden gepland, nog niet verstuurd." },
  { id: "HV-MA-02", name: "HV-MA-02 Materiaalaanvraag goedkeuren", build: aanvraagGoedkeuren, case: "03", owner: "Afdelingsverantwoordelijke", in: "Ter goedkeuring", out: "Goedgekeurd · Afgewezen", bpmn: ["c3_tobe:t4"], description: "Case 03: goedkeuring per niveau van de DT-03-route via Approvals, net als de schadeclaims." },
  { id: "HV-MA-03", name: "HV-MA-03 Materiaalaanvraag uitvoeren", build: aanvraagUitvoeren, case: "03", owner: "Werfplanning", in: "Goedgekeurd", out: "Reservaties en aankoopaanvragen in de outbox", bpmn: ["c3_tobe:t6"], description: "Case 03: de geplande ERP-berichten in de outbox zetten en de werfplanning en de werfleider verwittigen." },
  { id: "HV-MA-04", name: "HV-MA-04 Ontvangst: verbruik boeken", build: ontvangstVerbruik, case: "03", owner: "Werfplanning", in: "Ontvangen (werfapp)", out: "Verbruik in de outbox → Afgesloten", bpmn: ["c3_tobe:t13"], description: "Case 03: na de ontvangstbevestiging op de werf het verbruik per lijn op de werf boeken, via de outbox." },
  { id: "HV-IN-01", name: "HV-IN-01 ERP-outbox verzenden", build: outboxVerzenden, case: "alle", owner: "Functioneel beheer", in: "elke 5 minuten", out: "Verzonden · nieuwe poging · Dead-letter", bpmn: ["c1_tobe:t4", "c2_tobe:t11", "c3_tobe:t6", "c3_tobe:t13"], description: "Alle cases: elk ERP-bericht naar de ERP-sandbox, met retry 1-5-15-60-240 min, dead-letter met melding en idempotency-key." },
  { id: "HV-IN-02", name: "HV-IN-02 ERP-bevestiging terugschrijven", build: erpBevestiging, case: "alle", owner: "Functioneel beheer", in: "Outbox-bericht Verzonden", out: "Weegbon Geboekt · tijdlijn kost geboekt · aanvraag Afgesloten", bpmn: ["c1_tobe:t4", "c2_tobe:t11", "c3_tobe:t13"], description: "Alle cases: na een geslaagde ERP-boeking de bron bijwerken: weegbon geboekt, kost in de tijdlijn, aanvraag afgesloten." },
  { id: "HV-OP-01", name: "HV-OP-01 Meldingen versturen", build: meldingenVersturen, case: "alle", owner: "Functioneel beheer", in: "Melding aangemaakt", out: "Verstuurd · Extern niet aangesloten · Mislukt", bpmn: ["c1_tobe:t7", "c2_tobe:t3"], description: "Alle cases: elke melding naar de juiste persoon als in-app-notificatie in de backoffice; externe partijen worden gemarkeerd (kanaal niet aangesloten in de demo)." },
];

/** BPMN tasks that are automated in the TO-BE but deliberately not built, with the reason. */
export const NOT_BUILT = {
  "c1_tobe:t1": "Postvak en scanmap zijn niet aangesloten: de bonnen staan in Dataverse alsof ze binnenkwamen.",
  "c1_tobe:t2": "De AI-extractie is gesimuleerd (data/documents.json). Een echte AI Builder-intake vraagt capaciteit in de omgeving.",
  "c1_tobe:t8": "Archiveren in een documentbeheersysteem is niet gebouwd; de Dataverse-rij met bevindingen en correcties is het auditspoor en de KPI-bron.",
};
