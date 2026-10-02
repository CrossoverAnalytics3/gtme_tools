// Risk-First Messaging Studio logic.
// Brief: ~80% of enterprise purchases are driven by avoiding pain or career
// risk, ~20% by upside. Messaging should de-risk implementation, protect
// revenue from downtime, and prevent competitive displacement. Discovery
// should give value first (Stripe-style whiteboarding, benchmarks, AEO data).

export const RISK_CATEGORIES = [
  {
    id: 'career',
    label: 'Career & reputation risk',
    terms: ['career', 'reputation', 'accountable', 'blame', 'the board', 'on the line', 'safe choice', 'proven', 'trusted by', 'references', 'peace of mind', 'confidence'],
    fix: 'Name the person\'s exposure. Who explains it to the board if this goes wrong, and why that won\'t be them?',
  },
  {
    id: 'revenue',
    label: 'Downtime & revenue loss',
    terms: ['downtime', 'outage', 'outages', 'revenue loss', 'lost revenue', 'missed target', 'miss the quarter', 'missed quarter', 'goes down', 'crash', 'failure', 'fail', 'abandon', 'abandoned', 'slow pages', 'latency', 'uptime', 'sla'],
    fix: 'Put a number on what an hour of downtime or a slow checkout costs them, then show how you prevent it.',
  },
  {
    id: 'implementation',
    label: 'Implementation risk',
    terms: ['migration', 'migrate', 'rollout', 'implementation', 'disruption', 'rip and replace', 'rewrite', 'pilot', 'reversible', 'in days', 'in weeks', 'onboarding', 'go-live', 'cutover', 'rollback'],
    fix: 'Say how the rollout can\'t blow up: pilot first, migration help, rollback plan, time to first value.',
  },
  {
    id: 'security',
    label: 'Security & compliance',
    terms: ['security', 'secure', 'compliance', 'compliant', 'soc 2', 'gdpr', 'hipaa', 'audit', 'breach', 'vulnerability', 'sso', 'data loss', 'encryption', 'permissions'],
    fix: 'Name the certifications and controls up front so security review isn\'t the reason the deal stalls.',
  },
  {
    id: 'competitive',
    label: 'Competitive displacement',
    terms: ['fall behind', 'falling behind', 'competitors', 'displace', 'displacement', 'lose customers', 'losing customers', 'churn', 'market share', 'left behind'],
    fix: 'Show what happens if a competitor moves first and they don\'t.',
  },
  {
    id: 'cost',
    label: 'Cost & budget risk',
    terms: ['overrun', 'hidden costs', 'hidden fees', 'surprise bill', 'no surprises', 'predictable', 'budget', 'wasted', 'waste', 'sunk cost'],
    fix: 'Promise a predictable bill and show the total cost, including what they stop paying for.',
  },
  {
    id: 'general',
    label: 'General risk language',
    terms: ['risk', 'risks', 'risky', 'avoid', 'prevent', 'protect', 'guarantee', 'guaranteed', 'reliable', 'safe', 'worry', 'mitigate', 'without', 'never', 'stop'],
    fix: '',
  },
];

