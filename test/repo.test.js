// Structural checks: every tool in the registry has a page, a controller,
// a logic module test, and a README entry. Copy stays free of em dashes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { TOOLS } from '../assets/js/core/registry.js';

const root = new URL('..', import.meta.url).pathname;

test('registry has 10 tools, one per row of the brief\'s metrics table', () => {
  assert.equal(TOOLS.length, 10);
  assert.deepEqual(TOOLS.map((t) => t.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(new Set(TOOLS.map((t) => t.id)).size, 10);
});

test('every tool has a page, a controller and feature → benefit → use case rows', () => {
  for (const t of TOOLS) {
    assert.ok(existsSync(join(root, 'tools', `${t.id}.html`)), `missing tools/${t.id}.html`);
    assert.ok(existsSync(join(root, 'assets/js/tools', `${t.id}.js`)), `missing controller for ${t.id}`);
    const html = readFileSync(join(root, 'tools', `${t.id}.html`), 'utf8');
    assert.match(html, new RegExp(`assets/js/tools/${t.id}\\.js`));
    assert.ok(t.features.length >= 3, `${t.id} needs 3+ features`);
    for (const f of t.features) assert.ok(f.feature && f.benefit && f.useCase, `${t.id}: incomplete feature row`);
    for (const k of ['metric', 'outcome', 'source', 'framework', 'summary']) assert.ok(t[k], `${t.id}: missing ${k}`);
  }
});

test('README documents every tool', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  for (const t of TOOLS) assert.ok(readme.includes(t.title), `README is missing ${t.title}`);
});

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|html|md|css|json|csv)$/.test(name)) out.push(p);
  }
  return out;
}

test('no em dashes anywhere in the repo copy', () => {
  const offenders = walk(root).filter((p) => readFileSync(p, 'utf8').includes(String.fromCharCode(0x2014)));
  assert.deepEqual(offenders, []);
});

test('hosted links cover the hub, every tool and the design system', () => {
  const links = JSON.parse(readFileSync(join(root, 'hosted/links.json'), 'utf8'));
  for (const key of ['hub', 'designSystem', ...TOOLS.map((t) => t.id)]) {
    assert.match(links[key] || '', /^https:\/\/claude\.ai\/artifact\/[A-Za-z0-9]+$/, `missing hosted link for ${key}`);
  }
});

test('design system tokens match the app stylesheet', () => {
  const css = readFileSync(join(root, 'assets/css/app.css'), 'utf8');
  const tokens = JSON.parse(readFileSync(join(root, 'design-system/project/tokens.json'), 'utf8'));
  const lightRoot = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
  const sigRoot = css.slice(css.indexOf('/* ---------- Tool signal colors'));
  for (const t of tokens.color.tokens) {
    const src = t.name.startsWith('sig-') ? sigRoot : lightRoot;
    assert.ok(src.includes(`--${t.name}: ${t.value.light};`), `${t.name} light value ${t.value.light} is not in app.css`);
    assert.ok(css.includes(`--${t.name}: ${t.value.dark};`), `${t.name} dark value ${t.value.dark} is not in app.css`);
  }
  for (const t of TOOLS) {
    assert.ok(tokens.color.tokens.some((x) => x.name === t.signal.token), `no token for ${t.signal.token}`);
    assert.ok(css.includes(`:root[data-tool="${t.id}"]`), `no signal binding for ${t.id}`);
  }
});

test('design system bundle.css is the app stylesheet', () => {
  assert.equal(readFileSync(join(root, 'design-system/project/components/bundle.css'), 'utf8'), readFileSync(join(root, 'assets/css/app.css'), 'utf8'));
});

test('README carries the About section, credit line and outcome disclaimer', async () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  const { CREDIT, DISCLAIMER } = await import('../assets/js/core/shell.js');
  assert.match(readme, /^## About$/m);
  assert.ok(readme.includes('Chris Conyers'));
  assert.ok(readme.includes(CREDIT), 'README is missing the credit line');
  assert.ok(readme.includes(DISCLAIMER), 'README is missing the disclaimer');
  // the disclaimer comes before the first company-reported figure
  assert.ok(readme.indexOf(DISCLAIMER) < readme.indexOf('+31%'), 'brief figures appear before the disclaimer');
  assert.ok(readme.indexOf('## About') < readme.indexOf('Whoop'), 'README leads with a company case before the About section');
});
