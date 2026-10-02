// Each test rebuilds the brief's case with the tool's logic and checks the
// tool reproduces the outcome in the metrics table.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launchReadiness, measureLift, metricPlan, buildLaunchBrief } from '../assets/js/lib/launch.js';
import { projectImpact, buildSequence, measureAdoption } from '../assets/js/lib/adoption.js';
import { analyzeVariants, testPlan, categoryImpact, positioningStatement } from '../assets/js/lib/positioning.js';
import { nrr, expansionNeeded, compose, coverage, isStale } from '../assets/js/lib/narrative.js';
import { cohortSizing, arrFunnel, scoreSegments, flatEstimate } from '../assets/js/lib/segments.js';
import { analyzeCopy, ladderLines, talkTrack, discoveryPlan } from '../assets/js/lib/riskMessaging.js';
import { detectionProbability, interviewsNeeded, synthesize, buildGuide, readoutMarkdown } from '../assets/js/lib/fastFive.js';

const close = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

test('Launch Lift: Whoop-style launch measures +31% engagement and +21% usage', () => {
  const eng = measureLift({ controlUsers: 20000, controlActive: 6000, exposedUsers: 180000, exposedActive: 70740 });
  const use = measureLift({ controlUsers: 20000, controlActive: 4000, exposedUsers: 180000, exposedActive: 43560 });
  close(eng.test.relLift, 0.31);
  close(use.test.relLift, 0.21);
  assert.equal(eng.verdict.tone, 'good');
  const plan = metricPlan({ baseline: 0.3, targetLift: 0.25, eligibleUsers: 200000, holdoutShare: 0.1 });
  assert.equal(plan.detectable, true);
  close(plan.target, 0.375);
  const tiny = metricPlan({ baseline: 0.3, targetLift: 0.05, eligibleUsers: 2000, holdoutShare: 0.1 });
  assert.equal(tiny.detectable, false);
});

test('Launch Lift: readiness covers the 6 GTM phases', () => {
  assert.equal(launchReadiness({}).score, 0);
  const full = {
    goalType: 'adoption', goalStatement: 'x', competitiveNotes: 'Competitor shows HR natively on watches.',
    icp: 'a', pain: 'b', magic: 'c', featureBenefits: [{ feature: 'f', benefit: 'b' }],
    channels: ['in-product'], assets: ['a', 'b', 'c'], launchDate: '2026-11-03',
    owners: { Product: 'p', Sales: 's', Marketing: 'm', 'Customer success': 'c' },
  };
  assert.equal(launchReadiness(full).score, 1);
  assert.match(buildLaunchBrief(full), /all 6 phases covered/);
});

test('Adoption Campaign: Etsy-style plan implies +16% adoption and $12K', () => {
  const r = projectImpact({
    totalUsers: 25000, baselineAdoption: 0.12, valuePerAdopterMonth: 25, months: 1,
    segments: [{ size: 18000, conversion: 0.02 }, { size: 4000, conversion: 0.03 }],
  });
  assert.equal(r.newAdopters, 480);
  close(r.relLift, 0.16);
  assert.equal(r.incrementalValue, 12000);
  const m = measureAdoption({ controlUsers: 2500, controlAdopters: 300, treatedUsers: 25000, treatedAdopters: 3480 });
  close(m.test.relLift, 0.16);
});

test('Adoption Campaign: sequence respects segment toggles and fills placeholders', () => {
  const seq = buildSequence({ feature: 'coupon codes', audience: 'sellers', include: { never: true, lapsed: false, active: false } });
  assert.equal(seq.length, 5);
  assert.ok(seq.every((s) => s.segment === 'Never tried'));
  assert.match(seq[0].subject, /coupon codes/);
  assert.match(seq[2].subject, /\[peer\]/); // empty input shows as a visible placeholder
});

