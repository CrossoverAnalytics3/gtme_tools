// Page chrome shared by every tool: top bar with the tool menu, the tool
// header (signal color, source metric), the feature -> benefit -> use case
// table, the data toolbar, the example banner and the footer.

import { TOOLS, ROLES, getTool } from './registry.js';
import { h, clear, button, download, copyText, pickFile, toast, table, ask } from './dom.js';
import { createStore, clone } from './store.js';
import { hubHref, toolHref, designSystemHref } from './links.js';
import { isHosted } from './runtime.js';

const THEMES = ['auto', 'light', 'dark'];

export function applySavedTheme() {
  let t = 'auto';
  try {
    t = localStorage.getItem('gtm-toolkit:theme') || 'auto';
  } catch {
    /* ignore */
  }
  setTheme(t);
  return t;
}

function setTheme(t) {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  try {
    localStorage.setItem('gtm-toolkit:theme', t);
  } catch {
    /* ignore */
  }
}

/** Five-bar brand mark in the tools' signal colors. */
export function brandMark() {
  const ids = ['launch-lift', 'adoption-campaign', 'inbound-agent', 'win-room', 'risk-messaging'];
  return h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, ids.map((id) => h('i', { style: `--c: var(--sig-${id})` })));
}

export function topbar({ base = '..', currentId = null } = {}) {
  // The claude.ai viewer applies its own theme, so the toggle only shows elsewhere.
  let theme = isHosted() ? 'auto' : applySavedTheme();
  const themeBtn = isHosted()
    ? null
    : button(`Theme: ${theme}`, () => {
        theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
        setTheme(theme);
        themeBtn.textContent = `Theme: ${theme}`;
      }, 'ghost sm', { 'aria-label': 'Toggle color theme' });

  const current = currentId ? getTool(currentId) : null;
  const menu = h(
    'details',
    { class: 'menu' },
    h('summary', null, current ? `${current.n}. ${current.title}` : 'All tools'),
    h(
      'nav',
      { class: 'menu-panel', 'aria-label': 'Tools' },
      h('a', { href: hubHref(base) }, h('span', { class: 'dot', style: '--c: var(--ink)' }), 'All tools'),
      h('div', { class: 'sep' }),
      TOOLS.map((t) =>
        h('a', { href: toolHref(t.id, base), 'aria-current': t.id === currentId ? 'page' : null }, h('span', { class: 'dot', style: `--c: var(--sig-${t.id})` }), `${t.n}. ${t.title}`),
      ),
      h('div', { class: 'sep' }),
      h('a', { href: designSystemHref(base) }, h('span', { class: 'dot', style: '--c: var(--line-2)' }), 'Design system'),
    ),
  );
  document.addEventListener('click', (e) => {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });

  return h(
    'header',
    { class: 'topbar' },
    h('div', { class: 'topbar-inner' }, h('a', { class: 'brand', href: hubHref(base), 'aria-label': 'GTM Toolkit home' }, brandMark(), h('span', { class: 'brand-text' }, 'GTM Toolkit')), h('div', { class: 'spacer' }), menu, themeBtn),
  );
}

export function footer() {
  return h(
    'footer',
    { class: 'site' },
    h('p', null, isHosted() ? 'Your work saves to your claude.ai account as you type, privately. Export JSON to share it.' : 'Your work saves in this browser as you type. Export JSON to share or back it up.'),
    h('p', null, 'Outcomes are as reported in the source brief and not independently verified. Example data is illustrative, not company or team data.'),
    h('p', { class: 'credit' }, CREDIT),
  );
}

export const CREDIT = 'Designed by Chris Conyers, built with Claude Code.';
export const DISCLAIMER = 'Outcomes as reported in the source brief; not independently verified.';

function hero(tool) {
  return h(
    'section',
    { class: 'hero' },
    h('div', { class: 'kicker' }, h('span', { class: 'num' }, String(tool.n).padStart(2, '0')), `${ROLES[tool.role]} · ${tool.signal.name}`),
    h('h1', null, tool.title),
    h('p', { class: 'lede' }, tool.summary),
    h(
      'div',
      { class: 'readout' },
      h('span', { class: 'r-label' }, 'Reported'),
      h('span', { class: 'r-value big' }, tool.outcome),
      h('span', { class: 'r-label' }, 'Metric'),
      h('span', { class: 'r-value' }, tool.metric),
      h('span', { class: 'r-label' }, 'Source'),
      h('span', { class: 'r-value muted' }, tool.source),
      h('span', { class: 'r-label' }, 'Method'),
      h('span', { class: 'r-value muted' }, tool.framework),
      h('span', { class: 'r-note' }, DISCLAIMER),
    ),
  );
}

