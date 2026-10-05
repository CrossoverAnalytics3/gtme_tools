import { TOOLS, ROLES, getTool } from './core/registry.js';
import { topbar, footer, DISCLAIMER, CREDIT } from './core/shell.js';
import { h, replaceChildren, button } from './core/dom.js';
import { toolHref, designSystemHref } from './core/links.js';

const PLAYS = [
  {
    title: 'Launch a feature that moves a number',
    when: 'A feature ships next month and leadership wants engagement, not a blog post.',
    steps: ['fast-five', 'segment-sizer', 'risk-messaging', 'launch-lift', 'adoption-campaign'],
    notes: ['Learn why users care', 'Pick and size the segment', 'Write the risk-first message', 'Plan, set targets, measure lift', 'Educate existing users onto it'],
  },
  {
    title: 'Fix a slipping win rate',
    when: 'Sellers say you lose on price. You suspect that\'s not the whole story.',
    steps: ['win-room', 'fast-five', 'narrative-library', 'positioning-lab'],
    notes: ['Lostbot audit on lost deals', 'Interview 5 lost buyers', 'Publish the approved counter-narrative', 'Test the new angle before rollout'],
  },
  {
    title: 'Stand up a GTM engineering function',
    when: 'Inbound volume is growing faster than SDR headcount.',
    steps: ['inbound-agent', 'agent-roi', 'win-room'],
    notes: ['Encode rules, route leads, QA the gray zone', 'Price it and model the redeployed SDRs', 'Add Dealbot alerts to deal channels'],
  },
  {
    title: 'Grow net revenue retention',
    when: 'New-logo growth is slowing and the board is asking about expansion.',
    steps: ['narrative-library', 'adoption-campaign', 'risk-messaging'],
    notes: ['Model NRR levers, fill coverage gaps', 'Drive adoption of sticky features', 'Arm CS with risk-first renewal talk tracks'],
  },
];

let role = 'all';
const sig = (id) => `--c: var(--sig-${id}); --accent: var(--sig-${id})`;

