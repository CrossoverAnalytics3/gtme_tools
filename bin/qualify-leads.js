#!/usr/bin/env node
// Inbound qualification agent, command-line edition.
// Same rules as the browser tool, so a GTME can run it in a cron job,
// a webhook handler or a CI step.
//
//   node bin/qualify-leads.js examples/leads.csv
//   node bin/qualify-leads.js leads.csv --config my-config.json --out routed.csv
//   node bin/qualify-leads.js --prompt --config my-config.json
//   node bin/qualify-leads.js leads.csv --json

import { readFileSync, writeFileSync } from 'node:fs';
import { parseCSVObjects, toCSV } from '../assets/js/core/csv.js';
import { DEFAULT_CONFIG, qualifyBatch, buildAgentPrompt, RESULT_COLUMNS, flattenResult } from '../assets/js/lib/leadAgent.js';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith('--') && !['--config', '--out', '--company', '--product'].includes(args[i - 1]));

if (flag('--help') || flag('-h') || (!positional.length && !flag('--prompt'))) {
  console.log(`Usage:
  qualify-leads <leads.csv> [--config config.json] [--out routed.csv] [--json]
  qualify-leads --prompt [--config config.json] [--company "Acme"] [--product "a deploy platform"]

CSV columns (flexible names): name, email, title, company, employees, industry,
country, pricing_views, demo_requested, message, source.`);
  process.exit(positional.length || flag('--prompt') ? 0 : 1);
}

let config = DEFAULT_CONFIG;
if (opt('--config')) {
  const user = JSON.parse(readFileSync(opt('--config'), 'utf8'));
  config = {
    icp: { ...DEFAULT_CONFIG.icp, ...user.icp },
    weights: { ...DEFAULT_CONFIG.weights, ...user.weights },
    thresholds: { ...DEFAULT_CONFIG.thresholds, ...user.thresholds },
  };
}

if (flag('--prompt')) {
  console.log(buildAgentPrompt(config, { company: opt('--company'), product: opt('--product') }));
  process.exit(0);
}

const leads = parseCSVObjects(readFileSync(positional[0], 'utf8'));
const batch = qualifyBatch(leads, config);

if (flag('--json')) {
  process.stdout.write(JSON.stringify(batch, null, 2) + '\n');
} else {
  const csv = toCSV(batch.results.map(flattenResult), RESULT_COLUMNS);
  if (opt('--out')) writeFileSync(opt('--out'), csv);
  else process.stdout.write(csv);
}

const pct = (x) => `${Math.round(x * 100)}%`;
console.error(
  `\n${batch.total} leads → AE ${batch.counts.ae_fast_track}, QA ${batch.counts.sdr_qa}, nurture ${batch.counts.nurture}, disqualify ${batch.counts.disqualify}. ` +
    `Handled without a human: ${pct(batch.automationRate)}.`,
);
