import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseCSVObjects } from '../assets/js/core/csv.js';
import { DEFAULT_CONFIG, scoreLead, qualifyBatch, buildAgentPrompt, sdrCapacity, normalizeLead } from '../assets/js/lib/leadAgent.js';
import { annualCompute, inboundCost, redeployment, sensitivity } from '../assets/js/lib/agentEconomics.js';
import { winRates, lostbotAudit, lostbotSummary, dealbotAlerts, battlecardMarkdown, simulationPrompt, EVIDENCE } from '../assets/js/lib/winloss.js';

const close = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);
const sample = () => parseCSVObjects(readFileSync(new URL('../examples/leads.csv', import.meta.url), 'utf8'));

test('Inbound Agent: sample leads route the way an SDR would', () => {
  const b = qualifyBatch(sample());
  const route = (name) => b.results.find((r) => r.lead.name === name).route;
  assert.equal(route('Dana Whitfield'), 'ae_fast_track');
  assert.equal(route('Robin Hart'), 'ae_fast_track');
  assert.equal(route('Alex Kim'), 'disqualify'); // student
  assert.equal(route('Riley Chen'), 'disqualify'); // competitor domain
  assert.equal(route('Lena Novak'), 'disqualify'); // SEO spam
  assert.equal(route('Chris Patel'), 'nurture'); // good fit, no intent
  assert.equal(route('Jordan Lee'), 'sdr_qa'); // high intent, weak fit
  assert.equal(route('Casey Brooks'), 'sdr_qa');
  assert.equal(b.total, 18);
  assert.ok(b.automationRate > 0.6);
});

test('Inbound Agent: every non-DQ route comes with reasons', () => {
  for (const r of qualifyBatch(sample()).results) assert.ok(r.reasons.length > 0, r.lead.name);
});

test('Inbound Agent: missing data pushes a would-be AE lead to a human', () => {
  const r = scoreLead({ email: 'cto@bigco.com', title: 'CTO', demo_requested: 'yes', pricing_views: '5', message: 'We need SSO, an SLA and a contract for a migration of 40 apps this quarter, procurement is ready.' });
  assert.equal(r.route, 'sdr_qa');
  assert.deepEqual(r.missing.sort(), ['country', 'employees', 'industry']);
});

test('Inbound Agent: config changes change routing', () => {
  const lead = normalizeLead({ email: 'a@retailco.com', title: 'Engineer', company: 'RetailCo', employees: '800', industry: 'Retail', country: 'US', demo_requested: 'no', pricing_views: '3', message: 'Need SSO and an SLA before our migration next quarter. We run 30 storefronts, please call.' });
  assert.equal(scoreLead(lead).route, 'sdr_qa');
  const cfg = structuredClone(DEFAULT_CONFIG);
  cfg.icp.industries.push('retail');
  assert.equal(scoreLead(lead, cfg).route, 'ae_fast_track');
});

test('Inbound Agent: prompt carries the same thresholds as the code', () => {
  const p = buildAgentPrompt(DEFAULT_CONFIG, { company: 'Acme' });
  assert.match(p, /inbound lead qualification agent for Acme/);
  assert.match(p, new RegExp(`>= ${DEFAULT_CONFIG.thresholds.ae}: ae_fast_track`));
  assert.match(p, /"summary_for_ae"/);
});

test('Inbound Agent: capacity model reproduces 10 SDRs → 1', () => {
  const c = sdrCapacity({ leadsPerMonth: 3000, minutesPerManualLead: 25, qaShare: 0.25, minutesPerQaLead: 8, productiveHoursPerSdrMonth: 125 });
  close(c.sdrsBefore, 10);
  assert.equal(c.sdrsNeededAfter, 1);
  assert.equal(c.sdrsFreed, 9);
});

test('Inbound Agent: example config file matches the built-in defaults', () => {
  const file = JSON.parse(readFileSync(new URL('../examples/lead-agent.config.json', import.meta.url), 'utf8'));
  assert.deepEqual(file, DEFAULT_CONFIG);
});

