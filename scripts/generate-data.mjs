// Generates the fictional datasets for the three cases. Deterministic (seeded), so the
// numbers in the docs stay stable. Run with `npm run data`; the output is committed.
import { writeFileSync, readFileSync } from "node:fs";

const md = JSON.parse(readFileSync(new URL("../data/master-data.json", import.meta.url)));

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20261012);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const between = (a, b) => Math.round(a + R() * (b - a));
const pad = (n, w = 2) => String(n).padStart(w, "0");
const write = (name, obj) => writeFileSync(new URL(`../data/${name}`, import.meta.url), JSON.stringify(obj, null, 2) + "\n");

// ---------------------------------------------------------------- case 01: documents
const FIELDS = ["ticketNo", "date", "plate", "customerNo", "direction", "material", "gross", "tare", "net", "idFormNo", "soilRef"];
const activeCustomers = md.customers.filter((c) => c.active && c.customerNo !== "K-1007");
const accepted = md.acceptance.accepted;
const products = md.acceptance.products;

function cleanTicket(i, opts = {}) {
  const c = opts.customer ?? pick(activeCustomers);
  const direction = opts.direction ?? (R() < 0.7 ? "in" : "uit");
  const mat = opts.material ?? (direction === "in" ? pick(accepted.filter((a) => !a.needsSoilRef)).code : pick(products).code);
  const tare = opts.tare ?? between(11800, 15400);
  const net = opts.net ?? between(6200, 27800);
  const gross = opts.gross ?? tare + net;
  const day = opts.day ?? between(5, 9);
  const truth = {
    ticketNo: opts.ticketNo ?? `WB-26-${pad(4180 + i * 7, 5)}`,
    date: `2026-10-${pad(day)}`,
    plate: opts.plate ?? pick(c.plates),
    customerNo: c.customerNo,
    direction,
    material: mat,
    gross, tare, net: gross - tare,
    idFormNo: direction === "in" ? (opts.idFormNo === undefined ? `IDF-${between(70000, 79999)}` : opts.idFormNo) : null,
    soilRef: opts.soilRef ?? null,
  };
  return truth;
}

function extractionOf(truth, overrides = {}) {
  const fields = {};
  for (const f of FIELDS) {
    fields[f] = { value: truth[f], confidence: Math.round((0.93 + R() * 0.069) * 1000) / 1000 };
  }
  for (const [f, o] of Object.entries(overrides)) fields[f] = { ...fields[f], ...o };
  return fields;
}

const docs = [];
let n = 0;
const add = (scenario, truth, overrides = {}, extra = {}) => {
  n += 1;
  docs.push({
    id: `DOC-${pad(n, 3)}`,
    channel: extra.channel ?? (R() < 0.6 ? "scan weegbrug" : "mail transporteur"),
    received: `${truth.date}T${pad(between(6, 16))}:${pad(between(0, 59))}`,
    scenario,
    truth,
    extracted: extractionOf(truth, overrides),
  });
};

