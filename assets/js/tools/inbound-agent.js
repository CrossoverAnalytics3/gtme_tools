import { mountTool } from '../core/shell.js';
import { h, field, textInput, textArea, numberInput, percentInput, select, button, stat, pill, callout, table, replaceChildren, tabs, download, copyText, pickFile, hbars, debounce, toast, ask } from '../core/dom.js';
import { num, pct, splitList } from '../core/format.js';
import { parseCSVObjects, toCSV } from '../core/csv.js';
import { clone } from '../core/store.js';
import { DEFAULT_CONFIG, ROUTES, qualifyBatch, buildAgentPrompt, sdrCapacity, OUTPUT_SCHEMA, RESULT_COLUMNS, flattenResult } from '../lib/leadAgent.js';

const defaults = {
  config: clone(DEFAULT_CONFIG),
  company: '',
  product: '',
  csv: '',
  capacity: { leadsPerMonth: 1000, minutesPerManualLead: 20, qaShare: 0.3, minutesPerQaLead: 8, productiveHoursPerSdrMonth: 125 },
};

async function sampleCSV() {
  try {
    const res = await fetch(new URL('../../../examples/leads.csv', import.meta.url));
    if (res.ok) return await res.text();
  } catch {
    /* offline */
  }
  return 'name,email,title,company,employees,industry,country,pricing_views,demo_requested,message\nDana Whitfield,dana@northpeakcommerce.com,VP Engineering,Northpeak Commerce,850,E-commerce,US,4,yes,"Planning a migration, need SSO and an SLA"\n';
}

// Vercel-style example: 3,000 inbound leads a month used to need 10 SDRs.
const example = {
  config: clone(DEFAULT_CONFIG),
  company: 'Acme Cloud',
  product: 'a frontend cloud platform for deploying web apps',
  csv: '__SAMPLE__',
  capacity: { leadsPerMonth: 3000, minutesPerManualLead: 25, qaShare: 0.25, minutesPerQaLead: 8, productiveHoursPerSdrMonth: 125 },
};

function markdown(state) {
  return `# Inbound qualification agent\n\n## System prompt\n\n\`\`\`\n${buildAgentPrompt(state.config, { company: state.company || undefined, product: state.product || undefined })}\n\`\`\`\n\n## Config\n\n\`\`\`json\n${JSON.stringify(state.config, null, 2)}\n\`\`\`\n`;
}

// UI-only state (not persisted). Declared before mountTool, which renders immediately.
let routeFilter = 'all';

mountTool('inbound-agent', {
  defaults,
  example,
  markdown,
  render(app, ctx) {
    if (ctx.state.csv === '__SAMPLE__') {
      ctx.state.csv = '';
      sampleCSV().then((t) => { ctx.state.csv = t; ctx.save(); ctx.rerender(); });
    }
    tabs(
      app,
      [
        { id: 'run', label: '1. Route leads', render: (p) => renderRun(p, ctx) },
        { id: 'rules', label: '2. Rules', render: (p) => renderRules(p, ctx) },
        { id: 'prompt', label: '3. Agent prompt', render: (p) => renderPrompt(p, ctx) },
        { id: 'capacity', label: '4. SDR capacity', render: (p) => renderCapacity(p, ctx) },
      ],
      'inbound-agent',
    );
  },
});

