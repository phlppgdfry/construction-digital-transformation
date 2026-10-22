// Werfportaal demo. Uses the same engines as the tests (copied to ../assets/lib by scripts/build.mjs).
import { createTour } from "../assets/tour.js";
import * as D from "../assets/lib/documents.mjs";
import * as C from "../assets/lib/claims.mjs";
import * as M from "../assets/lib/materials.mjs";
import { nl, addHours, hoursBetween } from "../assets/lib/common.mjs";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const get = (p) => fetch(p).then((r) => { if (!r.ok) throw new Error(p); return r.json(); });

const [master, docsFile] = await Promise.all([get("../data/master-data.json"), get("../data/documents.json")]);
const DOCS = docsFile.documents;
const NOW0 = "2026-10-12T08:00";

// ------------------------------------------------------------------ tabs
function showTab(name) {
  for (const b of $$("[data-tab]")) b.setAttribute("aria-selected", String(b.dataset.tab === name));
  for (const p of $$(".panel")) p.classList.toggle("hidden", p.id !== `p-${name}`);
  const url = new URL(location.href);
  url.searchParams.set("case", name);
  history.replaceState(null, "", url);
}
for (const b of $$("[data-tab]")) b.addEventListener("click", () => showTab(b.dataset.tab));

// ================================================================== 01 DOCUMENTEN
const DECISION = {
  auto: ["ok", "automatisch", "Automatisch geboekt in het ERP. Geen menselijke tussenkomst."],
  review: ["warn", "nazicht", "Naar de wachtrij van de administratie. De gemarkeerde velden moeten nagekeken worden."],
  escalate: ["risk", "escalatie", "Geweigerd materiaal volgens de vergunning. Er wordt niets geboekt; de milieucoördinator beslist."],
  reject: ["info", "dubbel", "Dit bonnummer is al ontvangen. Gearchiveerd als dubbel, niet geboekt."],
};
const FIELD_LABEL = { ticketNo: "Bonnummer", date: "Datum", plate: "Nummerplaat", customerNo: "Klant", direction: "Richting", material: "Materiaal", gross: "Bruto (kg)", tare: "Tarra (kg)", net: "Netto (kg)", idFormNo: "ID-formulier", soilRef: "Traceerbaarheid" };
const results = D.processBatch(DOCS, master);
const resultById = Object.fromEntries(results.map((r) => [r.id, r]));
const customers = Object.fromEntries(master.customers.map((c) => [c.customerNo, c]));
const materialLabel = (code) => [...master.acceptance.accepted, ...master.acceptance.refused, ...master.acceptance.products].find((m) => m.code === code)?.label ?? "onbekend";
let processed = 0;
let selectedDoc = null;
const reviewed = {};

function renderDocList() {
  $("#doc-list").innerHTML = DOCS.map((d, i) => {
    const r = resultById[d.id];
    const done = i < processed;
    const [cls, label] = DECISION[r.decision];
    return `<li><button type="button" data-doc="${d.id}" aria-current="${selectedDoc === d.id}">
      <span>${d.id}<small>${esc(customers[d.truth.customerNo]?.name ?? "")} · ${d.channel}</small></span>
      ${done ? `<span class="chip ${reviewed[d.id] ? "ok" : cls}">${reviewed[d.id] ? "geboekt na nazicht" : label}</span>` : `<span class="chip info">wacht</span>`}
    </button></li>`;
  }).join("");
  for (const b of $$("[data-doc]")) b.addEventListener("click", () => selectDoc(b.dataset.doc));
  const shown = results.slice(0, processed);
  for (const k of ["auto", "review", "escalate", "reject"]) $(`[data-c="${k}"]`).textContent = shown.filter((r) => r.decision === k).length;
  if (processed === DOCS.length) {
    $("#doc-acc").textContent = nl.pct(D.fieldAccuracy(DOCS).rate);
    $("#doc-silent").textContent = String(D.silentErrors(DOCS, results).length);
  } else { $("#doc-acc").textContent = "–"; $("#doc-silent").textContent = "–"; }
}

