import { mountTool } from '../core/shell.js';
import { h, field, numberInput, percentInput, stat, callout, table, replaceChildren, tabs, hbars } from '../core/dom.js';
import { money, num, compact } from '../core/format.js';
import { inboundCost, redeployment, sensitivity, businessCaseMarkdown } from '../lib/agentEconomics.js';

const defaults = {
  before: { sdrs: 5, sdrLoadedCost: 90000 },
  agent: { leadsPerMonth: 1000, callsPerLead: 2, inputTokensPerCall: 3000, outputTokensPerCall: 400, priceInPerM: 3, priceOutPerM: 15, enrichmentPerLead: 0, infraMonthly: 0 },
  after: { qaSdrs: 1, gtmeAnnualCost: 200000, gtmeShareOnAgent: 0.2, buildWeeks: 6 },
  redeploy: { redeployedSdrs: 4, meetingsPerSdrMonth: 10, meetingToOpp: 0.5, winRate: 0.2, acv: 25000, rampMonths: 3 },
};

// Vercel-style example: 3,000 inbound leads/month, 10 SDRs → 1 QA SDR + agent.
const example = {
  before: { sdrs: 10, sdrLoadedCost: 95000 },
  agent: { leadsPerMonth: 3000, callsPerLead: 2, inputTokensPerCall: 3000, outputTokensPerCall: 400, priceInPerM: 3, priceOutPerM: 15, enrichmentPerLead: 0, infraMonthly: 0 },
  after: { qaSdrs: 1, gtmeAnnualCost: 220000, gtmeShareOnAgent: 0.25, buildWeeks: 6 },
  redeploy: { redeployedSdrs: 9, meetingsPerSdrMonth: 12, meetingToOpp: 0.5, winRate: 0.22, acv: 30000, rampMonths: 3 },
};

mountTool('agent-roi', {
  defaults,
  example,
  markdown: businessCaseMarkdown,
  render(app, ctx) {
    tabs(
      app,
      [
        { id: 'cost', label: '1. Cost model', render: (p) => renderCost(p, ctx) },
        { id: 'redeploy', label: '2. Redeployment upside', render: (p) => renderRedeploy(p, ctx) },
        { id: 'sensitivity', label: '3. Token sensitivity', render: (p) => renderSensitivity(p, ctx) },
      ],
      'agent-roi',
    );
  },
});

function inputs(ctx, groups, draw) {
  return h('div', { class: 'grid grid-3' },
    groups.map(([title, obj, fields, note]) =>
      h('div', { class: 'card stack' },
        h('h3', null, title),
        note ? h('p', { class: 'small muted' }, note) : null,
        fields.map(([label, key, kind, help]) => {
          const upd = (v) => { ctx.state[obj][key] = v; ctx.save(); draw(); };
          const input = kind === 'pct' ? percentInput(ctx.state[obj][key], upd, { min: 0 }) : numberInput(ctx.state[obj][key], upd, { min: 0 });
          return field(label, input, help);
        }),
      ),
    ),
  );
}

