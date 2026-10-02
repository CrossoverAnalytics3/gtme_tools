import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normCdf, normInv, twoProportionTest, sampleSizePerGroup, verdict, fmtP } from '../assets/js/core/stats.js';
import { parseCSV, parseCSVObjects, toCSV } from '../assets/js/core/csv.js';
import { pct, signedPct, pts, compact, money, toNumber, toBool, daysBetween, splitList } from '../assets/js/core/format.js';

const close = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

test('normal CDF and inverse agree with known values', () => {
  close(normCdf(0), 0.5);
  close(normCdf(1.96), 0.975);
  close(normInv(0.975), 1.959964);
  close(normInv(0.8), 0.841621);
  assert.throws(() => normInv(0));
});

test('two-proportion test matches a hand calculation', () => {
  const t = twoProportionTest(120, 4000, 180, 4000);
  close(t.pA, 0.03);
  close(t.pB, 0.045);
  close(t.relLift, 0.5);
  close(t.z, 3.53, 0.01);
  assert.ok(t.pValue < 0.001);
  assert.ok(t.ciLow > 0 && t.ciHigh > t.ciLow);
  assert.equal(twoProportionTest(1, 0, 1, 10), null);
});

test('sample size per group is in the textbook range', () => {
  // 10% baseline, 20% relative lift (10% -> 12%), alpha .05, power .8 => ~3,841
  const n = sampleSizePerGroup(0.1, 0.2);
  assert.ok(n > 3700 && n < 3950, `got ${n}`);
  assert.equal(sampleSizePerGroup(0.6, 1), null); // pushes rate over 100%
});

test('verdict labels', () => {
  assert.equal(verdict(null).tone, 'warn');
  assert.equal(verdict(twoProportionTest(120, 4000, 180, 4000)).tone, 'good');
  assert.equal(verdict(twoProportionTest(180, 4000, 120, 4000)).tone, 'bad');
  assert.equal(fmtP(0.0001), 'p < 0.001');
});

test('CSV parsing handles quotes, commas, newlines and CRLF', () => {
  const rows = parseCSV('a,b\r\n"x, y","say ""hi""\nthere"\r\n\r\n');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'say "hi"\nthere']]);
  const objs = parseCSVObjects('Job Title,Company Size\nVP,500\n');
  assert.deepEqual(objs, [{ job_title: 'VP', company_size: '500' }]);
  const csv = toCSV([{ a: 'x,y', b: ['p', 'q'] }], ['a', 'b']);
  assert.equal(csv, 'a,b\n"x,y",p; q\n');
});

test('formatters', () => {
  assert.equal(pct(0.312), '31.2%');
  assert.equal(pct(0.03, 2), '3%');
  assert.equal(pct(0.045, 2), '4.5%');
  assert.equal(signedPct(0.31, 0), '+31%');
  assert.equal(pts(0.086), '+8.6 pts');
  assert.equal(compact(24000000), '24M');
  assert.equal(compact(1.2e9, { currency: true }), '$1.2B');
  assert.equal(money(1080), '$1,080');
  assert.equal(toNumber('$1,200'), 1200);
  assert.equal(toBool('Yes'), true);
  assert.equal(daysBetween('2026-01-01', '2026-01-31'), 30);
  assert.deepEqual(splitList('a, b;c\n'), ['a', 'b', 'c']);
});
