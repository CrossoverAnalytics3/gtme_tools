import { mountTool } from '../core/shell.js';
import { h, field, textInput, textArea, numberInput, percentInput, checkbox, button, stat, pill, callout, table, replaceChildren, tabs, download, hbars } from '../core/dom.js';
import { money, num, pct, signedPct, pts } from '../core/format.js';
import { toCSV } from '../core/csv.js';
import { SEGMENTS, buildSequence, projectImpact, measureAdoption, campaignMarkdown } from '../lib/adoption.js';

const defaults = {
  campaign: {
    feature: '',
    audience: '',
    job: '',
    outcomeShort: '',
    proof: '',
    peer: '',
    moment: '',
    lapseReason: '',
    setupMinutes: 2,
    include: { never: true, lapsed: true, active: true },
  },
  impact: {
    totalUsers: 10000,
    baselineAdoption: 0.1,
    segments: [
      { id: 'never', label: 'Never tried', size: 8000, conversion: 0.02 },
      { id: 'lapsed', label: 'Tried, then stopped', size: 1000, conversion: 0.03 },
    ],
    valuePerAdopterMonth: 20,
    months: 3,
  },
  measure: { controlUsers: 0, controlAdopters: 0, treatedUsers: 0, treatedAdopters: 0, valuePerAdopterMonth: 20 },
};

// Illustrative reconstruction of the Etsy seller coupon campaign.
const example = {
  campaign: {
    feature: 'coupon codes',
    audience: 'sellers',
    job: 'win back shoppers who favorited an item but didn\'t buy',
    outcomeShort: 'turn more favorites into orders',
    proof: 'Shops in your category that send a favorites coupon convert more of those shoppers (insert your own stat here)',
    peer: 'a ceramics shop in Portland',
    moment: 'A shopper favorited your item but didn\'t buy',
    lapseReason: 'coupons felt like they cut margin without bringing in sales',
    setupMinutes: 2,
    include: { never: true, lapsed: true, active: true },
  },
  impact: {
    totalUsers: 25000,
    baselineAdoption: 0.12,
    segments: [
      { id: 'never', label: 'Never tried', size: 18000, conversion: 0.02 },
      { id: 'lapsed', label: 'Tried, then stopped', size: 4000, conversion: 0.03 },
    ],
    valuePerAdopterMonth: 25,
    months: 1,
  },
  measure: { controlUsers: 2500, controlAdopters: 300, treatedUsers: 25000, treatedAdopters: 3480, valuePerAdopterMonth: 25 },
};

mountTool('adoption-campaign', {
  defaults,
  example,
  markdown: campaignMarkdown,
  render(app, ctx) {
    tabs(
      app,
      [
        { id: 'inputs', label: '1. Campaign inputs', render: (p) => renderInputs(p, ctx) },
        { id: 'sequence', label: '2. Sequence', render: (p) => renderSequence(p, ctx) },
        { id: 'impact', label: '3. Impact model', render: (p) => renderImpact(p, ctx) },
        { id: 'measure', label: '4. Measure', render: (p) => renderMeasure(p, ctx) },
      ],
      'adoption-campaign',
    );
  },
});

function renderInputs(panel, ctx) {
  const c = ctx.state.campaign;
  const set = (k) => (v) => { c[k] = v; ctx.save(); };
  panel.append(
    callout('Fill these once. Every message in the sequence is generated from them, so sharper inputs make sharper copy.'),
    h('div', { class: 'grid grid-2' },
      h('div', { class: 'card stack' },
        h('h3', null, 'The feature and the job'),
        field('Feature (lowercase, as a user says it)', textInput(c.feature, set('feature'), { placeholder: 'coupon codes' })),
        field('Audience noun (plural)', textInput(c.audience, set('audience'), { placeholder: 'sellers' })),
        field('The job it does for them', textInput(c.job, set('job'), { placeholder: 'win back shoppers who favorited but didn\'t buy' })),
        field('Outcome, short (finishes "Why sellers who use X...")', textInput(c.outcomeShort, set('outcomeShort'), { placeholder: 'turn more favorites into orders' })),
        field('Minutes to set up', numberInput(c.setupMinutes, set('setupMinutes'), { min: 1 })),
      ),
      h('div', { class: 'card stack' },
        h('h3', null, 'Proof and moments'),
        field('Proof point', textArea(c.proof, set('proof'), { placeholder: 'One number or one peer result. Real data beats adjectives.' })),
        field('Peer example', textInput(c.peer, set('peer'), { placeholder: 'a ceramics shop in Portland' })),
        field('Moment of need (in-product trigger)', textInput(c.moment, set('moment'), { placeholder: 'A shopper favorited your item but didn\'t buy' }), 'The nudge fires here, inside the workflow, when the feature is most useful.'),
        field('Why people stopped using it', textInput(c.lapseReason, set('lapseReason'), { placeholder: 'it felt like it cut margin' }), 'Get this from churn surveys, support tickets or a Fast Five round.'),
      ),
    ),
    h('div', { class: 'card stack mt' },
      h('h3', null, 'Segments to include'),
      h('div', { class: 'grid grid-3' },
        SEGMENTS.map((s) => h('div', null, checkbox(!!c.include[s.id], (v) => { c.include[s.id] = v; ctx.save(); }, s.label), h('div', { class: 'small muted', style: { marginLeft: '22px' } }, s.job))),
      ),
    ),
  );
}

