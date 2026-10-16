// Minimal Dataverse Web API client for the provisioning scripts.
// Token: Azure CLI, signed in as the environment's maker (az login --tenant <tenant>).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const CONFIG = JSON.parse(readFileSync(new URL("../environment.json", import.meta.url)));
// The tenant id stays out of git: environment.local.json (ignored) or HV_TENANT_ID.
try { Object.assign(CONFIG, JSON.parse(readFileSync(new URL("../environment.local.json", import.meta.url)))); } catch { /* optional */ }
if (process.env.HV_TENANT_ID) CONFIG.tenantId = process.env.HV_TENANT_ID;
const BASE = `${CONFIG.url.replace(/\/$/, "")}/api/data/v9.2`;
let token = null;
let tokenAt = 0;

function getToken() {
  if (!token || Date.now() - tokenAt > 40 * 60_000) {
    token = execSync(`az account get-access-token --tenant ${CONFIG.tenantId} --resource ${CONFIG.url.replace(/\/$/, "")} --query accessToken -o tsv`, { encoding: "utf8" }).trim();
    tokenAt = Date.now();
  }
  return token;
}

export const label = (text) => ({ "@odata.type": "Microsoft.Dynamics.CRM.Label", LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: text, LanguageCode: 1033 }] });

export async function api(method, path, body, { solution = CONFIG.solution, headers = {}, allow = [] } = {}) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const res = await fetch(path.startsWith("http") ? path : `${BASE}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        ...(solution ? { "MSCRM.SolutionUniqueName": solution } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const json = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};
    if (res.ok) return { status: res.status, json, headers: res.headers };
    if (allow.includes(res.status)) return { status: res.status, json, headers: res.headers };
    const msg = json?.error?.message ?? text;
    // metadata locks and throttling: wait and retry
    if ([429, 503].includes(res.status) || /customization lock|another \[?import|try again|0x80071151|being imported|key in the request URI is not valid/i.test(msg)) {
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
      continue;
    }
    const err = new Error(`${method} ${path} → ${res.status}: ${msg}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  throw new Error(`${method} ${path}: gave up after retries`);
}

export const get = (p, o) => api("GET", p, undefined, o);
export const post = (p, b, o) => api("POST", p, b, o);
export const patch = (p, b, o) => api("PATCH", p, b, o);
export const idFrom = (res) => res.headers.get("OData-EntityId")?.match(/\(([0-9a-f-]{36})\)/)?.[1];
