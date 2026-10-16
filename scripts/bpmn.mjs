// Turns a compact process spec (models/*.json) into BPMN 2.0 XML with diagram interchange
// (opens in bpmn.io / Camunda Modeler / Signavio import) and a matching SVG for the docs.
// The spec is the source; the .bpmn and .svg files are generated and committed.

const COL_W = 150;
const LANE_H = 130;
const POOL_X = 20;
const POOL_LABEL = 30;
const LANE_LABEL = 30;
const TOP = 20;
const X0 = POOL_X + POOL_LABEL + LANE_LABEL + 70;

const SIZE = {
  startEvent: [36, 36], endEvent: [36, 36], intermediateCatchEvent: [36, 36], intermediateThrowEvent: [36, 36],
  exclusiveGateway: [50, 50], parallelGateway: [50, 50], eventBasedGateway: [50, 50],
};
const sizeOf = (n) => SIZE[n.type] ?? [116, 68];
const isEvent = (t) => /Event$/.test(t);
const isGateway = (t) => /Gateway$/.test(t);

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function layout(spec) {
  const laneIndex = new Map(spec.lanes.map((l, i) => [l.id, i]));
  const maxCol = Math.max(...spec.nodes.map((n) => n.col));
  const width = X0 + maxCol * COL_W + 120;
  const nodes = new Map();
  for (const n of spec.nodes) {
    const li = laneIndex.get(n.lane);
    if (li === undefined) throw new Error(`${spec.id}: node ${n.id} has unknown lane ${n.lane}`);
    const [w, h] = sizeOf(n);
    const cx = X0 + n.col * COL_W;
    const cy = TOP + li * LANE_H + LANE_H / 2 + (n.dy ?? 0);
    nodes.set(n.id, { ...n, w, h, cx, cy, x: cx - w / 2, y: cy - h / 2, li });
  }
  const edges = spec.flows.map((f, i) => {
    const s = nodes.get(f.from);
    const t = nodes.get(f.to);
    if (!s || !t) throw new Error(`${spec.id}: flow ${f.from} → ${f.to} references an unknown node`);
    let pts;
    if (f.bend !== undefined && t.col > s.col) {
      const bx = s.cx + s.w / 2 + f.bend;
      pts = [[s.cx + s.w / 2, s.cy], [bx, s.cy], [bx, t.cy], [t.cx - t.w / 2, t.cy]];
    } else if (t.col > s.col && s.li === t.li && Math.abs(s.cy - t.cy) < 1) {
      pts = [[s.cx + s.w / 2, s.cy], [t.cx - t.w / 2, t.cy]];
    } else if (t.col > s.col) {
      const down = t.cy > s.cy;
      pts = [[s.cx, down ? s.cy + s.h / 2 : s.cy - s.h / 2], [s.cx, t.cy], [t.cx - t.w / 2, t.cy]];
    } else if (t.col === s.col) {
      const down = t.cy > s.cy;
      pts = [[s.cx, down ? s.cy + s.h / 2 : s.cy - s.h / 2], [t.cx, down ? t.cy - t.h / 2 : t.cy + t.h / 2]];
    } else {
      const lowest = Math.max(s.li, t.li);
      const yb = TOP + (lowest + 1) * LANE_H - 12;
      pts = [[s.cx, s.cy + s.h / 2], [s.cx, yb], [t.cx, yb], [t.cx, t.cy + t.h / 2]];
    }
    return { ...f, id: f.id ?? `Flow_${spec.id}_${i + 1}`, pts };
  });
  const height = TOP + spec.lanes.length * LANE_H;
  return { nodes, edges, width, height };
}

/** Label near the corner where the edge enters its last segment (or on the first segment if straight). */
function labelPos(e) {
  const p = e.pts;
  if (p.length === 2) {
    const vertical = Math.abs(p[1][0] - p[0][0]) < 1;
    return vertical ? [p[0][0] + 6, (p[0][1] + p[1][1]) / 2] : [p[0][0] + 6, p[0][1] - 6];
  }
  const backward = p[p.length - 1][0] < p[0][0] || p.length === 4 && p[1][0] === p[0][0] && p[2][1] === p[1][1];
  if (backward && p.length === 4 && p[1][0] === p[0][0]) return [Math.min(p[1][0], p[2][0]) + 8, p[1][1] - 4];
  const c = p[p.length - 2];
  return [c[0] + 6, c[1] - 6];
}

