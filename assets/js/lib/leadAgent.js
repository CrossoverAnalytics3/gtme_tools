// Inbound Qualification Agent logic.
// Brief: Vercel's GTME built an inbound qualification agent in 6 weeks.
// 10 SDRs became 1 SDR doing QA on the agent; 9 moved to outbound.
//
// The scoring is deterministic and explainable on purpose: every route comes
// with reasons, and anything in the gray zone goes to a human. The same config
// also renders an LLM system prompt, so a GTME can run the rules in code, in a
// model, or both (rules first, model for the gray zone).

export const ROUTES = {
  ae: { id: 'ae_fast_track', label: 'AE fast-track', tone: 'good' },
  qa: { id: 'sdr_qa', label: 'SDR QA review', tone: 'warn' },
  nurture: { id: 'nurture', label: 'Nurture', tone: 'info' },
  dq: { id: 'disqualify', label: 'Disqualify', tone: 'bad' },
};

export const DEFAULT_CONFIG = {
  icp: {
    minEmployees: 50,
    maxEmployees: 5000,
    industries: ['software', 'saas', 'e-commerce', 'ecommerce', 'fintech', 'media', 'marketplace'],
    countries: ['US', 'CA', 'GB', 'UK', 'DE', 'FR', 'NL', 'AU'],
    seniorTitles: ['vp', 'vice president', 'head', 'director', 'chief', 'cto', 'ceo', 'cio', 'founder', 'co-founder', 'principal', 'lead'],
    freeEmailDomains: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'],
    competitorDomains: ['competitor.com'],
    disqualifyKeywords: ['student', 'homework', 'thesis', 'job application', 'resume', 'internship', 'seo services', 'guest post'],
    enterpriseKeywords: ['sso', 'saml', 'soc 2', 'soc2', 'migration', 'migrate', 'enterprise', 'contract', 'procurement', 'sla', 'security review', 'multi-region'],
  },
  weights: {
    employeesFit: 20,
    industryFit: 15,
    countryFit: 5,
    seniority: 15,
    businessEmail: 5,
    demoRequest: 15,
    pricingVisits: 10,
    enterpriseKeywords: 10,
    messageDetail: 5,
  },
  thresholds: {
    ae: 70,
    qa: 45,
    grayBand: 3,
    minIntent: 10,
  },
};

const FIT_KEYS = ['employeesFit', 'industryFit', 'countryFit', 'seniority', 'businessEmail'];
const INTENT_KEYS = ['demoRequest', 'pricingVisits', 'enterpriseKeywords', 'messageDetail'];