// 19 clean tickets, spread over the set
const plan = [
  "clean", "clean", "low-confidence", "clean", "clean", "net-misread", "clean", "unknown-customer", "clean",
  "clean", "plate-not-linked", "clean", "asbestos", "clean", "missing-idform", "clean", "soil-without-ref",
  "clean", "duplicate", "clean", "old-ticket", "clean", "overload", "clean", "silent-plate-misread",
  "clean", "clean", "haulier", "clean", "soil-with-ref",
];
for (const scenario of plan) {
  const i = n + 1;
  switch (scenario) {
    case "clean": add(scenario, cleanTicket(i)); break;
    case "low-confidence": {
      const t = cleanTicket(i, { direction: "in", material: "17 01 07" });
      add(scenario, t, { net: { value: t.net + 600, confidence: 0.62 } }, { channel: "mail transporteur" });
      break;
    }
    case "net-misread": {
      const t = cleanTicket(i, { direction: "in", tare: 13240, net: 18350 });
      add(scenario, t, { net: { value: 13350, confidence: 0.96 } }); // 8 read as 3, high confidence
      break;
    }
    case "unknown-customer": {
      const c = md.customers.find((x) => x.customerNo === "K-1004");
      const t = cleanTicket(i, { customer: c, direction: "in", material: "17 09 04" });
      add(scenario, t, { customerNo: { value: "K-1094", confidence: 0.91 } });
      break;
    }
    case "plate-not-linked": {
      const c = md.customers.find((x) => x.customerNo === "K-1002");
      add(scenario, cleanTicket(i, { customer: c, plate: "1-VRK-377", direction: "uit" }));
      break;
    }
    case "asbestos": {
      const c = md.customers.find((x) => x.customerNo === "K-1010");
      add(scenario, cleanTicket(i, { customer: c, direction: "in", material: "17 06 05*", net: 4120 }));
      break;
    }
    case "missing-idform": {
      const c = md.customers.find((x) => x.customerNo === "K-1001");
      add(scenario, cleanTicket(i, { customer: c, direction: "in", material: "17 01 01", idFormNo: null }));
      break;
    }
    case "soil-without-ref": {
      const c = md.customers.find((x) => x.customerNo === "K-1003");
      add(scenario, cleanTicket(i, { customer: c, direction: "in", material: "17 05 04" }));
      break;
    }
    case "soil-with-ref": {
      const c = md.customers.find((x) => x.customerNo === "K-1003");
      add(scenario, cleanTicket(i, { customer: c, direction: "in", material: "17 05 04", soilRef: "TR-2026-018342" }));
      break;
    }
    case "duplicate": {
      const original = docs[3].truth; // a re-scanned copy of DOC-004
      add(scenario, { ...original }, {}, { channel: "mail transporteur" });
      break;
    }
    case "old-ticket": {
      add(scenario, cleanTicket(i, { direction: "uit", day: 1 }), {}, {});
      docs.at(-1).truth.date = "2026-08-27";
      docs.at(-1).extracted.date.value = "2026-08-27";
      docs.at(-1).received = "2026-10-08T09:12";
      break;
    }
    case "overload": {
      const c = md.customers.find((x) => x.customerNo === "K-1008");
      add(scenario, cleanTicket(i, { customer: c, direction: "uit", material: "MG-031", tare: 15100, net: 31280 }));
      break;
    }
    case "silent-plate-misread": {
      const c = md.customers.find((x) => x.customerNo === "K-1001");
      const t = cleanTicket(i, { customer: c, plate: "1-DHK-101", direction: "uit" });
      add(scenario, t, { plate: { value: "1-DHK-102", confidence: 0.97 } }); // valid plate of the same customer
      break;
    }
    case "haulier": {
      const c = md.customers.find((x) => x.customerNo === "K-1006");
      add(scenario, cleanTicket(i, { customer: c, plate: "1-ZWT-902", direction: "in", material: "17 01 02" }));
      break;
    }
  }
}
write("documents.json", { _note: "30 fictieve weegbonnen zoals de extractiestap ze zou teruggeven ('extracted', met confidence) naast de werkelijke inhoud ('truth'). 'scenario' beschrijft wat er met het document aan de hand is; de regelmotor kijkt daar niet naar.", fields: FIELDS, documents: docs });