export function toXml(spec) {
  const { nodes, edges, width, height } = layout(spec);
  const pid = `Process_${spec.id}`;
  const out = [];
  out.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  out.push(`<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Defs_${spec.id}" targetNamespace="https://halverdijk.example/bpmn" exporter="construction-digital-transformation/scripts/bpmn.mjs" exporterVersion="1.0">`);
  out.push(`  <bpmn:collaboration id="Collab_${spec.id}">`);
  out.push(`    <bpmn:documentation>${esc(spec.description ?? "")}</bpmn:documentation>`);
  out.push(`    <bpmn:participant id="Pool_${spec.id}" name="${esc(spec.pool)}" processRef="${pid}" />`);
  out.push(`  </bpmn:collaboration>`);
  out.push(`  <bpmn:process id="${pid}" name="${esc(spec.name)}" isExecutable="false">`);
  out.push(`    <bpmn:laneSet id="LaneSet_${spec.id}">`);
  for (const l of spec.lanes) {
    out.push(`      <bpmn:lane id="Lane_${spec.id}_${l.id}" name="${esc(l.name)}">`);
    for (const n of spec.nodes.filter((x) => x.lane === l.id)) out.push(`        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`);
    out.push(`      </bpmn:lane>`);
  }
  out.push(`    </bpmn:laneSet>`);
  for (const n of spec.nodes) {
    const attrs = [`id="${n.id}"`, `name="${esc(n.name ?? "")}"`];
    const def = edges.find((e) => e.from === n.id && e.default);
    if (def) attrs.push(`default="${def.id}"`);
    out.push(`    <bpmn:${n.type} ${attrs.join(" ")}>`);
    if (n.doc) out.push(`      <bpmn:documentation>${esc(n.doc)}</bpmn:documentation>`);
    for (const e of edges.filter((x) => x.to === n.id)) out.push(`      <bpmn:incoming>${e.id}</bpmn:incoming>`);
    for (const e of edges.filter((x) => x.from === n.id)) out.push(`      <bpmn:outgoing>${e.id}</bpmn:outgoing>`);
    if (n.event === "timer") out.push(`      <bpmn:timerEventDefinition id="${n.id}_timer" />`);
    if (n.event === "message") out.push(`      <bpmn:messageEventDefinition id="${n.id}_msg" />`);
    if (n.event === "error") out.push(`      <bpmn:errorEventDefinition id="${n.id}_err" />`);
    if (n.event === "terminate") out.push(`      <bpmn:terminateEventDefinition id="${n.id}_term" />`);
    out.push(`    </bpmn:${n.type}>`);
  }
  for (const e of edges) {
    out.push(`    <bpmn:sequenceFlow id="${e.id}" sourceRef="${e.from}" targetRef="${e.to}"${e.name ? ` name="${esc(e.name)}"` : ""} />`);
  }
  out.push(`  </bpmn:process>`);
  out.push(`  <bpmndi:BPMNDiagram id="Diagram_${spec.id}">`);
  out.push(`    <bpmndi:BPMNPlane id="Plane_${spec.id}" bpmnElement="Collab_${spec.id}">`);
  out.push(`      <bpmndi:BPMNShape id="Pool_${spec.id}_di" bpmnElement="Pool_${spec.id}" isHorizontal="true"><dc:Bounds x="${POOL_X}" y="${TOP}" width="${width - POOL_X}" height="${height - TOP}" /></bpmndi:BPMNShape>`);
  spec.lanes.forEach((l, i) => {
    out.push(`      <bpmndi:BPMNShape id="Lane_${spec.id}_${l.id}_di" bpmnElement="Lane_${spec.id}_${l.id}" isHorizontal="true"><dc:Bounds x="${POOL_X + POOL_LABEL}" y="${TOP + i * LANE_H}" width="${width - POOL_X - POOL_LABEL}" height="${LANE_H}" /></bpmndi:BPMNShape>`);
  });
  for (const n of nodes.values()) {
    const marker = n.type === "exclusiveGateway" ? ` isMarkerVisible="true"` : "";
    out.push(`      <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${marker}><dc:Bounds x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" />${isEvent(n.type) || isGateway(n.type) ? `<bpmndi:BPMNLabel><dc:Bounds x="${n.cx - 50}" y="${n.y + n.h + 4}" width="100" height="27" /></bpmndi:BPMNLabel>` : ""}</bpmndi:BPMNShape>`);
  }
  for (const e of edges) {
    const wps = e.pts.map(([x, y]) => `<di:waypoint x="${x}" y="${y}" />`).join("");
    const [lx, ly] = labelPos(e);
    const lbl = e.name ? `<bpmndi:BPMNLabel><dc:Bounds x="${lx}" y="${ly - 12}" width="${Math.max(40, e.name.length * 6)}" height="14" /></bpmndi:BPMNLabel>` : "";
    out.push(`      <bpmndi:BPMNEdge id="${e.id}_di" bpmnElement="${e.id}">${wps}${lbl}</bpmndi:BPMNEdge>`);
  }
  out.push(`    </bpmndi:BPMNPlane>`);
  out.push(`  </bpmndi:BPMNDiagram>`);
  out.push(`</bpmn:definitions>`);
  return out.join("\n") + "\n";
}

