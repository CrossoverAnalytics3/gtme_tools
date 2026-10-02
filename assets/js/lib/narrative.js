// Narrative Product Library logic.
// Brief: Asana treated messaging like a data product: discoverable, current,
// pre-approved blocks mapped to "moments of truth". NRR went 107% → 120% in
// under 2 years.

import { daysBetween } from '../core/format.js';

export const BLOCK_TYPES = [
  { id: 'core', label: 'Core narrative', max: 1 },
  { id: 'pillar', label: 'Value pillar', max: 2 },
  { id: 'proof', label: 'Proof point', max: 2 },
  { id: 'objection', label: 'Objection response', max: 1 },
  { id: 'cta', label: 'Call to action', max: 1 },
];

export const MOMENTS = [
  { id: 'onboarding', label: 'Onboarding', lever: 'Early churn', goal: 'Get to first value fast so they never question the purchase.' },
  { id: 'first-value', label: 'First value', lever: 'Contraction', goal: 'Name the win out loud so the team keeps its seats.' },
  { id: 'expansion', label: 'Expansion', lever: 'Expansion', goal: 'Show the next team or tier the same win, with their numbers.' },
  { id: 'renewal', label: 'Renewal', lever: 'Churn', goal: 'Prove the value delivered and what is at risk if they leave.' },
  { id: 'at-risk', label: 'At risk', lever: 'Churn + contraction', goal: 'Acknowledge the problem, show the fix, re-earn trust.' },
];

export const STATUSES = ['draft', 'review', 'approved'];

export function isStale(block, today, maxDays) {
  if (!block.reviewedOn) return true;
  const d = daysBetween(block.reviewedOn, today);
  return d == null || d > maxDays;
}

const applies = (list, value) => !list || !list.length || list.includes(value);

/** Pick approved, current blocks that fit a persona and a moment of truth. */
export function compose(blocks, persona, moment, { today, staleDays = 180 } = {}) {
  const usable = blocks.filter((b) => b.status === 'approved' && applies(b.personas, persona) && applies(b.moments, moment));
  // Most specific first: blocks tagged for this exact persona/moment beat "applies to all".
  const specificity = (b) => (b.personas?.length ? 1 : 0) + (b.moments?.length ? 1 : 0);
  const sections = [];
  const gaps = [];
  for (const t of BLOCK_TYPES) {
    const picks = usable
      .filter((b) => b.type === t.id)
      .sort((a, b) => specificity(b) - specificity(a))
      .slice(0, t.max);
    if (!picks.length) gaps.push(t.label);
    sections.push({ type: t, blocks: picks });
  }
  const stale = today ? sections.flatMap((s) => s.blocks).filter((b) => isStale(b, today, staleDays)) : [];
  const text = sections
    .filter((s) => s.blocks.length)
    .map((s) => s.blocks.map((b) => b.text.trim()).join('\n\n'))
    .join('\n\n');
  return { sections, gaps, stale, text };
}

/** Approved blocks available per persona x moment (core + pillar + proof + objection + cta). */
export function coverage(blocks, personas, moments = MOMENTS) {
  return personas.map((p) => ({
    persona: p,
    cells: moments.map((m) => {
      const c = compose(blocks, p, m.id);
      return { moment: m.id, count: c.sections.reduce((a, s) => a + s.blocks.length, 0), gaps: c.gaps };
    }),
  }));
}

/** NRR from components expressed as fractions of starting ARR. */
export function nrr({ expansion, contraction, churn }) {
  return 1 + expansion - contraction - churn;
}

/** Expansion (as a fraction of starting ARR) needed to hit a target NRR. */
export function expansionNeeded(target, { contraction, churn }) {
  return target - 1 + contraction + churn;
}

export function nrrDollars(startARR, parts) {
  return {
    start: startARR,
    expansion: startARR * parts.expansion,
    contraction: startARR * parts.contraction,
    churn: startARR * parts.churn,
    end: startARR * nrr(parts),
  };
}

export function libraryMarkdown(state) {
  const lines = ['# Narrative product library', ''];
  for (const t of BLOCK_TYPES) {
    const bs = state.blocks.filter((b) => b.type === t.id);
    if (!bs.length) continue;
    lines.push(`## ${t.label}s`, '');
    for (const b of bs) {
      lines.push(
        `### ${b.title} (v${b.version}, ${b.status})`,
        `_Personas: ${b.personas?.length ? b.personas.join(', ') : 'all'} · Moments: ${b.moments?.length ? b.moments.join(', ') : 'all'} · Owner: ${b.owner || '-'} · Reviewed: ${b.reviewedOn || 'never'}_`,
        '',
        b.text,
        '',
      );
    }
  }
  return lines.join('\n');
}
