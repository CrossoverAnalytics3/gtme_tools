// Competitive Win Room logic.
// Brief: Atlin's AI-assisted narrative positioning reached a 75% head-to-head
// win rate. Also from the brief: a "Lostbot" that audits lost deals against the
// evidence (a "lost on price" deal really had no economic buyer and a weak ROI
// case), and "Dealbots" that warn reps in real time when key steps are missing.

import { daysBetween } from '../core/format.js';

export const OUTCOMES = ['open', 'won', 'lost'];
export const LOSS_REASONS = ['Price', 'Missing feature', 'Lost to competitor', 'No decision', 'Timing', 'Other'];

export const EVIDENCE = [
  { id: 'economicBuyer', short: 'EB', label: 'Economic buyer engaged', noun: 'economic buyer engaged', driver: 'No access to the economic buyer' },
  { id: 'roiValidated', short: 'ROI', label: 'ROI case validated by the buyer', noun: 'buyer-validated ROI case', driver: 'ROI case never validated by the buyer' },
  { id: 'champion', short: 'Champ', label: 'Champion identified', noun: 'champion', driver: 'No internal champion' },
  { id: 'technicalWin', short: 'Tech', label: 'Technical win secured', noun: 'technical win', driver: 'Technical evaluation not won' },
  { id: 'mutualPlan', short: 'MAP', label: 'Mutual action plan agreed', noun: 'mutual action plan', driver: 'No mutual action plan' },
];

// Which missing evidence is consistent with each logged reason.
const REASON_EVIDENCE = {
  Price: ['roiValidated'],
  'Missing feature': ['technicalWin'],
  'Lost to competitor': ['technicalWin', 'roiValidated', 'champion'],
  'No decision': ['economicBuyer', 'champion', 'mutualPlan'],
  Timing: ['mutualPlan', 'economicBuyer'],
  Other: [],
};

export const DEFAULT_DEALBOT_RULES = {
  economicBuyer: 30,
  champion: 21,
  roiValidated: 45,
  mutualPlan: 14,
  technicalWin: 60,
};

const NEXT_STEP = {
  economicBuyer: 'Ask your champion for a 30-minute ROI review with the budget owner.',
  champion: 'Find the person who loses the most if this doesn\'t happen and give them something to forward.',
  roiValidated: 'Build the ROI case with the buyer\'s numbers, not ours, and get them to say it back.',
  mutualPlan: 'Send a one-page mutual action plan with dates working back from their go-live.',
  technicalWin: 'Book a working session on their architecture, whiteboard it together, and agree on success criteria.',
};

const isH2H = (d) => !!(d.competitor && d.competitor.trim());
const rate = (won, total) => (total ? won / total : null);

export function winRates(deals) {
  const closed = deals.filter((d) => d.outcome === 'won' || d.outcome === 'lost');
  const h2h = closed.filter(isH2H);
  const won = (arr) => arr.filter((d) => d.outcome === 'won').length;

  const byCompetitor = {};
  for (const d of h2h) {
    const k = d.competitor.trim();
    byCompetitor[k] ??= { competitor: k, won: 0, lost: 0 };
    byCompetitor[k][d.outcome]++;
  }
  const competitors = Object.values(byCompetitor)
    .map((c) => ({ ...c, total: c.won + c.lost, rate: rate(c.won, c.won + c.lost) }))
    .sort((a, b) => b.total - a.total);

  const withN = h2h.filter((d) => d.narrativeUsed);
  const withoutN = h2h.filter((d) => !d.narrativeUsed);

  return {
    closed: closed.length,
    overall: rate(won(closed), closed.length),
    h2hTotal: h2h.length,
    h2hWon: won(h2h),
    h2h: rate(won(h2h), h2h.length),
    competitors,
    withNarrative: { total: withN.length, won: won(withN), rate: rate(won(withN), withN.length) },
    withoutNarrative: { total: withoutN.length, won: won(withoutN), rate: rate(won(withoutN), withoutN.length) },
  };
}