function wrap(text, max) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

const INK = "#242a38";
const RED = "#e20000";
const AUTO_FILL = "#fdecec";
const HUMAN_FILL = "#ffffff";
const LANE_FILL = ["#f6f6f7", "#efefef"];

function icon(n) {
  const x = n.x + 7;
  const y = n.y + 6;
  if (n.type === "userTask") return `<g transform="translate(${x},${y})" fill="none" stroke="${INK}" stroke-width="1.2"><circle cx="6" cy="4" r="3"/><path d="M0 13c0-4 3-6 6-6s6 2 6 6z"/></g>`;
  if (n.type === "serviceTask") return `<g transform="translate(${x},${y})" fill="none" stroke="${RED}" stroke-width="1.4"><circle cx="6" cy="6" r="3"/><path d="M6 0v2M6 10v2M0 6h2M10 6h2M1.8 1.8l1.4 1.4M8.8 8.8l1.4 1.4M1.8 10.2l1.4-1.4M8.8 3.2l1.4-1.4"/></g>`;
  if (n.type === "businessRuleTask") return `<g transform="translate(${x},${y})" fill="none" stroke="${RED}" stroke-width="1.2"><rect width="14" height="11"/><path d="M0 4h14M4 4v7"/></g>`;
  if (n.type === "manualTask") return `<g transform="translate(${x},${y})" fill="none" stroke="${INK}" stroke-width="1.2"><path d="M0 7h9a2 2 0 0 0 0-4H3M0 7v4h10"/></g>`;
  if (n.type === "sendTask") return `<g transform="translate(${x},${y})"><rect width="14" height="10" fill="${INK}"/><path d="M0 0l7 5 7-5" stroke="#fff" fill="none"/></g>`;
  if (n.type === "receiveTask") return `<g transform="translate(${x},${y})" fill="none" stroke="${INK}"><rect width="14" height="10"/><path d="M0 0l7 5 7-5"/></g>`;
  return "";
}