function ticketHtml(d) {
  const t = d.truth;
  const low = (f) => (d.extracted[f]?.confidence ?? 1) < D.CONFIDENCE_THRESHOLD;
  const val = (f, v) => `<dd class="${low(f) ? (f === "net" ? "hand" : "smudge") : ""}">${esc(v ?? "—")}</dd>`;
  return `<div class="ticket" aria-label="Gescande weegbon (fictief)">
    <h4>Halverdijk Recycling · weegbon</h4>
    <dl>
      <dt>Bonnr</dt>${val("ticketNo", t.ticketNo)}
      <dt>Datum</dt>${val("date", t.date)}
      <dt>Nummerplaat</dt>${val("plate", t.plate)}
      <dt>Klant</dt>${val("customerNo", `${t.customerNo} ${customers[t.customerNo]?.name ?? ""}`)}
      <dt>Richting</dt>${val("direction", t.direction === "in" ? "aanvoer (afval)" : "afvoer (product)")}
      <dt>Materiaal</dt>${val("material", `${t.material} ${materialLabel(t.material)}`)}
      <dt>Bruto</dt>${val("gross", `${t.gross} kg`)}
      <dt>Tarra</dt>${val("tare", `${t.tare} kg`)}
      <dt>Netto</dt>${val("net", `${t.net} kg`)}
      <dt>ID-formulier</dt>${val("idFormNo", t.idFormNo)}
      <dt>Traceerb.</dt>${val("soilRef", t.soilRef)}
    </dl>
    ${d.scenario === "duplicate" ? `<span class="stamp">KOPIE</span>` : ""}
  </div>`;
}

function selectDoc(id) {
  selectedDoc = id;
  const d = DOCS.find((x) => x.id === id);
  const r = resultById[id];
  const flagged = new Set(r.findings.map((f) => f.field));
  const [cls, label, text] = DECISION[r.decision];
  const silent = D.silentErrors(DOCS, results).filter((s) => s.id === id);
  const rows = Object.keys(FIELD_LABEL).map((f) => {
    const e = d.extracted[f];
    const c = e?.confidence ?? 0;
    const wrong = e?.value !== d.truth[f];
    return `<tr class="${flagged.has(f) ? "flag" : ""}"><td>${FIELD_LABEL[f]}</td><td>${esc(e?.value ?? "—")}</td>
      <td><span class="conf ${c < D.CONFIDENCE_THRESHOLD ? "low" : ""}"><i style="width:${Math.round(c * 100)}%"></i></span>${c.toFixed(2)}</td>
      <td>${wrong ? `<span class="chip risk" title="werkelijke waarde: ${esc(d.truth[f])}">fout gelezen</span>` : ""}</td></tr>`;
  }).join("");
  let actions = "";
  if (r.decision === "review" && !reviewed[id]) {
    const fields = [...flagged].filter(Boolean);
    actions = `<div class="review-form" id="review-form"><b>Nazicht (review-app)</b>
      ${fields.map((f) => `<label>${FIELD_LABEL[f]}<input data-fix="${f}" value="${esc(d.extracted[f]?.value ?? "")}"></label>`).join("")}
      <label class="check" style="grid-template-columns:auto 1fr"><input type="checkbox" id="review-ack" style="width:auto"> Ik heb de bon nagekeken; resterende bevindingen zijn verklaard</label>
      <div class="actions"><button class="btn small" type="button" id="review-ok">Goedkeuren en boeken</button><button class="btn small ghost" type="button" id="review-no">Afwijzen</button></div>
      <div id="review-msg"></div></div>`;
  } else if (r.decision === "escalate") {
    actions = `<div class="callout">Alleen de milieucoördinator kan deze bon behandelen: <b>weigeren</b> (klant en vervoerder verwittigen, lading retour) of <b>uitzonderlijk aanvaarden</b> met motivatie. De administratie ziet hem niet in haar wachtrij.</div>`;
  } else if (r.decision === "reject") {
    const orig = DOCS.find((x) => x.truth.ticketNo === d.truth.ticketNo && x.id !== id);
    actions = `<div class="callout">Origineel: <b>${orig?.id ?? "?"}</b>. Zou het toch verstuurd worden, dan geeft de ERP-facade met dezelfde Idempotency-Key de bestaande boeking terug, geen tweede.</div>`;
  }
  const payload = r.decision === "auto" || reviewed[id] ? `<p class="small muted">ERP-boeking (POST /weighing-tickets, Idempotency-Key = ${esc(r.values.ticketNo)}):</p><pre class="payload">${esc(JSON.stringify(reviewed[id] ?? D.erpPayload(r.values, master), null, 2))}</pre>` : "";
  $("#doc-detail").innerHTML = `${ticketHtml(d)}
    <div class="extract">
      <h3>${id} <span class="chip ${cls}">${label}</span></h3>
      <div class="table-wrap"><table><thead><tr><th>Veld</th><th>Gelezen</th><th>Confidence</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      ${r.findings.length ? `<ul class="findings">${r.findings.map((f) => `<li data-rule="${f.rule}">${esc(f.message)}</li>`).join("")}</ul>` : `<p class="small muted">Geen enkele regel faalt.</p>`}
      <div class="decision ${r.decision}">${text}</div>
      ${silent.length ? `<div class="callout"><b>Stille fout:</b> de nummerplaat is fout gelezen (${esc(d.extracted.plate.value)} i.p.v. ${esc(d.truth.plate)}) met confidence ${d.extracted.plate.confidence}, en beide platen horen bij dezelfde klant. Geen regel vangt dit. Restrisico, afgedekt met een steekproef van 5% en een maandelijkse review van correcties.</div>` : ""}
      ${actions}${payload}
    </div>`;
  renderDocList();
  const ok = $("#review-ok");
  if (ok) ok.addEventListener("click", () => approveReview(d, r));
  const no = $("#review-no");
  if (no) no.addEventListener("click", () => { $("#review-msg").innerHTML = `<p class="msg ok">Afgewezen. Vervoerder krijgt een melding; niets geboekt.</p>`; });
}

