// One model for every number in the docs and on the site. scripts/build.mjs writes the
// formatted values into <!--n:key-->…<!--/n--> markers; CI fails when a document drifts.

import { nl, sum } from "./common.mjs";
import * as D from "./documents.mjs";
import * as C from "./claims.mjs";
import * as M from "./materials.mjs";

export const NOW = "2026-10-12T08:00";

/**
 * Conservative business case. Time savings count only for the share that is really redeployed
 * (timeRealisationFactor); hard savings count fully. Year 1 reaches only rampUpYear1 of the benefit.
 * One-off = external/implementation days + internal hours (key users, UAT, training).
 * Run = licences/consumption + yearly maintenance as a share of the one-off cost.
 */
function businessCase({ timeBenefit, hardBenefit, run, days, internalHours }, A) {
  const c = A.common;
  const oneOff = days * c.implementationDayRate + internalHours * c.siteManagerCostPerHour;
  const benefit = timeBenefit * c.timeRealisationFactor + hardBenefit;
  const runTotal = run + oneOff * c.maintenanceShareOfOneOff;
  const net = benefit - runTotal;
  const years = c.horizonYears;
  return {
    timeBenefit, hardBenefit, benefit, run: runTotal, oneOff, netPerYear: net,
    paybackMonths: net > 0 ? 12 * (oneOff <= net * c.rampUpYear1 ? oneOff / (net * c.rampUpYear1) : 1 + (oneOff - net * c.rampUpYear1) / net) : Infinity,
    netOverHorizon: net * (c.rampUpYear1 + years - 1) - oneOff,
  };
}

export function compute({ master, documents, claimsHistory, requestsHistory, assumptions: A }) {
  const platformShare = (A.platform.siteUsers + A.platform.officeUsers) * A.platform.powerAppsPremiumPerUserMonth * 12 / A.platform.casesSharing;

  // ---------------- case 01
  const results = D.processBatch(documents, master);
  const count = (d) => results.filter((r) => r.decision === d).length;
  const n1 = results.length;
  const mix = { auto: count("auto") / n1, review: count("review") / n1, escalate: count("escalate") / n1, reject: count("reject") / n1 };
  const acc = D.fieldAccuracy(documents);
  const silent = D.silentErrors(documents, results);
  const a1 = A.case01;
  const docsYear = a1.documentsPerDay * A.common.workingDaysPerYear;
  const hoursAsIs = docsYear * a1.manualMinutesPerDocument / 60;
  const minutesToBe = sum(Object.entries(mix).map(([k, share]) => share * a1.minutes[k]));
  const hoursToBe = docsYear * minutesToBe / 60 + docsYear * a1.auditSampleShare * 1 / 60;
  const bc1 = businessCase({
    timeBenefit: (hoursAsIs - hoursToBe) * A.common.adminCostPerHour,
    hardBenefit: 0,
    run: docsYear * a1.extractionCostPerPage + a1.powerAutomateProcessPerMonth * 12 + platformShare,
    days: a1.implementationDays, internalHours: a1.internalHours,
  }, A);
  const rulesFired = Object.fromEntries(D.RULES.map((r) => [r.id, results.filter((x) => x.findings.some((f) => f.rule === r.id)).length]));

  // ---------------- case 02
  const b2 = C.baseline(claimsHistory);
  const a2 = A.case02;
  const minutesAsIs2 = a2.registerMinutesAsIs + b2.avgFollowUps * a2.followUpMinutes;
  const minutesToBe2 = a2.registerMinutesToBe + a2.followUpsToBe * a2.followUpMinutes;
  const insuredPerYear = a2.claimsPerYear * b2.insuredCount / b2.n;
  const lateShareAsIs = b2.lateInsurerCount / b2.insuredCount;
  const avoidedLate = insuredPerYear * (lateShareAsIs - a2.lateDeclarationShareToBe);
  const hoursSaved2 = a2.claimsPerYear * (minutesAsIs2 - minutesToBe2) / 60;
  const bc2 = businessCase({
    timeBenefit: hoursSaved2 * A.common.siteManagerCostPerHour,
    hardBenefit: avoidedLate * a2.avgLossPerLateDeclaration,
    run: platformShare,
    days: a2.implementationDays, internalHours: a2.internalHours,
  }, A);
  // Sensitivity: the loss per late declaration is the weakest assumption. At which value does the case break even?
  const breakEvenLoss2 = Math.max(0, (bc2.run - bc2.timeBenefit * A.common.timeRealisationFactor) / avoidedLate);
  const samples = C.SAMPLE_REPORTS.map((r) => ({ clientId: r.clientId, category: r.category, ...C.triage(r, master) }));

  // ---------------- case 03
  const b3 = M.baseline(requestsHistory);
  const rp = M.replay(requestsHistory, master, NOW);
  const a3 = A.case03;
  const autoShare = rp.auto / rp.n;
  const minutesToBe3 = autoShare * a3.handlingMinutesToBe.automatisch + (1 - autoShare) * a3.handlingMinutesToBe.goedkeuring;
  const hoursSaved3 = a3.requestsPerYear * (a3.handlingMinutesAsIs - minutesToBe3) / 60;
  const rushAvoided = a3.requestsPerYear * Math.max(0, b3.rushShare - a3.rushShareTarget);
  const wrongAvoided = a3.requestsPerYear * Math.max(0, b3.wrongShare - a3.wrongShareTarget);
  const bc3 = businessCase({
    timeBenefit: hoursSaved3 * A.common.adminCostPerHour,
    hardBenefit: rushAvoided * a3.rushExtraTransportCost + wrongAvoided * a3.wrongDeliveryCost,
    run: a3.powerAutomateProcessPerMonth * 12 + a3.integrationRunCostPerYear + platformShare,
    days: a3.implementationDays, internalHours: a3.internalHours,
  }, A);
  // Sensitivity: what if planning discipline does not improve and the rush share stays as is?
  const noRushChange3 = bc3.benefit - rushAvoided * a3.rushExtraTransportCost - bc3.run;

  const model = {
    case01: { n: n1, counts: { auto: count("auto"), review: count("review"), escalate: count("escalate"), reject: count("reject") }, accuracy: acc, silent, rulesFired, docsYear, hoursAsIs, hoursToBe, businessCase: bc1, results },
    case02: { baseline: b2, minutesAsIs: minutesAsIs2, minutesToBe: minutesToBe2, hoursSaved: hoursSaved2, avoidedLate, lateShareAsIs, samples, businessCase: bc2, breakEvenLoss: breakEvenLoss2 },
    case03: { baseline: b3, replay: { ...rp, results: undefined }, minutesToBe: minutesToBe3, hoursSaved: hoursSaved3, rushAvoided, wrongAvoided, businessCase: bc3, netWithoutRushChange: noRushChange3 },
    platform: { licenseYear: platformShare * A.platform.casesSharing, users: A.platform.siteUsers + A.platform.officeUsers },
  };
  return { model, facts: facts(model, A) };
}

