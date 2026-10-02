// Page chrome shared by every tool: top bar, hero with the source metric,
// the feature -> benefit -> use case table, the data toolbar and footer.

import { TOOLS, ROLES, getTool } from './registry.js';
import { h, clear, button, download, copyText, pickFile, toast, table } from './dom.js';
import { createStore, clone } from './store.js';

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

export function topbar({ base = '..', currentId = null } = {}) {
  let theme = applySavedTheme();
  const themeBtn = button(`Theme: ${theme}`, () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(theme);
    themeBtn.textContent = `Theme: ${theme}`;
  }, 'ghost sm', { 'aria-label': 'Toggle color theme' });

  const nav = h(
    'select',
    {
      'aria-label': 'Jump to tool',
      onChange: (e) => {
        if (e.target.value) location.href = e.target.value;
      },
    },
    h('option', { value: `${base}/index.html` }, 'All tools'),
    TOOLS.map((t) => h('option', { value: `${base}/tools/${t.id}.html` }, `${t.n}. ${t.title}`)),
  );
  nav.value = currentId ? `${base}/tools/${currentId}.html` : `${base}/index.html`;

  return h(
    'header',
    { class: 'topbar' },
    h('div', { class: 'topbar-inner' }, h('a', { class: 'brand', href: `${base}/index.html` }, 'GTM', h('span', null, '/'), 'Toolkit'), h('div', { class: 'spacer' }), nav, themeBtn),
  );
}

export function footer() {
  return h(
    'footer',
    { class: 'site' },
    h('p', null, 'Your data stays in this browser (localStorage). Export JSON to share or back up.'),
    h('p', null, 'Example data reconstructs the brief\'s case studies for illustration. It is not company data.'),
  );
}

function hero(tool) {
  return h(
    'section',
    { class: 'hero' },
    h('div', { class: 'kicker' }, `Tool ${tool.n} of ${TOOLS.length} · ${ROLES[tool.role]}`),
    h('h1', null, tool.title),
    h('p', { class: 'lede' }, tool.summary),
    h(
      'div',
      { class: 'metric-badge' },
      h('span', null, tool.metric),
      h('strong', null, tool.outcome),
      h('span', { class: 'muted' }, tool.source),
    ),
    h('p', { class: 'small muted' }, h('strong', null, 'Framework: '), tool.framework),
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

/**
 * Mount a tool page.
 * opts.defaults   initial state
 * opts.example    example state (from the brief's case)
 * opts.render     (app, ctx) => void, builds the tool UI
 * opts.markdown   optional (state) => string, export as a document
 */
export function mountTool(id, { defaults, example, render, markdown }) {
  const tool = getTool(id);
  const store = createStore(id, defaults);
  document.title = `${tool.title} · GTM Toolkit`;

  const app = h('div', { id: 'app' });
  const ctx = {
    store,
    get state() {
      return store.state;
    },
    save: () => store.save(),
    rerender: () => draw(),
  };

  function draw() {
    clear(app);
    render(app, ctx);
  }

  const tools = [
    example
      ? button('Load example', () => {
          if (!confirm('Replace what is on this page with the example from the brief?')) return;
          store.replace(clone(example));
          draw();
          toast('Example loaded');
        }, 'primary')
      : null,
    button('Reset', () => {
      if (!confirm('Clear everything on this page?')) return;
      store.reset();
      draw();
    }),
    h('div', { class: 'spacer' }),
    markdown
      ? button('Copy as Markdown', () => copyText(markdown(store.state), 'Markdown copied'))
      : null,
    markdown
      ? button('Download .md', () => download(`${id}.md`, markdown(store.state), 'text/markdown'))
      : null,
    button('Export JSON', () => download(`${id}.json`, JSON.stringify({ tool: id, version: 1, data: store.state }, null, 2), 'application/json')),
    button('Import JSON', async () => {
      const f = await pickFile('.json');
      if (!f) return;
      try {
        const parsed = JSON.parse(f.text);
        if (parsed.tool && parsed.tool !== id) throw new Error(`That file is for "${parsed.tool}"`);
        store.replace(parsed.data ?? parsed);
        draw();
        toast('Imported');
      } catch (err) {
        alert(`Could not import: ${err.message}`);
      }
    }),
    button('Print', () => window.print(), 'ghost'),
  ];

  const main = h('main', { class: 'wrap' }, hero(tool), explainer(tool), h('div', { class: 'toolbar' }, tools), app);
  document.body.prepend(topbar({ base: '..', currentId: id }));
  document.body.append(main, footer());
  draw();
  return ctx;
}
