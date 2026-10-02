import { mountTool } from '../core/shell.js';
import { h, field, textInput, textArea, numberInput, percentInput, dateInput, select, checkbox, button, stat, pill, callout, table, replaceChildren, tabs, copyText, uid, hbars } from '../core/dom.js';
import { money, pct, todayISO, splitList, compact } from '../core/format.js';
import { BLOCK_TYPES, MOMENTS, STATUSES, isStale, compose, coverage, nrr, expansionNeeded, nrrDollars, libraryMarkdown } from '../lib/narrative.js';

const blankBlock = () => ({ id: uid('blk'), type: 'pillar', title: '', text: '', personas: [], moments: [], status: 'draft', owner: '', reviewedOn: '', version: 1 });

const defaults = {
  personas: ['Admin', 'Team lead', 'Executive sponsor'],
  staleDays: 180,
  blocks: [],
  composer: { persona: 'Team lead', moment: 'expansion' },
  model: {
    startARR: 10000000,
    target: 1.2,
    current: { expansion: 0.12, contraction: 0.03, churn: 0.05 },
    program: { expansion: 0.18, contraction: 0.02, churn: 0.03 },
  },
};

const t = todayISO();
const old = todayISO(new Date(Date.now() - 400 * 86400000));
const B = (type, title, text, personas, moments, status = 'approved', reviewedOn = t, owner = 'PMM') => ({ id: uid('blk'), type, title, text, personas, moments, status, owner, reviewedOn, version: 1 });

// Illustrative library for a work management product, built like Asana's
// composable narrative products.
const example = {
  personas: ['Admin', 'Team lead', 'Executive sponsor'],
  staleDays: 180,
  composer: { persona: 'Executive sponsor', moment: 'renewal' },
  blocks: [
    B('core', 'Core: clarity at scale', 'Every team knows what to work on, why it matters and who owns it, so the company hits its goals without status meetings.', [], []),
    B('pillar', 'Pillar: goals connected to work', 'Company goals link straight to the projects and tasks behind them, so leaders see progress without asking for it.', ['Executive sponsor'], []),
    B('pillar', 'Pillar: fewer status meetings', 'Updates live where the work lives. Teams that roll out portfolios typically drop one recurring status meeting per week.', ['Team lead'], []),
    B('pillar', 'Pillar: governance without friction', 'SSO, permissions and audit logs come standard, so you can open access to more teams without opening risk.', ['Admin'], []),
    B('pillar', 'Pillar: expand what already works', 'The workflows your first team built are templates now. The next team starts from a working system, not a blank page.', [], ['expansion']),
    B('proof', 'Proof: launch time', 'A 400-person marketing org cut campaign launch time from 6 weeks to 4 after moving intake and approvals into one workflow.', ['Team lead', 'Executive sponsor'], ['expansion', 'renewal']),
    B('proof', 'Proof: usage report', 'Your workspace report: active users, projects linked to goals, and hours of status meetings removed this year. Pull it from the admin console before the call.', [], ['renewal', 'at-risk'], 'approved', old),
    B('proof', 'Proof: rollout speed', 'Admins at companies your size roll out to a new department in under 2 weeks using the template gallery.', ['Admin'], ['onboarding', 'expansion']),
    B('objection', 'Objection: "Teams already have their own tools"', 'Keep them. Integrations sync the work in. What changes is that leadership finally sees it in one place.', [], ['expansion', 'renewal']),
    B('objection', 'Objection: "Adoption stalled"', 'That usually means the first workflow was too broad. We will run a 2-week reset on one team\'s highest-friction process and measure it.', [], ['at-risk']),
    B('cta', 'CTA: expansion workshop', 'Book a 45-minute workshop to map the next team\'s workflow on top of what is already working.', [], ['expansion']),
    B('cta', 'CTA: value review', 'Let\'s walk through your value report together and agree on next year\'s goals before renewal.', [], ['renewal', 'at-risk']),
    B('cta', 'CTA: onboarding plan', 'Pick one workflow, launch it in 14 days, and we will measure the before and after.', [], ['onboarding', 'first-value']),
    B('pillar', 'Pillar: AI summaries (old)', 'Old positioning from last year\'s launch. Needs a refresh before anyone uses it.', [], [], 'review', old),
  ],
  model: {
    startARR: 100000000,
    target: 1.2,
    current: { expansion: 0.15, contraction: 0.03, churn: 0.05 },
    program: { expansion: 0.23, contraction: 0.015, churn: 0.015 },
  },
};