function approveReview(d, r) {
  const corrected = structuredClone(d);
  for (const inp of $$("[data-fix]")) {
    const f = inp.dataset.fix;
    const raw = inp.value.trim();
    const v = ["gross", "tare", "net"].includes(f) ? Number(raw) : raw === "" ? null : raw;
    corrected.extracted[f] = { value: v, confidence: 1 };
  }
  const ctx = D.buildContext(master);
  const again = D.checkDocument(corrected, ctx);
  const hard = again.findings.filter((f) => f.severity !== "review");
  const soft = again.findings.filter((f) => f.severity === "review");
  if (hard.length) { $("#review-msg").innerHTML = `<p class="msg err">${esc(hard.map((f) => `${f.rule}: ${f.message}`).join(" · "))}</p>`; return; }
  if (soft.length && !$("#review-ack").checked) { $("#review-msg").innerHTML = `<p class="msg err">Nog open: ${esc(soft.map((f) => `${f.rule} ${f.message}`).join(" · "))}. Corrigeer, of vink aan dat je het nagekeken hebt.</p>`; return; }
  reviewed[d.id] = D.erpPayload(again.values, master, { approvedBy: "reviewer@halverdijk.example" });
  selectDoc(d.id);
}

$("#doc-run").addEventListener("click", () => runDocs());
$("#doc-reset").addEventListener("click", () => { processed = 0; for (const k in reviewed) delete reviewed[k]; renderDocList(); });
function runDocs(instant = false) {
  if (instant) { processed = DOCS.length; renderDocList(); return; }
  processed = 0;
  const tick = () => { processed += 1; renderDocList(); if (processed < DOCS.length) setTimeout(tick, 45); };
  tick();
}
renderDocList();
selectDoc("DOC-001");

