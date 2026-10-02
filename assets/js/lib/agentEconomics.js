// Agent Economics Model logic.
// Brief: Vercel's inbound agent costs ~$1,000/year in compute. 10 SDRs became
// 1 QA SDR + agent, and 9 SDRs moved to outbound.
//
// Two lenses: what inbound qualification costs before vs. after, and what the
// freed SDRs produce in outbound pipeline.

import { money, num, pct } from '../core/format.js';

export function costPerLead({ callsPerLead, inputTokensPerCall, outputTokensPerCall, priceInPerM, priceOutPerM, enrichmentPerLead = 0 }) {
  const model = (callsPerLead * (inputTokensPerCall * priceInPerM + outputTokensPerCall * priceOutPerM)) / 1e6;
  return { model, total: model + (enrichmentPerLead || 0) };
}

export function annualCompute(agent, tokenMultiplier = 1) {
  const per = costPerLead({
    ...agent,
    inputTokensPerCall: agent.inputTokensPerCall * tokenMultiplier,
    outputTokensPerCall: agent.outputTokensPerCall * tokenMultiplier,
  });
  const leadsYear = agent.leadsPerMonth * 12;
  return {
    perLead: per.total,
    modelPerLead: per.model,
    leadsYear,
    annual: leadsYear * per.total + (agent.infraMonthly || 0) * 12,
  };
}

export function inboundCost({ before, agent, after }) {
  const compute = annualCompute(agent);
  const beforeCost = before.sdrs * before.sdrLoadedCost;
  const gtmeOngoing = after.gtmeAnnualCost * after.gtmeShareOnAgent;
  const afterCost = after.qaSdrs * before.sdrLoadedCost + compute.annual + gtmeOngoing;
  const buildCost = (after.gtmeAnnualCost * after.buildWeeks) / 52;
  const annualSavings = beforeCost - afterCost;
  const paybackMonths = annualSavings > 0 ? buildCost / (annualSavings / 12) : null;
  return {
    compute,
    beforeCost,
    afterCost,
    gtmeOngoing,
    buildCost,
    annualSavings,
    paybackMonths,
    costPerLeadBefore: compute.leadsYear > 0 ? beforeCost / compute.leadsYear : null,
    costPerLeadAfter: compute.leadsYear > 0 ? afterCost / compute.leadsYear : null,
    computeShareOfAfter: afterCost > 0 ? compute.annual / afterCost : 0,
  };
}

/**
 * Outbound pipeline from redeployed SDRs over the first year.
 * Ramp months count at half productivity.
 */
export function redeployment({ redeployedSdrs, meetingsPerSdrMonth, meetingToOpp, winRate, acv, rampMonths }) {
  const effectiveMonths = Math.max(0, 12 - Math.min(rampMonths, 12) * 0.5);
  const meetings = redeployedSdrs * meetingsPerSdrMonth * effectiveMonths;
  const opps = meetings * meetingToOpp;
  return {
    effectiveMonths,
    meetings,
    opps,
    pipeline: opps * acv,
    bookings: opps * winRate * acv,
  };
}

export function sensitivity(agent, multipliers = [1, 2, 5, 10]) {
  return multipliers.map((m) => ({ multiplier: m, ...annualCompute(agent, m) }));
}

export function businessCaseMarkdown(s) {
  const c = inboundCost(s);
  const r = redeployment(s.redeploy);
  return [
    '# Inbound agent business case',
    '',
    '## Compute',
    `- ${num(c.compute.leadsYear)} leads/year × ${money(c.compute.perLead, 4)} per lead = **${money(c.compute.annual)} / year**`,
    `- ${s.agent.callsPerLead} model call(s) per lead, ~${num(s.agent.inputTokensPerCall)} input + ${num(s.agent.outputTokensPerCall)} output tokens per call`,
    '',
    '## Inbound qualification cost',
    `| | Before | After |`,
    `| --- | --- | --- |`,
    `| People | ${s.before.sdrs} SDRs | ${s.after.qaSdrs} QA SDR(s) + ${pct(s.after.gtmeShareOnAgent, 0)} of a GTME |`,
    `| Annual cost | ${money(c.beforeCost)} | ${money(c.afterCost)} |`,
    `| Cost per lead | ${money(c.costPerLeadBefore, 2)} | ${money(c.costPerLeadAfter, 2)} |`,
    '',
    `- One-time build: ${s.after.buildWeeks} GTME weeks ≈ ${money(c.buildCost)}`,
    `- Annual savings on inbound: **${money(c.annualSavings)}**; payback in ${c.paybackMonths == null ? 'n/a' : num(c.paybackMonths, 1) + ' months'}`,
    '',
    '## Redeployment upside (year 1)',
    `- ${s.redeploy.redeployedSdrs} SDRs to outbound → ${num(r.meetings)} meetings → ${num(r.opps)} opportunities`,
    `- Pipeline: **${money(r.pipeline)}**; expected bookings: **${money(r.bookings)}**`,
    '',
  ].join('\n');
}
