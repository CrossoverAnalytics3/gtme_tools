import { mountTool } from '../core/shell.js';
import { h, field, textInput, numberInput, percentInput, select, button, stat, pill, callout, table, replaceChildren, tabs, hbars } from '../core/dom.js';
import { compact, pct, num } from '../core/format.js';
import { cohortSizing, flatEstimate, arrFunnel, payingNeeded, scoreSegments, QUADRANTS, segmentsMarkdown } from '../lib/segments.js';

const TIERS = ['SMB', 'Mid-Market', 'Enterprise'];

// Defaults are the brief's own US VR sizing example.
const defaults = {
  cohort: {
    name: 'US consumer VR',
    population: 320000000,
    lifespan: 80,
    flatRate: 0.025,
    cohorts: [
      { name: 'Gen Z', ageFrom: 18, ageTo: 26, willingness: 0.5 },
      { name: 'Millennials', ageFrom: 27, ageTo: 35, willingness: 0.25 },
    ],
  },
  funnel: { reachShare: 0.3, paidConversion: 0.05, arpu: 120, arrGoal: 100000000 },
  weights: { size: 1, growth: 1, fit: 1 },
  segments: [
    { name: '50-person startup growing 200%', tier: 'SMB', accounts: 1000, acv: 15000, growth: 2, fit: 4 },
    { name: '500-person firm, flat', tier: 'Mid-Market', accounts: 1000, acv: 40000, growth: 0, fit: 3 },
  ],
};

// Illustrative Adobe Express-style young creator segment.
const example = {
  cohort: {
    name: 'Global young creators (online population)',
    population: 5000000000,
    lifespan: 75,
    flatRate: 0.025,
    cohorts: [
      { name: 'Gen Z creators', ageFrom: 16, ageTo: 27, willingness: 0.3 },
      { name: 'Young millennial creators', ageFrom: 28, ageTo: 35, willingness: 0.15 },
      { name: 'Older millennials', ageFrom: 36, ageTo: 43, willingness: 0.05 },
    ],
  },
  funnel: { reachShare: 0.4, paidConversion: 0.08, arpu: 120, arrGoal: 1000000000 },
  weights: { size: 1, growth: 1.5, fit: 1 },
  segments: [
    { name: 'Solo creators & influencers', tier: 'SMB', accounts: 40000000, acv: 120, growth: 0.6, fit: 5 },
    { name: 'Small business social teams', tier: 'SMB', accounts: 3000000, acv: 360, growth: 0.35, fit: 4 },
    { name: 'Students (edu plans)', tier: 'SMB', accounts: 25000000, acv: 20, growth: 0.2, fit: 3 },
    { name: 'Mid-market marketing teams', tier: 'Mid-Market', accounts: 120000, acv: 6000, growth: 0.15, fit: 3 },
    { name: 'Enterprise brand studios', tier: 'Enterprise', accounts: 8000, acv: 60000, growth: 0.05, fit: 2 },
    { name: 'AI-native content startups', tier: 'SMB', accounts: 20000, acv: 2400, growth: 2, fit: 4 },
  ],
};

mountTool('segment-sizer', {
  defaults,
  example,
  markdown: segmentsMarkdown,
  render(app, ctx) {
    tabs(
      app,
      [
        { id: 'cohorts', label: '1. Cohort sizing', render: (p) => renderCohorts(p, ctx) },
        { id: 'funnel', label: '2. ARR projection', render: (p) => renderFunnel(p, ctx) },
        { id: 'segments', label: '3. 3-axis prioritization', render: (p) => renderSegments(p, ctx) },
      ],
      'segment-sizer',
    );
  },
});