export function toSvg(spec) {
  const { nodes, edges, width, height } = layout(spec);
  const o = [];
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width + 10} ${height + 30}" width="${width + 10}" height="${height + 30}" font-family="Barlow, 'Segoe UI', Arial, sans-serif" role="img" aria-label="${esc(spec.name)}">`);
  o.push(`<title>${esc(spec.name)}</title>`);
  o.push(`<defs><marker id="arr-${spec.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${INK}"/></marker></defs>`);
  o.push(`<rect x="0" y="0" width="${width + 10}" height="${height + 30}" fill="#ffffff"/>`);
  o.push(`<rect x="${POOL_X}" y="${TOP}" width="${width - POOL_X}" height="${height - TOP}" fill="none" stroke="${INK}" stroke-width="1.5"/>`);
  o.push(`<text transform="translate(${POOL_X + 19},${TOP + (height - TOP) / 2}) rotate(-90)" text-anchor="middle" font-size="14" font-weight="700" fill="${INK}">${esc(spec.pool)}</text>`);
  spec.lanes.forEach((l, i) => {
    const y = TOP + i * LANE_H;
    o.push(`<rect x="${POOL_X + POOL_LABEL}" y="${y}" width="${width - POOL_X - POOL_LABEL}" height="${LANE_H}" fill="${LANE_FILL[i % 2]}" stroke="${INK}" stroke-width="0.8"/>`);
    const lines = wrap(l.name, 16);
    o.push(`<text transform="translate(${POOL_X + POOL_LABEL + 18},${y + LANE_H / 2}) rotate(-90)" text-anchor="middle" font-size="11.5" fill="${INK}">${lines.map((t, k) => `<tspan x="0" dy="${k === 0 ? -(lines.length - 1) * 6 : 12}">${esc(t)}</tspan>`).join("")}</text>`);
  });
  for (const e of edges) {
    const d = e.pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
    o.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.3" marker-end="url(#arr-${spec.id})"${e.default ? "" : ""}/>`);
    if (e.default) {
      const [x, y] = e.pts[0];
      const [x2, y2] = e.pts[1];
      const dx = Math.sign(x2 - x) * 8;
      const dy = Math.sign(y2 - y) * 8;
      o.push(`<path d="M${x + dx - 4 + (dy ? 0 : 0)} ${y + dy - 4} l8 8" stroke="${INK}" stroke-width="1.3"/>`);
    }
    if (e.name) {
      const [lx, ly] = labelPos(e);
      o.push(`<text x="${lx}" y="${ly}" font-size="10.5" fill="${RED}" font-weight="600">${esc(e.name)}</text>`);
    }
  }
  for (const n of nodes.values()) {
    if (isEvent(n.type)) {
      const r = n.w / 2;
      const stroke = n.type === "endEvent" ? 3.2 : 1.6;
      o.push(`<circle cx="${n.cx}" cy="${n.cy}" r="${r}" fill="#fff" stroke="${n.type === "startEvent" ? INK : n.type === "endEvent" ? RED : INK}" stroke-width="${stroke}"/>`);
      if (/intermediate/.test(n.type)) o.push(`<circle cx="${n.cx}" cy="${n.cy}" r="${r - 3.5}" fill="none" stroke="${INK}" stroke-width="1"/>`);
      if (n.event === "timer") o.push(`<circle cx="${n.cx}" cy="${n.cy}" r="9" fill="none" stroke="${INK}"/><path d="M${n.cx} ${n.cy - 6}V${n.cy}l4 3" fill="none" stroke="${INK}"/>`);
      if (n.event === "message") o.push(`<rect x="${n.cx - 8}" y="${n.cy - 5.5}" width="16" height="11" fill="${n.type === "intermediateThrowEvent" || n.type === "endEvent" ? INK : "#fff"}" stroke="${INK}"/><path d="M${n.cx - 8} ${n.cy - 5.5}l8 6 8-6" fill="none" stroke="${n.type === "intermediateThrowEvent" || n.type === "endEvent" ? "#fff" : INK}"/>`);
      if (n.event === "terminate") o.push(`<circle cx="${n.cx}" cy="${n.cy}" r="9" fill="${RED}"/>`);
      if (n.event === "error") o.push(`<path d="M${n.cx - 7} ${n.cy + 7}l4-12 4 7 4-9-3 13-4-6z" fill="${RED}"/>`);
      const lines = wrap(n.name ?? "", 18);
      lines.forEach((t, k) => o.push(`<text x="${n.cx}" y="${n.y + n.h + 13 + k * 12}" text-anchor="middle" font-size="10.5" fill="${INK}">${esc(t)}</text>`));
    } else if (isGateway(n.type)) {
      const { cx, cy } = n;
      o.push(`<path d="M${cx} ${cy - 25}L${cx + 25} ${cy}L${cx} ${cy + 25}L${cx - 25} ${cy}z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`);
      if (n.type === "exclusiveGateway") o.push(`<path d="M${cx - 7} ${cy - 7}l14 14M${cx + 7} ${cy - 7}l-14 14" stroke="${INK}" stroke-width="3"/>`);
      if (n.type === "parallelGateway") o.push(`<path d="M${cx} ${cy - 10}v20M${cx - 10} ${cy}h20" stroke="${INK}" stroke-width="3"/>`);
      const lines = wrap(n.name ?? "", 18);
      lines.forEach((t, k) => o.push(`<text x="${cx}" y="${n.y - 6 - (lines.length - 1 - k) * 12}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${INK}">${esc(t)}</text>`));
    } else {
      const automated = ["serviceTask", "businessRuleTask", "sendTask"].includes(n.type);
      o.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="9" fill="${automated ? AUTO_FILL : HUMAN_FILL}" stroke="${automated ? RED : INK}" stroke-width="1.5"/>`);
      o.push(icon(n));
      const lines = wrap(n.name ?? "", 17).slice(0, 4);
      lines.forEach((t, k) => o.push(`<text x="${n.cx}" y="${n.cy + 4 + (k - (lines.length - 1) / 2) * 12.5}" text-anchor="middle" font-size="11" fill="${INK}">${esc(t)}</text>`));
    }
  }
  o.push(`<g transform="translate(${POOL_X},${height + 10})" font-size="10.5" fill="${INK}"><rect width="12" height="10" rx="2" fill="${HUMAN_FILL}" stroke="${INK}"/><text x="17" y="9">menselijke taak</text><rect x="110" width="12" height="10" rx="2" fill="${AUTO_FILL}" stroke="${RED}"/><text x="127" y="9">geautomatiseerd (flow, regel, AI)</text></g>`);
  o.push(`</svg>`);
  return o.join("\n") + "\n";
}
