// Sets the current value of an environment variable, e.g. node set-env.mjs hv_ErpBeschikbaar no
import { get, post, patch } from "./dv.mjs";
const [schema, value] = process.argv.slice(2);
const def = (await get(`environmentvariabledefinitions?$select=environmentvariabledefinitionid&$filter=schemaname eq '${schema}'`)).json.value[0];
const cur = (await get(`environmentvariablevalues?$select=environmentvariablevalueid&$filter=_environmentvariabledefinitionid_value eq ${def.environmentvariabledefinitionid}`)).json.value[0];
if (cur) await patch(`environmentvariablevalues(${cur.environmentvariablevalueid})`, { value });
else await post("environmentvariablevalues", { schemaname: `${schema}_value`, value, "EnvironmentVariableDefinitionId@odata.bind": `/environmentvariabledefinitions(${def.environmentvariabledefinitionid})` });
console.log(`${schema} = ${value}`);