function renderCohorts(panel, ctx) {
  const c = ctx.state.cohort;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const r = cohortSizing(c);
    const flat = flatEstimate(c.population, c.flatRate);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-3' },
        stat('People per age cohort', compact(r.perYear), `${compact(c.population)} ÷ ${c.lifespan} years`),
        stat('Addressable users', compact(r.total), `from ${compact(r.people)} people in target cohorts`),
        stat('Flat-% estimate', compact(flat), `${pct(c.flatRate, 1)} × everyone (the method to avoid)`),
      ),
      h('div', { class: 'card' },
        h('h3', null, 'Addressable users by cohort'),
        hbars(r.rows.map((x) => ({ label: x.name, value: x.users, display: compact(x.users), tip: `${x.years} yrs × ${compact(r.perYear)} = ${compact(x.people)} × ${pct(x.willingness, 0)} = ${compact(x.users)}` }))),
      ),
      table(
        [
          { label: 'Cohort', render: (x) => h('strong', null, x.name) },
          { label: 'Years', num: true, key: 'years' },
          { label: 'People', num: true, render: (x) => compact(x.people) },
          { label: 'Willingness', num: true, render: (x) => pct(x.willingness, 0) },
          { label: 'Users', num: true, render: (x) => compact(x.users) },
        ],
        r.rows,
      ),
    );
  };

  const editor = h('div');
  const drawEditor = () => {
    replaceChildren(
      editor,
      table(
        [
          { label: 'Cohort', render: (x) => textInput(x.name, (v) => { x.name = v; ctx.save(); draw(); }) },
          { label: 'Age from', render: (x) => numberInput(x.ageFrom, (v) => { x.ageFrom = v; ctx.save(); draw(); }, { min: 0 }) },
          { label: 'Age to', render: (x) => numberInput(x.ageTo, (v) => { x.ageTo = v; ctx.save(); draw(); }, { min: 0 }) },
          { label: 'Willingness (%)', render: (x) => percentInput(x.willingness, (v) => { x.willingness = v; ctx.save(); draw(); }, { min: 0, max: 100 }) },
          { label: '', render: (_, i) => button('×', () => { c.cohorts.splice(i, 1); ctx.save(); drawEditor(); draw(); }, 'ghost sm danger', { 'aria-label': 'Remove cohort' }) },
        ],
        c.cohorts,
      ),
      button('+ Add cohort', () => { c.cohorts.push({ name: 'New cohort', ageFrom: 36, ageTo: 44, willingness: 0.1 }); ctx.save(); drawEditor(); draw(); }, 'sm mt'),
    );
  };

  const upd = (k) => (v) => { c[k] = v; ctx.save(); draw(); };
  panel.append(
    callout('From the brief: don\'t multiply everyone by one flat %. Split the population into age cohorts, size each one, and give each its own willingness rate you can defend.'),
    h('div', { class: 'grid grid-2' },
      h('div', { class: 'card stack' },
        h('h3', null, 'Population'),
        field('Market name', textInput(c.name, (v) => { c.name = v; ctx.save(); })),
        h('div', { class: 'grid grid-3' },
          field('Population', numberInput(c.population, upd('population'), { min: 0 })),
          field('Lifespan (years)', numberInput(c.lifespan, upd('lifespan'), { min: 1 })),
          field('Flat % to compare (%)', percentInput(c.flatRate, upd('flatRate'), { min: 0 })),
        ),
        h('small', { class: 'muted' }, 'Age-to minus age-from = years in the cohort (the brief counts 18 to 26 as 8 years).'),
      ),
      h('div', { class: 'card stack' }, h('h3', null, 'Cohorts'), editor),
    ),
    h('div', { class: 'mt' }, out),
  );
  drawEditor();
  draw();
}