const lc = (s) => String(s ?? '').toLowerCase().trim();
const yes = (v) => /^(y|yes|true|1|x)$/i.test(String(v ?? '').trim());
const toNum = (v) => {
  const n = parseFloat(String(v ?? '').replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
};

function wordMatch(text, terms) {
  const t = ` ${lc(text).replace(/[^a-z0-9+\- ]/g, ' ')} `;
  return terms.filter((term) => t.includes(` ${lc(term)} `));
}

function phraseMatch(text, terms) {
  const t = lc(text);
  return terms.filter((term) => term && t.includes(lc(term)));
}

/** Map loosely named CSV columns onto the fields the agent uses. */
export function normalizeLead(raw) {
  const pick = (...keys) => {
    for (const k of keys) if (raw[k] != null && String(raw[k]).trim() !== '') return String(raw[k]).trim();
    return '';
  };
  return {
    name: pick('name', 'full_name', 'first_name'),
    email: pick('email', 'work_email', 'email_address'),
    title: pick('title', 'job_title', 'role'),
    company: pick('company', 'company_name', 'organization', 'account'),
    employees: toNum(pick('employees', 'employee_count', 'company_size', 'headcount')),
    industry: pick('industry', 'vertical'),
    country: pick('country', 'country_code', 'region'),
    message: pick('message', 'comments', 'notes', 'how_can_we_help'),
    pricingViews: toNum(pick('pricing_views', 'pricing_page_views', 'pricing_visits')) ?? 0,
    demoRequested: yes(pick('demo_requested', 'demo', 'requested_demo')),
    source: pick('source', 'lead_source', 'utm_source'),
  };
}

export function scoreLead(raw, config = DEFAULT_CONFIG) {
  const lead = raw && raw.email !== undefined && raw.pricingViews !== undefined ? raw : normalizeLead(raw);
  const { icp, weights: w, thresholds: th } = config;
  const reasons = [];
  const missing = [];
  const parts = {};
  const domain = lc(lead.email.split('@')[1] || '');

  // Hard disqualifiers first. These never reach a human.
  if (domain && icp.competitorDomains.map(lc).includes(domain)) {
    return finish(lead, { route: ROUTES.dq, reasons: [`Competitor domain (${domain})`], parts: {}, missing, fit: 0, intent: 0 });
  }
  const dqHits = phraseMatch(`${lead.message} ${lead.title}`, icp.disqualifyKeywords);
  if (dqHits.length) {
    return finish(lead, { route: ROUTES.dq, reasons: [`Disqualifying keywords: ${dqHits.join(', ')}`], parts: {}, missing, fit: 0, intent: 0 });
  }

  // Fit
  if (lead.employees == null) {
    parts.employeesFit = 0;
    missing.push('employees');
  } else if (lead.employees >= icp.minEmployees && lead.employees <= icp.maxEmployees) {
    parts.employeesFit = w.employeesFit;
    reasons.push(`${lead.employees.toLocaleString()} employees is inside the ICP range`);
  } else if (lead.employees >= icp.minEmployees / 2 && lead.employees <= icp.maxEmployees * 2) {
    parts.employeesFit = w.employeesFit / 2;
    reasons.push(`${lead.employees.toLocaleString()} employees is near the ICP range`);
  } else {
    parts.employeesFit = 0;
    reasons.push(`${lead.employees.toLocaleString()} employees is outside the ICP range`);
  }

  if (!lead.industry) {
    parts.industryFit = 0;
    missing.push('industry');
  } else if (phraseMatch(lead.industry, icp.industries).length) {
    parts.industryFit = w.industryFit;
    reasons.push(`Target industry (${lead.industry})`);
  } else {
    parts.industryFit = 0;
    reasons.push(`Non-target industry (${lead.industry})`);
  }

  if (!lead.country) {
    parts.countryFit = 0;
    missing.push('country');
  } else if (icp.countries.map(lc).includes(lc(lead.country))) {
    parts.countryFit = w.countryFit;
  } else {
    parts.countryFit = 0;
    reasons.push(`Outside target countries (${lead.country})`);
  }

  if (!lead.title) {
    parts.seniority = 0;
    missing.push('title');
  } else if (wordMatch(lead.title, icp.seniorTitles).length) {
    parts.seniority = w.seniority;
    reasons.push(`Senior title (${lead.title})`);
  } else {
    parts.seniority = w.seniority / 3;
  }

  const freeEmail = !domain || icp.freeEmailDomains.map(lc).includes(domain);
  parts.businessEmail = freeEmail ? 0 : w.businessEmail;
  if (freeEmail) reasons.push('Personal email domain');

  // Intent
  parts.demoRequest = lead.demoRequested ? w.demoRequest : 0;
  if (lead.demoRequested) reasons.push('Requested a demo');

  const views = lead.pricingViews || 0;
  parts.pricingVisits = Math.min(views / 3, 1) * w.pricingVisits;
  if (views > 0) reasons.push(`${views} pricing page view${views === 1 ? '' : 's'}`);

  const entHits = phraseMatch(lead.message, icp.enterpriseKeywords);
  parts.enterpriseKeywords = entHits.length ? w.enterpriseKeywords : 0;
  if (entHits.length) reasons.push(`Enterprise signals: ${entHits.join(', ')}`);

  const len = lead.message.length;
  parts.messageDetail = len >= 80 ? w.messageDetail : len >= 30 ? w.messageDetail / 2 : 0;

  const fit = FIT_KEYS.reduce((a, k) => a + (parts[k] || 0), 0);
  const intent = INTENT_KEYS.reduce((a, k) => a + (parts[k] || 0), 0);
  const score = fit + intent;
  const fitMax = FIT_KEYS.reduce((a, k) => a + w[k], 0);
  const intentMax = INTENT_KEYS.reduce((a, k) => a + w[k], 0);

  let route = score >= th.ae ? ROUTES.ae : score >= th.qa ? ROUTES.qa : ROUTES.nurture;

  // Good fit with no buying signal yet: let nurture and product usage do the work.
  if (route !== ROUTES.nurture && intent < th.minIntent) {
    route = ROUTES.nurture;
    reasons.push(`Intent ${Math.round(intent)} is below the ${th.minIntent}-point floor`);
  }

  // Guardrails that send a lead to a human instead of guessing.
  if (route !== ROUTES.qa && !(route === ROUTES.nurture && intent < th.minIntent)) {
    const nearest = Math.min(Math.abs(score - th.ae), Math.abs(score - th.qa));
    if (nearest < th.grayBand) {
      route = ROUTES.qa;
      reasons.push(`Within ${th.grayBand} points of a threshold`);
    } else if (route === ROUTES.nurture && intent >= intentMax * 0.6 && fit < fitMax * 0.5) {
      route = ROUTES.qa;
      reasons.push('High intent but weak fit: worth a human look');
    } else if (route === ROUTES.ae && missing.length >= 2) {
      route = ROUTES.qa;
      reasons.push(`Strong signals but missing ${missing.join(', ')}`);
    }
  }

  return finish(lead, { route, reasons, parts, missing, fit, intent });
}

function finish(lead, { route, reasons, parts, missing, fit, intent }) {
  const score = Math.round(fit + intent);
  const completeness = 1 - missing.length / 4;
  const confidence = route === ROUTES.dq ? 'high' : route === ROUTES.qa ? 'low' : completeness >= 0.75 ? 'high' : 'medium';
  return {
    lead,
    route: route.id,
    routeLabel: route.label,
    tone: route.tone,
    score,
    fit: Math.round(fit),
    intent: Math.round(intent),
    parts,
    reasons,
    missing,
    confidence,
  };
}

export function qualifyBatch(rawLeads, config = DEFAULT_CONFIG) {
  const results = rawLeads.map((r) => scoreLead(r, config));
  const counts = Object.fromEntries(Object.values(ROUTES).map((r) => [r.id, 0]));
  for (const r of results) counts[r.route]++;
  const total = results.length;
  return {
    results,
    counts,
    total,
    automationRate: total ? (total - counts.sdr_qa) / total : 0,
    qaShare: total ? counts.sdr_qa / total : 0,
  };
}

/**
 * SDR capacity before and after the agent.
 * Before: every lead is qualified by hand. After: only the QA share is.
 */
export function sdrCapacity({ leadsPerMonth, minutesPerManualLead, qaShare, minutesPerQaLead, productiveHoursPerSdrMonth }) {
  const hoursBefore = (leadsPerMonth * minutesPerManualLead) / 60;
  const hoursAfter = (leadsPerMonth * qaShare * minutesPerQaLead) / 60;
  const sdrsBefore = productiveHoursPerSdrMonth > 0 ? hoursBefore / productiveHoursPerSdrMonth : 0;
  const sdrsAfter = productiveHoursPerSdrMonth > 0 ? hoursAfter / productiveHoursPerSdrMonth : 0;
  return {
    hoursBefore,
    hoursAfter,
    sdrsBefore,
    sdrsAfter,
    sdrsNeededAfter: Math.max(1, Math.ceil(sdrsAfter)),
    sdrsFreed: Math.max(0, Math.round(sdrsBefore) - Math.max(1, Math.ceil(sdrsAfter))),
  };
}

export const OUTPUT_SCHEMA = {
  type: 'object',
  required: ['route', 'fit_score', 'intent_score', 'reasons', 'missing_fields', 'confidence', 'summary_for_ae'],
  properties: {
    route: { enum: Object.values(ROUTES).map((r) => r.id) },
    fit_score: { type: 'number', minimum: 0 },
    intent_score: { type: 'number', minimum: 0 },
    reasons: { type: 'array', items: { type: 'string' } },
    missing_fields: { type: 'array', items: { type: 'string' } },
    confidence: { enum: ['high', 'medium', 'low'] },
    summary_for_ae: { type: 'string', description: '2 sentences an AE can read before the first call.' },
  },
};

/** System prompt for an LLM qualifier that follows the same rules. */
export function buildAgentPrompt(config = DEFAULT_CONFIG, { company = 'our company', product = 'our product' } = {}) {
  const { icp, weights: w, thresholds: th } = config;
  const fitMax = FIT_KEYS.reduce((a, k) => a + w[k], 0);
  const intentMax = INTENT_KEYS.reduce((a, k) => a + w[k], 0);
  return `You are the inbound lead qualification agent for ${company}, which sells ${product}.
Your job: read one inbound lead and decide where it goes. A human SDR reviews anything you are unsure about, so when in doubt, route to sdr_qa. Never invent company facts. If a field is unknown, list it in missing_fields.

## Hard disqualifiers (route: disqualify)
- Email domain is a competitor: ${icp.competitorDomains.join(', ') || 'none listed'}
- Message or title contains: ${icp.disqualifyKeywords.join(', ')}

## Fit score (0 to ${fitMax})
- Company size ${icp.minEmployees} to ${icp.maxEmployees} employees: ${w.employeesFit} points (half if within 2x of the range, 0 if unknown)
- Industry is one of [${icp.industries.join(', ')}]: ${w.industryFit} points
- Country is one of [${icp.countries.join(', ')}]: ${w.countryFit} points
- Senior title (${icp.seniorTitles.join(', ')}): ${w.seniority} points, other known titles ${Math.round(w.seniority / 3)}
- Business email domain (not ${icp.freeEmailDomains.join(', ')}): ${w.businessEmail} points

## Intent score (0 to ${intentMax})
- Requested a demo: ${w.demoRequest} points
- Pricing page views: ${w.pricingVisits} points at 3+ views, scaled below that
- Message mentions any of [${icp.enterpriseKeywords.join(', ')}]: ${w.enterpriseKeywords} points
- Message is specific (80+ characters): ${w.messageDetail} points, half for 30+

## Routing
- fit + intent >= ${th.ae}: ae_fast_track
- ${th.qa} to ${th.ae - 1}: sdr_qa
- below ${th.qa}: nurture
- Intent below ${th.minIntent}: nurture, whatever the fit
- Within ${th.grayBand} points of a threshold: sdr_qa
- High intent (>= ${Math.round(intentMax * 0.6)}) with weak fit (< ${Math.round(fitMax * 0.5)}): sdr_qa
- Would be ae_fast_track but 2+ of employees/industry/country/title are unknown: sdr_qa

## Output
Return only JSON matching this schema:
${JSON.stringify(OUTPUT_SCHEMA, null, 2)}

Write summary_for_ae as 2 plain sentences: who they are and what they seem to need, then the strongest buying signal.`;
}

export const RESULT_COLUMNS = [
  { key: 'name', label: 'name' },
  { key: 'email', label: 'email' },
  { key: 'company', label: 'company' },
  { key: 'title', label: 'title' },
  { key: 'route', label: 'route' },
  { key: 'score', label: 'score' },
  { key: 'fit', label: 'fit' },
  { key: 'intent', label: 'intent' },
  { key: 'confidence', label: 'confidence' },
  { key: 'reasons', label: 'reasons' },
  { key: 'missing', label: 'missing_fields' },
];

export function flattenResult(r) {
  return { ...r.lead, route: r.route, score: r.score, fit: r.fit, intent: r.intent, confidence: r.confidence, reasons: r.reasons, missing: r.missing };
}
