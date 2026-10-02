import { mountTool } from '../core/shell.js';
import { h, field, textInput, numberInput, percentInput, button, stat, pill, callout, table, replaceChildren, tabs, hbars, copyText } from '../core/dom.js';
import { money, num, pct, signedPct } from '../core/format.js';
import { fmtP } from '../core/stats.js';
import { positioningStatement, testPlan, analyzeVariants, categoryImpact, positioningMarkdown } from '../lib/positioning.js';

const blankVariant = (name) => ({ name, audience: '', need: '', angle: '', differentiator: '', headline: '', proof: '', visitors: 0, conversions: 0, revenue: 0 });

const defaults = {
  product: { name: '', category: '', alternative: '' },
  variants: [blankVariant('Control (current positioning)'), blankVariant('Variant B')],
  plan: { baselineRate: 0.03, relMde: 0.25, dailyVisitors: 1000 },
  categorySales: 0,
};

// Illustrative reconstruction of the Reebok graphic tee test.
const example = {
  product: { name: 'the Reebok graphic tee line', category: 'everyday graphic tee', alternative: 'unisex gym tees with a logo on the chest' },
  variants: [
    { name: 'Control: unisex athletic', audience: 'gym-goers', need: 'want a tee to train in', angle: 'shows you train', differentiator: 'carries a heritage training logo', headline: 'Train hard. Wear the logo.', proof: 'Heritage training brand since 1958', visitors: 4000, conversions: 120, revenue: 3600 },
    { name: 'B: feminine graphic tees', audience: 'women who train and dress for themselves', need: 'are tired of shrunk-down men\'s tees', angle: 'lets them feel strong and look like themselves', differentiator: 'is cut and designed for women first, with graphics women chose in testing', headline: 'Made for how you move. Designed for how you look.', proof: 'Fit and graphics picked with 40 women in a preview panel', visitors: 4000, conversions: 180, revenue: 5400 },
    { name: 'C: retro lifestyle', audience: 'streetwear shoppers', need: 'want vintage sports style', angle: 'gives them an authentic throwback look', differentiator: 'reissues archive graphics', headline: 'Classic since \'82.', proof: 'Archive designs, reissued', visitors: 4000, conversions: 132, revenue: 3960 },
  ],
  plan: { baselineRate: 0.03, relMde: 0.4, dailyVisitors: 1000 },
  categorySales: 2000000,
};

mountTool('positioning-lab', {
  defaults,
  example,
  markdown: positioningMarkdown,
  render(app, ctx) {
    tabs(
      app,
      [
        { id: 'variants', label: '1. Variants', render: (p) => renderVariants(p, ctx) },
        { id: 'plan', label: '2. Test plan', render: (p) => renderPlan(p, ctx) },
        { id: 'results', label: '3. Results', render: (p) => renderResults(p, ctx) },
      ],
      'positioning-lab',
    );
  },
});

function renderVariants(panel, ctx) {
  const s = ctx.state;
  const setP = (k) => (v) => { s.product[k] = v; ctx.save(); redrawStatements(); };
  const statements = [];
  const redrawStatements = () => statements.forEach(([el, v]) => (el.textContent = positioningStatement(v, s.product)));

  panel.append(
    h('div', { class: 'card stack' },
      h('h3', null, 'Product'),
      h('div', { class: 'grid grid-3' },
        field('Product name', textInput(s.product.name, setP('name'), { placeholder: 'the graphic tee line' })),
        field('Category (frame of reference)', textInput(s.product.category, setP('category'), { placeholder: 'everyday graphic tee' })),
        field('Main alternative', textInput(s.product.alternative, setP('alternative'), { placeholder: 'unisex gym tees' })),
      ),
    ),
    callout('Each variant should change one big thing: the audience or the emotional angle. If two variants share both, you are testing copy, not positioning.'),
  );

  const grid = h('div', { class: 'grid grid-2' });
  s.variants.forEach((v, i) => {
    const stmt = h('div', { class: 'copy-area small' });
    statements.push([stmt, v]);
    const set = (k) => (val) => { v[k] = val; ctx.save(); redrawStatements(); };
    grid.append(
      h('div', { class: 'card stack' },
        h('div', { class: 'row', style: { justifyContent: 'space-between' } },
          pill(i === 0 ? 'Control' : `Variant ${String.fromCharCode(65 + i)}`, i === 0 ? '' : 'info'),
          i > 0 ? button('Remove', () => { s.variants.splice(i, 1); ctx.save(); ctx.rerender(); }, 'ghost sm danger') : null,
        ),
        field('Variant name', textInput(v.name, set('name'))),
        h('div', { class: 'grid grid-2' },
          field('Audience', textInput(v.audience, set('audience'), { placeholder: 'women who train' })),
          field('Who... (need)', textInput(v.need, set('need'), { placeholder: 'are tired of shrunk-down men\'s tees' })),
        ),
        field('Emotional angle (the benefit)', textInput(v.angle, set('angle'), { placeholder: 'lets them feel strong and look like themselves' })),
        field('Differentiator vs. the alternative', textInput(v.differentiator, set('differentiator'))),
        field('Headline', textInput(v.headline, set('headline'))),
        field('Proof', textInput(v.proof, set('proof'))),
        h('div', { class: 'small muted' }, 'Positioning statement'),
        stmt,
        button('Copy statement', () => copyText(positioningStatement(v, s.product)), 'sm'),
      ),
    );
  });
  panel.append(grid, button('+ Add variant', () => { s.variants.push(blankVariant(`Variant ${String.fromCharCode(65 + s.variants.length)}`)); ctx.save(); ctx.rerender(); }, 'mt'));
  redrawStatements();
}