function bcFacts(prefix, bc) {
  return {
    [`${prefix}.timeBenefit`]: nl.eur(bc.timeBenefit),
    [`${prefix}.hardBenefit`]: nl.eur(bc.hardBenefit),
    [`${prefix}.benefit`]: nl.eur(bc.benefit),
    [`${prefix}.run`]: nl.eur(bc.run),
    [`${prefix}.oneOff`]: nl.eur(bc.oneOff),
    [`${prefix}.netYear`]: nl.eur(bc.netPerYear),
    [`${prefix}.payback`]: Number.isFinite(bc.paybackMonths) ? `${nl.dec(bc.paybackMonths, 1)} maanden` : "geen terugverdientijd",
    [`${prefix}.net3y`]: nl.eur(bc.netOverHorizon),
  };
}

function facts(m, A) {
  const c1 = m.case01, c2 = m.case02, c3 = m.case03;
  return {
    "c1.n": String(c1.n),
    "c1.auto": String(c1.counts.auto),
    "c1.review": String(c1.counts.review),
    "c1.escalate": String(c1.counts.escalate),
    "c1.reject": String(c1.counts.reject),
    "c1.autoPct": nl.pct(c1.counts.auto / c1.n),
    "c1.touchPct": nl.pct((c1.n - c1.counts.auto) / c1.n),
    "c1.fields": nl.int(c1.accuracy.total),
    "c1.fieldsWrong": String(c1.accuracy.wrong.length),
    "c1.accuracy": nl.pct(c1.accuracy.rate),
    "c1.caught": String(c1.accuracy.wrong.length - c1.silent.length),
    "c1.silent": String(c1.silent.length),
    "c1.rules": String(Object.keys(c1.rulesFired).length),
    "c1.docsYear": nl.int(c1.docsYear),
    "c1.hoursAsIs": nl.int(c1.hoursAsIs),
    "c1.hoursToBe": nl.int(c1.hoursToBe),
    "c1.hoursSaved": nl.int(c1.hoursAsIs - c1.hoursToBe),
    ...bcFacts("c1.bc", c1.businessCase),

    "c2.n": String(c2.baseline.n),
    "c2.phone": String(c2.baseline.byChannel.telefoon),
    "c2.mail": String(c2.baseline.byChannel.mail),
    "c2.paper": String(c2.baseline.byChannel.papier),
    "c2.medianRegister": `${nl.dec(c2.baseline.medianDaysToRegister, 0)} dagen`,
    "c2.incomplete": nl.pct(c2.baseline.incompleteShare, 0),
    "c2.noPhoto": nl.pct(c2.baseline.withoutPhotoShare, 0),
    "c2.followUps": nl.dec(c2.baseline.avgFollowUps, 1),
    "c2.medianClose": `${nl.dec(c2.baseline.medianDaysToClose, 0)} dagen`,
    "c2.insured": String(c2.baseline.insuredCount),
    "c2.lateInsurer": String(c2.baseline.lateInsurerCount),
    "c2.latePct": nl.pct(c2.lateShareAsIs, 0),
    "c2.recoverable": String(c2.baseline.recoverableCount),
    "c2.total": nl.eur(c2.baseline.totalAmount),
    "c2.minAsIs": nl.int(c2.minutesAsIs),
    "c2.minToBe": nl.int(c2.minutesToBe),
    "c2.hoursSaved": nl.int(c2.hoursSaved),
    "c2.avoidedLate": nl.int(c2.avoidedLate),
    "c2.lateTarget": nl.pct(A.case02.lateDeclarationShareToBe, 0),
    "c2.breakEvenLoss": nl.eur(c2.breakEvenLoss),
    "c2.lossAssumption": nl.eur(A.case02.avgLossPerLateDeclaration),
    ...bcFacts("c2.bc", c2.businessCase),

    "c3.n": String(c3.baseline.n),
    "c3.phone": String(c3.baseline.byChannel.telefoon),
    "c3.mail": String(c3.baseline.byChannel.mail),
    "c3.whatsapp": String(c3.baseline.byChannel.whatsapp),
    "c3.rushPct": nl.pct(c3.baseline.rushShare, 0),
    "c3.rushTarget": nl.pct(A.case03.rushShareTarget, 0),
    "c3.medianHandling": `${nl.dec(c3.baseline.medianHandlingHours, 0)} uur`,
    "c3.wrongPct": nl.pct(c3.baseline.wrongShare, 1),
    "c3.latePct": nl.pct(c3.baseline.lateShare, 0),
    "c3.lateRushPct": nl.pct(c3.baseline.lateRushShare, 0),
    "c3.auto": String(c3.replay.auto),
    "c3.rush": String(c3.replay.rush),
    "c3.autoPct": nl.pct(c3.replay.auto / c3.replay.n, 0),
    "c3.pl": String(c3.replay.pl),
    "c3.plDept": String(c3.replay.plAndDept),
    "c3.overBudget": String(c3.replay.overBudget),
    "c3.withPurchase": String(c3.replay.withPurchase),
    "c3.lines": String(c3.replay.lines),
    "c3.internalLines": String(c3.replay.internalLines),
    "c3.covered": String(c3.replay.internalCoveredLines),
    "c3.alternatives": String(c3.replay.alternatives),
    "c3.minToBe": nl.dec(c3.minutesToBe, 1),
    "c3.hoursSaved": nl.int(c3.hoursSaved),
    "c3.rushAvoided": nl.int(c3.rushAvoided),
    "c3.wrongAvoided": nl.int(c3.wrongAvoided),
    "c3.netNoRush": nl.eur(c3.netWithoutRushChange),
    ...bcFacts("c3.bc", c3.businessCase),

    "p.licenseYear": nl.eur(m.platform.licenseYear),
    "p.users": String(m.platform.users),
    "a.realisation": nl.pct(A.common.timeRealisationFactor, 0),
    "a.ramp": nl.pct(A.common.rampUpYear1, 0),
    "a.dayRate": nl.eur(A.common.implementationDayRate),
    "p.benefit": nl.eur(c1.businessCase.benefit + c2.businessCase.benefit + c3.businessCase.benefit),
    "p.netYear": nl.eur(c1.businessCase.netPerYear + c2.businessCase.netPerYear + c3.businessCase.netPerYear),
    "p.oneOff": nl.eur(c1.businessCase.oneOff + c2.businessCase.oneOff + c3.businessCase.oneOff),
  };
}