function render() {
  const grid = h('div', { class: 'grid grid-3' });
  const drawGrid = () => {
    replaceChildren(
      grid,
      TOOLS.filter((t) => role === 'all' || t.role === role || t.role === 'both').map((t) =>
        h('a', { class: 'card tool-card', href: toolHref(t.id, '.'), style: sig(t.id) },
          h('div', { class: 'top' }, h('span', { class: 'num' }, `TOOL ${String(t.n).padStart(2, '0')}`), h('span', { class: 'dot' })),
          h('h3', null, t.title),
          h('div', { class: 'outcome' }, t.outcome),
          h('p', null, t.summary),
          h('div', { class: 'role row' }, h('span', { class: 'pill' }, ROLES[t.role]), h('span', { class: 'small muted' }, `${t.features.length} features · ${t.signal.name}`)),
        ),
      ),
    );
  };
  const filters = h('div', { class: 'row', role: 'group', 'aria-label': 'Filter by role' },
    ['all', 'pmm', 'gtme'].map((r) =>
      button(r === 'all' ? 'All tools' : ROLES[r], (e) => {
        role = r;
        for (const b of filters.children) {
          b.classList.toggle('primary', b === e.currentTarget);
          b.setAttribute('aria-pressed', String(b === e.currentTarget));
        }
        drawGrid();
      }, r === role ? 'sm primary' : 'sm', { 'aria-pressed': String(r === role) }),
    ),
  );

  const main = h('main', { class: 'wrap' },
    h('section', { class: 'hub-hero' },
      h('div', { class: 'signal-strip', 'aria-hidden': 'true' }, TOOLS.map((t) => h('i', { style: `--c: var(--sig-${t.id})` }))),
      h('div', { class: 'kicker' }, 'Product marketing + GTM engineering'),
      h('h1', null, 'Ten working tools for the jobs PMMs and GTM engineers do every week'),
      h('p', { class: 'lede', style: { maxWidth: '68ch', color: 'var(--ink-2)', fontSize: '1.05rem', margin: 0 } },
        'Plan a launch and prove its lift against a holdout. Route inbound leads with a rules-based agent and price what it costs to run. Audit why deals were really lost, size a segment by cohort, check copy for risk language, and turn five customer interviews into patterns. Each tool runs one framework from an executive brief on modern product marketing, on your own numbers.'),
      h('p', { class: 'small', style: { margin: 0, color: 'var(--ink-2)' } }, CREDIT),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary', href: '#tools' }, 'Browse the tools'),
        h('a', { class: 'btn', href: '#plays' }, 'See how they chain'),
        h('a', { class: 'btn ghost', href: designSystemHref('.') }, 'Design system'),
      ),
    ),

    h('div', { class: 'section-title' }, h('h2', null, 'Where each tool comes from'), h('span', { class: 'small muted' }, DISCLAIMER)),
    h('p', { class: 'small muted', style: { maxWidth: '72ch' } }, 'Each tool is built around one row of the brief\'s metrics table. The outcomes below are the brief\'s figures, shown for context. The tools teach the method; your numbers are what count.'),
    h('div', { class: 'table-wrap' },
      h('table', null,
        h('thead', null, h('tr', null, ['Metric / objective', 'Reported outcome', 'Source context', 'Tool'].map((x) => h('th', null, x)))),
        h('tbody', null,
          TOOLS.map((t) =>
            h('tr', { style: sig(t.id) },
              h('td', null, t.metric),
              h('td', null, h('strong', { class: 'mono', style: { color: 'var(--accent)' } }, t.outcome)),
              h('td', { class: 'muted' }, t.source),
              h('td', null, h('a', { href: toolHref(t.id, '.'), class: 'row', style: { gap: '8px', flexWrap: 'nowrap' } }, h('span', { class: 'dot' }), `${t.title}`)),
            ),
          ),
        ),
      ),
    ),

    h('div', { class: 'section-title', id: 'tools' }, h('h2', null, 'Tools'), filters),
    grid,

    h('div', { class: 'section-title', id: 'plays' }, h('h2', null, 'Plays: tools in sequence')),
    h('p', { class: 'muted' }, 'Each tool works alone. These are the orders I\'d run them in for 4 common jobs.'),
    h('div', { class: 'grid grid-2' },
      PLAYS.map((p) =>
        h('div', { class: 'card stack' },
          h('h3', null, p.title),
          h('p', { class: 'small muted' }, p.when),
          h('ol', { class: 'list-tight' },
            p.steps.map((id, i) => {
              const t = getTool(id);
              return h('li', { style: sig(id) }, h('a', { href: toolHref(id, '.') }, t.title), h('span', { class: 'muted' }, `: ${p.notes[i]}`));
            }),
          ),
        ),
      ),
    ),

    h('div', { class: 'section-title' }, h('h2', null, 'How it works')),
    h('div', { class: 'grid grid-3' },
      h('div', { class: 'card' }, h('h3', null, 'Opens on a worked example'), h('p', { class: 'small' }, 'Every tool starts filled in, with a banner saying so. Edit it or start blank. The ', h('a', { href: toolHref('narrative-library', '.') }, 'Narrative Product Library'), ' opens on an illustrative Personnel & Coaching example (head coach, analytics director and GM personas); the rest rebuild the brief\'s cases. None of it is real company or team data.')),
      h('div', { class: 'card' }, h('h3', null, 'Your work is saved'), h('p', { class: 'small' }, 'Changes save as you type. On claude.ai they go to a private space on your account, so they follow you between devices. Export JSON to hand a filled-in tool to a teammate.')),
      h('div', { class: 'card' }, h('h3', null, 'Built for GTMEs too'), h('p', { class: 'small' }, 'The logic lives in plain, tested JS modules in the repo. The lead agent also runs from the command line: ', h('code', null, 'npm run qualify -- leads.csv'), '.')),
    ),
  );

  document.body.prepend(topbar({ base: '.', currentId: null }));
  document.body.append(main, footer());
  drawGrid();
}

render();
