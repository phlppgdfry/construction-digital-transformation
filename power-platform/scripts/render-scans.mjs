// Renders a fictional "scan" of each weighing ticket (what is printed on the paper, i.e. the truth,
// with smudges or handwriting where the extraction was unsure) and uploads it to the image column
// hv_bestand of the matching Weegbon row. The images are illustrations, not real scans.
// Usage: node render-scans.mjs [--no-upload]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { get, CONFIG } from "./dv.mjs";

async function uploadImage(path, buf, name) {
  const token = execSync(`az account get-access-token --tenant ${CONFIG.tenantId} --resource ${CONFIG.url} --query accessToken -o tsv`, { encoding: "utf8" }).trim();
  const res = await fetch(`${CONFIG.url}/api/data/v9.2/${path}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream", "x-ms-file-name": name }, body: buf });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
}

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");
const md = JSON.parse(readFileSync(new URL("../../data/master-data.json", import.meta.url)));
const docs = JSON.parse(readFileSync(new URL("../../data/documents.json", import.meta.url))).documents;
const OUT = new URL("../scans/", import.meta.url);
mkdirSync(OUT, { recursive: true });
const customers = Object.fromEntries(md.customers.map((c) => [c.customerNo, c.name]));
const label = (code) => [...md.acceptance.accepted, ...md.acceptance.refused, ...md.acceptance.products].find((m) => m.code === code)?.label ?? "";
const esc = (s) => String(s ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;");

function html(d) {
  const t = d.truth;
  const low = (f) => (d.extracted[f]?.confidence ?? 1) < 0.85;
  const v = (f, text) => `<dd class="${low(f) ? (f === "net" ? "hand" : "smudge") : ""}">${esc(text)}</dd>`;
  const rot = ((parseInt(d.id.slice(-2), 10) % 5) - 2) * 0.4;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#cfcac0;font-family:"Courier New",monospace}
    .t{width:520px;margin:24px;background:#fffdf6;padding:26px 28px;transform:rotate(${rot}deg);box-shadow:3px 4px 0 #b8b09a;position:relative}
    h1{font-size:15px;letter-spacing:.08em;margin:0 0 4px} .sub{font-size:11px;color:#6b6455;border-bottom:2px dashed #b8b09a;padding-bottom:8px;margin-bottom:12px}
    dl{display:grid;grid-template-columns:150px 1fr;gap:6px 10px;margin:0;font-size:15px} dt{color:#6b6455} dd{margin:0;font-weight:700}
    .smudge{filter:blur(1.3px);background:radial-gradient(circle,rgba(150,110,50,.45),transparent 70%)}
    .hand{font-family:"Bradley Hand","Comic Sans MS",cursive;font-size:22px;color:#1d3e8a;font-weight:400}
    .stamp{position:absolute;right:22px;bottom:20px;color:#c00;border:3px solid #c00;padding:3px 8px;font-weight:700;transform:rotate(-9deg)}
    .foot{margin-top:14px;border-top:2px dashed #b8b09a;padding-top:8px;font-size:11px;color:#6b6455}
  </style></head><body><div class="t" id="t">
    <h1>HALVERDIJK RECYCLING · WEEGBON</h1><div class="sub">Breekwerf Westerzande (fictief) · weegbrug 2 · ${d.channel}</div>
    <dl>
      <dt>Bonnummer</dt>${v("ticketNo", t.ticketNo)}<dt>Datum</dt>${v("date", t.date)}<dt>Nummerplaat</dt>${v("plate", t.plate)}
      <dt>Klant</dt>${v("customerNo", `${t.customerNo} ${customers[t.customerNo] ?? ""}`)}
      <dt>Richting</dt>${v("direction", t.direction === "in" ? "AANVOER (afval)" : "AFVOER (product)")}
      <dt>Materiaal</dt>${v("material", `${t.material} ${label(t.material)}`)}
      <dt>Bruto</dt>${v("gross", `${t.gross} kg`)}<dt>Tarra</dt>${v("tare", `${t.tare} kg`)}<dt>Netto</dt>${v("net", `${t.net} kg`)}
      <dt>ID-formulier</dt>${v("idFormNo", t.idFormNo)}<dt>Traceerbaarheid</dt>${v("soilRef", t.soilRef)}
    </dl>
    <div class="foot">Handtekening chauffeur: ______________ · Fictief document voor portfolio</div>
    ${d.scenario === "duplicate" ? '<span class="stamp">KOPIE</span>' : ""}
  </div></body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1.5 });
const upload = !process.argv.includes("--no-upload");
const es = upload ? (await get("EntityDefinitions(LogicalName='hv_document')?$select=EntitySetName")).json.EntitySetName : null;
for (const d of docs) {
  await page.setContent(html(d));
  const buf = await page.locator("#t").screenshot({ type: "jpeg", quality: 82 });
  writeFileSync(new URL(`${d.id}.jpg`, OUT), buf);
  if (upload) {
    const row = (await get(`${es}?$select=hv_documentid&$filter=hv_documentnr eq '${d.id}'`, { solution: null })).json.value[0];
    // binary upload on the column stores the full-size image (the JSON base64 route only keeps the 144 px thumbnail)
    if (row) await uploadImage(`${es}(${row.hv_documentid})/hv_bestand`, buf, `${d.id}.jpg`);
  }
  process.stdout.write(`${d.id} `);
}
await browser.close();
console.log("\nscans rendered" + (upload ? " and uploaded" : ""));