test('Inbound Agent: CLI routes the sample CSV and prints the prompt', () => {
  const bin = new URL('../bin/qualify-leads.js', import.meta.url).pathname;
  const csv = execFileSync('node', [bin, new URL('../examples/leads.csv', import.meta.url).pathname], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const rows = parseCSVObjects(csv);
  assert.equal(rows.length, 18);
  assert.equal(rows[0].route, 'ae_fast_track');
  const prompt = execFileSync('node', [bin, '--prompt', '--company', 'Acme'], { encoding: 'utf8' });
  assert.match(prompt, /for Acme/);
});

test('Agent Economics: Vercel-style volume costs about $1,000 a year', () => {
  const agent = { leadsPerMonth: 3000, callsPerLead: 2, inputTokensPerCall: 3000, outputTokensPerCall: 400, priceInPerM: 3, priceOutPerM: 15 };
  const c = annualCompute(agent);
  close(c.perLead, 0.03);
  close(c.annual, 1080);
  const s = sensitivity(agent);
  close(s[3].annual, 10800);
});

test('Agent Economics: savings, payback and redeployment', () => {
  const r = inboundCost({
    before: { sdrs: 10, sdrLoadedCost: 95000 },
    agent: { leadsPerMonth: 3000, callsPerLead: 2, inputTokensPerCall: 3000, outputTokensPerCall: 400, priceInPerM: 3, priceOutPerM: 15 },
    after: { qaSdrs: 1, gtmeAnnualCost: 220000, gtmeShareOnAgent: 0.25, buildWeeks: 6 },
  });
  close(r.beforeCost, 950000);
  close(r.afterCost, 95000 + 1080 + 55000);
  assert.ok(r.paybackMonths > 0 && r.paybackMonths < 1);
  const d = redeployment({ redeployedSdrs: 9, meetingsPerSdrMonth: 12, meetingToOpp: 0.5, winRate: 0.22, acv: 30000, rampMonths: 3 });
  close(d.meetings, 9 * 12 * 10.5);
  close(d.bookings, d.opps * 0.22 * 30000);
});

const ev = (s) => Object.fromEntries(EVIDENCE.map((e) => [e.id, s.includes(e.short)]));

test('Win Room: head-to-head rate excludes deals with no competitor', () => {
  const deals = [
    ...Array.from({ length: 9 }, () => ({ outcome: 'won', competitor: 'X', narrativeUsed: true })),
    ...Array.from({ length: 3 }, () => ({ outcome: 'lost', competitor: 'X', narrativeUsed: true })),
    { outcome: 'lost', competitor: '', narrativeUsed: false },
    { outcome: 'open', competitor: 'X', narrativeUsed: true },
  ];
  const w = winRates(deals);
  close(w.h2h, 0.75);
  close(w.withNarrative.rate, 0.75);
  assert.equal(w.h2hTotal, 12);
  assert.equal(w.closed, 13);
});

test('Win Room: Lostbot flags a "price" loss with no economic buyer', () => {
  const a = lostbotAudit({ name: 'Atlas', outcome: 'lost', loggedReason: 'Price', evidence: ev('Champ Tech') });
  assert.equal(a.mismatch, true);
  assert.equal(a.primary.id, 'economicBuyer');
  assert.match(a.finding, /budget authority/);
  const ok = lostbotAudit({ name: 'Vela', outcome: 'lost', loggedReason: 'Missing feature', evidence: ev('EB ROI Champ MAP') });
  assert.equal(ok.mismatch, false);
  assert.equal(lostbotSummary([{ outcome: 'lost', loggedReason: 'Price', evidence: {} }]).mismatches, 1);
});

test('Win Room: Dealbot fires at 30 days without an economic buyer', () => {
  const deal = { name: 'Sable', outcome: 'open', openedOn: '2026-01-01', evidence: ev('Champ Tech ROI MAP') };
  assert.equal(dealbotAlerts([deal], '2026-01-30').length, 0);
  const alerts = dealbotAlerts([deal], '2026-01-31');
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].message, /30 days in with no economic buyer/);
  assert.match(alerts[0].slack, /^:warning:/);
  assert.equal(dealbotAlerts([deal], '2026-03-01')[0].severity, 'critical');
});

test('Win Room: battlecard and simulation prompt render', () => {
  const card = { competitor: 'Northwind', objections: 'Cheaper => Not in year 1', whereWeWin: 'Speed\nSecurity' };
  const md = battlecardMarkdown(card);
  assert.match(md, /us vs\. Northwind/);
  assert.match(md, /\*\*"Cheaper"\*\* → Not in year 1/);
  assert.match(simulationPrompt(card), /skeptical/);
});
