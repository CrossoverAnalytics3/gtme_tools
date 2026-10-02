// Fast Five Research Kit logic.
// Brief: when the numbers show a problem, run 5 unscripted 50-minute customer
// interviews. Five conversations surface population patterns with ~97% certainty.
//
// Where "97%" comes from: if a problem affects half your users, the chance it
// shows up in at least one of 5 random interviews is 1 - 0.5^5 = 96.9%.
// It's a detection guarantee for common problems, not a measurement of how
// common they are.

import { splitList } from '../core/format.js';

export function detectionProbability(prevalence, n) {
  if (!(prevalence > 0)) return 0;
  if (prevalence >= 1) return 1;
  return 1 - Math.pow(1 - prevalence, n);
}

export function interviewsNeeded(prevalence, confidence = 0.95) {
  if (!(prevalence > 0 && prevalence < 1) || !(confidence > 0 && confidence < 1)) return null;
  return Math.ceil(Math.log(1 - confidence) / Math.log(1 - prevalence));
}

export function detectionTable(prevalences = [0.1, 0.2, 0.3, 0.5], ns = [1, 3, 5, 8, 10]) {
  return prevalences.map((p) => ({ prevalence: p, cells: ns.map((n) => ({ n, prob: detectionProbability(p, n) })) }));
}

/** 50-minute unscripted guide built around the hypothesis. */
export function buildGuide({ signal, hypothesis, audience, decision }) {
  const s = signal || '[the data signal]';
  const hyp = hypothesis || '[your hypothesis]';
  return [
    {
      block: 'Open',
      minutes: 5,
      prompts: [
        'Thank them, say there are no wrong answers, and that you\'re here to learn, not to sell.',
        'Ask permission to record. Confirm they have 50 minutes.',
        `Context for you only (don't read aloud): ${s}`,
      ],
    },
    {
      block: 'Their world',
      minutes: 10,
      prompts: [
        'Tell me about your role and what a normal week looks like.',
        `Where does ${audience ? audience.toLowerCase() : 'this work'} fit into that week?`,
        'What are you measured on?',
      ],
    },
    {
      block: 'The last time',
      minutes: 15,
      prompts: [
        'Walk me through the last time you did this. Start from the very beginning.',
        'What happened next? And then?',
        'Where did you get stuck or slow down?',
        'What did you do instead? (Workarounds are gold.)',
      ],
    },
    {
      block: 'Dig into the pain',
      minutes: 12,
      prompts: [
        'How often does that happen?',
        'What does it cost you when it happens: time, money, reputation?',
        'Have you tried to fix it? What happened?',
        `Probe (without leading) whether this holds: ${hyp}`,
      ],
    },
    {
      block: 'Reactions',
      minutes: 5,
      prompts: [
        'If you could wave a magic wand, what would be different?',
        'Show the current flow or a rough idea only now, and ask: what would you expect to happen here?',
      ],
    },
    {
      block: 'Close',
      minutes: 3,
      prompts: [
        'Is there anything I should have asked but didn\'t?',
        'Who else should I talk to?',
        decision ? `Note for the readout: this informs "${decision}".` : 'Note for the readout: which decision does this inform?',
      ],
    },
  ];
}

export const HELD = [
  { value: '', label: 'Not called' },
  { value: 'yes', label: 'Held' },
  { value: 'partly', label: 'Partly' },
  { value: 'no', label: 'Didn\'t hold' },
];

/** Tag counts across interviews: 3+ = pattern, 2 = signal, 1 = anecdote. */
export function synthesize(interviews) {
  const done = interviews.filter((i) => (i.notes || '').trim() || (i.tags || '').trim());
  const tagMap = new Map();
  done.forEach((iv, idx) => {
    const seen = new Set();
    for (const raw of splitList(iv.tags)) {
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (!tagMap.has(key)) tagMap.set(key, { tag: raw, count: 0, who: [] });
      const t = tagMap.get(key);
      t.count++;
      t.who.push(iv.participant || `Interview ${idx + 1}`);
    }
  });
  const label = (c) => (c >= 3 ? 'Pattern' : c === 2 ? 'Signal' : 'Anecdote');
  const tags = [...tagMap.values()].map((t) => ({ ...t, label: label(t.count) })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const tally = { yes: 0, partly: 0, no: 0 };
  for (const iv of done) if (tally[iv.held] != null) tally[iv.held]++;
  const called = tally.yes + tally.partly + tally.no;
  let hypothesis = 'Not enough calls yet';
  if (called >= 3) {
    const support = tally.yes + tally.partly * 0.5;
    hypothesis = support / called >= 0.7 ? 'Supported' : support / called >= 0.4 ? 'Mixed' : 'Not supported';
  }

  const quotes = done.flatMap((iv) =>
    String(iv.quotes || '')
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean)
      .map((q) => ({ quote: q, who: iv.participant || 'Participant', segment: iv.segment })),
  );

  return { completed: done.length, tags, patterns: tags.filter((t) => t.count >= 3), tally, called, hypothesis, quotes };
}

export function readoutMarkdown(state) {
  const s = state.setup;
  const syn = synthesize(state.interviews);
  return [
    `# Fast Five readout: ${s.title || 'Untitled study'}`,
    '',
    `**Signal:** ${s.signal || '-'}  `,
    `**Hypothesis:** ${s.hypothesis || '-'}  `,
    `**Decision this informs:** ${s.decision || '-'}  `,
    `**Interviews completed:** ${syn.completed} of 5`,
    '',
    `## Verdict: ${syn.hypothesis}`,
    `Held ${syn.tally.yes} · partly ${syn.tally.partly} · didn't hold ${syn.tally.no}`,
    '',
    '## Patterns (3+ of 5)',
    ...(syn.patterns.length ? syn.patterns.map((t) => `- **${t.tag}** (${t.count}/5: ${t.who.join(', ')})`) : ['- None yet']),
    '',
    '## Signals (2 of 5)',
    ...syn.tags.filter((t) => t.count === 2).map((t) => `- ${t.tag} (${t.who.join(', ')})`),
    '',
    '## In their words',
    ...syn.quotes.map((q) => `> "${q.quote}" (${q.who}${q.segment ? `, ${q.segment}` : ''})`),
    '',
    '## Why 5 is enough',
    `A problem shared by half your users shows up in at least one of 5 interviews ${Math.round(detectionProbability(0.5, 5) * 1000) / 10}% of the time. Rarer problems (10% of users) need ${interviewsNeeded(0.1, 0.95)} interviews for 95% confidence.`,
    '',
  ].join('\n');
}