function renderSequence(panel, ctx) {
  const seq = buildSequence(ctx.state.campaign);
  panel.append(
    h('div', { class: 'row mb' },
      h('span', { class: 'muted' }, `${seq.length} touches across ${new Set(seq.map((s) => s.segment)).size} segment(s). Bracketed text means an input is still empty.`),
      h('div', { style: { flex: 1 } }),
      button('Download CSV for your ESP', () => download('adoption-sequence.csv', toCSV(seq, ['segment', 'stage', 'day', 'channel', 'subject', 'body', 'cta', 'metric']), 'text/csv'), 'sm'),
    ),
    table(
      [
        { label: 'Segment', render: (r) => pill(r.segment, 'info') },
        { label: 'Stage', render: (r) => h('strong', null, r.stage) },
        { label: 'Day', key: 'day' },
        { label: 'Channel', key: 'channel' },
        { label: 'Subject / prompt', render: (r) => h('div', null, h('div', null, r.subject), h('div', { class: 'small muted' }, r.body)) },
        { label: 'CTA', key: 'cta' },
        { label: 'Measure', key: 'metric' },
      ],
      seq,
      { empty: 'Pick at least one segment on the inputs tab.' },
    ),
  );
}

function renderImpact(panel, ctx) {
  const m = ctx.state.impact;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const r = projectImpact(m);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-3' },
        stat('New adopters', num(r.newAdopters), `on top of ${num(r.baseAdopters)} today`),
        stat('Relative adoption lift', signedPct(r.relLift), `${pct(m.baselineAdoption)} → ${pct(r.newAdoptionRate)}`),
        stat('Incremental value', money(r.incrementalValue), `${num(m.months)} month(s) at ${money(m.valuePerAdopterMonth)}/adopter/month`),
      ),
      h('div', { class: 'card' },
        h('h3', null, 'New adopters by segment'),
        hbars(r.rows.map((s) => ({ label: s.label, value: s.newAdopters, display: num(s.newAdopters), tip: `${s.label}: ${num(s.size)} × ${pct(s.conversion)} = ${num(s.newAdopters)}` }))),
      ),
    );
  };
  const upd = (o, k) => (v) => { o[k] = v; ctx.save(); draw(); };
  panel.append(
    callout('Bottom-up: each segment\'s size × the share you expect the campaign to convert. The relative lift is what you would report as "+16% adoption".'),
    h('div', { class: 'grid grid-2' },
      h('div', { class: 'card stack' },
        h('h3', null, 'Base'),
        h('div', { class: 'grid grid-2' },
          field('Total users in scope', numberInput(m.totalUsers, upd(m, 'totalUsers'), { min: 0 })),
          field('Adoption today (%)', percentInput(m.baselineAdoption, upd(m, 'baselineAdoption'), { min: 0, max: 100 })),
          field('Value per adopter / month ($)', numberInput(m.valuePerAdopterMonth, upd(m, 'valuePerAdopterMonth'), { min: 0 }), 'GMS, revenue or margin. Pick one and say which.'),
          field('Months to count', numberInput(m.months, upd(m, 'months'), { min: 1 })),
        ),
      ),
      h('div', { class: 'card stack' },
        h('h3', null, 'Segments'),
        m.segments.map((s) =>
          h('div', { class: 'grid grid-2' },
            field(`${s.label}: size`, numberInput(s.size, upd(s, 'size'), { min: 0 })),
            field(`${s.label}: expected conversion (%)`, percentInput(s.conversion, upd(s, 'conversion'), { min: 0, max: 100 })),
          ),
        ),
      ),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}

function renderMeasure(panel, ctx) {
  const m = ctx.state.measure;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const { test, verdict: v } = measureAdoption(m);
    if (!test) return replaceChildren(out, h('p', { class: 'muted' }, 'Enter counts for both groups.'));
    const incAdopters = Math.max(0, test.diff * m.treatedUsers);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-3' },
        stat('Adoption lift', signedPct(test.relLift), `${pct(test.pA)} holdout → ${pct(test.pB)} treated`),
        stat('Incremental adopters', num(incAdopters), `95% CI ${pts(test.ciLow)} to ${pts(test.ciHigh)}`),
        stat('Incremental value', money(incAdopters * m.valuePerAdopterMonth), 'first month'),
      ),
      h('div', null, pill(v.label, v.tone)),
    );
  };
  const upd = (k) => (v) => { m[k] = v; ctx.save(); draw(); };
  panel.append(
    callout('Keep 5 to 10% of eligible users out of the campaign. Without a holdout you cannot separate the campaign from seasonality.'),
    h('div', { class: 'card stack' },
      h('div', { class: 'grid grid-4' },
        field('Holdout users', numberInput(m.controlUsers, upd('controlUsers'), { min: 0 })),
        field('Holdout adopters', numberInput(m.controlAdopters, upd('controlAdopters'), { min: 0 })),
        field('Treated users', numberInput(m.treatedUsers, upd('treatedUsers'), { min: 0 })),
        field('Treated adopters', numberInput(m.treatedAdopters, upd('treatedAdopters'), { min: 0 })),
      ),
      field('Value per adopter / month ($)', numberInput(m.valuePerAdopterMonth, upd('valuePerAdopterMonth'), { min: 0 })),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}