test('Positioning Lab: Reebok-style test calls variant B at +50%', () => {
  const a = analyzeVariants([
    { name: 'A', visitors: 4000, conversions: 120, revenue: 3600 },
    { name: 'B', visitors: 4000, conversions: 180, revenue: 5400 },
    { name: 'C', visitors: 4000, conversions: 132, revenue: 3960 },
  ]);
  assert.equal(a.winner.name, 'B');
  close(a.winner.test.relLift, 0.5);
  assert.equal(a.rows[2].significant, false);
  assert.equal(categoryImpact(2000000, 0.5).incremental, 1000000);
  const p2 = testPlan({ baselineRate: 0.03, relMde: 0.4, variants: 2, dailyVisitors: 1000 });
  const p3 = testPlan({ baselineRate: 0.03, relMde: 0.4, variants: 3, dailyVisitors: 1000 });
  assert.ok(p3.perVariant > p2.perVariant, 'Bonferroni makes each arm bigger');
  assert.match(positioningStatement({ audience: 'women who train' }, {}), /^For women who train who \[need\]/);
});

test('Narrative Library: NRR math reproduces 107% → 120%', () => {
  close(nrr({ expansion: 0.15, contraction: 0.03, churn: 0.05 }), 1.07);
  close(nrr({ expansion: 0.23, contraction: 0.015, churn: 0.015 }), 1.2);
  close(expansionNeeded(1.2, { contraction: 0.015, churn: 0.015 }), 0.23);
});

test('Narrative Library: composer uses approved blocks only, most specific first', () => {
  const blocks = [
    { id: 1, type: 'core', title: 'core', text: 'Core.', personas: [], moments: [], status: 'approved', reviewedOn: '2026-01-01' },
    { id: 2, type: 'pillar', title: 'generic', text: 'Generic.', personas: [], moments: [], status: 'approved', reviewedOn: '2026-01-01' },
    { id: 3, type: 'pillar', title: 'admin', text: 'Admin.', personas: ['Admin'], moments: ['renewal'], status: 'approved', reviewedOn: '2026-01-01' },
    { id: 4, type: 'pillar', title: 'draft', text: 'Draft.', personas: ['Admin'], moments: ['renewal'], status: 'draft', reviewedOn: '2026-01-01' },
  ];
  const c = compose(blocks, 'Admin', 'renewal', { today: '2026-10-01', staleDays: 180 });
  const pillars = c.sections.find((s) => s.type.id === 'pillar').blocks.map((b) => b.title);
  assert.deepEqual(pillars, ['admin', 'generic']);
  assert.ok(c.gaps.includes('Proof point'));
  assert.equal(c.stale.length, 3);
  assert.equal(isStale({ reviewedOn: '2026-09-01' }, '2026-10-01', 180), false);
  assert.equal(coverage(blocks, ['Admin', 'User'])[1].cells[0].count, 2);
});

test('Segment Sizer: cohort method reproduces the brief\'s 24M VR estimate', () => {
  const r = cohortSizing({
    population: 320e6, lifespan: 80,
    cohorts: [{ name: 'Gen Z', ageFrom: 18, ageTo: 26, willingness: 0.5 }, { name: 'Millennials', ageFrom: 27, ageTo: 35, willingness: 0.25 }],
  });
  assert.equal(r.perYear, 4e6);
  assert.equal(r.rows[0].users, 16e6);
  assert.equal(r.total, 24e6);
  assert.equal(flatEstimate(320e6, 0.025), 8e6);
});

test('Segment Sizer: young-creator example clears $1B ARR', () => {
  const c = cohortSizing({
    population: 5e9, lifespan: 75,
    cohorts: [
      { ageFrom: 16, ageTo: 27, willingness: 0.3 },
      { ageFrom: 28, ageTo: 35, willingness: 0.15 },
      { ageFrom: 36, ageTo: 43, willingness: 0.05 },
    ],
  });
  const f = arrFunnel({ addressable: c.total, reachShare: 0.4, paidConversion: 0.08, arpu: 120 });
  assert.ok(f.arr > 1e9, `ARR ${f.arr}`);
});

