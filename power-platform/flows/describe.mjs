// Turns a flow definition from definitions.mjs into a readable step list (Markdown), in the order the
// flow runs them. scripts/build.mjs writes it between <!--actions:HV-XX-NN-->…<!--/actions--> in the
// flow specs, so the technical part of every spec always matches the deployed definition.

const MESSAGE = { 1: "rij toegevoegd", 2: "rij verwijderd", 3: "rij gewijzigd", 4: "rij toegevoegd of gewijzigd" };
const OPERATION = {
  ListRecords: "rijen opzoeken in",
  GetItem: "één rij ophalen uit",
  CreateRecord: "rij toevoegen in",
  UpdateOnlyRecord: "rij bijwerken in",
};
const VARIABLE = {
  InitializeVariable: "variabele aanmaken",
  SetVariable: "variabele zetten",
  IncrementVariable: "variabele verhogen",
  DecrementVariable: "variabele verlagen",
  AppendToArrayVariable: "bericht toevoegen aan lijst",
  AppendToStringVariable: "tekst toevoegen aan",
};
const UNIT = { Minute: ["elke minuut", "minuten"], Hour: ["elk uur", "uur"], Day: ["elke dag", "dagen"] };

/** Logical table name (hv_klant) from the entity set name the flows use (hv_klants). */
const tableOf = (set, tables) => tables.find((t) => `${t.name}s` === set) ?? { name: set, display: set };
const columns = (params) => Object.keys(params).filter((k) => k.startsWith("item/")).map((k) => `\`${k.slice(5).replace(/@odata\.bind$/, "")}\``);

/** Actions of one scope in run order: an action comes after everything in its runAfter, ties keep source order. */
export function runOrder(actions) {
  const names = Object.keys(actions);
  const done = new Set();
  const out = [];
  while (out.length < names.length) {
    const next = names.find((n) => !done.has(n) && Object.keys(actions[n].runAfter ?? {}).every((d) => done.has(d)));
    if (!next) throw new Error(`cycle in runAfter: ${names.filter((n) => !done.has(n)).join(", ")}`);
    done.add(next);
    out.push(next);
  }
  return out;
}

function triggerLine(name, t, tables) {
  if (t.type === "Recurrence") {
    const { frequency, interval } = t.recurrence;
    const [one, many] = UNIT[frequency] ?? [frequency, frequency];
    return `**Trigger \`${name}\`**: schema, ${interval === 1 ? one : `elke ${interval} ${many}`}`;
  }
  const p = t.inputs.parameters;
  const table = tableOf(p["subscriptionRequest/entityname"] + "s", tables);
  const extra = [];
  if (p["subscriptionRequest/filteringattributes"]) extra.push(`alleen bij wijziging van \`${p["subscriptionRequest/filteringattributes"]}\``);
  if (p["subscriptionRequest/filterexpression"]) extra.push(`voorwaarde \`${p["subscriptionRequest/filterexpression"]}\``);
  return `**Trigger \`${name}\`**: Dataverse, ${MESSAGE[p["subscriptionRequest/message"]]} in *${table.display}* (\`${table.name}\`)${extra.length ? `; ${extra.join(", ")}` : ""}`;
}

function label(a, tables) {
  if (a.type === "OpenApiConnection") {
    const p = a.inputs.parameters;
    const table = tableOf(p.entityName, tables);
    const base = `${OPERATION[a.inputs.host.operationId] ?? a.inputs.host.operationId} *${table.display}*`;
    const cols = columns(p);
    if (cols.length) return `${base}: ${cols.join(", ")}`;
    if (p.$top === 1) return `${base} (eerste treffer)`;
    return base;
  }
  if (a.type === "OpenApiConnectionWebhook" && a.inputs.host.operationId === "StartAndWaitForAnApproval") return "goedkeuring vragen via Approvals en wachten op het antwoord";
  if (a.type === "Compose") return "berekening";
  if (a.type === "Query") return "lijst filteren";
  if (a.type === "Select") return "lijst omzetten";
  if (a.type === "Terminate") return `run stoppen (status ${a.inputs.runStatus})`;
  if (a.type in VARIABLE) {
    const v = a.inputs.variables?.[0] ?? a.inputs;
    return `${VARIABLE[a.type]} \`${v.name}\`${v.type ? ` (${v.type})` : ""}`;
  }
  if (a.type === "If") return "voorwaarde";
  if (a.type === "Switch") return "keuze";
  if (a.type === "Foreach") return `voor elk item${a.runtimeConfiguration?.concurrency?.repetitions === 1 ? ", één voor één" : ""}`;
  if (a.type === "Until") return `herhalen tot de voorwaarde klopt (max. ${a.limit.count} keer, time-out ${a.limit.timeout.replace(/^P(\d+)D$/, "$1 dagen")})`;
  return a.type;
}

