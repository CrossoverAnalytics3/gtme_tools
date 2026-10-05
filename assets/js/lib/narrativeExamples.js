// Illustrative Personnel & Coaching example for the Narrative Product Library.
// Everything here is made up to show the method on a sports-org buyer: no
// real team, customer or result. Proof points say so in their own text.

export const SPORTS_PERSONAS = ['Head coach', 'Analytics director', 'General manager'];

/**
 * @param {string} today  ISO date used as "last reviewed" for current blocks
 * @param {string} old    ISO date for the one deliberately stale block
 */
export function sportsExample(today, old) {
  let n = 0;
  const B = (type, title, text, personas, moments, status = 'approved', reviewedOn = today, owner = 'PMM') => ({
    id: `sp-${++n}`,
    type,
    title,
    text,
    personas,
    moments,
    status,
    owner,
    reviewedOn,
    version: 1,
  });

  return {
    personas: [...SPORTS_PERSONAS],
    staleDays: 180,
    composer: { persona: 'General manager', moment: 'renewal' },
    blocks: [
      B('core', 'Core: one player picture', 'Coaches, analysts and the front office look at the same player picture before every decision, so staff time goes to coaching and every call holds up when someone asks why.', [], []),
      B('pillar', 'Pillar: prep without the busywork', 'Film, practice data and scouting notes land in one view before the staff meeting. Assistants stop rebuilding the same report three different ways.', ['Head coach'], []),
      B('pillar', 'Pillar: models people actually use', 'Your models show up inside the coaches\' workflow, next to the film, instead of in a PDF nobody opens. Adoption by the staff is the number that keeps an analytics department funded.', ['Analytics director'], []),
      B('pillar', 'Pillar: decisions you can defend', 'Every roster move carries its evaluation trail: who graded the player, what the data said, what changed. When ownership asks why, the answer is already written down.', ['General manager'], []),
      B('pillar', 'Pillar: same system, next group', 'The workflow the coaching staff built becomes the template for player development, recruiting or the next team, so they start from something that already works.', [], ['expansion']),
      B('proof', 'Proof: prep time (illustrative)', 'Illustrative: a staff that moved weekly opponent prep into one shared board cut report assembly from 2 days to same-day. Swap in a real customer number before using this.', ['Head coach', 'Analytics director'], ['first-value', 'expansion', 'renewal']),
      B('proof', 'Proof: decision trail (illustrative)', 'Illustrative: a front office used the evaluation trail to brief ownership on a deadline trade in one meeting instead of three. Swap in a real customer story before using this.', ['General manager'], ['expansion', 'renewal']),
      B('proof', 'Proof: season value report (template)', 'Pull the season report before the meeting: evaluations completed, players tracked, hours of manual reporting removed. Fill it with the account\'s real usage.', [], ['renewal', 'at-risk']),
      B('objection', 'Objection: "Our staff already has its own system"', 'Keep it running. Import what they have and the coaches see their own grades on day one. What changes is that the front office sees them too.', [], ['onboarding', 'expansion']),
      B('objection', 'Objection: "New head coach, new tools"', 'A coaching change is when history matters most. The new staff inherits every evaluation and note on day one instead of starting from zero. Offer a 2-week install for the incoming staff.', [], ['at-risk', 'renewal']),
      B('cta', 'CTA: preseason install', 'Pick one workflow (opponent prep or player evaluations), set it up before the first game week, and we\'ll measure hours saved by week 4.', [], ['onboarding', 'first-value']),
      B('cta', 'CTA: next-group workshop', 'Book 45 minutes with the player development staff to map their workflow onto what the coaches already use.', [], ['expansion']),
      B('cta', 'CTA: end-of-season review', 'Walk through the season report together and agree on next season\'s goals before renewal.', [], ['renewal', 'at-risk']),
      B('pillar', 'Pillar: draft-day narrative (old)', 'Positioning from last year\'s draft push. Needs a refresh before anyone uses it.', ['General manager'], [], 'review', old),
    ],
    model: {
      startARR: 12000000,
      target: 1.1,
      current: { expansion: 0.1, contraction: 0.04, churn: 0.08 },
      program: { expansion: 0.15, contraction: 0.02, churn: 0.04 },
    },
  };
}