// ---------------------------------------------------------------- case 02: claims history (AS-IS)
const CATS = [
  ["eigen-materieel", 0.3], ["gehuurd-materieel", 0.12], ["derden-schade", 0.25], ["nutsleiding", 0.18], ["eigen-werf", 0.15],
];
const CHANNELS = [["telefoon", 0.45], ["mail", 0.35], ["papier", 0.2]];
const weighted = (list) => { const r = R(); let acc = 0; for (const [v, w] of list) { acc += w; if (r <= acc) return v; } return list.at(-1)[0]; };
const claims = [];
for (let i = 1; i <= 40; i++) {
  const channel = weighted(CHANNELS);
  const category = weighted(CATS);
  const registerDays = channel === "papier" ? between(3, 12) : channel === "telefoon" ? between(1, 5) : between(0, 3);
  const incomplete = R() < (channel === "telefoon" ? 0.7 : channel === "papier" ? 0.6 : 0.4);
  const followUps = incomplete ? between(1, 4) : 0;
  const amount = category === "nutsleiding" ? between(1800, 22000) : category === "derden-schade" ? between(600, 14000) : R() < 0.15 ? between(15500, 38000) : between(400, 9000);
  const toInsurerDays = amount > 15000 || category === "derden-schade" || category === "nutsleiding" ? registerDays + between(0, 7) + followUps : null;
  const closeDays = registerDays + between(18, 110) + followUps * 6;
  const photos = channel === "telefoon" ? 0 : between(0, 4);
  claims.push({
    claimNo: `SCH-25-${pad(i, 3)}`, channel, category, project: pick(md.projects).projectNo,
    reportedOn: `2025-${pad(between(1, 12))}-${pad(between(1, 28))}`,
    daysToRegister: registerDays, incompleteFirstReport: incomplete, followUpContacts: followUps, photos,
    amount, daysToInsurer: toInsurerDays, daysToClose: closeDays,
    recovered: category === "derden-schade" || category === "nutsleiding" ? R() < 0.35 : false,
  });
}
write("claims-history.json", { _note: "40 fictieve schadedossiers uit 2025 zoals ze vandaag in een Excel-register staan (AS-IS). Dienen als nulmeting-voorbeeld, niet als echte cijfers.", claims });

// ---------------------------------------------------------------- case 03: material request history (AS-IS)
const reqChannels = [["telefoon", 0.5], ["mail", 0.3], ["whatsapp", 0.2]];
// Weighted towards what sites order most: granulates, sand, cable ducts, signage.
const requestable = Object.entries({ "MG-031": 5, "BG-040": 2, "ZS-02": 3, "SC-150": 2, "AB-4C": 2, "KB-160": 3, "BS-IC1": 2, "SB-F45": 3, "HK-350": 3, "PG-031": 1, "RB-315": 1, "RB-400": 1, "GT-525": 1 }).flatMap(([k, w]) => Array(w).fill(k));
const activeProjects = md.projects.filter((p) => p.active);
const requests = [];
for (let i = 1; i <= 60; i++) {
  const p = pick(activeProjects);
  const channel = weighted(reqChannels);
  const lines = [];
  const nLines = between(1, 3);
  for (let l = 0; l < nLines; l++) {
    const itemNo = pick(requestable);
    if (lines.some((x) => x.itemNo === itemNo)) continue;
    const item = md.catalog.find((c) => c.itemNo === itemNo);
    const qty = item.unit === "t" ? between(2, 16) * 5 : item.unit === "m3" ? between(3, 18) : item.unit === "m" ? between(2, 10) * 6 : between(2, 16);
    lines.push({ itemNo, qty });
  }
  const noticeHours = R() < 0.38 ? between(2, 40) : between(52, 220);
  const handlingHours = channel === "telefoon" ? between(1, 30) : channel === "mail" ? between(3, 48) : between(1, 20);
  requests.push({
    requestNo: `MA-25-${pad(i, 3)}`, channel, projectNo: p.projectNo, lines,
    noticeHours, // time between request and requested delivery
    handlingHours, // time until someone confirmed availability and planning
    wrongItemOrQty: R() < 0.12,
    deliveredLate: noticeHours < 48 ? R() < 0.4 : R() < 0.1,
  });
}
write("requests-history.json", { _note: "60 fictieve materiaalaanvragen (AS-IS): kanaal, verwittigingstermijn, behandeltijd en fouten. Worden in de TO-BE opnieuw door de regelmotor gestuurd (replay).", requests });

console.log(`documents: ${docs.length}, claims: ${claims.length}, requests: ${requests.length}`);