/** The Lostbot: compare the logged reason to what the deal evidence shows. */
export function lostbotAudit(deal) {
  const ev = deal.evidence || {};
  const gaps = EVIDENCE.filter((e) => !ev[e.id]);
  if (!gaps.length) {
    return { deal, gaps, primary: null, mismatch: false, finding: `Every step was covered. "${deal.loggedReason || 'Unlogged'}" is probably the real reason.` };
  }
  const primary = gaps[0];
  const consistent = REASON_EVIDENCE[deal.loggedReason] || [];
  const mismatch = !deal.loggedReason || !consistent.includes(primary.id);
  let finding = `${primary.driver}.`;
  if (deal.loggedReason === 'Price' && (!ev.economicBuyer || !ev.roiValidated)) {
    finding = `Logged as price, but ${!ev.economicBuyer ? 'nobody with budget authority was engaged' : 'the buyer never validated the ROI'}. Price is usually the polite reason when value wasn't proven to the person who signs.`;
  } else if (mismatch) {
    finding = `Logged as "${deal.loggedReason || 'nothing'}", but the evidence points to: ${primary.driver.toLowerCase()}.`;
  }
  return { deal, gaps, primary, mismatch, finding };
}

export function lostbotSummary(deals) {
  const lost = deals.filter((d) => d.outcome === 'lost');
  const audits = lost.map(lostbotAudit);
  const drivers = {};
  for (const a of audits) for (const g of a.gaps) drivers[g.driver] = (drivers[g.driver] || 0) + 1;
  const logged = {};
  for (const d of lost) logged[d.loggedReason || 'Unlogged'] = (logged[d.loggedReason || 'Unlogged'] || 0) + 1;
  return {
    audits,
    lost: lost.length,
    mismatches: audits.filter((a) => a.mismatch).length,
    drivers: Object.entries(drivers).map(([driver, count]) => ({ driver, count })).sort((a, b) => b.count - a.count),
    logged: Object.entries(logged).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
  };
}

/** The Dealbot: alerts for open deals past the day limits without key steps. */
export function dealbotAlerts(deals, today, rules = DEFAULT_DEALBOT_RULES) {
  const alerts = [];
  for (const d of deals.filter((x) => x.outcome === 'open')) {
    const days = daysBetween(d.openedOn, today);
    if (days == null) continue;
    for (const e of EVIDENCE) {
      const limit = rules[e.id];
      if (limit == null || (d.evidence || {})[e.id] || days < limit) continue;
      const over = days - limit;
      const severity = over >= 14 ? 'critical' : 'warning';
      const message = `${d.name} is ${days} days in with no ${e.noun} (limit ${limit} days).`;
      alerts.push({
        deal: d,
        evidence: e.id,
        days,
        severity,
        message,
        nextStep: NEXT_STEP[e.id],
        slack: `${severity === 'critical' ? ':rotating_light:' : ':warning:'} *${d.name}*${d.owner ? ` (<@${d.owner}>)` : ''}: ${days} days in, no ${e.noun}. Next step: ${NEXT_STEP[e.id]}`,
      });
    }
  }
  return alerts.sort((a, b) => (a.severity === b.severity ? b.days - a.days : a.severity === 'critical' ? -1 : 1));
}

export function battlecardMarkdown(card) {
  const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const out = [
    `# Battlecard: us vs. ${card.competitor || '[competitor]'}`,
    '',
    `**Last updated:** ${card.updatedOn || '-'}`,
    '',
    '## Their pitch',
    card.theirPitch || '-',
    '',
    '## Where they win',
    ...lines(card.whereTheyWin).map((x) => `- ${x}`),
    '',
    '## Where we win',
    ...lines(card.whereWeWin).map((x) => `- ${x}`),
    '',
    '## Landmines (questions to plant early)',
    ...lines(card.landmines).map((x) => `- ${x}`),
    '',
    '## Objections',
  ];
  for (const l of lines(card.objections)) {
    const [obj, resp] = l.split('=>').map((x) => x.trim());
    out.push(`- **"${obj}"** → ${resp || '[response]'}`);
  }
  out.push('', '## Proof', ...lines(card.proof).map((x) => `- ${x}`), '');
  return out.join('\n');
}

/** Prompt that pressure-tests a battlecard against a simulated buyer. */
export function simulationPrompt(card, persona = 'VP Engineering at a 1,000-person company') {
  return `Act as a skeptical ${persona} who is evaluating us against ${card.competitor || 'a competitor'} in a head-to-head bake-off. You are measured on avoiding risk: a failed rollout or a missed revenue target would hurt your career.

Here is what ${card.competitor || 'the competitor'} told you: ${card.theirPitch || '(not provided)'}

Here is our positioning and proof:
${battlecardMarkdown(card)}

Do three things:
1. List the 5 questions you would ask us that are hardest to answer, ranked by how much they would decide the deal.
2. For each objection in the battlecard, say whether our response would convince you, and why or why not.
3. Tell us the single biggest risk you still see in choosing us, and what proof would remove it.

Be blunt. Don't be polite on our behalf.`;
}