function runAfterNote(a) {
  const deps = Object.entries(a.runAfter ?? {});
  const lenient = deps.filter(([, s]) => s.length > 1).map(([d]) => `\`${d}\``);
  return lenient.length ? ` · loopt ook als ${lenient.join(", ")} faalt (bewust: idempotentie)` : "";
}

function lines(actions, tables, depth) {
  const pad = "  ".repeat(depth);
  const order = runOrder(actions);
  const parallel = order.filter((n) => Object.keys(actions[n].runAfter ?? {}).length === 0).length > 1;
  const out = [];
  for (const name of order) {
    const a = actions[name];
    const start = parallel && Object.keys(a.runAfter ?? {}).length === 0 ? " · start parallel" : "";
    out.push(`${pad}- \`${name}\`: ${label(a, tables)}${start}${runAfterNote(a)}`);
    if (a.type === "If") {
      out.push(`${pad}  - als waar:`, ...(Object.keys(a.actions).length ? lines(a.actions, tables, depth + 2) : [`${pad}    - niets`]));
      if (Object.keys(a.else?.actions ?? {}).length) out.push(`${pad}  - anders:`, ...lines(a.else.actions, tables, depth + 2));
    } else if (a.type === "Switch") {
      for (const [cn, c] of Object.entries(a.cases)) out.push(`${pad}  - geval \`${c.case}\` (${cn}):`, ...lines(c.actions, tables, depth + 2));
      if (Object.keys(a.default?.actions ?? {}).length) out.push(`${pad}  - anders:`, ...lines(a.default.actions, tables, depth + 2));
    } else if (a.actions) {
      out.push(...lines(a.actions, tables, depth + 1));
    }
  }
  return out;
}

/** Count of actions at every depth (the trigger not included). */
export function countActions(actions) {
  let n = 0;
  for (const a of Object.values(actions)) {
    n += 1;
    if (a.actions) n += countActions(a.actions);
    if (a.else?.actions) n += countActions(a.else.actions);
    if (a.cases) for (const c of Object.values(a.cases)) n += countActions(c.actions);
    if (a.default?.actions) n += countActions(a.default.actions);
  }
  return n;
}

/** Markdown step list for one flow definition. */
export function describeFlow(def, tables) {
  const [tname, trigger] = Object.entries(def.triggers)[0];
  const params = Object.entries(def.parameters).filter(([k]) => !k.startsWith("$")).map(([, v]) => `\`${v.metadata.schemaName}\` (standaard ${v.defaultValue})`);
  const connections = [...new Set([...JSON.stringify(def).matchAll(/"connectionName":"([^"]+)"/g)].map((m) => m[1]))].map((c) => ({ shared_commondataserviceforapps: "Microsoft Dataverse", shared_approvals: "Approvals" })[c] ?? c);
  return [
    `*Gegenereerd uit [\`definitions.mjs\`](definitions.mjs) door \`npm run build\`. Niet met de hand aanpassen.* ${countActions(def.actions)} acties · verbindingen: ${connections.join(", ")} · omgevingsvariabelen: ${params.length ? params.join(", ") : "geen"}.`,
    "",
    `- ${triggerLine(tname, trigger, tables)}`,
    ...lines(def.actions, tables, 0),
  ].join("\n");
}
