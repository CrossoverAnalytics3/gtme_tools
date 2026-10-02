#!/usr/bin/env node
// Builds one self-contained folder per page for publishing as claude.ai
// artifacts: dist/hosted/<page>/index.html (content only; the platform adds
// the document skeleton) plus every asset that page loads.
//
//   node scripts/build-hosted.js            build all 11 pages
//   node scripts/build-hosted.js --manifest print the publish manifest (JSON)
//
// Cross-page links come from hosted/links.json ({hub, designSystem, <tool id>: url}).
// Pages without a URL yet fall back to relative links, so the first build
// works before anything is published.

import { mkdirSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS } from '../assets/js/core/registry.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist/hosted');
const linksFile = join(root, 'hosted/links.json');
const links = existsSync(linksFile) ? JSON.parse(readFileSync(linksFile, 'utf8')) : {};

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">';

const core = readdirSync(join(root, 'assets/js/core')).filter((f) => f.endsWith('.js'));
const libs = readdirSync(join(root, 'assets/js/lib')).filter((f) => f.endsWith('.js'));

function page(name, { title, entry, extra = [] }) {
  const dir = join(out, name);
  const files = {};
  const copy = (rel) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    copyFileSync(join(root, rel), join(dir, rel));
    files[rel] = rel;
  };
  copy('assets/css/app.css');
  for (const f of core) if (f !== 'links.js') copy(`assets/js/core/${f}`);
  for (const f of libs) copy(`assets/js/lib/${f}`);
  copy(entry);
  for (const rel of extra) copy(rel);

  // links.js with the published URLs baked in
  const linksSrc = readFileSync(join(root, 'assets/js/core/links.js'), 'utf8').replace(
    'export const HOSTED_LINKS = null;',
    `export const HOSTED_LINKS = ${JSON.stringify(links, null, 2)};`,
  );
  writeFileSync(join(dir, 'assets/js/core/links.js'), linksSrc);
  files['assets/js/core/links.js'] = 'assets/js/core/links.js';

  const html = `<title>${title}</title>\n${FONTS}\n<link rel="stylesheet" href="assets/css/app.css">\n<script type="module" src="${entry}"></script>\n`;
  writeFileSync(join(dir, 'index.html'), html);
  return { name, dir: `dist/hosted/${name}`, index: `dist/hosted/${name}/index.html`, files, url: links[name === 'hub' ? 'hub' : name] || null };
}

rmSync(out, { recursive: true, force: true });
const manifest = [
  page('hub', { title: 'GTM Toolkit', entry: 'assets/js/hub.js' }),
  ...TOOLS.map((t) =>
    page(t.id, {
      title: t.title,
      entry: `assets/js/tools/${t.id}.js`,
      extra: t.id === 'inbound-agent' ? ['examples/leads.csv'] : [],
    }),
  ),
];
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));

if (process.argv.includes('--manifest')) console.log(JSON.stringify(manifest, null, 2));
else console.log(`Built ${manifest.length} pages in dist/hosted (${Object.keys(links).length} known URLs).`);
