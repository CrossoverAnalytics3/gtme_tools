import { mountTool } from '../core/shell.js';
import { h, field, textInput, textArea, numberInput, percentInput, dateInput, select, checkbox, button, stat, pill, callout, table, replaceChildren, tabs } from '../core/dom.js';
import { pct, signedPct, num, pts } from '../core/format.js';
import { GOAL_TYPES, CHANNELS, ASSETS, FUNCTIONS, launchReadiness, metricPlan, measureLift, buildLaunchBrief, liftSummaryMarkdown, targetFromLift } from '../lib/launch.js';

const blankMetric = (name) => ({
  name,
  definition: '',
  baseline: 0.2,
  targetLift: 0.2,
  eligibleUsers: 50000,
  holdoutShare: 0.1,
  controlUsers: 0,
  controlActive: 0,
  exposedUsers: 0,
  exposedActive: 0,
});

const defaults = {
  brief: {
    feature: '',
    launchDate: '',
    goalType: 'adoption',
    goalStatement: '',
    icp: '',
    pain: '',
    magic: '',
    featureBenefits: [{ feature: '', benefit: '' }],
    channels: [],
    assets: [],
    owners: {},
    competitiveNotes: '',
  },
  metrics: [blankMetric('Engagement'), blankMetric('Feature usage')],
};

// Reconstruction of the Whoop launch from the brief, for illustration.
const example = {
  brief: {
    feature: 'Live heart rate zones on the Lock Screen and Dynamic Island',
    launchDate: '2026-11-03',
    goalType: 'adoption',
    goalStatement: 'Lift weekly engagement among iPhone members by 25%+ and feature usage of HR zones by 15%+ within 60 days, measured against a 10% holdout.',
    icp: 'iPhone members who log 3+ workouts a week and glance at their phone mid-workout (gym and run training, 25 to 44).',
    pain: 'To see which zone they are in, they have to unlock the phone and open the app mid-set. Most stop checking, so zone training never becomes a habit.',
    magic: 'Know your zone at a glance without breaking the workout.',
    featureBenefits: [
      { feature: 'Live Activity on the Dynamic Island', benefit: 'Glance down and know you are in zone 3 without stopping your set.' },
      { feature: 'Color-coded zones', benefit: 'Know instantly whether to push harder or back off.' },
      { feature: 'Auto-starts with a detected workout', benefit: 'Nothing to set up. It is there the moment you train.' },
    ],
    channels: ['in-product', 'os-surface', 'lifecycle-email', 'community', 'influencer'],
    assets: ['Launch brief', 'Release notes / changelog', 'In-app tour or tooltip', 'Demo video (under 2 min)', 'Launch email', 'Social posts', 'FAQ for support'],
    owners: { Product: 'Mobile PM (iOS)', Sales: 'Partnerships lead (gyms + teams)', Marketing: 'PMM, member engagement', 'Customer success': 'Member support lead' },
    competitiveNotes: 'Smartwatches show HR natively, but members who train with a phone and a strap have no glanceable view. Reddit threads ask for this weekly. Win the phone-first trainer.',
  },
  metrics: [
    {
      name: 'Engagement',
      definition: 'Members who open the app or interact with the Live Activity on 5+ days per week',
      baseline: 0.3,
      targetLift: 0.25,
      eligibleUsers: 200000,
      holdoutShare: 0.1,
      controlUsers: 20000,
      controlActive: 6000,
      exposedUsers: 180000,
      exposedActive: 70740,
    },
    {
      name: 'Feature usage',
      definition: 'Members who train with HR zones visible at least once per week',
      baseline: 0.2,
      targetLift: 0.15,
      eligibleUsers: 200000,
      holdoutShare: 0.1,
      controlUsers: 20000,
      controlActive: 4000,
      exposedUsers: 180000,
      exposedActive: 43560,
    },
  ],
};

function markdown(state) {
  const metrics = Object.fromEntries(state.metrics.map((m) => [m.name, m]));
  const rows = state.metrics.map((m) => ({ name: m.name, input: m, result: measureLift(m) })).filter((r) => r.result.test);
  let md = buildLaunchBrief(state.brief, metrics);
  if (rows.length) md += '\n## 9. Results vs. holdout\n\n' + liftSummaryMarkdown(rows);
  return md;
}

mountTool('launch-lift', {
  defaults,
  example,
  markdown,
  render(app, ctx) {
    tabs(
      app,
      [
        { id: 'brief', label: '1. Launch brief', render: (p) => renderBrief(p, ctx) },
        { id: 'targets', label: '2. Targets', render: (p) => renderTargets(p, ctx) },
        { id: 'measure', label: '3. Measure lift', render: (p) => renderMeasure(p, ctx) },
        { id: 'preview', label: 'Preview', render: (p) => renderPreview(p, ctx) },
      ],
      'launch-lift',
    );
  },
});