function renderRun(panel, ctx) {
  const s = ctx.state;
  const out = h('div', { class: 'stack' });
  const csvBox = textArea(s.csv, debounce((v) => { s.csv = v; ctx.save(); draw(); }, 250), { rows: 8, class: 'mono', placeholder: 'Paste a CSV export of inbound leads, or load the sample.', spellcheck: 'false' });

  function draw() {
    let leads = [];
    try {
      leads = parseCSVObjects(s.csv);
    } catch {
      leads = [];
    }
    if (!leads.length) return replaceChildren(out, h('p', { class: 'muted' }, 'No leads yet. Load the sample or paste a CSV.'));
    const b = qualifyBatch(leads, s.config);
    const shown = b.results.filter((r) => routeFilter === 'all' || r.route === routeFilter);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-4' },
        stat('Leads', num(b.total)),
        stat('Handled by the agent', pct(b.automationRate, 0), 'AE, nurture or disqualify'),
        stat('Sent to SDR QA', num(b.counts.sdr_qa), pct(b.qaShare, 0)),
        stat('Fast-tracked to AE', num(b.counts.ae_fast_track)),
      ),
      h('div', { class: 'card' },
        h('h3', null, 'Leads by route'),
        hbars(Object.values(ROUTES).map((r) => ({ label: r.label, value: b.counts[r.id], display: `${num(b.counts[r.id])} (${pct(b.counts[r.id] / b.total, 0)})` }))),
      ),
      h('div', { class: 'row' },
        h('span', { class: 'small muted' }, 'Show'),
        select([{ value: 'all', label: 'All routes' }, ...Object.values(ROUTES).map((r) => ({ value: r.id, label: r.label }))], routeFilter, (v) => { routeFilter = v; draw(); }, { style: { width: 'auto' } }),
        h('div', { style: { flex: 1 } }),
        button('Use QA share in capacity', () => { s.capacity.qaShare = b.qaShare; ctx.save(); toast(`QA share set to ${pct(b.qaShare, 0)}`); }, 'sm'),
        button('Download routed CSV', () => download('routed-leads.csv', toCSV(b.results.map(flattenResult), RESULT_COLUMNS), 'text/csv'), 'sm primary'),
      ),
      table(
        [
          { label: 'Lead', render: (r) => h('div', null, h('strong', null, r.lead.name || r.lead.email || '(no name)'), h('div', { class: 'small muted' }, [r.lead.title, r.lead.company].filter(Boolean).join(' · '))) },
          { label: 'Route', render: (r) => pill(r.routeLabel, r.tone) },
          { label: 'Score', num: true, render: (r) => h('span', { title: `Fit ${r.fit} + intent ${r.intent}` }, `${r.score}`) },
          { label: 'Fit / intent', num: true, render: (r) => `${r.fit} / ${r.intent}` },
          { label: 'Why', render: (r) => h('ul', { class: 'list-tight small' }, r.reasons.map((x) => h('li', null, x)), r.missing.length ? h('li', { class: 'muted' }, `Missing: ${r.missing.join(', ')}`) : null) },
        ],
        shown,
        { empty: 'No leads on this route.' },
      ),
    );
  }

  panel.append(
    h('div', { class: 'card stack' },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } },
        h('h3', { class: 'mt-0' }, 'Inbound leads (CSV)'),
        h('div', { class: 'row' },
          button('Load sample leads', async () => { s.csv = await sampleCSV(); ctx.save(); csvBox.value = s.csv; draw(); }, 'sm'),
          button('Upload CSV', async () => { const f = await pickFile('.csv,.txt'); if (!f) return; s.csv = f.text; ctx.save(); csvBox.value = s.csv; draw(); }, 'sm'),
        ),
      ),
      csvBox,
      h('small', { class: 'muted' }, 'Columns it understands: name, email, title, company, employees, industry, country, pricing_views, demo_requested, message, source. Common variants (job_title, company_size, headcount) work too.'),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}

function renderRules(panel, ctx) {
  const c = ctx.state.config;
  const list = (obj, k) => textInput(obj[k].join(', '), (v) => { obj[k] = splitList(v); ctx.save(); }, { title: 'Comma-separated' });
  const n = (obj, k, attrs = {}) => numberInput(obj[k], (v) => { obj[k] = v; ctx.save(); }, { min: 0, ...attrs });
  const fitMax = c.weights.employeesFit + c.weights.industryFit + c.weights.countryFit + c.weights.seniority + c.weights.businessEmail;
  const intentMax = c.weights.demoRequest + c.weights.pricingVisits + c.weights.enterpriseKeywords + c.weights.messageDetail;
  panel.append(
    callout('This is the agent\'s brain. Every SDR\'s judgment calls should end up here as a rule or a weight. Changes apply on the Route leads tab right away.'),
    h('div', { class: 'grid grid-2' },
      h('div', { class: 'card stack' },
        h('h3', null, 'ICP (fit)'),
        h('div', { class: 'grid grid-2' }, field('Min employees', n(c.icp, 'minEmployees')), field('Max employees', n(c.icp, 'maxEmployees'))),
        field('Target industries', list(c.icp, 'industries'), 'Partial matches count: "software" matches "Software & Services".'),
        field('Target countries', list(c.icp, 'countries')),
        field('Senior title words', list(c.icp, 'seniorTitles')),
      ),
      h('div', { class: 'card stack' },
        h('h3', null, 'Signals and disqualifiers'),
        field('Enterprise intent keywords', list(c.icp, 'enterpriseKeywords')),
        field('Disqualify keywords', list(c.icp, 'disqualifyKeywords')),
        field('Competitor domains', list(c.icp, 'competitorDomains')),
        field('Personal email domains', list(c.icp, 'freeEmailDomains')),
      ),
      h('div', { class: 'card stack' },
        h('h3', null, 'Weights'),
        h('div', { class: 'grid grid-2' },
          field('Company size fit', n(c.weights, 'employeesFit')),
          field('Industry fit', n(c.weights, 'industryFit')),
          field('Country fit', n(c.weights, 'countryFit')),
          field('Senior title', n(c.weights, 'seniority')),
          field('Business email', n(c.weights, 'businessEmail')),
          field('Demo requested', n(c.weights, 'demoRequest')),
          field('Pricing views (at 3+)', n(c.weights, 'pricingVisits')),
          field('Enterprise keywords', n(c.weights, 'enterpriseKeywords')),
          field('Specific message', n(c.weights, 'messageDetail')),
        ),
        h('small', { class: 'muted' }, `Max fit ${fitMax}, max intent ${intentMax}, total ${fitMax + intentMax}. Reload the tab to refresh these totals.`),
      ),
      h('div', { class: 'card stack' },
        h('h3', null, 'Routing thresholds'),
        field('AE fast-track at or above', n(c.thresholds, 'ae')),
        field('SDR QA at or above', n(c.thresholds, 'qa'), 'Below this goes to nurture.'),
        field('Gray band (points)', n(c.thresholds, 'grayBand'), 'Leads this close to a threshold go to a human.'),
        field('Intent floor', n(c.thresholds, 'minIntent'), 'Below this, even a perfect fit goes to nurture.'),
        h('div', { class: 'row' },
          button('Restore default rules', async () => { if (await ask('Replace your rules with the defaults?', { confirmLabel: 'Restore defaults' })) { ctx.state.config = clone(DEFAULT_CONFIG); ctx.save(); ctx.rerender(); } }, 'sm'),
          button('Download config.json', () => download('lead-agent.config.json', JSON.stringify(c, null, 2), 'application/json'), 'sm'),
        ),
      ),
    ),
  );
}

