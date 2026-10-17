// Creates publisher, solution, tables, columns, lookups, alternate keys and environment variables
// from ../model.json. Idempotent: existing components are skipped, so it can be re-run safely.
import { readFileSync } from "node:fs";
import { CONFIG, label, get, post, idFrom } from "./dv.mjs";

const model = JSON.parse(readFileSync(new URL("../model.json", import.meta.url)));
const P = CONFIG.publisher;
const schemaName = (logical) => logical.replace(/^hv_/, "hv_").replace(/_([a-z])/, (_m, c) => `_${c.toUpperCase()}`);
const log = (...a) => console.log(...a);

async function ensurePublisher() {
  const found = await get(`publishers?$select=publisherid&$filter=uniquename eq '${P.uniquename}'`, { solution: null });
  if (found.json.value.length) return found.json.value[0].publisherid;
  const res = await post("publishers", { uniquename: P.uniquename, friendlyname: P.friendlyname, customizationprefix: P.prefix, customizationoptionvalueprefix: P.optionPrefix, description: "Fictieve uitgever voor de portfolio construction-digital-transformation." }, { solution: null });
  log("publisher created");
  return idFrom(res);
}

async function ensureSolution(publisherId) {
  const found = await get(`solutions?$select=solutionid&$filter=uniquename eq '${CONFIG.solution}'`, { solution: null });
  if (found.json.value.length) return;
  await post("solutions", { uniquename: CONFIG.solution, friendlyname: "Halverdijk transformatie (portfolio)", version: "1.0.0.0", description: "Drie digitaliseringscases voor de fictieve Halverdijk Group: weegbonnen, schadeclaims, materiaalaanvragen. Bron: github.com/phlppgdfry/construction-digital-transformation", "publisherid@odata.bind": `/publishers(${publisherId})` }, { solution: null });
  log("solution created");
}

async function tableExists(name) {
  const r = await get(`EntityDefinitions(LogicalName='${name}')?$select=LogicalName`, { allow: [404] });
  return r.status === 200;
}
async function attributeExists(table, name) {
  const r = await get(`EntityDefinitions(LogicalName='${table}')/Attributes(LogicalName='${name}')?$select=LogicalName`, { allow: [404] });
  return r.status === 200;
}

function attributeMetadata([name, type, display, extra]) {
  const base = { SchemaName: schemaName(name), DisplayName: label(display), RequiredLevel: { Value: "None", CanBeChanged: true, ManagedPropertyLogicalName: "canmodifyrequirementlevelsettings" } };
  switch (type) {
    case "text": return { "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata", ...base, MaxLength: extra ?? 100, FormatName: { Value: "Text" } };
    case "memo": return { "@odata.type": "Microsoft.Dynamics.CRM.MemoAttributeMetadata", ...base, MaxLength: extra ?? 2000, Format: "TextArea" };
    case "int": return { "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata", ...base, MinValue: -2147483648, MaxValue: 2147483647, Format: "None" };
    case "decimal": return { "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata", ...base, Precision: 2, MinValue: -100000000000, MaxValue: 100000000000 };
    case "bool": return { "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata", ...base, DefaultValue: false, OptionSet: { TrueOption: { Value: 1, Label: label("Ja") }, FalseOption: { Value: 0, Label: label("Nee") } } };
    case "datetime": return { "@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata", ...base, Format: "DateAndTime", DateTimeBehavior: { Value: "UserLocal" } };
    case "date": return { "@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata", ...base, Format: "DateOnly", DateTimeBehavior: { Value: "DateOnly" } };
    case "image": return { "@odata.type": "Microsoft.Dynamics.CRM.ImageAttributeMetadata", SchemaName: schemaName(name), DisplayName: label(display), RequiredLevel: { Value: "None" }, CanStoreFullImage: true, IsPrimaryImage: false, MaxSizeInKB: 10240 };
    case "choice": {
      const options = typeof extra === "string" ? model.choices[extra] : extra;
      return { "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata", ...base, OptionSet: { "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata", IsGlobal: false, OptionSetType: "Picklist", Options: Object.entries(options).map(([v, l]) => ({ Value: Number(v), Label: label(l) })) } };
    }
    default: throw new Error(`unknown type ${type}`);
  }
}

