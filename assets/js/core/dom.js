// Tiny DOM toolkit. No framework: tools build inputs once, then re-render
// only their output panels so typing never loses focus.

import { capability, isHosted } from './runtime.js';

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function replaceChildren(el, ...children) {
  clear(el);
  append(el, children);
  return el;
}

// ---------- Form fields ----------

export function field(label, input, help) {
  return h('label', { class: 'field' }, h('span', { class: 'lbl' }, label), input, help ? h('small', { class: 'muted' }, help) : null);
}

export function textInput(value, onInput, attrs = {}) {
  return h('input', { type: 'text', value: value ?? '', ...attrs, onInput: (e) => onInput(e.target.value) });
}

export function numberInput(value, onInput, attrs = {}) {
  return h('input', {
    type: 'number',
    value: value ?? '',
    step: 'any',
    inputmode: 'decimal',
    ...attrs,
    onInput: (e) => {
      const n = parseFloat(e.target.value);
      onInput(Number.isFinite(n) ? n : 0);
    },
  });
}

/** Shows 30 for a stored 0.30. Keeps state in fractions, UI in percents. */
export function percentInput(value, onInput, attrs = {}) {
  const shown = value == null || !Number.isFinite(value) ? '' : +(value * 100).toFixed(4);
  return numberInput(shown, (v) => onInput(v / 100), attrs);
}

export function dateInput(value, onInput, attrs = {}) {
  return h('input', { type: 'date', value: value ?? '', ...attrs, onInput: (e) => onInput(e.target.value) });
}

export function textArea(value, onInput, attrs = {}) {
  return h('textarea', { ...attrs, onInput: (e) => onInput(e.target.value) }, value ?? '');
}

/** options: array of strings or {value, label}. */
export function select(options, value, onChange, attrs = {}) {
  const el = h(
    'select',
    { ...attrs, onChange: (e) => onChange(e.target.value) },
    options.map((o) => {
      const opt = typeof o === 'string' ? { value: o, label: o } : o;
      return h('option', { value: opt.value }, opt.label);
    }),
  );
  el.value = value ?? '';
  return el;
}

export function checkbox(checked, onChange, label, attrs = {}) {
  const box = h('input', { type: 'checkbox', checked, ...attrs, onChange: (e) => onChange(e.target.checked) });
  return label ? h('label', { class: 'check' }, box, h('span', null, label)) : box;
}

export function button(label, onClick, cls = '', attrs = {}) {
  return h('button', { type: 'button', class: `btn ${cls}`.trim(), ...attrs, onClick }, label);
}

// ---------- Display ----------

export function stat(label, value, sub, attrs = {}) {
  return h('div', { class: 'stat', ...attrs }, h('div', { class: 'label' }, label), h('div', { class: 'value' }, value), sub ? h('div', { class: 'sub' }, sub) : null);
}

export function pill(text, tone = '') {
  return h('span', { class: `pill ${tone}`.trim() }, text);
}

export function callout(content, tone = '') {
  return h('div', { class: `callout ${tone}`.trim() }, content);
}

/**
 * columns: [{label, key?, render?(row, i), num?: bool}]
 */
export function table(columns, rows, { empty = 'Nothing here yet.' } = {}) {
  if (!rows.length) return h('p', { class: 'muted' }, empty);
  return h(
    'div',
    { class: 'table-wrap' },
    h(
      'table',
      null,
      h('thead', null, h('tr', null, columns.map((c) => h('th', { class: c.num ? 'num' : null }, c.label)))),
      h(
        'tbody',
        null,
        rows.map((r, i) =>
          h(
            'tr',
            null,
            columns.map((c) => h('td', { class: c.num ? 'num' : null }, c.render ? c.render(r, i) : r[c.key])),
          ),
        ),
      ),
    ),
  );
}

/** Tabs that remember the last-open tab per tool. */
export function tabs(container, items, storageKey) {
  const bar = h('div', { class: 'tabs', role: 'tablist' });
  const panel = h('div', { role: 'tabpanel' });
  let current = items[0].id;
  try {
    const saved = localStorage.getItem(`gtm-toolkit:tab:${storageKey}`);
    if (saved && items.some((t) => t.id === saved)) current = saved;
  } catch {
    /* storage unavailable */
  }
  if (location.hash && items.some((t) => t.id === location.hash.slice(1))) current = location.hash.slice(1);

  function show(id) {
    current = id;
    try {
      localStorage.setItem(`gtm-toolkit:tab:${storageKey}`, id);
    } catch {
      /* ignore */
    }
    for (const b of bar.children) b.setAttribute('aria-selected', String(b.dataset.id === id));
    clear(panel);
    items.find((t) => t.id === id).render(panel);
  }

  for (const t of items) {
    bar.append(h('button', { type: 'button', role: 'tab', dataset: { id: t.id }, onClick: () => show(t.id) }, t.label));
  }
  container.append(bar, panel);
  show(current);
  return { show, get current() { return current; }, rerender: () => show(current) };
}