function renderCost(panel, ctx) {
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const c = inboundCost(ctx.state);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-4' },
        stat('Compute / year', money(c.compute.annual), `${money(c.compute.perLead, 4)} per lead`),
        stat('Inbound cost before', compact(c.beforeCost, { currency: true }), `${money(c.costPerLeadBefore, 2)} per lead`),
        stat('Inbound cost after', compact(c.afterCost, { currency: true }), `${money(c.costPerLeadAfter, 2)} per lead`),
        stat('Payback on the build', c.paybackMonths == null ? 'No payback' : `${num(c.paybackMonths, 1)} mo`, `build ≈ ${money(c.buildCost)}`),
      ),
      h('div', { class: 'card' },
        h('h3', null, 'Annual cost of inbound qualification'),
        hbars([
          { label: 'Before: SDR team', value: c.beforeCost, display: money(c.beforeCost), tone: 'alt' },
          { label: 'After: QA SDR(s)', value: ctx.state.after.qaSdrs * ctx.state.before.sdrLoadedCost, display: money(ctx.state.after.qaSdrs * ctx.state.before.sdrLoadedCost) },
          { label: 'After: GTME upkeep', value: c.gtmeOngoing, display: money(c.gtmeOngoing) },
          { label: 'After: compute', value: c.compute.annual, display: money(c.compute.annual) },
        ]),
        h('p', { class: 'small muted mt' }, `Compute is ${(c.computeShareOfAfter * 100).toFixed(1)}% of the new cost. The people around the agent cost more than the agent.`),
      ),
      callout(`Annual savings on inbound: ${money(c.annualSavings)}. Most teams don't bank this as a cut. They move the SDRs to outbound (next tab).`, c.annualSavings > 0 ? 'good' : 'warn'),
    );
  };
  panel.append(
    inputs(ctx, [
      ['Before', 'before', [['SDRs on inbound', 'sdrs'], ['Loaded cost per SDR ($/yr)', 'sdrLoadedCost', 'num', 'Salary, benefits, tools, management.']]],
      ['Agent run cost', 'agent', [
        ['Inbound leads / month', 'leadsPerMonth'],
        ['Model calls per lead', 'callsPerLead', 'num', 'e.g. 1 to research, 1 to decide.'],
        ['Input tokens per call', 'inputTokensPerCall'],
        ['Output tokens per call', 'outputTokensPerCall'],
        ['Price per 1M input tokens ($)', 'priceInPerM', 'num', 'Use your provider\'s current list price.'],
        ['Price per 1M output tokens ($)', 'priceOutPerM'],
        ['Enrichment per lead ($)', 'enrichmentPerLead', 'num', 'Clearbit, Apollo, etc. 0 if bundled.'],
        ['Hosting / other ($/month)', 'infraMonthly'],
      ]],
      ['After', 'after', [
        ['QA SDRs', 'qaSdrs'],
        ['GTME loaded cost ($/yr)', 'gtmeAnnualCost'],
        ['GTME time on upkeep (%)', 'gtmeShareOnAgent', 'pct', 'Prompt tuning, rule changes, monitoring.'],
        ['Build time (weeks)', 'buildWeeks', 'num', 'Vercel\'s took 6.'],
      ]],
    ], draw),
    h('div', { class: 'mt' }, out),
  );
  draw();
}

function renderRedeploy(panel, ctx) {
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const r = redeployment(ctx.state.redeploy);
    const c = inboundCost(ctx.state);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-4' },
        stat('Outbound meetings', num(r.meetings), `${num(r.effectiveMonths, 1)} productive months`),
        stat('Opportunities', num(r.opps)),
        stat('Pipeline (yr 1)', compact(r.pipeline, { currency: true })),
        stat('Expected bookings', compact(r.bookings, { currency: true }), `vs. ${money(c.compute.annual)} compute`),
      ),
      callout('This is the slide that gets the project funded: same inbound conversion, faster response, and a new outbound team for the price of the compute.'),
    );
  };
  panel.append(
    inputs(ctx, [
      ['Redeployed SDRs', 'redeploy', [
        ['SDRs moved to outbound', 'redeployedSdrs'],
        ['Ramp (months, half speed)', 'rampMonths'],
      ]],
      ['Outbound funnel', 'redeploy', [
        ['Meetings per SDR / month', 'meetingsPerSdrMonth'],
        ['Meeting → opportunity (%)', 'meetingToOpp', 'pct'],
      ]],
      ['Deal economics', 'redeploy', [
        ['Win rate (%)', 'winRate', 'pct'],
        ['Average contract value ($)', 'acv'],
      ]],
    ], draw),
    h('div', { class: 'mt' }, out),
  );
  draw();
}

function renderSensitivity(panel, ctx) {
  const rows = sensitivity(ctx.state.agent);
  panel.append(
    callout('Prompts get longer, you add tools, you add a research step. Here is what compute does if token usage grows. If the case still holds at 10x, stop worrying about the model bill.'),
    table(
      [
        { label: 'Token usage', render: (r) => `${r.multiplier}x` },
        { label: 'Cost per lead', num: true, render: (r) => money(r.perLead, 4) },
        { label: 'Compute / year', num: true, render: (r) => money(r.annual) },
        { label: 'vs. one SDR', num: true, render: (r) => `${((r.annual / ctx.state.before.sdrLoadedCost) * 100).toFixed(1)}%` },
      ],
      rows,
    ),
    h('div', { class: 'card mt' },
      h('h3', null, 'Compute per year by token usage'),
      hbars(rows.map((r) => ({ label: `${r.multiplier}x tokens`, value: r.annual, display: money(r.annual) }))),
    ),
  );
}