function renderBrief(panel, ctx) {
  const b = ctx.state.brief;
  const readinessBox = h('div');
  const set = (k) => (v) => {
    b[k] = v;
    ctx.save();
    drawReadiness();
  };

  function drawReadiness() {
    const r = launchReadiness(b);
    replaceChildren(
      readinessBox,
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h3', { class: 'mt-0' }, 'Launch readiness'), h('strong', null, `${Math.round(r.score * 100)}%`)),
      h('div', { class: 'meter', 'aria-hidden': 'true' }, h('div', { style: { width: `${r.score * 100}%` } })),
      h(
        'ul',
        { class: 'list-tight mt', style: { listStyle: 'none', paddingLeft: 0 } },
        r.phases.map((p) => h('li', null, pill(p.done ? 'Done' : 'Open', p.done ? 'good' : 'warn'), ' ', p.label)),
      ),
    );
  }

  const fbBox = h('div');
  function drawFB() {
    replaceChildren(
      fbBox,
      table(
        [
          { label: 'Feature (what it is)', render: (r) => textInput(r.feature, (v) => { r.feature = v; ctx.save(); drawReadiness(); }, { placeholder: 'Live Activity on the Dynamic Island' }) },
          { label: 'Benefit (what it does for them)', render: (r) => textInput(r.benefit, (v) => { r.benefit = v; ctx.save(); drawReadiness(); }, { placeholder: 'Know your zone without stopping' }) },
          { label: '', render: (_, i) => button('Remove', () => { b.featureBenefits.splice(i, 1); ctx.save(); drawFB(); drawReadiness(); }, 'ghost sm danger') },
        ],
        b.featureBenefits,
      ),
      button('+ Add feature', () => { b.featureBenefits.push({ feature: '', benefit: '' }); ctx.save(); drawFB(); }, 'sm mt'),
    );
  }

  const toggleIn = (list, id) => (on) => {
    const arr = b[list];
    const i = arr.indexOf(id);
    if (on && i < 0) arr.push(id);
    if (!on && i >= 0) arr.splice(i, 1);
    ctx.save();
    drawReadiness();
  };

  panel.append(
    h(
      'div',
      { class: 'grid grid-3' },
      h(
        'div',
        { class: 'stack', style: { gridColumn: 'span 2' } },
        h(
          'div',
          { class: 'card stack' },
          h('h3', null, 'Goal'),
          h('div', { class: 'grid grid-2' },
            field('Feature or launch name', textInput(b.feature, set('feature'), { placeholder: 'HR zones on the Lock Screen' })),
            field('Launch date', dateInput(b.launchDate, set('launchDate'))),
          ),
          field('Goal type', select(GOAL_TYPES, b.goalType, set('goalType'))),
          field('Goal statement', textArea(b.goalStatement, set('goalStatement'), { placeholder: 'Lift weekly engagement among X by 25% within 60 days, measured against a 10% holdout.' }), 'Name the audience, the metric, the size of the move and the time window.'),
        ),
        h(
          'div',
          { class: 'card stack' },
          h('h3', null, 'Know the user'),
          field('ICP: who exactly is this for?', textArea(b.icp, set('icp'), { placeholder: 'Specific enough that you could find 5 of them by Friday.' })),
          field('Their pain today', textArea(b.pain, set('pain'), { placeholder: 'What they do now, and what it costs them.' })),
        ),
        h(
          'div',
          { class: 'card stack' },
          h('h3', null, 'Know the magic'),
          field('The value prop in one line', textInput(b.magic, set('magic'), { placeholder: 'Know your zone at a glance without breaking the workout.' }), 'Say what changes in their day. Skip the spec sheet.'),
          h('h4', null, 'Feature → benefit'),
          fbBox,
        ),
        h(
          'div',
          { class: 'card stack' },
          h('h3', null, 'Connect the two: channels'),
          h('p', { class: 'small muted' }, 'Pick channels where this ICP already pays attention. The note says when each one works.'),
          h('div', { class: 'grid grid-2' },
            CHANNELS.map((c) => h('div', null, checkbox(b.channels.includes(c.id), toggleIn('channels', c.id), c.label), h('div', { class: 'small muted', style: { marginLeft: '22px' } }, c.when))),
          ),
        ),
        h(
          'div',
          { class: 'card stack' },
          h('h3', null, 'Competitive intelligence'),
          field('Gaps, competitor positioning, win/loss notes', textArea(b.competitiveNotes, set('competitiveNotes'), { placeholder: 'Sources: G2, Reddit, sales call transcripts, churn surveys.' })),
        ),
        h(
          'div',
          { class: 'card stack' },
          h('h3', null, 'Assets and owners'),
          h('div', { class: 'grid grid-2' }, ASSETS.map((a) => checkbox(b.assets.includes(a), toggleIn('assets', a), a))),
          h('h4', { class: 'mt' }, 'Cross-functional owners'),
          h('div', { class: 'grid grid-2' }, FUNCTIONS.map((f) => field(f, textInput(b.owners[f], (v) => { b.owners[f] = v; ctx.save(); drawReadiness(); }, { placeholder: 'Name or role' })))),
        ),
      ),
      h('div', null, h('div', { class: 'card', style: { position: 'sticky', top: '70px' } }, readinessBox)),
    ),
  );
  drawFB();
  drawReadiness();
}

