// Launch Lift Planner logic.
// Brief: "Know the User, Know the Magic, Connect the Two" + the 6-phase GTM
// framework, measured the way the Whoop launch was (+31% engagement, +21% usage).

import { twoProportionTest, sampleSizePerGroup, verdict } from '../core/stats.js';
import { pct, signedPct, num, pts } from '../core/format.js';

export const GOAL_TYPES = [
  { value: 'adoption', label: 'Drive new feature adoption' },
  { value: 'reengage', label: 'Re-engage churned or dormant users' },
  { value: 'netnew', label: 'Acquire net-new logos' },
  { value: 'expansion', label: 'Expand existing accounts' },
];

// Channels with the persona behavior that makes them high-intent.
export const CHANNELS = [
  { id: 'in-product', label: 'In-product notification / tour', when: 'Users are already active and the feature lives in the product.' },
  { id: 'os-surface', label: 'OS surface (widget, live activity, push)', when: 'The value shows up in the moment of use, away from the app.' },
  { id: 'lifecycle-email', label: 'Lifecycle email', when: 'Existing users who need a reason and a how-to.' },
  { id: 'linkedin', label: 'LinkedIn / exec content', when: 'B2B buyers and champions who follow peers and thought leaders.' },
  { id: 'community', label: 'Community / user groups', when: 'Power users who teach each other and amplify.' },
  { id: 'influencer', label: 'Creators / influencers', when: 'Consumer audiences who buy on trusted recommendation.' },
  { id: 'sales', label: 'Sales + CS enablement', when: 'Accounts with an owner who can drive the conversation.' },
  { id: 'pr', label: 'PR / launch event', when: 'The feature is news on its own.' },
];

export const ASSETS = [
  'Launch brief',
  'Release notes / changelog',
  'In-app tour or tooltip',
  'Demo video (under 2 min)',
  'Sales battle card',
  'One-pager',
  'Customer case study',
  'FAQ for support',
  'Launch email',
  'Social posts',
];

export const FUNCTIONS = ['Product', 'Sales', 'Marketing', 'Customer success'];

export const PHASES = [
  { id: 'goal', label: '1. Goal setting', check: (b) => !!b.goalType && !!b.goalStatement },
  { id: 'intel', label: '2. Competitive intelligence', check: (b) => (b.competitiveNotes || '').trim().length >= 20 },
  { id: 'messaging', label: '3. Messaging & positioning', check: (b) => !!b.icp && !!b.pain && !!b.magic && (b.featureBenefits || []).some((r) => r.feature && r.benefit) },
  { id: 'channels', label: '4. Channel strategy', check: (b) => (b.channels || []).length > 0 },
  { id: 'assets', label: '5. Content & assets', check: (b) => (b.assets || []).length >= 3 },
  { id: 'execution', label: '6. Execution & alignment', check: (b) => FUNCTIONS.every((f) => (b.owners || {})[f]) && !!b.launchDate },
];

/** Readiness score across the 6 GTM phases. */
export function launchReadiness(brief) {
  const results = PHASES.map((p) => ({ id: p.id, label: p.label, done: !!p.check(brief || {}) }));
  const done = results.filter((r) => r.done).length;
  return { score: done / PHASES.length, phases: results, missing: results.filter((r) => !r.done).map((r) => r.label) };
}

/** Target rate for a metric given a baseline and a relative lift goal. */
export function targetFromLift(baselineRate, relLift) {
  return baselineRate * (1 + relLift);
}

/**
 * Plan check for one metric: what target do we need, and can we detect it
 * with the audience we have?
 */
export function metricPlan({ baseline, targetLift, eligibleUsers, holdoutShare = 0.1 }) {
  const target = targetFromLift(baseline, targetLift);
  const needed = sampleSizePerGroup(baseline, targetLift);
  const holdout = Math.floor(eligibleUsers * holdoutShare);
  return {
    target,
    neededPerGroup: needed,
    holdoutUsers: holdout,
    detectable: needed != null && holdout >= needed,
  };
}

/** Lift readout for one metric: control (holdout) vs exposed. */
export function measureLift({ controlUsers, controlActive, exposedUsers, exposedActive }) {
  const test = twoProportionTest(controlActive, controlUsers, exposedActive, exposedUsers);
  return { test, verdict: verdict(test) };
}

export function buildLaunchBrief(b, metrics = {}) {
  const goal = GOAL_TYPES.find((g) => g.value === b.goalType)?.label || '-';
  const channels = CHANNELS.filter((c) => (b.channels || []).includes(c.id));
  const ready = launchReadiness(b);
  const lines = [
    `# Launch brief: ${b.feature || 'Untitled feature'}`,
    '',
    `**Launch date:** ${b.launchDate || 'TBD'}  `,
    `**Goal type:** ${goal}  `,
    `**Readiness:** ${Math.round(ready.score * 100)}% (${ready.missing.length ? 'missing: ' + ready.missing.join(', ') : 'all 6 phases covered'})`,
    '',
    '## 1. Goal',
    b.goalStatement || '-',
    '',
    '## 2. Know the user',
    `**ICP:** ${b.icp || '-'}  `,
    `**Pain today:** ${b.pain || '-'}`,
    '',
    '## 3. Know the magic',
    b.magic || '-',
    '',
    '| Feature | Benefit to the user |',
    '| --- | --- |',
    ...(b.featureBenefits || []).filter((r) => r.feature || r.benefit).map((r) => `| ${r.feature} | ${r.benefit} |`),
    '',
    '## 4. Connect the two (channels)',
    ...(channels.length ? channels.map((c) => `- **${c.label}:** ${c.when}`) : ['-']),
    '',
    '## 5. Competitive intelligence',
    b.competitiveNotes || '-',
    '',
    '## 6. Assets',
    ...((b.assets || []).length ? b.assets.map((a) => `- [ ] ${a}`) : ['-']),
    '',
    '## 7. Owners',
    ...FUNCTIONS.map((f) => `- **${f}:** ${(b.owners || {})[f] || 'unassigned'}`),
  ];

  const ms = Object.entries(metrics);
  if (ms.length) {
    lines.push('', '## 8. Success metrics');
    for (const [name, m] of ms) {
      lines.push(`- **${name}:** baseline ${pct(m.baseline)} → target ${pct(targetFromLift(m.baseline, m.targetLift))} (${signedPct(m.targetLift, 0)})`);
    }
  }
  return lines.join('\n') + '\n';
}

export function liftSummaryMarkdown(rows) {
  const out = ['| Metric | Control | Exposed | Lift | 95% CI (pts) | Verdict |', '| --- | --- | --- | --- | --- | --- |'];
  for (const r of rows) {
    const t = r.result.test;
    if (!t) continue;
    out.push(
      `| ${r.name} | ${pct(t.pA)} of ${num(r.input.controlUsers)} | ${pct(t.pB)} of ${num(r.input.exposedUsers)} | ${signedPct(t.relLift)} | ${pts(t.ciLow)} to ${pts(t.ciHigh)} | ${r.result.verdict.label} |`,
    );
  }
  return out.join('\n') + '\n';
}