// UI-only state (not persisted). Declared before mountTool, which renders immediately.
let filter = { q: '', status: 'all', type: 'all' };

mountTool('narrative-library', {
  defaults,
  example,
  markdown: libraryMarkdown,
  render(app, ctx) {
    tabs(
      app,
      [
        { id: 'library', label: '1. Library', render: (p) => renderLibrary(p, ctx) },
        { id: 'composer', label: '2. Composer', render: (p) => renderComposer(p, ctx) },
        { id: 'coverage', label: '3. Coverage', render: (p) => renderCoverage(p, ctx) },
        { id: 'nrr', label: '4. NRR model', render: (p) => renderNRR(p, ctx) },
      ],
      'narrative-library',
    );
  },
});

function renderLibrary(panel, ctx) {
  const s = ctx.state;
  const list = h('div', { class: 'stack' });
  const today = todayISO();

  const draw = () => {
    const q = filter.q.toLowerCase();
    const shown = s.blocks.filter(
      (b) =>
        (filter.status === 'all' || b.status === filter.status) &&
        (filter.type === 'all' || b.type === filter.type) &&
        (!q || `${b.title} ${b.text}`.toLowerCase().includes(q)),
    );
    replaceChildren(list, shown.length ? shown.map((b) => blockEditor(b, ctx, today, draw)) : h('p', { class: 'muted' }, 'No blocks match. Add one or load the example.'));
  };

  const approved = s.blocks.filter((b) => b.status === 'approved').length;
  const stale = s.blocks.filter((b) => isStale(b, today, s.staleDays)).length;

  panel.append(
    h('div', { class: 'grid grid-4 mb' },
      stat('Blocks', String(s.blocks.length)),
      stat('Approved', String(approved)),
      stat('Stale', String(stale), `not reviewed in ${s.staleDays} days`),
      stat('Personas', String(s.personas.length), s.personas.join(', ')),
    ),
    h('div', { class: 'card stack mb' },
      h('div', { class: 'grid grid-3' },
        field('Personas (comma-separated)', textInput(s.personas.join(', '), (v) => { s.personas = splitList(v); ctx.save(); })),
        field('Stale after (days)', numberInput(s.staleDays, (v) => { s.staleDays = v; ctx.save(); }, { min: 1 })),
        field('Search', h('input', { type: 'search', value: filter.q, placeholder: 'Find a block', onInput: (e) => { filter.q = e.target.value; draw(); } })),
      ),
      h('div', { class: 'row' },
        select([{ value: 'all', label: 'All statuses' }, ...STATUSES], filter.status, (v) => { filter.status = v; draw(); }, { style: { width: 'auto' } }),
        select([{ value: 'all', label: 'All types' }, ...BLOCK_TYPES.map((x) => ({ value: x.id, label: x.label }))], filter.type, (v) => { filter.type = v; draw(); }, { style: { width: 'auto' } }),
        h('div', { style: { flex: 1 } }),
        button('+ New block', () => { s.blocks.unshift(blankBlock()); ctx.save(); draw(); }, 'primary sm'),
      ),
    ),
    list,
  );
  draw();
}

