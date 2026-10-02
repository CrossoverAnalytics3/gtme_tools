/* @ds-bundle: {"format":4,"namespace":"GTMKit","components":[{"name":"Button"},{"name":"Field"},{"name":"Tabs"},{"name":"TopBar"},{"name":"ToolHeader"},{"name":"ExampleBanner"},{"name":"StatTile"},{"name":"Pill"},{"name":"Callout"},{"name":"DataTable"},{"name":"BarChart"},{"name":"Meter"},{"name":"ToolCard"},{"name":"ConfirmDialog"},{"name":"Toast"}]} */
/* GTM Toolkit components as plain DOM factories. No framework, no network.
   Mirrors assets/js/core/dom.js and shell.js in the gtme_tools repo.
   Every factory returns an HTMLElement styled by bundle.css. */
(function () {
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) return c.forEach(function (x) { add(el, x); });
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }

  /** variant: 'default' | 'primary' | 'ghost' | 'danger'; size: 'md' | 'sm' */
  function Button(p) {
    p = p || {};
    var cls = ['btn'];
    if (p.variant && p.variant !== 'default') cls.push(p.variant === 'danger' ? 'danger solid' : p.variant);
    if (p.size === 'sm') cls.push('sm');
    return h('button', { type: 'button', class: cls.join(' '), onClick: p.onClick, disabled: p.disabled }, p.label);
  }

  /** A labeled control. kind: 'text' | 'number' | 'select' | 'textarea' */
  function Field(p) {
    var input;
    if (p.kind === 'select') {
      input = h('select', { id: p.id }, (p.options || []).map(function (o) { return h('option', { value: o }, o); }));
      if (p.value != null) input.value = p.value;
    } else if (p.kind === 'textarea') {
      input = h('textarea', { id: p.id, placeholder: p.placeholder }, p.value || '');
    } else {
      input = h('input', { id: p.id, type: p.kind === 'number' ? 'number' : 'text', placeholder: p.placeholder });
      if (p.value != null) input.value = p.value;
    }
    if (p.onInput) input.addEventListener('input', function (e) { p.onInput(e.target.value); });
    return h('label', { class: 'field' }, h('span', { class: 'lbl' }, p.label), input, p.help ? h('small', { class: 'muted' }, p.help) : null);
  }

  /** items: [{id, label, render(panel)}] */
  function Tabs(p) {
    var wrap = h('div');
    var bar = h('div', { class: 'tabs', role: 'tablist' });
    var panel = h('div', { role: 'tabpanel' });
    function show(id) {
      Array.prototype.forEach.call(bar.children, function (b) { b.setAttribute('aria-selected', String(b.dataset.id === id)); });
      panel.textContent = '';
      p.items.filter(function (t) { return t.id === id; })[0].render(panel);
    }
    p.items.forEach(function (t) {
      var b = h('button', { type: 'button', role: 'tab', onClick: function () { show(t.id); } }, t.label);
      b.dataset.id = t.id;
      bar.append(b);
    });
    wrap.append(bar, panel);
    show(p.initial || p.items[0].id);
    return wrap;
  }

  var MARK = ['launch-lift', 'adoption-campaign', 'inbound-agent', 'win-room', 'risk-messaging'];
  /** tools: [{id, n, title, href}], current: tool id */
  function TopBar(p) {
    var mark = h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, MARK.map(function (id) { return h('i', { style: '--c: var(--sig-' + id + ')' }); }));
    var cur = (p.tools || []).filter(function (t) { return t.id === p.current; })[0];
    var menu = h('details', { class: 'menu' },
      h('summary', null, cur ? cur.n + '. ' + cur.title : 'All tools'),
      h('nav', { class: 'menu-panel' }, (p.tools || []).map(function (t) {
        return h('a', { href: t.href || '#', 'aria-current': t.id === p.current ? 'page' : null }, h('span', { class: 'dot', style: '--c: var(--sig-' + t.id + ')' }), t.n + '. ' + t.title);
      })));
    return h('header', { class: 'topbar' }, h('div', { class: 'topbar-inner' }, h('a', { class: 'brand', href: p.homeHref || '#' }, mark, h('span', { class: 'brand-text' }, p.name || 'GTM Toolkit')), h('div', { class: 'spacer' }), menu));
  }

  /** The tool's name, number, signal and the brief outcome it reproduces. */
  function ToolHeader(p) {
    var rows = [['Outcome', p.outcome, 'big'], ['Metric', p.metric], ['Source', p.source, 'muted'], ['Method', p.method, 'muted']].filter(function (r) { return r[1]; });
    return h('section', { class: 'hero' },
      h('div', { class: 'kicker' }, h('span', { class: 'num' }, String(p.n).padStart(2, '0')), (p.role || '') + (p.signalName ? ' · ' + p.signalName : '')),
      h('h1', null, p.title),
      p.summary ? h('p', { class: 'lede' }, p.summary) : null,
      h('div', { class: 'readout' }, rows.map(function (r) { return [h('span', { class: 'r-label' }, r[0]), h('span', { class: 'r-value' + (r[2] ? ' ' + r[2] : '') }, r[1])]; })));
  }

  function ExampleBanner(p) {
    p = p || {};
    return h('div', { class: 'banner', role: 'note' },
      h('span', { class: 'grow' }, h('strong', null, (p.title || 'You\'re looking at the example from the brief.') + ' '), p.body || 'Edit anything to make it yours, or clear it and start from blank.'),
      Button({ label: p.primaryLabel || 'Start blank', variant: 'primary', size: 'sm', onClick: p.onStartBlank }),
      Button({ label: p.secondaryLabel || 'Keep the example', variant: 'ghost', size: 'sm', onClick: p.onKeep }));
  }

  /** key: true marks the one figure the page is about. */
  function StatTile(p) {
    return h('div', { class: 'stat' + (p.key ? ' key' : '') }, h('div', { class: 'label' }, p.label), h('div', { class: 'value' }, p.value), p.sub ? h('div', { class: 'sub' }, p.sub) : null);
  }

  /** tone: '' | 'good' | 'warn' | 'bad' | 'info' */
  function Pill(p) {
    return h('span', { class: ('pill ' + (p.tone || '')).trim() }, p.text);
  }

  function Callout(p) {
    return h('div', { class: ('callout ' + (p.tone || '')).trim() }, p.title ? h('strong', null, p.title + ' ') : null, p.body);
  }

  /** columns: [{label, key, num}] */
  function DataTable(p) {
    return h('div', { class: 'table-wrap' }, h('table', null,
      h('thead', null, h('tr', null, p.columns.map(function (c) { return h('th', { class: c.num ? 'num' : null }, c.label); }))),
      h('tbody', null, p.rows.map(function (r) { return h('tr', null, p.columns.map(function (c) { return h('td', { class: c.num ? 'num' : null }, r[c.key]); })); }))));
  }

  /** rows: [{label, value, display, muted}] single-series horizontal bars from a zero baseline. */
  function BarChart(p) {
    var max = p.max || Math.max.apply(null, p.rows.map(function (r) { return Math.abs(r.value); }).concat([1]));
    return h('div', { class: 'hbar', role: 'list' }, p.rows.map(function (r) {
      return [h('div', { class: 'hbar-label', role: 'listitem' }, r.label),
        h('div', { class: 'hbar-track' }, h('div', { class: 'hbar-fill' + (r.muted ? ' alt' : ''), style: { width: (Math.abs(r.value) / max) * 70 + '%' }, title: r.label + ': ' + r.display }), h('span', { class: 'hbar-val' }, r.display))];
    }));
  }

  /** value: 0..1 */
  function Meter(p) {
    return h('div', { class: 'meter', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(p.value * 100)), 'aria-label': p.label }, h('div', { style: { width: p.value * 100 + '%' } }));
  }

  function ToolCard(p) {
    return h('a', { class: 'card tool-card', href: p.href || '#', style: '--c: var(--sig-' + p.id + '); --accent: var(--sig-' + p.id + ')' },
      h('div', { class: 'top' }, h('span', { class: 'num' }, 'TOOL ' + String(p.n).padStart(2, '0')), h('span', { class: 'dot' })),
      h('h3', null, p.title), h('div', { class: 'outcome' }, p.outcome), h('p', null, p.summary),
      h('div', { class: 'role row' }, h('span', { class: 'pill' }, p.role), p.meta ? h('span', { class: 'small muted' }, p.meta) : null));
  }

  /** Static (inline) or modal. Returns the dialog element; modal: true also returns a Promise via .result. */
  function ConfirmDialog(p) {
    var resolve;
    var result = new Promise(function (r) { resolve = r; });
    var box = h('div', { class: 'ask', role: 'dialog', 'aria-modal': p.inline ? null : 'true', 'aria-label': 'Confirm' },
      h('p', null, p.message),
      h('div', { class: 'row' },
        Button({ label: 'Cancel', variant: 'ghost', onClick: function () { close(false); } }),
        Button({ label: p.confirmLabel || 'Continue', variant: p.danger ? 'danger' : 'primary', onClick: function () { close(true); } })));
    var root = p.inline ? box : h('div', { class: 'ask-backdrop' }, box);
    function close(v) { if (!p.inline) root.remove(); resolve(v); }
    root.result = result;
    return root;
  }

  function Toast(p) {
    return h('div', { class: 'toast', role: 'status', style: p.inline ? { position: 'static', transform: 'none', display: 'inline-block' } : null }, p.text);
  }

  window.GTMKit = { h: h, Button: Button, Field: Field, Tabs: Tabs, TopBar: TopBar, ToolHeader: ToolHeader, ExampleBanner: ExampleBanner, StatTile: StatTile, Pill: Pill, Callout: Callout, DataTable: DataTable, BarChart: BarChart, Meter: Meter, ToolCard: ToolCard, ConfirmDialog: ConfirmDialog, Toast: Toast };
})();
