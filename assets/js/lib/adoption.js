// Adoption Campaign Builder logic.
// Brief: Etsy's seller educational lifecycle campaign (+16% coupon adoption,
// +$12K GMS). The play: segment by adoption state, teach before you sell,
// and measure the lift against a holdout.

import { twoProportionTest, verdict } from '../core/stats.js';
import { money, num, pct, signedPct } from '../core/format.js';

export const SEGMENTS = [
  { id: 'never', label: 'Never tried', job: 'Teach why it matters, then make the first use easy.' },
  { id: 'lapsed', label: 'Tried, then stopped', job: 'Remove the reason they stopped and show what changed.' },
  { id: 'active', label: 'Using it now', job: 'Reinforce the habit and turn them into proof for others.' },
];

const fill = (tpl, c) => tpl.replace(/\{(\w+)\}/g, (_, k) => (c[k] ? c[k] : `[${k}]`));

// Stage templates per segment. {placeholders} come from the campaign inputs.
const STAGES = {
  never: [
    { stage: 'Educate', day: 0, channel: 'Email', subject: 'Why {audience} who use {feature} {outcomeShort}', body: 'Open with the job: {job}. One stat or one peer result: {proof}. No setup steps yet.', cta: 'See how it works', metric: 'Click rate' },
    { stage: 'Show', day: 3, channel: 'Email + in-product', subject: 'Set up {feature} in {setupMinutes} minutes', body: 'A 3-step how-to with screenshots or a 60-second video. End on the first action, not a feature list.', cta: 'Start setup', metric: 'Setup started' },
    { stage: 'Prove', day: 7, channel: 'Email', subject: 'How {peer} used {feature}', body: 'Short peer story: situation, what they set up, what happened. Use their words.', cta: 'Copy their setup', metric: 'Setup completed' },
    { stage: 'Nudge', day: 10, channel: 'In-product prompt', subject: '{moment}? This is when {feature} helps', body: 'Trigger at the moment of need, inside the workflow. One click to apply a sensible default.', cta: 'Try it now', metric: 'First use' },
    { stage: 'Reinforce', day: 'After first use', channel: 'Email', subject: 'Your first {feature} result', body: 'Show what their first use did (views, sales, time saved). Suggest the next step.', cta: 'Do it again', metric: 'Second use in 30 days' },
  ],
  lapsed: [
    { stage: 'Re-educate', day: 0, channel: 'Email', subject: 'What changed with {feature}', body: 'Name the likely reason they stopped ({lapseReason}) and what is different now.', cta: 'See what\'s new', metric: 'Click rate' },
    { stage: 'Show', day: 4, channel: 'Email + in-product', subject: 'A faster way to use {feature}', body: 'How-to focused on the step that tripped them up. Pre-fill settings where possible.', cta: 'Pick up where you left off', metric: 'Setup restarted' },
    { stage: 'Prove', day: 8, channel: 'Email', subject: '{peer} came back to {feature}. Here\'s what happened', body: 'Peer story from someone who also stopped and returned.', cta: 'Try their approach', metric: 'Reactivation' },
    { stage: 'Nudge', day: 12, channel: 'In-product prompt', subject: '{moment}? Turn {feature} back on', body: 'Moment-of-need prompt with a one-click restart.', cta: 'Turn it on', metric: 'Return use' },
  ],
  active: [
    { stage: 'Reinforce', day: 'Monthly', channel: 'Email digest', subject: 'Your {feature} results this month', body: 'Personal results and one advanced tip.', cta: 'Try the advanced tip', metric: 'Depth of use' },
    { stage: 'Advocate', day: 'After 3rd use', channel: 'Email / community', subject: 'Share how you use {feature}', body: 'Invite them to share a tip or a story. These become the proof for the "never tried" segment.', cta: 'Share your tip', metric: 'Stories collected' },
  ],
};

export function buildSequence(c) {
  const ctx = { ...c, outcomeShort: c.outcomeShort || 'get better results' };
  const out = [];
  for (const seg of SEGMENTS) {
    if (!(c.include || {})[seg.id]) continue;
    for (const s of STAGES[seg.id]) {
      out.push({
        segment: seg.label,
        stage: s.stage,
        day: s.day,
        channel: s.channel,
        subject: fill(s.subject, ctx),
        body: fill(s.body, ctx),
        cta: s.cta,
        metric: s.metric,
      });
    }
  }
  return out;
}

/**
 * Bottom-up impact: each segment's size x expected conversion to adopter.
 * Also reports the implied relative adoption lift vs. today's base.
 */
export function projectImpact({ totalUsers, baselineAdoption, segments, valuePerAdopterMonth, months }) {
  const rows = segments.map((s) => ({ ...s, newAdopters: Math.round((s.size || 0) * (s.conversion || 0)) }));
  const newAdopters = rows.reduce((a, r) => a + r.newAdopters, 0);
  const baseAdopters = totalUsers * baselineAdoption;
  const relLift = baseAdopters > 0 ? newAdopters / baseAdopters : null;
  return {
    rows,
    newAdopters,
    baseAdopters,
    newAdoptionRate: totalUsers > 0 ? (baseAdopters + newAdopters) / totalUsers : null,
    relLift,
    incrementalValue: newAdopters * valuePerAdopterMonth * months,
  };
}

export function measureAdoption({ controlUsers, controlAdopters, treatedUsers, treatedAdopters }) {
  const test = twoProportionTest(controlAdopters, controlUsers, treatedAdopters, treatedUsers);
  return { test, verdict: verdict(test) };
}

export function campaignMarkdown(state) {
  const c = state.campaign;
  const seq = buildSequence(c);
  const imp = projectImpact(state.impact);
  const lines = [
    `# Adoption campaign: ${c.feature || 'Untitled'}`,
    '',
    `**Audience:** ${c.audience || '-'}  `,
    `**Job it does:** ${c.job || '-'}  `,
    `**Moment of need:** ${c.moment || '-'}`,
    '',
    '## Projected impact',
    `- New adopters: **${num(imp.newAdopters)}** (${signedPct(imp.relLift)} relative adoption lift, ${pct(state.impact.baselineAdoption)} → ${pct(imp.newAdoptionRate)})`,
    `- Incremental value: **${money(imp.incrementalValue)}** over ${state.impact.months} month(s)`,
    '',
    '## Sequence',
    '',
    '| Segment | Stage | Day | Channel | Subject | CTA | Success metric |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...seq.map((s) => `| ${s.segment} | ${s.stage} | ${s.day} | ${s.channel} | ${s.subject} | ${s.cta} | ${s.metric} |`),
    '',
    '## Copy notes',
    ...seq.map((s) => `- **${s.segment} / ${s.stage}:** ${s.body}`),
  ];
  return lines.join('\n') + '\n';
}
