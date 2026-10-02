import { mountTool } from '../core/shell.js';
import { h, field, textInput, textArea, numberInput, percentInput, select, button, stat, pill, callout, table, replaceChildren, tabs, copyText, debounce } from '../core/dom.js';
import { pct } from '../core/format.js';
import { RISK_CATEGORIES, analyzeCopy, ladderLines, talkTrack, BUYER_ROLES, discoveryPlan, messagingMarkdown } from '../lib/riskMessaging.js';

const blankRow = () => ({ feature: '', benefit: '', pain: '', proof: '', character: '' });

const defaults = {
  target: 0.8,
  copy: '',
  ladder: [blankRow()],
  discovery: { role: 'economic', count: 8, account: '' },
};

const example = {
  target: 0.8,
  copy: `Subject: Black Friday without the 2 a.m. war room

Hi Dana,

Last November a lot of retailers lost revenue to slow pages and checkout outages on their biggest day. Every second of latency on checkout costs conversion, and the person who owns the platform is the one who explains it to the board.

We help teams like yours migrate in weeks, not quarters, with a pilot on one storefront first and a rollback plan if anything looks off. SOC 2 Type II and SSO come standard, so security review won't stall the rollout.

Teams that switch also ship faster and grow conversion, but the main reason they move is simple: they never want to live through another outage.

Worth 20 minutes to look at your Core Web Vitals benchmark against 5 peers? I'll bring it either way.`,
  ladder: [
    { feature: 'Multi-region failover', benefit: 'checkout keeps running when a region goes down', pain: 'Losing your biggest sales day to an outage', proof: '99.99% uptime SLA in the contract', character: '' },
    { feature: 'Instant rollback', benefit: 'a bad deploy is undone in one click', pain: 'A Friday deploy taking the site down for the weekend', proof: 'Median rollback time under 30 seconds', character: '' },
    { feature: 'Preview deployments', benefit: 'every change is reviewed on a real URL before it ships', pain: 'Finding bugs in production, in front of customers', proof: '', character: '' },
    { feature: 'SOC 2 Type II + SSO', benefit: 'security review signs off in days', pain: 'A deal stalling for 3 months in security review', proof: 'Report and questionnaire shared on day 1', character: '' },
    { feature: 'Edge caching', benefit: 'pages load fast everywhere', pain: 'Shoppers abandoning slow product pages', proof: '', character: '' },
    { feature: 'House-cleaning robot', benefit: 'your family gets its Saturday back', pain: 'Spending every weekend cleaning', proof: '', character: 'Alfred, the personal butler you\'ve always wanted' },
  ],
  discovery: { role: 'economic', count: 8, account: 'Northpeak Commerce' },
};

mountTool('risk-messaging', {
  defaults,
  example,
  markdown: messagingMarkdown,
  render(app, ctx) {
    tabs(
      app,
      [
        { id: 'analyze', label: '1. Copy analyzer', render: (p) => renderAnalyzer(p, ctx) },
        { id: 'ladder', label: '2. Feature → benefit → risk', render: (p) => renderLadder(p, ctx) },
        { id: 'discovery', label: '3. Discovery planner', render: (p) => renderDiscovery(p, ctx) },
      ],
      'risk-messaging',
    );
  },
});