function explainer(tool) {
  const d = h(
    'details',
    { class: 'explainer' },
    h('summary', null, 'Feature → benefit → use case'),
    table(
      [
        { label: 'Feature', key: 'feature' },
        { label: 'Benefit', key: 'benefit' },
        { label: 'Use case', key: 'useCase' },
      ],
      tool.features,
    ),
  );
  if (window.matchMedia('(min-width: 900px)').matches) d.open = true;
  return d;
}

const SYNC_LABEL = {
  local: 'Saved in this browser',
  syncing: 'Saving to your account…',
  synced: 'Saved to your account',
  error: 'Saved in this browser only',
};

/**
 * Mount a tool page.
 * opts.defaults   blank state
 * opts.example    the brief's case; a first visit opens on it
 * opts.examples   optional [{id, button, banner, data}] when a tool has more
 *                 than one example; the first one opens on a first visit
 * opts.render     (app, ctx) => void, builds the tool UI
 * opts.markdown   optional (state) => string, export as a document
 */
export function mountTool(id, { defaults, example, examples, render, markdown }) {
  const tool = getTool(id);
  const exampleList = examples || (example ? [{ id: 'brief', button: 'Load example', banner: 'You\'re looking at the example from the brief.', data: example }] : []);
  const exampleById = (eid) => exampleList.find((x) => x.id === eid) || exampleList[0];
  document.documentElement.setAttribute('data-tool', id);
  document.title = tool.title;

  const app = h('div', { id: 'app' });
  const banner = h('div');
  const sync = h('span', { class: 'sync', role: 'status' }, '');
  const store = createStore(id, defaults, {
    example: exampleList[0]?.data ?? null,
    exampleId: exampleList[0]?.id,
    onRemote: () => draw(),
    onStatus: (s) => {
      sync.textContent = isHosted() || s !== 'local' ? SYNC_LABEL[s] : SYNC_LABEL.local;
    },
  });

  const ctx = {
    store,
    get state() {
      return store.state;
    },
    save: () => {
      store.save();
      drawBanner();
    },
    rerender: () => draw(),
  };

  function drawBanner() {
    clear(banner);
    if (!store.fromExample) return;
    banner.append(
      h(
        'div',
        { class: 'banner', role: 'note' },
        h('span', { class: 'grow' }, h('strong', null, `${exampleById(store.fromExample)?.banner ?? 'You\'re looking at an example.'} `), 'Edit anything to make it yours, or clear it and start from blank.'),
        button('Start blank', async () => {
          if (!(await ask('Clear the example and start from a blank page?', { confirmLabel: 'Start blank' }))) return;
          store.reset();
          draw();
        }, 'sm primary'),
        button('Keep the example', () => {
          store.dismissExample();
          drawBanner();
        }, 'sm ghost'),
      ),
    );
  }

  function draw() {
    clear(app);
    drawBanner();
    render(app, ctx);
  }

  const actions = [
    ...exampleList.map((ex) =>
      button(ex.button, async () => {
        if (!(await ask(`Replace what is on this page with ${ex.id === 'brief' ? 'the example from the brief' : 'this example'}?`, { confirmLabel: ex.button }))) return;
        store.replace(clone(ex.data), { fromExample: ex.id });
        draw();
        toast('Example loaded');
      }),
    ),
    button('Reset', async () => {
      if (!(await ask('Clear everything on this page? This can\'t be undone.', { confirmLabel: 'Clear page', danger: true }))) return;
      store.reset();
      draw();
    }),
    sync,
    h('div', { class: 'spacer' }),
    markdown ? button('Copy as Markdown', () => copyText(markdown(store.state), 'Markdown copied')) : null,
    markdown ? button('Save .md', () => download(`${id}.md`, markdown(store.state), 'text/markdown')) : null,
    button('Export JSON', () => download(`${id}.json`, JSON.stringify({ tool: id, version: 1, data: store.state }, null, 2), 'application/json')),
    button('Import JSON', async () => {
      const f = await pickFile('.json');
      if (!f) return;
      try {
        const parsed = JSON.parse(f.text);
        if (parsed.tool && parsed.tool !== id) throw new Error(`that file is for "${parsed.tool}"`);
        store.replace(parsed.data ?? parsed);
        draw();
        toast('Imported');
      } catch (err) {
        toast(`Could not import: ${err.message}`);
      }
    }),
    isHosted() ? null : button('Print', () => window.print(), 'ghost'),
  ];

  const main = h('main', { class: 'wrap' }, hero(tool), explainer(tool), h('div', { class: 'toolbar' }, actions), banner, app);
  document.body.prepend(topbar({ base: '..', currentId: id }));
  document.body.append(main, footer());
  draw();
  return ctx;
}