function renderPlan(panel, ctx) {
  const p = ctx.state.plan;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const r = testPlan({ ...p, variants: ctx.state.variants.length });
    if (!r) return replaceChildren(out, callout('Baseline must be between 0% and 100%, and the lift cannot push it over 100%.', 'warn'));
    replaceChildren(
      out,
      h('div', { class: 'grid grid-3' },
        stat('Visitors per variant', num(r.perVariant), `${ctx.state.variants.length} variants`),
        stat('Total visitors', num(r.total)),
        stat('Days to run', r.days ? num(r.days) : '-', r.days ? `at ${num(p.dailyVisitors)} visitors/day` : 'enter daily traffic'),
      ),
      callout(
        r.days && r.days > 42
          ? `About ${r.days} days is long. Seasonality and stock changes will muddy it. Cut variants, test a bolder change (bigger lift), or use a higher-traffic placement.`
          : `Each variant is compared to control at p < ${r.adjAlpha.toFixed(4)} (5% split across ${r.comparisons} comparison${r.comparisons > 1 ? 's' : ''}). Decide your stop date now and don't peek-and-stop early.`,
        r.days && r.days > 42 ? 'warn' : '',
      ),
    );
  };
  const upd = (k) => (v) => { p[k] = v; ctx.save(); draw(); };
  panel.append(
    h('div', { class: 'card stack' },
      h('div', { class: 'grid grid-3' },
        field('Baseline conversion rate (%)', percentInput(p.baselineRate, upd('baselineRate'), { min: 0, max: 100 }), 'Control\'s current rate on the page or channel you test.'),
        field('Smallest lift worth detecting (%)', percentInput(p.relMde, upd('relMde'), { min: 1 }), 'Positioning tests should aim big. 20 to 50% relative.'),
        field('Visitors per day (all variants)', numberInput(p.dailyVisitors, upd('dailyVisitors'), { min: 0 })),
      ),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}

function renderResults(panel, ctx) {
  const s = ctx.state;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const a = analyzeVariants(s.variants);
    const imp = a.winner ? categoryImpact(s.categorySales, a.winner.test.relLift) : null;
    replaceChildren(
      out,
      a.winner
        ? callout(h('span', null, h('strong', null, `Winner: ${a.winner.name}. `), `${signedPct(a.winner.test.relLift)} conversion vs. control (${fmtP(a.winner.test.pValue)}).`), 'good')
        : callout('No variant beats control with significance yet. Keep running to your planned sample size before calling it.', 'warn'),
      h('div', { class: 'grid grid-3' },
        stat('Best lift', a.winner ? signedPct(a.winner.test.relLift) : '-', a.winner ? a.winner.name : 'no significant winner'),
        stat('Revenue / visitor lift', a.winner && a.winner.rpvLift != null ? signedPct(a.winner.rpvLift) : '-'),
        stat('Category impact', imp ? money(imp.incremental) : '-', imp ? `${money(s.categorySales)} → ${money(imp.projected)}` : 'enter category sales below'),
      ),
      h('div', { class: 'card' },
        h('h3', null, 'Conversion rate by variant'),
        hbars(a.rows.map((r) => ({ label: r.name, value: r.rate || 0, display: r.rate == null ? '-' : pct(r.rate, 2), tone: r.isControl ? 'alt' : '' }))),
      ),
      table(
        [
          { label: 'Variant', render: (r) => h('strong', null, r.name) },
          { label: 'Conv. rate', num: true, render: (r) => (r.rate == null ? '-' : pct(r.rate, 2)) },
          { label: 'Lift', num: true, render: (r) => (r.isControl ? 'control' : signedPct(r.test?.relLift)) },
          { label: 'p-value', num: true, render: (r) => (r.isControl || !r.test ? '-' : fmtP(r.test.pValue)) },
          { label: 'Rev / visitor', num: true, render: (r) => money(r.rpv, 2) },
          { label: 'Call', render: (r) => (r.isControl ? '' : r.significant ? pill('Beats control', 'good') : pill('Not yet', 'warn')) },
        ],
        a.rows,
      ),
    );
  };
  const inputs = table(
    [
      { label: 'Variant', key: 'name' },
      { label: 'Visitors', render: (v) => numberInput(v.visitors, (x) => { v.visitors = x; ctx.save(); draw(); }, { min: 0 }) },
      { label: 'Conversions', render: (v) => numberInput(v.conversions, (x) => { v.conversions = x; ctx.save(); draw(); }, { min: 0 }) },
      { label: 'Revenue ($)', render: (v) => numberInput(v.revenue, (x) => { v.revenue = x; ctx.save(); draw(); }, { min: 0 }) },
    ],
    s.variants,
  );
  panel.append(
    h('div', { class: 'card stack' },
      h('h3', null, 'Enter results'),
      inputs,
      field('Category sales baseline ($ / year)', numberInput(s.categorySales, (x) => { s.categorySales = x; ctx.save(); draw(); }, { min: 0 }), 'Wholesale or retail sales for the whole category. Used to size the rollout of the winner.'),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}
