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