function renderTargets(panel, ctx) {
  panel.append(
    callout('Set targets before launch. If your holdout is too small to detect the lift you want, you will ship and never know if it worked.'),
  );
  const grid = h('div', { class: 'grid grid-2' });
  panel.append(grid);
  for (const m of ctx.state.metrics) {
    const out = h('div', { class: 'stack mt' });
    const draw = () => {
      const plan = metricPlan(m);
      replaceChildren(
        out,
        h('div', { class: 'grid grid-2' },
          stat('Target rate', pct(plan.target), `from ${pct(m.baseline)} baseline`),
          stat('Holdout users', num(plan.holdoutUsers), `${pct(m.holdoutShare, 0)} of eligible`),
        ),
        plan.neededPerGroup == null
          ? callout('Enter a baseline between 0% and 100% and a non-zero lift.', 'warn')
          : callout(
              plan.detectable
                ? `Detectable. You need ${num(plan.neededPerGroup)} users per group to see a ${signedPct(m.targetLift, 0)} lift (95% confidence, 80% power). Your holdout has ${num(plan.holdoutUsers)}.`
                : `Too small to detect. You need ${num(plan.neededPerGroup)} users per group, but the holdout has ${num(plan.holdoutUsers)}. Grow the holdout, widen the audience, or aim for a bigger lift.`,
              plan.detectable ? 'good' : 'bad',
            ),
      );
    };
    const upd = (k) => (v) => { m[k] = v; ctx.save(); draw(); };
    grid.append(
      h('div', { class: 'card stack' },
        h('h3', null, m.name),
        field('Metric definition', textInput(m.definition, (v) => { m.definition = v; ctx.save(); }, { placeholder: 'Users who do X at least N times per week' })),
        h('div', { class: 'grid grid-2' },
          field('Baseline rate (%)', percentInput(m.baseline, upd('baseline'), { min: 0, max: 100 })),
          field('Target relative lift (%)', percentInput(m.targetLift, upd('targetLift'))),
          field('Eligible users', numberInput(m.eligibleUsers, upd('eligibleUsers'), { min: 0 })),
          field('Holdout share (%)', percentInput(m.holdoutShare, upd('holdoutShare'), { min: 0, max: 50 })),
        ),
        out,
      ),
    );
    draw();
  }
}

function renderMeasure(panel, ctx) {
  panel.append(callout('Enter post-launch counts for the holdout (did not see the launch) and the exposed group. Same time window, same metric definition.'));
  const grid = h('div', { class: 'grid grid-2' });
  panel.append(grid);
  for (const m of ctx.state.metrics) {
    const out = h('div', { class: 'stack mt' });
    const draw = () => {
      const { test, verdict: v } = measureLift(m);
      if (!test) return replaceChildren(out, h('p', { class: 'muted' }, 'Enter user counts for both groups.'));
      const target = targetFromLift(m.baseline, m.targetLift);
      replaceChildren(
        out,
        h('div', { class: 'grid grid-2' },
          stat('Relative lift', signedPct(test.relLift), `${pct(test.pA)} → ${pct(test.pB)}`),
          stat('vs. target', test.pB >= target ? 'Hit' : 'Missed', `target rate ${pct(target)}`),
        ),
        h('p', { class: 'small' }, `95% CI on the change: ${pts(test.ciLow)} to ${pts(test.ciHigh)}`),
        h('div', null, pill(v.label, v.tone)),
      );
    };
    const upd = (k) => (v) => { m[k] = v; ctx.save(); draw(); };
    grid.append(
      h('div', { class: 'card stack' },
        h('h3', null, m.name),
        h('div', { class: 'grid grid-2' },
          field('Holdout users', numberInput(m.controlUsers, upd('controlUsers'), { min: 0 })),
          field('Holdout active', numberInput(m.controlActive, upd('controlActive'), { min: 0 })),
          field('Exposed users', numberInput(m.exposedUsers, upd('exposedUsers'), { min: 0 })),
          field('Exposed active', numberInput(m.exposedActive, upd('exposedActive'), { min: 0 })),
        ),
        out,
      ),
    );
    draw();
  }
}

function renderPreview(panel, ctx) {
  panel.append(h('pre', { class: 'output' }, markdown(ctx.state)));
}