test('Segment Sizer: fast-growing startup outranks the flat bigger firm', () => {
  const ranked = scoreSegments([
    { name: 'startup', accounts: 1000, acv: 15000, growth: 2, fit: 4 },
    { name: 'flat firm', accounts: 1000, acv: 40000, growth: 0, fit: 3 },
  ]);
  assert.equal(ranked[0].name, 'startup');
  assert.equal(ranked[0].quadrant, 'Bet on growth');
  assert.equal(ranked[1].quadrant, 'Harvest');
});

test('Risk-First Messaging: analyzer separates risk from upside language', () => {
  const risky = analyzeCopy('Avoid downtime on launch day. Our SOC 2 controls and rollback plan protect you from a failed migration.');
  assert.ok(risky.riskShare >= 0.8);
  assert.equal(risky.verdict.label, 'Risk-first');
  const hype = analyzeCopy('Unlock growth, boost productivity and accelerate innovation to 10x your revenue.');
  assert.equal(hype.verdict.label, 'Upside-heavy');
  assert.equal(analyzeCopy('Hello there').verdict.label, 'Not enough signal yet');
  // "miss the quarter" is matched as one phrase, not split up
  assert.equal(analyzeCopy('so you never miss the quarter').hits.filter((h) => h.term === 'miss the quarter').length, 1);
  // highlight segments rebuild the original text exactly
  const t = 'Stop outages. Grow faster.';
  assert.equal(analyzeCopy(t).segments.map((s) => s.text).join(''), t);
});

test('Risk-First Messaging: ladder, talk track and discovery plan', () => {
  const l = ladderLines({ feature: 'Instant rollback', benefit: 'a bad deploy is undone in one click', pain: 'Losing a weekend to a bad Friday deploy', proof: 'Rollback in under 30 seconds.' });
  assert.equal(l.riskFirst, 'No more losing a weekend to a bad Friday deploy. Instant rollback means a bad deploy is undone in one click. Rollback in under 30 seconds.');
  assert.equal(l.upside, 'A bad deploy is undone in one click, with instant rollback. Rollback in under 30 seconds.');
  assert.equal(l.character, null);
  const track = talkTrack(Array.from({ length: 5 }, (_, i) => ({ feature: `F${i}`, benefit: 'b', pain: 'losing x' })));
  assert.equal(track.filter((x) => x.startsWith('No more')).length, 4);
  const p = discoveryPlan('economic', 10, 0.8, 'Acme');
  assert.ok(p.risk.length >= p.upside.length * 3);
  assert.ok(p.risk.some((q) => q.includes('Acme')));
});

test('Fast Five: 5 interviews = 96.9% for a problem half of users have', () => {
  close(detectionProbability(0.5, 5), 0.96875);
  assert.equal(interviewsNeeded(0.1, 0.95), 29);
  assert.equal(detectionProbability(0, 5), 0);
  assert.equal(buildGuide({}).reduce((a, b) => a + b.minutes, 0), 50);
});

test('Fast Five: synthesis labels patterns and calls the hypothesis', () => {
  const s = synthesize([
    { participant: 'A', tags: 'blank project, slow', held: 'yes', notes: 'n' },
    { participant: 'B', tags: 'Blank project', held: 'yes', notes: 'n' },
    { participant: 'C', tags: 'blank project, slow, blank project', held: 'partly', notes: 'n', quotes: 'q1\nq2' },
    { participant: 'D', tags: 'pricing', held: 'no', notes: 'n' },
    { participant: '', tags: '', notes: '' },
  ]);
  assert.equal(s.completed, 4);
  assert.equal(s.tags[0].tag.toLowerCase(), 'blank project');
  assert.equal(s.tags[0].count, 3);
  assert.equal(s.tags[0].label, 'Pattern');
  assert.equal(s.tags.find((t) => t.tag === 'slow').label, 'Signal');
  assert.equal(s.hypothesis, 'Mixed');
  assert.equal(s.quotes.length, 2);
  assert.match(readoutMarkdown({ setup: {}, interviews: [] }), /96.9%/);
});