async function ensureTable(t) {
  if (await tableExists(t.name)) { log(`table ${t.name} exists`); return; }
  const [pName, pDisplay, auto] = t.primary;
  const primary = { "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata", SchemaName: schemaName(pName), IsPrimaryName: true, MaxLength: 100, FormatName: { Value: "Text" }, DisplayName: label(pDisplay), RequiredLevel: { Value: auto ? "None" : "ApplicationRequired" }, ...(auto ? { AutoNumberFormat: auto } : {}) };
  await post("EntityDefinitions", {
    "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
    SchemaName: schemaName(t.name), DisplayName: label(t.display), DisplayCollectionName: label(t.plural),
    Description: label(`${t.display} — Halverdijk portfolio (fictief)`), OwnershipType: t.ownership, IsActivity: false, HasActivities: false, HasNotes: t.name === "hv_schadeclaim",
    Attributes: [primary],
  });
  log(`table ${t.name} created`);
}

async function ensureColumns(t) {
  for (const col of t.columns ?? []) {
    if (await attributeExists(t.name, col[0])) continue;
    await post(`EntityDefinitions(LogicalName='${t.name}')/Attributes`, attributeMetadata(col));
    log(`  + ${t.name}.${col[0]}`);
  }
}

// New options in an existing choice column (e.g. a status "Fout" added later): InsertOptionValue.
async function ensureOptions(t) {
  for (const [name, type, , extra] of t.columns ?? []) {
    if (type !== "choice" || typeof extra === "string") continue;
    const attr = await get(`EntityDefinitions(LogicalName='${t.name}')/Attributes(LogicalName='${name}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`);
    const have = new Set(attr.json.OptionSet.Options.map((o) => o.Value));
    for (const [value, text] of Object.entries(extra)) {
      if (have.has(Number(value))) continue;
      await post("InsertOptionValue", { EntityLogicalName: t.name, AttributeLogicalName: name, Value: Number(value), Label: label(text), SolutionUniqueName: CONFIG.solution });
      log(`  + option ${t.name}.${name} ${value} ${text}`);
    }
  }
}

async function ensureLookups(t) {
  for (const [name, target, display] of t.lookups ?? []) {
    if (await attributeExists(t.name, name)) continue;
    await post("RelationshipDefinitions", {
      "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
      SchemaName: `hv_${target.replace(/^hv_/, "")}_${t.name.replace(/^hv_/, "")}_${name.replace(/^hv_/, "")}`,
      ReferencedEntity: target, ReferencingEntity: t.name,
      CascadeConfiguration: { Assign: "NoCascade", Delete: target === "hv_schadeclaim" || target === "hv_materiaalaanvraag" ? "Cascade" : "RemoveLink", Merge: "NoCascade", Reparent: "NoCascade", Share: "NoCascade", Unshare: "NoCascade" },
      Lookup: { "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata", AttributeType: "Lookup", AttributeTypeName: { Value: "LookupType" }, SchemaName: schemaName(name), DisplayName: label(display), RequiredLevel: { Value: "None" } },
    });
    log(`  ↳ lookup ${t.name}.${name} → ${target}`);
  }
}

async function ensureKeys(t) {
  for (const attrs of t.keys ?? []) {
    const keyName = `${t.name}_${attrs.join("_").replace(/hv_/g, "")}_key`;
    const existing = await get(`EntityDefinitions(LogicalName='${t.name}')/Keys?$select=LogicalName`);
    if (existing.json.value.some((k) => k.LogicalName === keyName)) continue;
    await post(`EntityDefinitions(LogicalName='${t.name}')/Keys`, { SchemaName: keyName, DisplayName: label(`Sleutel ${attrs.join(", ")}`), KeyAttributes: attrs });
    log(`  ⚿ key ${keyName}`);
  }
}

async function ensureEnvironmentVariables() {
  const TYPES = { string: 100000000, decimal: 100000001, boolean: 100000002 };
  for (const v of model.environmentVariables) {
    const found = await get(`environmentvariabledefinitions?$select=environmentvariabledefinitionid&$filter=schemaname eq '${v.schemaName}'`);
    if (found.json.value.length) continue;
    const def = await post("environmentvariabledefinitions", { schemaname: v.schemaName, displayname: v.display, type: TYPES[v.type], defaultvalue: v.value, description: "Halverdijk portfolio — drempel of schakelaar, aanpasbaar zonder release." });
    log(`  env var ${v.schemaName}`, idFrom(def) ? "ok" : "");
  }
}

const publisherId = await ensurePublisher();
await ensureSolution(publisherId);
for (const t of model.tables) await ensureTable(t);
for (const t of model.tables) { await ensureColumns(t); await ensureOptions(t); }
for (const t of model.tables) { await ensureLookups(t); }
for (const t of model.tables) { await ensureKeys(t); }
await ensureEnvironmentVariables();
await post("PublishAllXml", {});
log("published");
