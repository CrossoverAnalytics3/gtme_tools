import { TOOLS, ROLES, getTool } from './core/registry.js';
import { topbar, footer } from './core/shell.js';
import { h, replaceChildren, button } from './core/dom.js';

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
    notes: ['Lostbot audit on lost deals', 'Interview 5 lost buyers', 'Publish approved counter-narrative', 'Test the new angle before rollout'],
  },
  {
    title: 'Stand up a GTM engineering function',
    when: 'Inbound volume is growing faster than SDR headcount.',
    steps: ['inbound-agent', 'agent-roi', 'win-room'],
    notes: ['Encode rules, route leads, QA the gray zone', 'Price it and model the redeployed SDRs', 'Add Dealbot alerts to deal channels'],
  },
  {
    title: 'Grow net revenue retention',
    when: 'New logo growth is slowing and the board is asking about expansion.',
    steps: ['narrative-library', 'adoption-campaign', 'risk-messaging'],
    notes: ['Model NRR levers, fill coverage gaps', 'Drive adoption of sticky features', 'Arm CS with risk-first renewal talk tracks'],
  },
];

let role = 'all';

function render() {
  const grid = h('div', { class: 'grid grid-3' });
  const drawGrid = () => {
    replaceChildren(
      grid,
      TOOLS.filter((t) => role === 'all' || t.role === role || t.role === 'both').map((t) =>
        h('a', { class: 'card tool-card', href: `tools/${t.id}.html` },
          h('div', { class: 'num' }, `TOOL ${t.n}`),
          h('h3', null, t.title),
          h('div', { class: 'outcome' }, t.outcome),
          h('p', null, t.summary),
          h('div', { class: 'role row' }, h('span', { class: 'pill' }, ROLES[t.role]), h('span', { class: 'small muted' }, `${t.features.length} features`)),
        ),
      ),
    );
  };
  const filters = h('div', { class: 'row' },
    ['all', 'pmm', 'gtme'].map((r) =>
      button(r === 'all' ? 'All tools' : ROLES[r], (e) => {
        role = r;
        for (const b of filters.children) b.classList.toggle('primary', b === e.currentTarget);
        drawGrid();
      }, r === role ? 'sm primary' : 'sm'),
    ),
  );

  const main = h('main', { class: 'wrap' },
    h('section', { class: 'hero' },
      h('div', { class: 'kicker' }, 'From executive brief to working tools'),
      h('h1', null, 'GTM Toolkit for PMMs and GTM engineers'),
      h('p', { class: 'lede' }, 'The brief\'s metrics table lists 10 results: +31% engagement, 10 SDRs down to 1, NRR from 107% to 120%, and more. Each tool here takes one result and turns the method behind it into something you can run on your own numbers.'),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary', href: '#tools' }, 'Browse the tools'),
        h('a', { class: 'btn', href: '#plays' }, 'See how they chain together'),
      ),
    ),

    h('div', { class: 'section-title' }, h('h2', null, 'The metrics table, as tools')),
    h('div', { class: 'table-wrap' },
      h('table', null,
        h('thead', null, h('tr', null, ['Metric / objective', 'Value / outcome', 'Source context', 'Tool'].map((x) => h('th', null, x)))),
        h('tbody', null,
          TOOLS.map((t) =>
            h('tr', null,
              h('td', null, t.metric),
              h('td', null, h('strong', null, t.outcome)),
              h('td', { class: 'muted' }, t.source),
              h('td', null, h('a', { href: `tools/${t.id}.html` }, `${t.n}. ${t.title}`)),
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
              return h('li', null, h('a', { href: `tools/${id}.html` }, t.title), h('span', { class: 'muted' }, `: ${p.notes[i]}`));
            }),
          ),
        ),
      ),
    ),

    h('div', { class: 'section-title' }, h('h2', null, 'How it works')),
    h('div', { class: 'grid grid-3' },
      h('div', { class: 'card' }, h('h3', null, 'Your data stays local'), h('p', { class: 'small' }, 'Everything saves to this browser as you type. Nothing is sent anywhere. Export JSON to back up, share with a teammate, or move between machines.')),
      h('div', { class: 'card' }, h('h3', null, 'Start from an example'), h('p', { class: 'small' }, 'Every tool has a "Load example" button that rebuilds the brief\'s case (Whoop, Etsy, Vercel, Asana...) so you can see a filled-in version first. The examples are illustrative, not company data.')),
      h('div', { class: 'card' }, h('h3', null, 'Built for GTMEs too'), h('p', { class: 'small' }, 'The logic lives in plain JS modules with tests. The lead agent runs from the command line: ', h('code', null, 'npm run qualify -- leads.csv'), '.')),
    ),
  );

  document.body.prepend(topbar({ base: '.', currentId: null }));
  document.body.append(main, footer());
  drawGrid();
}

render();
