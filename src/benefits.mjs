// Benefits realisation over time: what the three cases would deliver month by month, in money, hours
// and avoided work. A SIMULATION, not a measurement: it spreads the yearly business case of
// src/metrics.mjs over a roadmap (data/assumptions.json → roadmap) with an adoption ramp, for three
// scenarios. After go-live, real measurements replace it (Dataverse table KPI-meting, bron "Meting").
// Pure ESM without imports, so the browser dashboard can load the same file.

/** Share of the full benefit reached `m` months after go-live, for a linear ramp of `rampMonths`. */
export function adoption(m, rampMonths) {
  if (m < 0) return 0;
  return Math.min(1, (m + 0.5) / rampMonths);
}

/**
 * Per case, the yearly figures the simulation needs, taken from the business case of the model:
 * benefit = the part that counts in money (time × realisation factor + hard savings), run = yearly cost
 * from go-live, oneOff = spread over the build months, and the volumes behind the hours and the work.
 */
export function yearlyInputs(model, A) {
  const f = A.common.timeRealisationFactor;
  const c1 = model.case01;
  const c2 = model.case02;
  const c3 = model.case03;
  const touched1 = (c1.counts.review + c1.counts.escalate + c1.counts.reject) / c1.n;
  return {
    case03: {
      label: "03 Materiaal", bc: c3.businessCase, hours: c3.hoursSaved,
      money: { time: c3.businessCase.timeBenefit * f, hard: c3.businessCase.hardBenefit },
      work: { label: "spoed- en foute leveringen vermeden", perYear: c3.rushAvoided + c3.wrongAvoided },
    },
    case02: {
      label: "02 Schadeclaims", bc: c2.businessCase, hours: c2.hoursSaved,
      money: { time: c2.businessCase.timeBenefit * f, hard: c2.businessCase.hardBenefit },
      work: { label: "te late verzekeringsaangiftes vermeden", perYear: c2.avoidedLate },
    },
    case01: {
      label: "01 Weegbonnen", bc: c1.businessCase, hours: c1.hoursAsIs - c1.hoursToBe,
      money: { time: c1.businessCase.timeBenefit * f, hard: c1.businessCase.hardBenefit },
      work: { label: "bonnen zonder overtypen", perYear: c1.docsYear * (1 - touched1) },
    },
  };
}

/** Month-by-month series per case and in total, for one scenario. */
export function simulate(inputs, roadmap, scenario) {
  const months = roadmap.horizonMonths;
  const cases = {};
  for (const [key, inp] of Object.entries(inputs)) {
    const { start, goLive } = roadmap[key];
    const buildMonths = Math.max(1, goLive - start);
    let cum = 0;
    let cumHours = 0;
    let cumWork = 0;
    const rows = [];
    for (let m = 0; m < months; m++) {
      const live = m >= goLive;
      const share = live ? adoption(m - goLive, scenario.rampMonths) * scenario.benefitFactor : 0;
      const benefit = ((inp.money.time + inp.money.hard) / 12) * share;
      const hours = (inp.hours / 12) * share;
      const work = (inp.work.perYear / 12) * share;
      const run = live ? inp.bc.run / 12 : 0;
      const invest = m >= start && m < goLive ? inp.bc.oneOff / buildMonths : 0;
      cum += benefit - run - invest;
      cumHours += hours;
      cumWork += work;
      rows.push({ m, benefit, run, invest, net: benefit - run - invest, cum, hours, cumHours, work, cumWork, adoption: share });
    }
    const breakEven = rows.find((r, i) => i > 0 && r.cum >= 0 && rows[i - 1].cum < 0)?.m ?? null;
    cases[key] = { label: inp.label, workLabel: inp.work.label, start: roadmap[key].start, goLive: roadmap[key].goLive, rows, breakEven, oneOff: inp.bc.oneOff, fullYear: { benefit: inp.money.time + inp.money.hard, run: inp.bc.run, hours: inp.hours, work: inp.work.perYear } };
  }
  const total = Array.from({ length: months }, (_, m) => {
    const sumOf = (k) => Object.values(cases).reduce((a, c) => a + c.rows[m][k], 0);
    return { m, benefit: sumOf("benefit"), run: sumOf("run"), invest: sumOf("invest"), net: sumOf("net"), cum: sumOf("cum"), hours: sumOf("hours"), cumHours: sumOf("cumHours") };
  });
  const breakEven = total.find((r, i) => i > 0 && r.cum >= 0 && total[i - 1].cum < 0)?.m ?? null;
  const lowest = total.reduce((lo, r) => (r.cum < lo.cum ? r : lo), total[0]);
  return { cases, total, breakEven, lowest };
}

/** All scenarios at once (what build.mjs writes to site/data/benefits.json). */
export function benefitsOverTime(model, A) {
  const inputs = yearlyInputs(model, A);
  const scenarios = Object.fromEntries(Object.entries(A.scenarios).filter(([k]) => !k.startsWith("_")).map(([k, s]) => [k, { ...s, ...simulate(inputs, A.roadmap, s) }]));
  return { horizonMonths: A.roadmap.horizonMonths, scenarios };
}