function renderAnalyzer(panel, ctx) {
  const s = ctx.state;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const a = analyzeCopy(s.copy, s.target);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-4' },
        stat('Risk share', a.riskShare == null ? '-' : pct(a.riskShare, 0), `target ${pct(s.target, 0)}`),
        stat('Risk phrases', String(a.risk)),
        stat('Upside phrases', String(a.upside)),
        stat('Risk categories covered', `${a.categoriesHit.filter((c) => c !== 'general').length} / ${RISK_CATEGORIES.length - 1}`),
      ),
      callout(h('span', null, h('strong', null, `${a.verdict.label}. `), a.verdict.note), a.verdict.tone),
      h('div', { class: 'card' },
        h('div', { class: 'row', style: { justifyContent: 'space-between' } },
          h('h3', { class: 'mt-0' }, 'Highlighted copy'),
          h('div', { class: 'row small' }, h('mark', { class: 'risk' }, 'risk avoidance'), h('mark', { class: 'upside' }, 'upside')),
        ),
        a.segments.length
          ? h('div', { class: 'copy-area' }, a.segments.map((seg) => (seg.kind ? h('mark', { class: seg.kind, title: seg.kind === 'risk' ? RISK_CATEGORIES.find((c) => c.id === seg.category)?.label : 'Upside' }, seg.text) : seg.text)))
          : h('p', { class: 'muted' }, 'Paste copy above.'),
      ),
      a.missing.length && a.total
        ? h('div', { class: 'card' },
            h('h3', null, 'Risk angles you haven\'t used'),
            table([{ label: 'Angle', render: (m) => h('strong', null, m.label) }, { label: 'How to add it', key: 'fix' }], a.missing),
          )
        : null,
    );
  };
  panel.append(
    callout('Paste an email, landing page, or deck slide. The analyzer counts risk-avoidance vs. upside language and checks it against the 80/20 split enterprise buyers respond to. It\'s a keyword heuristic: use it as a mirror, not a grade.'),
    h('div', { class: 'card stack' },
      field('Copy to check', textArea(s.copy, debounce((v) => { s.copy = v; ctx.save(); draw(); }, 200), { rows: 10, placeholder: 'Paste your copy here' })),
      h('div', { style: { maxWidth: '220px' } }, field('Target risk share (%)', percentInput(s.target, (v) => { s.target = v; ctx.save(); draw(); }, { min: 0, max: 100 }))),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}

function renderLadder(panel, ctx) {
  const s = ctx.state;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const track = talkTrack(s.ladder, s.target);
    replaceChildren(
      out,
      table(
        [
          { label: 'Feature', render: (r) => h('strong', null, r.feature || '-') },
          { label: 'Risk-first line', render: (r) => ladderLines(r).riskFirst },
          { label: 'Upside line', render: (r) => h('span', { class: 'muted' }, ladderLines(r).upside) },
          { label: 'Character line', render: (r) => ladderLines(r).character || h('span', { class: 'muted' }, '-') },
        ],
        s.ladder.filter((r) => r.feature || r.benefit || r.pain),
        { empty: 'Fill in a row above.' },
      ),
      h('div', { class: 'card stack' },
        h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h3', { class: 'mt-0' }, `Talk track (${pct(s.target, 0)} risk-first)`), button('Copy talk track', () => copyText(track.join('\n\n')), 'sm primary')),
        h('div', { class: 'copy-area' }, track.join('\n\n') || 'Add rows to build a talk track.'),
      ),
    );
  };
  const editor = h('div');
  const drawEditor = () => {
    replaceChildren(
      editor,
      table(
        [
          { label: 'Feature (what it is)', render: (r) => textInput(r.feature, (v) => { r.feature = v; ctx.save(); draw(); }, { style: { minWidth: '140px' } }) },
          { label: 'Benefit (what it does for them)', render: (r) => textInput(r.benefit, (v) => { r.benefit = v; ctx.save(); draw(); }, { style: { minWidth: '180px' } }) },
          { label: 'Pain avoided (start with -ing)', render: (r) => textInput(r.pain, (v) => { r.pain = v; ctx.save(); draw(); }, { style: { minWidth: '180px' }, placeholder: 'Losing your biggest day to an outage' }) },
          { label: 'Proof', render: (r) => textInput(r.proof, (v) => { r.proof = v; ctx.save(); draw(); }, { style: { minWidth: '140px' } }) },
          { label: 'Name it (optional)', render: (r) => textInput(r.character, (v) => { r.character = v; ctx.save(); draw(); }, { style: { minWidth: '140px' }, placeholder: 'Alfred, your butler' }) },
          { label: '', render: (_, i) => button('×', () => { s.ladder.splice(i, 1); ctx.save(); drawEditor(); draw(); }, 'ghost sm danger', { 'aria-label': 'Remove row' }) },
        ],
        s.ladder,
      ),
      button('+ Add feature', () => { s.ladder.push(blankRow()); ctx.save(); drawEditor(); }, 'sm mt'),
    );
  };
  panel.append(
    callout('The brief\'s feature-to-benefit move: a house-cleaning robot becomes "Alfred, the personal butler you\'ve always wanted." For enterprise, add the third rung: the pain that no longer happens.'),
    h('div', { class: 'card' }, editor),
    h('div', { class: 'mt' }, out),
  );
  drawEditor();
  draw();
}

function renderDiscovery(panel, ctx) {
  const d = ctx.state.discovery;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const p = discoveryPlan(d.role, d.count, ctx.state.target, d.account);
    const text = [`Discovery plan: ${p.role.label}${d.account ? ` at ${d.account}` : ''}`, '', `Bring: ${p.asset}`, '', 'Risk questions:', ...p.risk.map((q, i) => `${i + 1}. ${q}`), '', 'Upside questions:', ...p.upside.map((q, i) => `${i + 1}. ${q}`)].join('\n');
    replaceChildren(
      out,
      callout(h('span', null, h('strong', null, 'Value-add to bring: '), p.asset), 'good'),
      h('div', { class: 'grid grid-2' },
        h('div', { class: 'card' }, h('h3', null, h('span', null, 'Risk questions '), pill(`${p.risk.length}`, 'warn')), h('ol', null, p.risk.map((q) => h('li', null, q)))),
        h('div', { class: 'card' }, h('h3', null, h('span', null, 'Upside questions '), pill(`${p.upside.length}`, 'good')), h('ol', null, p.upside.map((q) => h('li', null, q)))),
      ),
      button('Copy call plan', () => copyText(text), 'primary'),
    );
  };
  panel.append(
    callout('Discovery that feels like interrogation loses. Open with something useful (the brief\'s Stripe whiteboard, a benchmark), then ask mostly about what they\'re afraid of.'),
    h('div', { class: 'card' },
      h('div', { class: 'grid grid-3' },
        field('Buyer role', select(BUYER_ROLES.map((r) => ({ value: r.id, label: r.label })), d.role, (v) => { d.role = v; ctx.save(); draw(); })),
        field('Account', textInput(d.account, (v) => { d.account = v; ctx.save(); draw(); }, { placeholder: 'Northpeak Commerce' })),
        field('Number of questions', numberInput(d.count, (v) => { d.count = v; ctx.save(); draw(); }, { min: 2, max: 12, step: 1 })),
      ),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}