function renderPrompt(panel, ctx) {
  const s = ctx.state;
  const pre = h('pre', { class: 'output' });
  const draw = () => (pre.textContent = buildAgentPrompt(s.config, { company: s.company || undefined, product: s.product || undefined }));
  const snippet = `// Node: same rules, no model call. Run it in a webhook handler.
import { scoreLead } from './assets/js/lib/leadAgent.js';
import config from './lead-agent.config.json' with { type: 'json' };

export async function onInboundLead(lead) {
  const r = scoreLead(lead, config);
  if (r.route === 'ae_fast_track') await crm.assignToAE(lead, r.reasons);
  else if (r.route === 'sdr_qa') await slack.post('#inbound-qa', r);   // 1 SDR reviews these
  else if (r.route === 'nurture') await marketing.addToNurture(lead);
  // disqualify: log and stop
  return r;
}

// Gray-zone leads can also go to an LLM with the system prompt above,
// asking for JSON that matches the schema. Keep the human QA step either way.`;
  panel.append(
    callout('Paste this into the system prompt of whatever model or agent framework you use. It is generated from the same rules, so the model and the code agree.'),
    h('div', { class: 'grid grid-2 mb' },
      field('Company name', textInput(s.company, (v) => { s.company = v; ctx.save(); draw(); }, { placeholder: 'Acme Cloud' })),
      field('What you sell', textInput(s.product, (v) => { s.product = v; ctx.save(); draw(); }, { placeholder: 'a frontend cloud platform' })),
    ),
    h('div', { class: 'row mb' }, button('Copy prompt', () => copyText(pre.textContent, 'Prompt copied'), 'primary sm'), button('Copy JSON schema', () => copyText(JSON.stringify(OUTPUT_SCHEMA, null, 2)), 'sm')),
    pre,
    h('h3', { class: 'mt' }, 'Wiring it up'),
    h('p', { class: 'small muted' }, 'The CLI runs the same rules: node bin/qualify-leads.js leads.csv --config lead-agent.config.json'),
    h('pre', { class: 'output' }, snippet),
  );
  draw();
}

function renderCapacity(panel, ctx) {
  const c = ctx.state.capacity;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const r = sdrCapacity(c);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-3' },
        stat('SDRs needed before', num(r.sdrsBefore, 1), `${num(r.hoursBefore)} hours/month of manual qualification`),
        stat('SDRs needed after', num(r.sdrsNeededAfter), `${num(r.hoursAfter)} hours/month of QA`),
        stat('SDRs freed for outbound', num(r.sdrsFreed), 'model their pipeline in the Agent Economics tool'),
      ),
      h('div', { class: 'card' },
        h('h3', null, 'Qualification hours per month'),
        hbars([
          { label: 'Before: every lead by hand', value: r.hoursBefore, display: `${num(r.hoursBefore)} h`, tone: 'alt' },
          { label: 'After: agent + QA queue', value: r.hoursAfter, display: `${num(r.hoursAfter)} h` },
        ]),
      ),
      h('p', null, h('a', { href: 'agent-roi.html' }, 'Open the Agent Economics Model →'), ' to price the compute and the redeployed pipeline.'),
    );
  };
  const upd = (k) => (v) => { c[k] = v; ctx.save(); draw(); };
  panel.append(
    h('div', { class: 'card stack' },
      h('div', { class: 'grid grid-3' },
        field('Inbound leads per month', numberInput(c.leadsPerMonth, upd('leadsPerMonth'), { min: 0 })),
        field('Minutes per lead, by hand', numberInput(c.minutesPerManualLead, upd('minutesPerManualLead'), { min: 0 }), 'Research, enrichment, first reply, CRM notes.'),
        field('Productive SDR hours / month', numberInput(c.productiveHoursPerSdrMonth, upd('productiveHoursPerSdrMonth'), { min: 1 })),
        field('Share routed to QA (%)', percentInput(c.qaShare, upd('qaShare'), { min: 0, max: 100 }), 'Use the button on the Route leads tab to pull this from a real batch.'),
        field('Minutes per QA review', numberInput(c.minutesPerQaLead, upd('minutesPerQaLead'), { min: 0 })),
      ),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}