function renderFunnel(panel, ctx) {
  const f = ctx.state.funnel;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const addressable = cohortSizing(ctx.state.cohort).total;
    const r = arrFunnel({ ...f, addressable });
    const need = payingNeeded(f.arrGoal, f.arpu);
    const convNeeded = r.reachable > 0 && need != null ? need / r.reachable : null;
    replaceChildren(
      out,
      h('div', { class: 'grid grid-4' },
        stat('Addressable', compact(addressable), 'from cohort sizing'),
        stat('Reachable', compact(r.reachable)),
        stat('Paying', compact(r.paying)),
        stat('ARR', compact(r.arr, { currency: true })),
      ),
      h('div', { class: 'card' },
        h('h3', null, 'Funnel'),
        hbars([
          { label: 'Addressable users', value: addressable, display: compact(addressable) },
          { label: 'Reachable', value: r.reachable, display: compact(r.reachable) },
          { label: 'Paying', value: r.paying, display: compact(r.paying) },
        ]),
      ),
      callout(
        convNeeded == null
          ? 'Set an ARR goal and ARPU to see what conversion it takes.'
          : `To hit ${compact(f.arrGoal, { currency: true })} ARR you need ${compact(need)} paying users: ${pct(convNeeded, 1)} of reachable users. ${convNeeded > 0.15 ? 'That is a very high paid conversion. Widen reach or raise ARPU.' : convNeeded <= f.paidConversion ? 'Your assumptions already clear it.' : 'Doable, but higher than your current assumption.'}`,
        convNeeded == null ? '' : convNeeded <= f.paidConversion ? 'good' : convNeeded > 0.15 ? 'bad' : 'warn',
      ),
    );
  };
  const upd = (k) => (v) => { f[k] = v; ctx.save(); draw(); };
  panel.append(
    h('div', { class: 'card stack' },
      h('div', { class: 'grid grid-4' },
        field('Reachable share (%)', percentInput(f.reachShare, upd('reachShare'), { min: 0, max: 100 }), 'Who your channels can actually reach.'),
        field('Paid conversion (%)', percentInput(f.paidConversion, upd('paidConversion'), { min: 0, max: 100 })),
        field('ARPU ($ / year)', numberInput(f.arpu, upd('arpu'), { min: 0 })),
        field('ARR goal ($)', numberInput(f.arrGoal, upd('arrGoal'), { min: 0 })),
      ),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}

function renderSegments(panel, ctx) {
  const s = ctx.state;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const ranked = scoreSegments(s.segments, s.weights);
    replaceChildren(
      out,
      h('div', { class: 'card' },
        h('h3', null, 'Priority score (0 to 100)'),
        hbars(ranked.map((x) => ({ label: `${x.rank}. ${x.name}`, value: x.score, display: x.score.toFixed(0), tip: `Size ${(x.sizeScore * 100).toFixed(0)} · Growth ${(x.growthScore * 100).toFixed(0)} · Fit ${(x.fitScore * 100).toFixed(0)}` })), { max: 100 }),
      ),
      table(
        [
          { label: '#', key: 'rank' },
          { label: 'Segment', render: (x) => h('div', null, h('strong', null, x.name), h('div', { class: 'small muted' }, `${x.tier} · pool ${compact(x.pool, { currency: true })}`)) },
          { label: 'X: size', num: true, render: (x) => (x.sizeScore * 100).toFixed(0) },
          { label: 'Y: growth', num: true, render: (x) => (x.growthScore * 100).toFixed(0) },
          { label: 'Z: fit', num: true, render: (x) => (x.fitScore * 100).toFixed(0) },
          { label: 'Score', num: true, render: (x) => h('strong', null, x.score.toFixed(0)) },
          { label: 'Quadrant', render: (x) => h('div', null, pill(x.quadrant, QUADRANTS[x.quadrant].tone), h('div', { class: 'small muted', style: { marginTop: '4px', maxWidth: '260px' } }, QUADRANTS[x.quadrant].note)) },
        ],
        ranked,
      ),
    );
  };

  const editor = h('div');
  const drawEditor = () => {
    replaceChildren(
      editor,
      table(
        [
          { label: 'Segment', render: (x) => textInput(x.name, (v) => { x.name = v; ctx.save(); draw(); }, { style: { minWidth: '160px' } }) },
          { label: 'Tier', render: (x) => select(TIERS, x.tier, (v) => { x.tier = v; ctx.save(); draw(); }) },
          { label: 'Accounts', render: (x) => numberInput(x.accounts, (v) => { x.accounts = v; ctx.save(); draw(); }, { min: 0 }) },
          { label: 'ACV ($)', render: (x) => numberInput(x.acv, (v) => { x.acv = v; ctx.save(); draw(); }, { min: 0 }) },
          { label: 'Growth YoY (%)', render: (x) => percentInput(x.growth, (v) => { x.growth = v; ctx.save(); draw(); }) },
          { label: 'Fit (1-5)', render: (x) => numberInput(x.fit, (v) => { x.fit = v; ctx.save(); draw(); }, { min: 1, max: 5, step: 1 }) },
          { label: '', render: (_, i) => button('×', () => { s.segments.splice(i, 1); ctx.save(); drawEditor(); draw(); }, 'ghost sm danger', { 'aria-label': 'Remove segment' }) },
        ],
        s.segments,
      ),
      button('+ Add segment', () => { s.segments.push({ name: 'New segment', tier: 'SMB', accounts: 1000, acv: 10000, growth: 0.2, fit: 3 }); ctx.save(); drawEditor(); draw(); }, 'sm mt'),
    );
  };
  const w = (k) => numberInput(s.weights[k], (v) => { s.weights[k] = v; ctx.save(); draw(); }, { min: 0, step: 0.5 });
  panel.append(
    callout('Size alone misleads in consumption models. The brief\'s example: a 50-person startup growing 200% a year beats a flat 500-person firm. Z (fit) captures workload and business model: e-commerce vs. crypto, traffic rank, B2B vs. B2C payments.'),
    h('div', { class: 'card stack' },
      h('h3', null, 'Segments'),
      editor,
      h('div', { class: 'grid grid-3 mt' }, field('Weight: X size', w('size')), field('Weight: Y growth', w('growth')), field('Weight: Z fit', w('fit'))),
      h('small', { class: 'muted' }, 'Size = accounts × ACV on a log scale. Growth and size are scaled 0 to 100 across the segments you list. Fit 1 to 5 is your call on workload and model fit.'),
    ),
    h('div', { class: 'mt' }, out),
  );
  drawEditor();
  draw();
}