export const UPSIDE_TERMS = [
  'grow', 'growth', 'increase', 'boost', 'more revenue', 'faster', 'accelerate', 'scale', 'new markets', 'opportunity', 'upside', 'innovate', 'innovation',
  'transform', 'unlock', '10x', '2x', 'maximize', 'gain', 'expand', 'delight', 'best-in-class', 'revolutionary', 'next-level', 'productivity', 'efficiency',
  'roi', 'win more', 'outperform', 'supercharge', 'cutting-edge', 'game-changing',
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildMatchers() {
  const list = [];
  for (const c of RISK_CATEGORIES) for (const t of c.terms) list.push({ term: t, kind: 'risk', category: c.id });
  for (const t of UPSIDE_TERMS) list.push({ term: t, kind: 'upside', category: 'upside' });
  // Longest phrases first so "miss the quarter" wins over "miss".
  list.sort((a, b) => b.term.length - a.term.length);
  return list.map((m) => ({ ...m, re: new RegExp(`(^|[^a-z0-9])(${escapeRe(m.term)})(?=$|[^a-z0-9])`, 'gi') }));
}
const MATCHERS = buildMatchers();

export function analyzeCopy(text, target = 0.8) {
  const src = String(text || '');
  const lower = src.toLowerCase();
  const taken = new Array(src.length).fill(false);
  const hits = [];
  for (const m of MATCHERS) {
    m.re.lastIndex = 0;
    let r;
    while ((r = m.re.exec(lower))) {
      const start = r.index + r[1].length;
      const end = start + r[2].length;
      if (taken.slice(start, end).some(Boolean)) continue;
      for (let i = start; i < end; i++) taken[i] = true;
      hits.push({ start, end, kind: m.kind, category: m.category, term: src.slice(start, end) });
    }
  }
  hits.sort((a, b) => a.start - b.start);

  const risk = hits.filter((x) => x.kind === 'risk').length;
  const upside = hits.filter((x) => x.kind === 'upside').length;
  const total = risk + upside;
  const riskShare = total ? risk / total : null;
  const categoriesHit = new Set(hits.filter((x) => x.kind === 'risk').map((x) => x.category));
  const missing = RISK_CATEGORIES.filter((c) => c.id !== 'general' && !categoriesHit.has(c.id));

  let verdict;
  if (total < 3) verdict = { label: 'Not enough signal yet', tone: 'warn', note: 'Paste a longer piece of copy, at least a paragraph.' };
  else if (riskShare >= target - 0.1) verdict = { label: 'Risk-first', tone: 'good', note: 'This speaks to what enterprise buyers are trying to avoid.' };
  else if (riskShare >= 0.4) verdict = { label: 'Balanced: lean further into risk', tone: 'warn', note: 'Swap some upside claims for the pain you prevent.' };
  else verdict = { label: 'Upside-heavy', tone: 'bad', note: 'Most enterprise buyers are buying to avoid pain. This copy mostly sells upside.' };

  // Segments for highlighting.
  const segments = [];
  let pos = 0;
  for (const hgt of hits) {
    if (hgt.start > pos) segments.push({ text: src.slice(pos, hgt.start) });
    segments.push({ text: src.slice(hgt.start, hgt.end), kind: hgt.kind, category: hgt.category });
    pos = hgt.end;
  }
  if (pos < src.length) segments.push({ text: src.slice(pos) });

  return { hits, risk, upside, total, riskShare, target, categoriesHit: [...categoriesHit], missing, verdict, segments };
}

/** Feature -> benefit -> risk removed ladder. */
export function ladderLines(row) {
  const f = (x, ph) => (x && String(x).trim() ? String(x).trim().replace(/[.\s]+$/, '') : `[${ph}]`);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const lowerFirst = (s) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const proof = row.proof && row.proof.trim() ? ` ${f(row.proof, 'proof')}.` : '';
  return {
    riskFirst: `No more ${lowerFirst(f(row.pain, 'the pain you prevent'))}. ${cap(f(row.feature, 'feature'))} means ${f(row.benefit, 'benefit')}.${proof}`,
    upside: `${cap(f(row.benefit, 'benefit'))}, with ${lowerFirst(f(row.feature, 'feature'))}.${proof}`,
    character: row.character && row.character.trim() ? `${f(row.character, 'character')}: ${f(row.benefit, 'benefit')}.` : null,
  };
}

/** 80/20 talk track: risk-first lines for most rows, upside for the rest. */
export function talkTrack(rows, riskShare = 0.8) {
  const usable = rows.filter((r) => r.feature || r.benefit || r.pain);
  const nRisk = Math.round(usable.length * riskShare);
  return usable.map((r, i) => (i < nRisk ? ladderLines(r).riskFirst : ladderLines(r).upside));
}

export const BUYER_ROLES = [
  {
    id: 'economic',
    label: 'Economic buyer',
    asset: 'A benchmark of their business against peers (site speed, Core Web Vitals, conversion impact, AEO visibility) before you ask for anything.',
    risk: [
      'What would it cost {account} if this project slipped a quarter?',
      'When a platform decision went wrong here before, what happened, and who carried it?',
      'What has to be true for you to defend this choice to the board in 12 months?',
      'Which revenue targets this year depend on the systems we\'re talking about?',
      'What does an hour of downtime cost on your biggest day of the year?',
      'If you do nothing this year, what breaks first?',
    ],
    upside: ['If this works, what would you do with the time and budget it frees up?', 'Which growth goal would this most help you hit?'],
  },
  {
    id: 'champion',
    label: 'Champion',
    asset: 'A draft internal business case they can forward, written in their company\'s language.',
    risk: [
      'Who internally is most likely to block this, and what are they worried about?',
      'What happened the last time your team pushed for a new tool?',
      'What would make you look bad if we got this wrong?',
      'Which deadline is driving this, and what happens if it\'s missed?',
      'What do you need from us to make the case without it landing on you alone?',
    ],
    upside: ['If this goes well, what does it do for your team\'s standing?', 'What would you build next with this in place?'],
  },
  {
    id: 'technical',
    label: 'Technical evaluator',
    asset: 'A live whiteboard of their current architecture (the Stripe play): they leave with a diagram worth having even if they never buy.',
    risk: [
      'Walk me through your current setup. Where does it break under load?',
      'What would a migration have to avoid touching for you to sign off?',
      'How do you roll back today if a deploy goes bad?',
      'Which integrations are fragile enough that you\'re nervous about any change?',
      'What did the last vendor migration cost you in engineering time?',
      'What would make you veto this, technically?',
    ],
    upside: ['What would your team ship if it didn\'t have to maintain this?', 'Where would faster builds or previews change how you work?'],
  },
  {
    id: 'security',
    label: 'Security / procurement',
    asset: 'A pre-filled security questionnaire, SOC 2 report and DPA, sent before they ask.',
    risk: [
      'Which controls or certifications are must-haves before a pilot?',
      'What caused the last vendor review to stall?',
      'Where does customer data need to live, and who can touch it?',
      'What contract terms have burned you before (overages, auto-renew, exit)?',
      'What does your incident response expectation look like for a vendor?',
    ],
    upside: ['Would consolidating vendors simplify your review load?'],
  },
  {
    id: 'user',
    label: 'End user',
    asset: 'A teardown of their top 3 daily tasks, timed today vs. with your product.',
    risk: [
      'What part of your day breaks most often?',
      'What did you have to work around last time a tool changed?',
      'What would make you quietly go back to the old way?',
      'Where do mistakes happen today, and who catches them?',
    ],
    upside: ['If one task took half the time, which one would you pick?'],
  },
];

export function discoveryPlan(roleId, count = 10, riskShare = 0.8, account = 'your company') {
  const role = BUYER_ROLES.find((r) => r.id === roleId) || BUYER_ROLES[0];
  const nRisk = Math.min(role.risk.length, Math.round(count * riskShare));
  const nUp = Math.min(role.upside.length, Math.max(1, count - nRisk));
  const fill = (q) => q.replace(/\{account\}/g, account || 'your company');
  return {
    role,
    risk: role.risk.slice(0, nRisk).map(fill),
    upside: role.upside.slice(0, nUp).map(fill),
    asset: role.asset,
  };
}

export function messagingMarkdown(state) {
  const a = analyzeCopy(state.copy, state.target);
  const plan = discoveryPlan(state.discovery.role, state.discovery.count, state.target, state.discovery.account);
  return [
    '# Risk-first messaging',
    '',
    '## Copy check',
    `- Risk language: ${a.risk} · Upside language: ${a.upside} · Risk share: ${a.riskShare == null ? '-' : Math.round(a.riskShare * 100) + '%'} (target ${Math.round(state.target * 100)}%)`,
    `- Verdict: **${a.verdict.label}**. ${a.verdict.note}`,
    ...a.missing.map((m) => `- Missing: ${m.label}. ${m.fix}`),
    '',
    '## Feature → benefit → risk removed',
    '',
    '| Feature | Benefit | Pain avoided | Risk-first line |',
    '| --- | --- | --- | --- |',
    ...state.ladder.map((r) => `| ${r.feature} | ${r.benefit} | ${r.pain} | ${ladderLines(r).riskFirst} |`),
    '',
    `## Discovery plan: ${plan.role.label} at ${state.discovery.account || 'the account'}`,
    `**Bring:** ${plan.asset}`,
    '',
    '**Risk questions**',
    ...plan.risk.map((q, i) => `${i + 1}. ${q}`),
    '',
    '**Upside questions**',
    ...plan.upside.map((q, i) => `${i + 1}. ${q}`),
    '',
  ].join('\n');
}