// ================================================================== 02 SCHADECLAIMS
let now = NOW0;
const server = { claims: [], nextSeq: 1 };
let queue = [];
let photos = 0;
let clientId = newClientId();
let selectedClaim = null;
let claimMsg = "";
function newClientId() { return `c-${Math.random().toString(36).slice(2, 10)}`; }
const fmtTime = (iso) => { const d = new Date(`${iso}Z`); return d.toLocaleString("nl-BE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }); };

$("#f-project").innerHTML = `<option value="">— kies —</option>` + master.projects.map((p) => `<option value="${p.projectNo}">${p.projectNo} ${esc(p.name)}${p.active ? "" : " (afgesloten)"}</option>`).join("");

function readForm() {
  const v = (id) => $(`#f-${id}`).value;
  const c = (id) => $(`#f-${id}`).checked;
  const third = c("thirdParty");
  return {
    clientId, reporter: "Werfleider (demo)", channel: "werfapp",
    projectNo: v("project"), occurredAt: now, location: { gps: "51.17,2.83" }, category: v("category"),
    utilityType: v("utilityType") || undefined, klipRef: v("klipRef"), utilityOwner: v("utilityOwner"), ownerNotified: c("ownerNotified"),
    rentalRef: v("rentalRef"), description: v("description"),
    estimatedAmount: v("amount") === "" ? null : Number(v("amount")),
    thirdParty: third, thirdPartyName: third ? v("thirdPartyName") : "", thirdPartyLiable: third && c("thirdPartyLiable"),
    injuries: c("injuries"), photos: Array.from({ length: photos }, (_, i) => `foto-${i + 1}.jpg`),
  };
}
function fillForm(r) {
  const set = (id, val) => { const el = $(`#f-${id}`); if (el.type === "checkbox") el.checked = !!val; else el.value = val ?? ""; };
  set("project", r.projectNo); set("category", r.category); set("utilityType", r.utilityType); set("klipRef", r.klipRef); set("utilityOwner", r.utilityOwner);
  set("ownerNotified", r.ownerNotified); set("rentalRef", r.rentalRef); set("description", r.description); set("amount", r.estimatedAmount);
  set("thirdParty", r.thirdParty); set("thirdPartyName", r.thirdPartyName); set("thirdPartyLiable", r.thirdPartyLiable); set("injuries", r.injuries);
  photos = r.photos?.length ?? 0;
  clientId = newClientId();
  refreshForm();
}
function refreshForm() {
  const cat = $("#f-category").value;
  for (const el of $$(".cond")) el.classList.toggle("hidden", el.dataset.for === "third" ? !$("#f-thirdParty").checked : el.dataset.for !== cat);
  $("#photo-count").textContent = `${photos} foto${photos === 1 ? "" : "'s"}`;
  const injured = $("#f-injuries").checked;
  $("#stop-injury").classList.toggle("hidden", !injured);
  const v = C.validateReport(readForm(), master);
  $("#claim-errors").innerHTML = v.errors.map((e) => `<li>${esc(e.msg)}</li>`).join("");
  $("#claim-warnings").innerHTML = v.warnings.map((e) => `<li>${esc(e.msg)}</li>`).join("");
  $("#claim-send").disabled = !v.ok;
  const online = $("#net").checked;
  $("#net-label").textContent = online ? "online" : "offline";
  $("#queue").className = `queue ${online ? "" : "offline"}`;
  $("#queue").textContent = queue.length ? `${queue.length} melding(en) op dit toestel, wachten op bereik.` : claimMsg;
}
$("#preset").addEventListener("change", (e) => { if (e.target.value === "") { $("#claim-new").click(); return; } fillForm(C.SAMPLE_REPORTS[Number(e.target.value)]); });
for (const el of $$(".phone-body input, .phone-body select, .phone-body textarea")) el.addEventListener("input", refreshForm);
$("#photo-add").addEventListener("click", () => { photos += 1; refreshForm(); });
$("#photo-clear").addEventListener("click", () => { photos = 0; refreshForm(); });
$("#claim-new").addEventListener("click", () => { for (const el of $$(".phone-body input, .phone-body textarea")) { if (el.type === "checkbox") el.checked = false; else el.value = ""; } for (const s of $$(".phone-body select")) s.value = ""; photos = 0; clientId = newClientId(); claimMsg = ""; refreshForm(); });
$("#claim-send").addEventListener("click", () => sendClaim());
$("#net").addEventListener("change", () => { if ($("#net").checked) syncNow(); refreshForm(); });

function sendClaim() {
  const r = readForm();
  if (!C.validateReport(r, master).ok) return;
  if (!$("#net").checked) {
    if (!queue.some((q) => q.clientId === r.clientId)) queue.push(r);
    claimMsg = "";
    refreshForm();
    return;
  }
  const [res] = C.syncQueue([r], server, master, { now });
  claimMsg = res.status === "aangemaakt" ? `Verzonden: dossier ${res.claimNo} aangemaakt.` : `Al ontvangen als ${res.claimNo}: geen tweede dossier.`;
  selectedClaim = res.claimNo;
  refreshForm(); renderClaims();
}
function syncNow() {
  if (!queue.length) return;
  const res = C.syncQueue(queue, server, master, { now });
  claimMsg = `Gesynchroniseerd: ${res.map((x) => `${x.claimNo} (${x.status})`).join(", ")}`;
  queue = [];
  selectedClaim = res.at(-1).claimNo;
  renderClaims();
}

const SEV = { kritiek: "risk", hoog: "risk", middel: "warn", laag: "ok" };
function renderClaims() {
  $("#clock").textContent = fmtTime(now);
  if (!server.claims.length) return;
  $("#claims-list").innerHTML = server.claims.map((c) => {
    const sla = C.slaStatus(c, now);
    return `<button type="button" data-claim="${c.claimNo}" aria-current="${selectedClaim === c.claimNo}">
      <span><b>${c.claimNo}</b> · ${esc(C.CATEGORIES[c.report.category].label)} · €${nl.int(c.report.estimatedAmount)}</span>
      <span><span class="chip ${SEV[c.severity]}">${c.severity}</span> <span class="chip info">${c.state}</span> ${sla.status === "overschreden" ? `<span class="chip risk">SLA overschreden</span>` : sla.status === "dreigt" ? `<span class="chip warn">SLA dreigt</span>` : ""}</span>
    </button>`;
  }).join("");
  for (const b of $$("[data-claim]")) b.addEventListener("click", () => { selectedClaim = b.dataset.claim; renderClaims(); });
  renderClaimDetail();
}
function renderClaimDetail(message = "") {
  const c = server.claims.find((x) => x.claimNo === selectedClaim);
  if (!c) { $("#claim-detail").innerHTML = ""; return; }
  const sla = C.slaStatus(c, now);
  const chain = c.approvalChain.map((role, i) => `<span class="${i < c.approvals.length ? "done" : i === c.approvals.length && c.state === "ter-goedkeuring" ? "next" : ""}">${esc(role)}</span>`).join("→");
  const T = C.TRANSITIONS[c.state];
  const next = c.approvalChain[c.approvals.length];
  const roles = ["Projectleider", "Fleetmanager", "Claims & verzekeringen", "Afdelingsverantwoordelijke", "Directie"];
  let buttons = "";
  if (c.state === "in-beoordeling") buttons = `<button class="btn small" data-act="submitForApproval">Ter goedkeuring</button><button class="btn small ghost" data-act="requestInfo">Info vragen aan werfleider</button><button class="btn small ghost" data-act="reject">Afwijzen</button>`;
  if (c.state === "info-gevraagd") buttons = `<button class="btn small" data-act="infoReceived">Info ontvangen</button>`;
  if (c.state === "ter-goedkeuring") buttons = `<label class="small">Ik ben <select id="as-role">${roles.map((r) => `<option ${r === next ? "selected" : ""}>${r}</option>`).join("")}</select></label><button class="btn small" data-act="approve">Goedkeuren</button><button class="btn small ghost" data-act="reject">Afwijzen</button>`;
  if (c.state === "goedgekeurd") buttons = `<button class="btn small" data-act="startHandling">Start afhandeling</button>`;
  if (c.state === "in-afhandeling" || c.state === "afgewezen") buttons = `<button class="btn small" data-act="close">${c.state === "afgewezen" ? "Afsluiten" : "Afsluiten en kost boeken"}</button>`;
  const cost = c.state === "afgesloten" && c.approvals.length === c.approvalChain.length ? `<p class="small muted">ERP-boeking via outbox (POST /project-costs, Idempotency-Key = ${c.claimNo}-schade):</p><pre class="payload">${esc(JSON.stringify({ projectNo: c.report.projectNo, costType: "schade", amount: c.report.estimatedAmount, reference: c.claimNo }, null, 2))}</pre>` : "";
  $("#claim-detail").innerHTML = `
    <h3>${c.claimNo} <span class="chip ${SEV[c.severity]}">${c.severity}</span> <span class="chip navy">${c.state}</span></h3>
    <p style="margin:0">${esc(c.report.description)}</p>
    <dl class="kv">
      <dt>Werf</dt><dd>${c.report.projectNo}</dd>
      <dt>Eigenaar</dt><dd>${esc(c.owner)}</dd>
      <dt>Verwittigd</dt><dd>${c.notify.map((n) => `<span class="chip info">${esc(n)}</span>`).join(" ")}</dd>
      <dt>Beoordelen vóór</dt><dd>${fmtTime(c.deadlines.assessment)} (${c.slaHours} u) ${sla.status !== "n.v.t." ? `· <b>${sla.status}</b>` : ""}</dd>
      <dt>Aangifte verzekeraar</dt><dd>${c.deadlines.insurer ? `vóór ${fmtTime(c.deadlines.insurer)} · concept klaargezet` : "niet nodig"}</dd>
      <dt>Verhaal op derde</dt><dd>${c.recoveryTrack ? "ja, verhaaltraject start" : "nee"}</dd>
      <dt>Goedkeuringsketen (DT-02)</dt><dd class="chain">${chain}</dd>
    </dl>
    ${message}
    <div class="actions">${buttons}</div>
    <ol class="timeline">${c.timeline.map((t) => `<li><b>${fmtTime(t.at)}</b> · ${esc(t.event)} · ${esc(t.by ?? "")} ${t.note ? `— ${esc(t.note)}` : ""}</li>`).join("")}</ol>
    ${cost}`;
  for (const b of $$("[data-act]", $("#claim-detail"))) b.addEventListener("click", () => act(c, b.dataset.act));
  const amount = c.report.estimatedAmount;
  for (const tr of $$("tr[data-dt]")) tr.classList.toggle("hit", Number(tr.dataset.dt) === (amount <= 2500 ? 1 : amount <= 15000 ? 2 : 3));
}
function act(c, action) {
  const by = action === "approve" ? $("#as-role").value : c.owner;
  try {
    const next = C.transition(c, action, { by, at: now });
    server.claims[server.claims.indexOf(c)] = next;
    renderClaims();
  } catch (e) {
    renderClaimDetail(`<p class="msg err">${esc(e.message)}</p>`);
  }
}
$("#clock-plus").addEventListener("click", () => { now = addHours(now, 4); renderClaims(); });
refreshForm();

// ================================================================== 03 MATERIAAL
const NOW_M = NOW0;
let req = structuredClone(M.SAMPLE_REQUESTS[0]);
let outbox = [];
let erpSeen = new Set();
let approvals = [];
let materialRevision = "";
$("#r-project").innerHTML = master.projects.map((p) => `<option value="${p.projectNo}">${p.projectNo} ${esc(p.name)}${p.active ? "" : " (afgesloten)"}</option>`).join("");
$("#r-reason").innerHTML = `<option value="">— kies —</option>` + M.RUSH_REASONS.map((r) => `<option>${r}</option>`).join("");
$("#req-presets").innerHTML = M.SAMPLE_REQUESTS.map((r, i) => `<button class="btn small ${i ? "ghost" : ""}" type="button" data-req="${i}">${r.requestNo}</button>`).join("");
for (const b of $$("[data-req]")) b.addEventListener("click", () => loadRequest(Number(b.dataset.req)));
const itemOptions = (sel) => master.catalog.map((c) => `<option value="${c.itemNo}" ${c.itemNo === sel ? "selected" : ""}>${c.itemNo} · ${esc(c.label)} (${c.unit})</option>`).join("");

function loadRequest(i) {
  req = structuredClone(M.SAMPLE_REQUESTS[i]);
  for (const b of $$("[data-req]")) b.classList.toggle("ghost", Number(b.dataset.req) !== i);
  outbox = []; erpSeen = new Set(); approvals = [];
  for (const el of $("#req-form").querySelectorAll("input, select, button")) el.disabled = false;
  $("#r-booked").hidden = true;
  renderRequestForm();
}
function renderRequestForm() {
  $("#r-project").value = req.projectNo;
  $("#r-deliver").value = req.deliverAt;
  $("#r-reason").value = req.rushReason ?? "";
  $("#r-lines").innerHTML = req.lines.map((l, i) => `<div class="line"><select data-line="${i}" data-k="itemNo" aria-label="Artikel">${itemOptions(l.itemNo)}</select><input type="number" min="0" data-line="${i}" data-k="qty" value="${l.qty}" aria-label="Hoeveelheid"><button type="button" data-del="${i}" aria-label="Lijn verwijderen">✕</button></div>`).join("");
  for (const el of $$("[data-line]")) el.addEventListener("input", () => { const l = req.lines[Number(el.dataset.line)]; l[el.dataset.k] = el.dataset.k === "qty" ? Number(el.value) : el.value; evaluateNow(); });
  for (const b of $$("[data-del]")) b.addEventListener("click", () => { req.lines.splice(Number(b.dataset.del), 1); renderRequestForm(); });
  evaluateNow();
}
$("#r-project").addEventListener("change", (e) => { req.projectNo = e.target.value; approvals = []; evaluateNow(); });
$("#r-deliver").addEventListener("change", (e) => { req.deliverAt = e.target.value; approvals = []; evaluateNow(); });
$("#r-reason").addEventListener("change", (e) => { req.rushReason = e.target.value || undefined; evaluateNow(); });
$("#r-add").addEventListener("click", () => { req.lines.push({ itemNo: "MG-031", qty: 20 }); renderRequestForm(); });

function evaluateNow() {
  const revision = JSON.stringify(req);
  if (revision !== materialRevision) {
    // Any content change invalidates earlier approvals and unsent messages.
    approvals = [];
    outbox = [];
    materialRevision = revision;
    renderOutbox();
  }
  const v = M.validateRequest(req, master, NOW_M);
  const rush = M.isRush(req, NOW_M);
  $("#r-rush").classList.toggle("hidden", !rush);
  $("#r-reason-wrap").classList.toggle("hidden", !rush);
  $("#r-errors").innerHTML = v.errors.map((e) => `<li>${esc(e.msg)}</li>`).join("");
  if (!v.ok) { $("#evaluation").innerHTML = `<p class="muted">Vul de aanvraag aan om de evaluatie te zien.</p>`; return; }
  const e = M.evaluate(req, master, NOW_M);
  const depots = Object.fromEntries(master.depots.map((d) => [d.depotNo, d.name]));
  const lines = e.lines.map((l) => {
    const total = l.qty || 1;
    const bars = l.allocations.map((a, i) => `<span class="d${i % 3}" style="width:${(a.qty / total) * 100}%" title="${esc(depots[a.depotNo])}">${a.qty === Infinity ? "" : a.qty} · ${a.depotNo} ${a.km} km</span>`).join("")
      + (l.shortfall ? `<span class="short" style="width:${(l.shortfall / total) * 100}%">tekort ${l.shortfall}</span>` : "")
      + (l.purchase ? `<span class="short" style="width:100%">aankoop ${l.purchase} ${l.unit}</span>` : "");
    return `<div class="eval-line"><h4>${l.qty} ${l.unit} ${esc(l.label)} <span class="muted small">€${nl.int(l.value)}</span></h4>
      <div class="alloc">${bars}</div>
      ${l.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}
      ${l.alternative ? `<p class="alt">♻ ${esc(l.alternative.label)} op voorraad · besparing €${nl.int(l.alternative.saving)}. ${esc(l.alternative.note)}</p>` : ""}</div>`;
  }).join("");
  const budget = `<div class="table-wrap"><table><thead><tr><th>Budgetlijn</th><th class="num">Gevraagd</th><th class="num">Resterend</th></tr></thead><tbody>${e.budget.map((b) => `<tr class="${b.over ? "flag" : ""}"><td>${b.category}</td><td class="num">€${nl.int(b.requested)}</td><td class="num">€${nl.int(b.remaining)}</td></tr>`).join("")}</tbody></table></div>`;
  const needed = e.approval.approvers;
  const done = approvals.length >= needed.length;
  const approveBtns = needed.length && !done ? `<button class="btn small" type="button" id="m-approve">Goedkeuren als ${needed[approvals.length]}</button>` : "";
  $("#evaluation").innerHTML = `<div class="route" id="m-route"><b>${needed.length ? needed.join(" → ") : "Automatisch goedgekeurd"}</b><br><span class="small">${esc(e.approval.rule)} · waarde €${nl.int(e.value)}${e.rush ? " · SPOED" : ""}</span></div>
    <p class="small">Te verwittigen (simulatie): ${e.informs.map((x) => `<span class="chip info">${esc(x)}</span>`).join(" ")}</p>
    <div id="m-lines">${lines}</div>
    ${budget}
    <div class="actions" style="margin-top:12px">${approveBtns}<button class="btn small dark" type="button" id="m-submit" ${needed.length && !done ? "disabled" : ""}>Naar ERP-outbox</button></div>`;
  if ($("#m-approve")) $("#m-approve").addEventListener("click", () => { approvals.push(needed[approvals.length]); evaluateNow(); });
  $("#m-submit").addEventListener("click", () => { outbox = M.erpMessages(e, req); renderOutbox(); $("#outbox-wrap").scrollIntoView({ behavior: "smooth", block: "start" }); });
}
function renderOutbox(log = null, res = null) {
  if (!outbox.length) { $("#outbox").innerHTML = `<p class="muted">Leeg. Keur een aanvraag goed en stuur ze naar de outbox.</p>`; return; }
  const msgs = `<div class="table-wrap"><table><thead><tr><th>Idempotency-Key</th><th>Endpoint</th><th>Artikel</th><th class="num">Hoeveelheid</th><th>Depot</th></tr></thead><tbody>${outbox.map((m) => `<tr><td><code>${m.idempotencyKey}</code></td><td>POST /${m.type === "reservation" ? "reservations" : "purchase-requisitions"}</td><td>${m.body.itemNo}</td><td class="num">${m.body.quantity}</td><td>${m.body.depotNo ?? "—"}</td></tr>`).join("")}</tbody></table></div>`;
  const logHtml = log ? `<h4 style="margin-top:14px">Verzendlog</h4><p class="small">${res.delivered.length} geboekt · ${res.dead.length} in dead-letter${res.dead.length ? " → ticket functioneel beheer (runbook)" : ""}</p>
    <div class="table-wrap log"><table><thead><tr><th>Key</th><th class="num">Minuut</th><th class="num">Poging</th><th>Resultaat</th></tr></thead><tbody>${log.map((l) => `<tr class="${/^2/.test(l.result) ? "ok" : "fail"}"><td><code>${l.key}</code></td><td class="num">${l.minute}</td><td class="num">${l.attempt}</td><td>${esc(l.result)}</td></tr>`).join("")}</tbody></table></div>` : "";
  $("#outbox").innerHTML = msgs + logHtml;
}
function sendOutbox() {
  if (!outbox.length) return;
  const up = $("#erp-up").checked;
  const restore = Number($("#erp-restore").value);
  const res = M.deliverOutbox(outbox, up ? () => true : (m) => m >= restore, { erpSeen });
  if (res.delivered.length) {
    for (const el of $("#req-form").querySelectorAll("input, select, button")) el.disabled = true;
    $("#r-booked").hidden = false;
  }
  renderOutbox(res.log, res);
}
$("#outbox-send").addEventListener("click", sendOutbox);
$("#outbox-again").addEventListener("click", () => { $("#erp-up").checked = true; sendOutbox(); });
loadRequest(0);
renderOutbox();

// ================================================================== tour + deep links
const requestedCase = new URLSearchParams(location.search).get("case");
const start = ({ claims: "claims", materials: "materiaal", documents: "documenten" })[requestedCase] ?? requestedCase;
showTab(["documenten", "claims", "materiaal"].includes(start) ? start : "documenten");

const tour = createTour([
  { text: "Dit werfportaal bundelt de drie cases van de fictieve Halverdijk Group. Alles draait in je browser op dezelfde regelmotor als de tests in de repo.", focus: ".tabbar", before: () => showTab("documenten") },
  { text: "Case 01: dertig weegbonnen worden verwerkt. 20 gaan automatisch naar het ERP, 8 naar nazicht, 1 asbestbon naar de milieucoördinator en 1 dubbele bon wordt tegengehouden.", focus: "#doc-counters", before: () => { showTab("documenten"); runDocs(true); selectDoc("DOC-001"); } },
  { text: "DOC-006: de AI las een 8 als 3, met confidence 0,96. De confidence-drempel ziet dat niet, maar de rekenregel netto = bruto − tarra (R03) vangt het. Zo werkt de mens-bij-twijfel.", focus: "#doc-detail", before: () => { showTab("documenten"); runDocs(true); selectDoc("DOC-006"); } },
  { text: "DOC-025 is de eerlijke uitzondering: een geldige maar verkeerde nummerplaat van dezelfde klant. Geen regel vangt dit. Restrisico, afgedekt met een steekproef van 5%.", focus: "#doc-detail", before: () => { showTab("documenten"); runDocs(true); selectDoc("DOC-025"); } },
  { text: "Case 02: een werfleider raakt een gasleiding en heeft geen bereik. Deze browserdemo simuleert de wachtrij in het geheugen; vernieuwen wist die. Twee keer verzenden geeft één dossier (client-id). Echte foto-opslag en offlinegebruik op een toestel zijn nog niet bewezen.", focus: "#phone", before: () => { showTab("claims"); $("#net").checked = false; $("#preset").value = "0"; fillForm(C.SAMPLE_REPORTS[0]); sendClaim(); sendClaim(); } },
  { text: "Verbinding terug: het dossier wordt aangemaakt en meteen getriageerd. Kritiek, beoordeling binnen 2 uur, vijf partijen verwittigd, en de aangiftetermijn bij de verzekeraar loopt al.", focus: "#claim-detail", before: () => { showTab("claims"); $("#net").checked = true; syncNow(); refreshForm(); } },
  { text: "Case 03: 240 ton menggranulaat voor werf W-2604. De regels nemen eerst 160 ton uit het dichtste depot (4 km) en de rest uit de breekwerf (6 km). Geen telefoontje meer naar het depot.", focus: "#m-lines", before: () => { showTab("materiaal"); loadRequest(0); } },
  { text: "Primair porfier boven het werfbudget: beslistabel DT-03 stuurt naar projectleider én afdeling, en de app toont het gerecycleerde alternatief op voorraad met de besparing.", focus: "#m-route", before: () => { showTab("materiaal"); loadRequest(3); } },
  { text: "Het ERP ligt 20 minuten plat. De outbox probeert opnieuw na 1, 5 en 15 minuten en boekt in poging 4, elk bericht precies één keer dankzij de idempotency-key.", focus: "#outbox", before: () => { showTab("materiaal"); loadRequest(0); approvals = ["Projectleider"]; evaluateNow(); $("#m-submit").click(); $("#erp-up").checked = false; $("#erp-restore").value = "20"; sendOutbox(); } },
  { text: "Wat dit niet toont: echte AI, een echt ERP of echte gebruikers. Het toont wel de beslissingen, de regels en hoe ze getest zijn. De volledige analyse per case staat op GitHub.", focus: ".site-header nav" },
], { label: "Rondleiding werfportaal", labels: { step: "Stap", of: "van", back: "Terug", next: "Volgende", finish: "Klaar", close: "Sluiten" } });
$("#btn-tour").addEventListener("click", () => tour.start());