function blockEditor(b, ctx, today, redraw) {
  const s = ctx.state;
  const set = (k) => (v) => { b[k] = v; ctx.save(); };
  const toggle = (k, val) => (on) => {
    const arr = b[k];
    const i = arr.indexOf(val);
    if (on && i < 0) arr.push(val);
    if (!on && i >= 0) arr.splice(i, 1);
    ctx.save();
  };
  const stale = isStale(b, today, s.staleDays);
  return h('details', { class: 'card' },
    h('summary', { style: { cursor: 'pointer', listStyle: 'none' } },
      h('div', { class: 'row' },
        pill(BLOCK_TYPES.find((x) => x.id === b.type)?.label || b.type, 'info'),
        h('strong', null, b.title || '(untitled)'),
        pill(b.status, b.status === 'approved' ? 'good' : b.status === 'review' ? 'warn' : ''),
        stale ? pill('Stale', 'bad') : null,
        h('span', { class: 'small muted' }, `v${b.version}`),
      ),
      h('div', { class: 'small muted', style: { marginTop: '6px' } }, b.text.slice(0, 160) + (b.text.length > 160 ? '…' : '')),
    ),
    h('div', { class: 'stack mt' },
      h('div', { class: 'grid grid-3' },
        field('Type', select(BLOCK_TYPES.map((x) => ({ value: x.id, label: x.label })), b.type, set('type'))),
        field('Title', textInput(b.title, set('title'))),
        field('Status', select(STATUSES, b.status, (v) => { b.status = v; ctx.save(); redraw(); })),
      ),
      field('Approved copy', textArea(b.text, set('text'), { rows: 3 })),
      h('div', { class: 'grid grid-2' },
        h('div', null, h('div', { class: 'small muted' }, 'Personas (none = all)'), h('div', { class: 'row' }, s.personas.map((p) => checkbox(b.personas.includes(p), toggle('personas', p), p)))),
        h('div', null, h('div', { class: 'small muted' }, 'Moments of truth (none = all)'), h('div', { class: 'row' }, MOMENTS.map((m) => checkbox(b.moments.includes(m.id), toggle('moments', m.id), m.label)))),
      ),
      h('div', { class: 'grid grid-3' },
        field('Owner', textInput(b.owner, set('owner'))),
        field('Last reviewed', dateInput(b.reviewedOn, set('reviewedOn'))),
        h('div', { class: 'row', style: { alignItems: 'end' } },
          button('Reviewed today (+1 version)', () => { b.reviewedOn = todayISO(); b.version = (b.version || 1) + 1; ctx.save(); redraw(); }, 'sm'),
          button('Delete', () => { if (confirm('Delete this block?')) { s.blocks.splice(s.blocks.indexOf(b), 1); ctx.save(); redraw(); } }, 'ghost sm danger'),
        ),
      ),
    ),
  );
}

function renderComposer(panel, ctx) {
  const s = ctx.state;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const c = compose(s.blocks, s.composer.persona, s.composer.moment, { today: todayISO(), staleDays: s.staleDays });
    const m = MOMENTS.find((x) => x.id === s.composer.moment);
    replaceChildren(
      out,
      callout(h('span', null, h('strong', null, `${m.label}: `), m.goal, ` NRR lever: ${m.lever}.`)),
      c.gaps.length ? callout(`No approved ${c.gaps.join(', ').toLowerCase()} for ${s.composer.persona} at ${m.label.toLowerCase()}. Add or approve one in the library.`, 'warn') : null,
      c.stale.length ? callout(`${c.stale.length} block(s) here are past the review window: ${c.stale.map((b) => b.title).join(', ')}.`, 'bad') : null,
      h('div', { class: 'card stack' },
        h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h3', { class: 'mt-0' }, 'Composed message'), c.text ? button('Copy message', () => copyText(c.text), 'sm primary') : null),
        c.text ? h('div', { class: 'copy-area' }, c.text) : h('p', { class: 'muted' }, 'Nothing approved fits this combination yet.'),
      ),
      table(
        [
          { label: 'Section', render: (r) => r.type.label },
          { label: 'Blocks used', render: (r) => (r.blocks.length ? r.blocks.map((b) => h('div', null, `${b.title} (v${b.version})`)) : pill('Gap', 'warn')) },
        ],
        c.sections,
      ),
    );
  };
  panel.append(
    h('div', { class: 'grid grid-2 mb' },
      field('Persona', select(s.personas, s.composer.persona, (v) => { s.composer.persona = v; ctx.save(); draw(); })),
      field('Moment of truth', select(MOMENTS.map((m) => ({ value: m.id, label: m.label })), s.composer.moment, (v) => { s.composer.moment = v; ctx.save(); draw(); })),
    ),
    out,
  );
  draw();
}

