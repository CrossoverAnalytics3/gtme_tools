// Positioning Test Lab logic.
// Brief: Reebok's feminine graphic tee positioning test (+50% category sales).
// Positioning is a hypothesis; test variants against a control and only
// roll out a winner the data supports.

import { twoProportionTest, sampleSizePerGroup } from '../core/stats.js';
import { money, signedPct } from '../core/format.js';

export function positioningStatement(v, product = {}) {
  const f = (x, ph) => (x && String(x).trim() ? x.trim() : `[${ph}]`);
  return (
    `For ${f(v.audience, 'audience')} who ${f(v.need, 'need')}, ` +
    `${f(product.name, 'product')} is the ${f(product.category, 'category')} that ${f(v.angle, 'emotional benefit')}. ` +
    `Unlike ${f(product.alternative, 'the alternative')}, it ${f(v.differentiator, 'differentiator')}.`
  );
}

/**
 * Plan a test with k variants (including control). Uses a Bonferroni
 * correction across the k - 1 comparisons against control.
 */
export function testPlan({ baselineRate, relMde, variants = 2, dailyVisitors, alpha = 0.05, power = 0.8 }) {
  const comparisons = Math.max(1, variants - 1);
  const adjAlpha = alpha / comparisons;
  const perVariant = sampleSizePerGroup(baselineRate, relMde, adjAlpha, power);
  if (perVariant == null) return null;
  const total = perVariant * variants;
  const days = dailyVisitors > 0 ? Math.ceil(total / dailyVisitors) : null;
  return { perVariant, total, days, adjAlpha, comparisons };
}

/** Compare every variant to the first one (control). */
export function analyzeVariants(variants, alpha = 0.05) {
  if (!variants.length) return { rows: [], winner: null };
  const [control, ...rest] = variants;
  const adjAlpha = alpha / Math.max(1, rest.length);
  const rpv = (v) => (v.visitors > 0 ? (v.revenue || 0) / v.visitors : 0);
  const rows = [
    { ...control, rate: control.visitors > 0 ? control.conversions / control.visitors : null, rpv: rpv(control), isControl: true, test: null },
    ...rest.map((v) => {
      const test = twoProportionTest(control.conversions, control.visitors, v.conversions, v.visitors, adjAlpha);
      return {
        ...v,
        rate: v.visitors > 0 ? v.conversions / v.visitors : null,
        rpv: rpv(v),
        rpvLift: rpv(control) > 0 ? rpv(v) / rpv(control) - 1 : null,
        test,
        significant: !!test && test.pValue < adjAlpha && test.diff > 0,
      };
    }),
  ];
  const winners = rows.filter((r) => r.significant).sort((a, b) => b.test.relLift - a.test.relLift);
  return { rows, winner: winners[0] || null, adjAlpha };
}

export function categoryImpact(baselineSales, relLift) {
  if (!(baselineSales > 0) || relLift == null) return null;
  return { projected: baselineSales * (1 + relLift), incremental: baselineSales * relLift };
}

export function positioningMarkdown(state) {
  const { product, variants, plan, categorySales } = state;
  const a = analyzeVariants(variants);
  const p = testPlan({ ...plan, variants: variants.length });
  const lines = [`# Positioning test: ${product.name || 'Untitled'}`, '', '## Variants', ''];
  variants.forEach((v, i) => {
    lines.push(`### ${i === 0 ? 'Control' : `Variant ${String.fromCharCode(65 + i)}`}: ${v.name}`, `> ${positioningStatement(v, product)}`, '', `**Headline:** ${v.headline || '-'}  `, `**Proof:** ${v.proof || '-'}`, '');
  });
  if (p) lines.push('## Test plan', `- ${p.perVariant.toLocaleString()} visitors per variant, ${p.total.toLocaleString()} total${p.days ? `, about ${p.days} days at current traffic` : ''}`, `- Significance threshold per comparison: ${p.adjAlpha.toFixed(4)} (Bonferroni across ${p.comparisons})`, '');
  if (a.rows.some((r) => r.visitors > 0)) {
    lines.push('## Results', '', '| Variant | Visitors | Conv. rate | Lift vs. control | p-value |', '| --- | --- | --- | --- | --- |');
    for (const r of a.rows) lines.push(`| ${r.name} | ${r.visitors} | ${r.rate == null ? '-' : (r.rate * 100).toFixed(2) + '%'} | ${r.isControl ? 'control' : signedPct(r.test?.relLift)} | ${r.isControl ? '-' : r.test ? r.test.pValue.toFixed(4) : '-'} |`);
    lines.push('');
    if (a.winner) {
      const imp = categoryImpact(categorySales, a.winner.test.relLift);
      lines.push(`**Winner:** ${a.winner.name} (${signedPct(a.winner.test.relLift)})`);
      if (imp) lines.push(`**Category impact if rolled out:** ${money(imp.incremental)} incremental on ${money(categorySales)} baseline`);
    } else lines.push('**No variant beat control with significance yet.**');
  }
  return lines.join('\n') + '\n';
}