// ---------- Horizontal bar chart (single series per bar) ----------

let tipEl = null;
function tooltip() {
  if (!tipEl) {
    tipEl = h('div', { class: 'tooltip hide', role: 'status' });
    document.body.append(tipEl);
  }
  return tipEl;
}

/**
 * rows: [{label, value, display, tip?, tone?: 'alt'|'alt2'}]
 * Bars grow from a shared zero baseline. Values are labeled at the bar end,
 * hover shows the tooltip.
 */
export function hbars(rows, { max } = {}) {
  const top = max ?? Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return h(
    'div',
    { class: 'hbar', role: 'list' },
    rows.map((r) => {
      const width = `${Math.max(0, (Math.abs(r.value) / top) * 70)}%`;
      const fill = h('div', {
        class: `hbar-fill ${r.tone || ''}`.trim(),
        style: { width },
        tabindex: '0',
        'aria-label': `${r.label}: ${r.display}`,
        onMouseenter: (e) => showTip(e, r.tip || `${r.label}: ${r.display}`),
        onMousemove: (e) => moveTip(e),
        onMouseleave: hideTip,
        onFocus: (e) => showTip(e, r.tip || `${r.label}: ${r.display}`),
        onBlur: hideTip,
      });
      return [h('div', { class: 'hbar-label', role: 'listitem' }, r.label), h('div', { class: 'hbar-track' }, fill, h('span', { class: 'hbar-val' }, r.display))];
    }),
  );
}

function showTip(e, text) {
  const t = tooltip();
  t.textContent = text;
  t.classList.remove('hide');
  moveTip(e);
}
function moveTip(e) {
  const t = tooltip();
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX || rect.right;
  const y = e.clientY || rect.top;
  t.style.left = `${Math.min(x + 12, window.innerWidth - t.offsetWidth - 8)}px`;
  t.style.top = `${y - t.offsetHeight - 10}px`;
}
function hideTip() {
  tooltip().classList.add('hide');
}

// ---------- IO ----------

/**
 * Offer a generated file. Hosted on claude.ai this goes through the
 * `downloads` capability (the viewer confirms the save); elsewhere it is a
 * normal browser download.
 */
export async function download(filename, text, mime = 'text/plain') {
  if (isHosted()) {
    const dl = await capability('downloads');
    if (!dl) {
      toast('Saving files is off here. Use Copy instead.');
      return false;
    }
    try {
      await dl.save({ filename, data: text });
      toast(`Saved ${filename}`);
      return true;
    } catch (err) {
      if (err?.code !== 'declined') toast(`Could not save ${filename} (${err?.code || 'error'})`);
      return false;
    }
  }
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/**
 * In-page confirmation. Browsers' confirm() is blocked inside the claude.ai
 * viewer, so every destructive action asks here instead.
 */
export function ask(message, { confirmLabel = 'Continue', danger = false } = {}) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const done = (v) => {
      backdrop.remove();
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
      resolve(v);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') done(false);
    };
    const yes = button(confirmLabel, () => done(true), danger ? 'danger solid' : 'primary');
    const backdrop = h(
      'div',
      { class: 'ask-backdrop', onClick: (e) => { if (e.target === backdrop) done(false); } },
      h('div', { class: 'ask', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Confirm' },
        h('p', null, message),
        h('div', { class: 'row' }, button('Cancel', () => done(false), 'ghost'), yes),
      ),
    );
    document.addEventListener('keydown', onKey);
    document.body.append(backdrop);
    yes.focus();
  });
}

export async function copyText(text, msg = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
  } catch {
    const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }, text);
    document.body.append(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast(msg);
    } catch {
      toast('Copy failed. Select the text and copy manually.');
    }
    ta.remove();
  }
}

export function pickFile(accept = '.json,.csv,.txt') {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept, style: { display: 'none' } });
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, text: String(reader.result) });
      reader.readAsText(file);
    });
    document.body.append(input);
    input.click();
    setTimeout(() => input.remove(), 60000);
  });
}

let toastTimer = null;
export function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(el);
  }
  el.textContent = msg;
  el.classList.remove('hide');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hide'), 2200);
}

export function debounce(fn, ms = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