function renderCoverage(panel, ctx) {
  const s = ctx.state;
  const rows = coverage(s.blocks, s.personas);
  const maxBlocks = BLOCK_TYPES.reduce((a, b) => a + b.max, 0);
  panel.append(
    callout(`Each cell counts approved blocks the composer can use (max ${maxBlocks}). Gaps are your PMM backlog, ranked by which NRR lever they hit.`),
    h('div', { class: 'table-wrap' },
      h('table', { class: 'heat' },
        h('thead', null, h('tr', null, h('th', null, 'Persona'), MOMENTS.map((m) => h('th', { class: 'num' }, m.label)))),
        h('tbody', null,
          rows.map((r) =>
            h('tr', null,
              h('td', null, h('strong', null, r.persona)),
              r.cells.map((c) =>
                h('td', { class: 'cell', title: c.gaps.length ? `Missing: ${c.gaps.join(', ')}` : 'Fully covered' },
                  h('div', null, `${c.count}/${maxBlocks}`),
                  c.gaps.length ? pill(`${c.gaps.length} gap${c.gaps.length > 1 ? 's' : ''}`, c.gaps.length > 2 ? 'bad' : 'warn') : pill('Covered', 'good'),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function renderNRR(panel, ctx) {
  const m = ctx.state.model;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const cur = nrr(m.current);
    const prog = nrr(m.program);
    const need = expansionNeeded(m.target, m.program);
    const dCur = nrrDollars(m.startARR, m.current);
    const dProg = nrrDollars(m.startARR, m.program);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-4' },
        stat('NRR today', pct(cur)),
        stat('NRR with program', pct(prog), `${prog >= m.target ? 'hits' : 'misses'} the ${pct(m.target, 0)} target`),
        stat('Extra retained ARR', compact(dProg.end - dCur.end, { currency: true }), `on ${compact(m.startARR, { currency: true })} starting ARR`),
        stat('Expansion needed for target', pct(need), 'given program churn + contraction'),
      ),
      h('div', { class: 'grid grid-2' },
        h('div', { class: 'card' }, h('h3', null, 'Today'), hbars([
          { label: 'Expansion', value: dCur.expansion, display: money(dCur.expansion) },
          { label: 'Contraction', value: dCur.contraction, display: `-${money(dCur.contraction)}`, tone: 'alt' },
          { label: 'Churn', value: dCur.churn, display: `-${money(dCur.churn)}`, tone: 'alt' },
        ], { max: Math.max(dCur.expansion, dProg.expansion) })),
        h('div', { class: 'card' }, h('h3', null, 'With narrative program'), hbars([
          { label: 'Expansion', value: dProg.expansion, display: money(dProg.expansion) },
          { label: 'Contraction', value: dProg.contraction, display: `-${money(dProg.contraction)}`, tone: 'alt' },
          { label: 'Churn', value: dProg.churn, display: `-${money(dProg.churn)}`, tone: 'alt' },
        ], { max: Math.max(dCur.expansion, dProg.expansion) })),
      ),
      table(
        [
          { label: 'Moment of truth', render: (x) => h('strong', null, x.label) },
          { label: 'NRR lever', key: 'lever' },
          { label: 'What the message has to do', key: 'goal' },
        ],
        MOMENTS,
      ),
    );
  };
  const part = (obj, k, label) => field(label, percentInput(obj[k], (v) => { obj[k] = v; ctx.save(); draw(); }, { min: 0 }));
  panel.append(
    callout('NRR = 1 + expansion − contraction − churn, each as a share of starting ARR. Narrative products move it by giving CS and sales the right message at each moment of truth.'),
    h('div', { class: 'grid grid-3' },
      h('div', { class: 'card stack' },
        h('h3', null, 'Base'),
        field('Starting ARR ($)', numberInput(m.startARR, (v) => { m.startARR = v; ctx.save(); draw(); }, { min: 0 })),
        field('Target NRR (%)', percentInput(m.target, (v) => { m.target = v; ctx.save(); draw(); }, { min: 0 })),
      ),
      h('div', { class: 'card stack' }, h('h3', null, 'Today (% of ARR)'), part(m.current, 'expansion', 'Expansion'), part(m.current, 'contraction', 'Contraction'), part(m.current, 'churn', 'Churn')),
      h('div', { class: 'card stack' }, h('h3', null, 'With program (% of ARR)'), part(m.program, 'expansion', 'Expansion'), part(m.program, 'contraction', 'Contraction'), part(m.program, 'churn', 'Churn')),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}
