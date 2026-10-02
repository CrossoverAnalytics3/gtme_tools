// Segment Opportunity Sizer logic.
// Brief: Adobe Express grew a young-creator segment past $1B ARR. Two methods
// from the brief: cohort-based market sizing (instead of one flat % across
// everyone) and 3-axis segmentation (size, growth potential, attributes).

import { compact, pct } from '../core/format.js';

/**
 * Cohort sizing. The brief's VR example: 320M people / 80-year lifespan =
 * 4M per single-year age cohort. Gen Z (18-26) = 8 years x 4M = 32M x 50% = 16M.
 */
export function cohortSizing({ population, lifespan, cohorts }) {
  const perYear = lifespan > 0 ? population / lifespan : 0;
  const rows = cohorts.map((c) => {
    const years = Math.max(0, (c.ageTo ?? 0) - (c.ageFrom ?? 0));
    const people = years * perYear;
    return { ...c, years, people, users: people * (c.willingness || 0) };
  });
  return { perYear, rows, total: rows.reduce((a, r) => a + r.users, 0), people: rows.reduce((a, r) => a + r.people, 0) };
}

export function flatEstimate(population, flatRate) {
  return population * flatRate;
}

export function arrFunnel({ addressable, reachShare, paidConversion, arpu }) {
  const reachable = addressable * reachShare;
  const paying = reachable * paidConversion;
  return { addressable, reachable, paying, arr: paying * arpu };
}

/** Inverse: how many paying users (and what conversion) does an ARR goal need? */
export function payingNeeded(arrGoal, arpu) {
  return arpu > 0 ? arrGoal / arpu : null;
}

const minmax = (vals) => {
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  return (v) => (hi > lo ? (v - lo) / (hi - lo) : 1);
};

/**
 * 3-axis scoring. X = size (revenue pool = accounts x ACV, log-scaled),
 * Y = growth potential (YoY growth), Z = attribute / workload fit (1-5).
 */
export function scoreSegments(segments, weights = { size: 1, growth: 1, fit: 1 }) {
  if (!segments.length) return [];
  const pools = segments.map((s) => Math.log10(Math.max(1, (s.accounts || 0) * (s.acv || 0))));
  const growths = segments.map((s) => s.growth || 0);
  const nSize = minmax(pools);
  const nGrowth = minmax(growths);
  const wSum = (weights.size || 0) + (weights.growth || 0) + (weights.fit || 0) || 1;
  return segments
    .map((s, i) => {
      const size = nSize(pools[i]);
      const growth = nGrowth(growths[i]);
      const fit = Math.min(1, Math.max(0, ((s.fit || 1) - 1) / 4));
      const score = ((weights.size * size + weights.growth * growth + weights.fit * fit) / wSum) * 100;
      const quadrant = size >= 0.5 ? (growth >= 0.5 ? 'Land now' : 'Harvest') : growth >= 0.5 ? 'Bet on growth' : 'Deprioritize';
      return { ...s, pool: (s.accounts || 0) * (s.acv || 0), sizeScore: size, growthScore: growth, fitScore: fit, score, quadrant };
    })
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export const QUADRANTS = {
  'Land now': { tone: 'good', note: 'Big pool and growing. Put your best reps and launch budget here.' },
  'Bet on growth': { tone: 'info', note: 'Small today, growing fast. Win them early and grow with them (consumption models love this).' },
  Harvest: { tone: 'warn', note: 'Big but flat. Efficient coverage, protect the base, don\'t over-invest.' },
  Deprioritize: { tone: 'bad', note: 'Small and flat. Self-serve or nurture only.' },
};

export function segmentsMarkdown(state) {
  const c = cohortSizing(state.cohort);
  const f = arrFunnel({ ...state.funnel, addressable: c.total });
  const ranked = scoreSegments(state.segments, state.weights);
  return [
    `# Segment sizing: ${state.cohort.name || 'Untitled'}`,
    '',
    `Population ${compact(state.cohort.population)} / ${state.cohort.lifespan}-year lifespan = **${compact(c.perYear)} people per age cohort**`,
    '',
    '| Cohort | Ages | People | Willingness | Users |',
    '| --- | --- | --- | --- | --- |',
    ...c.rows.map((r) => `| ${r.name} | ${r.ageFrom}-${r.ageTo} | ${compact(r.people)} | ${pct(r.willingness, 0)} | ${compact(r.users)} |`),
    `| **Total addressable** | | | | **${compact(c.total)}** |`,
    '',
    '## ARR funnel',
    `${compact(f.addressable)} addressable → ${compact(f.reachable)} reachable (${pct(state.funnel.reachShare, 0)}) → ${compact(f.paying)} paying (${pct(state.funnel.paidConversion, 1)}) × $${state.funnel.arpu}/yr = **${compact(f.arr, { currency: true })} ARR**`,
    '',
    '## Segment priority (size × growth × fit)',
    '',
    '| Rank | Segment | Tier | Score | Quadrant |',
    '| --- | --- | --- | --- | --- |',
    ...ranked.map((s) => `| ${s.rank} | ${s.name} | ${s.tier} | ${s.score.toFixed(0)} | ${s.quadrant} |`),
    '',
  ].join('\n');
}
