import { mountTool } from '../core/shell.js';
import { h, field, textInput, textArea, numberInput, percentInput, dateInput, select, checkbox, button, stat, pill, callout, table, replaceChildren, tabs, hbars, copyText, download, pickFile, uid, toast, ask } from '../core/dom.js';
import { money, pct, num, todayISO, toBool, toNumber } from '../core/format.js';
import { parseCSVObjects, toCSV } from '../core/csv.js';
import { OUTCOMES, LOSS_REASONS, EVIDENCE, DEFAULT_DEALBOT_RULES, winRates, lostbotSummary, dealbotAlerts, battlecardMarkdown, simulationPrompt } from '../lib/winloss.js';

const daysAgo = (n) => todayISO(new Date(Date.now() - n * 86400000));
const blankCard = () => ({ competitor: '', updatedOn: todayISO(), theirPitch: '', whereTheyWin: '', whereWeWin: '', landmines: '', objections: '', proof: '' });
const blankDeal = () => ({ id: uid('deal'), name: '', competitor: '', outcome: 'open', amount: 0, openedOn: todayISO(), loggedReason: '', narrativeUsed: false, owner: '', evidence: {} });

const defaults = {
  target: 0.75,
  deals: [],
  rules: { ...DEFAULT_DEALBOT_RULES },
  cards: [blankCard()],
  persona: 'VP Engineering at a 1,000-person company',
};

// Illustrative: a team that rolled out an AI-assisted narrative and tracked it.
function d(name, competitor, outcome, amount, reason, narrativeUsed, ev, opened) {
  const flags = Object.fromEntries(EVIDENCE.map((e) => [e.id, ev.includes(e.short)]));
  return { id: uid('deal'), name, competitor, outcome, amount, openedOn: daysAgo(opened), loggedReason: reason, narrativeUsed, owner: '', evidence: flags };
}
const ALL = 'EB ROI Champ Tech MAP';
const example = {
  target: 0.75,
  rules: { ...DEFAULT_DEALBOT_RULES },
  persona: 'VP Engineering at a 1,000-person fintech',
  deals: [
    d('Ledgerline', 'Northwind', 'won', 120000, '', true, ALL, 120),
    d('Brightpath Health', 'Northwind', 'won', 85000, '', true, ALL, 110),
    d('Kestrel Retail', 'Contoso', 'won', 60000, '', true, 'EB ROI Champ Tech', 105),
    d('Orbit Media', 'Northwind', 'won', 45000, '', true, ALL, 100),
    d('Pinecrest Bank', 'Contoso', 'won', 210000, '', true, ALL, 98),
    d('Atlas Freight', 'Northwind', 'lost', 90000, 'Price', true, 'Champ Tech', 95),
    d('Summit Labs', 'Contoso', 'won', 52000, '', true, 'EB ROI Champ Tech', 92),
    d('Harbor Insurance', 'Northwind', 'won', 140000, '', true, ALL, 90),
    d('Vela Commerce', 'Contoso', 'lost', 75000, 'Missing feature', true, 'EB ROI Champ MAP', 88),
    d('Quarry Systems', 'Northwind', 'won', 66000, '', true, ALL, 85),
    d('Nimbus Travel', 'Contoso', 'won', 48000, '', true, 'EB ROI Champ Tech', 80),
    d('Granite Payroll', 'Northwind', 'lost', 110000, 'Price', true, 'Tech MAP', 78),
    d('Copperline', 'Northwind', 'lost', 70000, 'Price', false, 'Champ Tech', 160),
    d('Riverstone', 'Contoso', 'won', 40000, '', false, ALL, 150),
    d('Delta Learning', 'Northwind', 'lost', 55000, 'No decision', false, 'Tech', 145),
    d('Maple Logistics', 'Contoso', 'lost', 95000, 'Lost to competitor', false, 'EB Champ', 140),
    d('Fernwood', 'Northwind', 'won', 38000, '', false, ALL, 135),
    d('Sable Energy', 'Northwind', 'open', 180000, '', true, 'Champ Tech', 34),
    d('Lumen Health', 'Contoso', 'open', 95000, '', true, 'EB Champ', 50),
    d('Tidewater Bank', 'Northwind', 'open', 260000, '', true, 'EB ROI Champ', 18),
    d('Polar Apps', '', 'open', 30000, '', false, '', 25),
  ],
  cards: [
    {
      competitor: 'Northwind',
      updatedOn: todayISO(),
      theirPitch: 'The all-in-one platform. One vendor, one contract, cheaper per seat.',
      whereTheyWin: 'Buyers who want one vendor for everything\nPrice-led procurement with no technical evaluation\nSmall teams with simple workflows',
      whereWeWin: 'Teams with real scale or compliance needs (SOC 2, SSO, audit logs)\nTechnical evaluations: our setup takes a day, theirs takes a quarter\nBuyers who have been burned by a failed rollout before',
      landmines: 'How long did your last platform migration take, and who owned the risk?\nWhat happens to your launch date if the rollout slips 2 months?\nWho signs off on security, and what do they need to see?',
      objections: 'Northwind is cheaper => Per seat, yes. Add the 3 tools you still need and the migration services and we are lower in year 1. Here is the model.\nWe already use Northwind for X => Keep it. We integrate with it in 20 minutes; you don\'t have to rip anything out.\nYou are the smaller vendor => 2 of the 5 largest fintechs run on us. Here is their reference contact.',
      proof: 'Ledgerline cut rollout from 14 weeks to 9 days\nPinecrest Bank passed security review in 2 weeks\n75% head-to-head win rate since the new narrative',
    },
  ],
};

function markdown(state) {
  const w = winRates(state.deals);
  const l = lostbotSummary(state.deals);
  const alerts = dealbotAlerts(state.deals, todayISO(), state.rules);
  return [
    '# Competitive win room',
    '',
    `- Head-to-head win rate: **${pct(w.h2h)}** (${w.h2hWon}/${w.h2hTotal}) vs. target ${pct(state.target, 0)}`,
    `- With new narrative: ${pct(w.withNarrative.rate)} (${w.withNarrative.won}/${w.withNarrative.total}); without: ${pct(w.withoutNarrative.rate)} (${w.withoutNarrative.won}/${w.withoutNarrative.total})`,
    '',
    '## By competitor',
    ...w.competitors.map((c) => `- ${c.competitor}: ${pct(c.rate)} (${c.won}/${c.total})`),
    '',
    `## Lostbot: ${l.mismatches} of ${l.lost} losses have a logged reason the evidence doesn't support`,
    ...l.audits.map((a) => `- **${a.deal.name}** (logged: ${a.deal.loggedReason || '-'}): ${a.finding}`),
    '',
    `## Dealbot: ${alerts.length} open alerts`,
    ...alerts.map((a) => `- ${a.message} Next: ${a.nextStep}`),
    '',
    ...state.cards.map(battlecardMarkdown),
  ].join('\n');
}

mountTool('win-room', {
  defaults,
  example,
  markdown,
  render(app, ctx) {
    tabs(
      app,
      [
        { id: 'deals', label: '1. Deals & win rate', render: (p) => renderDeals(p, ctx) },
        { id: 'lostbot', label: '2. Lostbot audit', render: (p) => renderLostbot(p, ctx) },
        { id: 'dealbot', label: '3. Dealbot alerts', render: (p) => renderDealbot(p, ctx) },
        { id: 'cards', label: '4. Battlecards', render: (p) => renderCards(p, ctx) },
      ],
      'win-room',
    );
  },
});

const DEAL_CSV_COLS = ['name', 'competitor', 'outcome', 'amount', 'opened_on', 'logged_reason', 'narrative_used', 'owner', ...EVIDENCE.map((e) => e.id)];

function dealsToCSV(deals) {
  return toCSV(
    deals.map((x) => ({ ...x, opened_on: x.openedOn, logged_reason: x.loggedReason, narrative_used: x.narrativeUsed ? 'yes' : 'no', ...Object.fromEntries(EVIDENCE.map((e) => [e.id, x.evidence[e.id] ? 'yes' : 'no'])) })),
    DEAL_CSV_COLS,
  );
}

function dealsFromCSV(text) {
  return parseCSVObjects(text).map((r) => ({
    id: uid('deal'),
    name: r.name || r.deal || r.account || '',
    competitor: r.competitor || '',
    outcome: OUTCOMES.includes((r.outcome || '').toLowerCase()) ? r.outcome.toLowerCase() : 'open',
    amount: toNumber(r.amount),
    openedOn: r.opened_on || r.created || todayISO(),
    loggedReason: r.logged_reason || r.loss_reason || '',
    narrativeUsed: toBool(r.narrative_used),
    owner: r.owner || '',
    evidence: Object.fromEntries(EVIDENCE.map((e) => [e.id, toBool(r[e.id.toLowerCase()] ?? r[e.id])])),
  }));
}

function renderDeals(panel, ctx) {
  const s = ctx.state;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const w = winRates(s.deals);
    const gap = w.h2h == null ? null : w.h2h - s.target;
    replaceChildren(
      out,
      h('div', { class: 'grid grid-4' },
        stat('Head-to-head win rate', pct(w.h2h), `${w.h2hWon} of ${w.h2hTotal} closed vs. a named competitor`),
        stat('vs. target', gap == null ? '-' : `${gap >= 0 ? '+' : ''}${(gap * 100).toFixed(1)} pts`, `target ${pct(s.target, 0)}`),
        stat('With new narrative', pct(w.withNarrative.rate), `${w.withNarrative.won}/${w.withNarrative.total} deals`),
        stat('Without', pct(w.withoutNarrative.rate), `${w.withoutNarrative.won}/${w.withoutNarrative.total} deals`),
      ),
      w.competitors.length
        ? h('div', { class: 'card' }, h('h3', null, 'Head-to-head win rate by competitor'), hbars(w.competitors.map((c) => ({ label: c.competitor, value: c.rate || 0, display: `${pct(c.rate)} (${c.won}/${c.total})` })), { max: 1 }))
        : null,
    );
  };

  const log = h('div');
  const drawLog = () => {
    replaceChildren(
      log,
      table(
        [
          { label: 'Deal', render: (x) => textInput(x.name, (v) => { x.name = v; ctx.save(); }, { style: { minWidth: '130px' } }) },
          { label: 'Competitor', render: (x) => textInput(x.competitor, (v) => { x.competitor = v; ctx.save(); draw(); }, { style: { minWidth: '100px' }, placeholder: 'none' }) },
          { label: 'Outcome', render: (x) => select(OUTCOMES, x.outcome, (v) => { x.outcome = v; ctx.save(); draw(); }) },
          { label: 'Amount', render: (x) => numberInput(x.amount, (v) => { x.amount = v; ctx.save(); }, { style: { minWidth: '90px' } }) },
          { label: 'Opened', render: (x) => dateInput(x.openedOn, (v) => { x.openedOn = v; ctx.save(); }) },
          { label: 'Logged loss reason', render: (x) => select(['', ...LOSS_REASONS], x.loggedReason, (v) => { x.loggedReason = v; ctx.save(); }) },
          { label: 'Narrative', render: (x) => checkbox(x.narrativeUsed, (v) => { x.narrativeUsed = v; ctx.save(); draw(); }, null, { 'aria-label': 'New narrative used' }) },
          ...EVIDENCE.map((e) => ({ label: e.short, render: (x) => checkbox(!!x.evidence[e.id], (v) => { x.evidence[e.id] = v; ctx.save(); }, null, { title: e.label, 'aria-label': e.label }) })),
          { label: '', render: (_, i) => button('×', () => { s.deals.splice(i, 1); ctx.save(); drawLog(); draw(); }, 'ghost sm danger', { 'aria-label': 'Remove deal' }) },
        ],
        s.deals,
        { empty: 'No deals yet. Add one, import a CSV, or load the example.' },
      ),
    );
  };

  panel.append(
    h('div', { class: 'row mb' },
      field('Target head-to-head win rate (%)', percentInput(s.target, (v) => { s.target = v; ctx.save(); draw(); }, { min: 0, max: 100, style: { maxWidth: '120px' } })),
    ),
    out,
    h('div', { class: 'section-title' },
      h('h3', { class: 'mt-0' }, 'Deal log'),
      h('div', { class: 'row' },
        button('+ Add deal', () => { s.deals.unshift(blankDeal()); ctx.save(); drawLog(); }, 'sm primary'),
        button('Import CSV', async () => {
          const f = await pickFile('.csv');
          if (!f) return;
          const rows = dealsFromCSV(f.text);
          s.deals.push(...rows);
          ctx.save(); drawLog(); draw();
          toast(`Imported ${rows.length} deals`);
        }, 'sm'),
        button('Export CSV', () => download('deals.csv', dealsToCSV(s.deals), 'text/csv'), 'sm'),
      ),
    ),
    h('p', { class: 'small muted' }, `Evidence columns: ${EVIDENCE.map((e) => `${e.short} = ${e.label}`).join(' · ')}. Pull these from CRM fields or call transcripts, not from memory.`),
    log,
  );
  draw();
  drawLog();
}

function renderLostbot(panel, ctx) {
  const l = lostbotSummary(ctx.state.deals);
  if (!l.lost) return panel.append(h('p', { class: 'muted' }, 'No lost deals in the log yet.'));
  panel.append(
    callout(`${l.mismatches} of ${l.lost} lost deals have a logged reason the evidence doesn't back up. Fix the process gap, not the price.`, l.mismatches ? 'warn' : 'good'),
    h('div', { class: 'grid grid-2' },
      h('div', { class: 'card' }, h('h3', null, 'What sellers logged'), hbars(l.logged.map((x) => ({ label: x.reason, value: x.count, display: num(x.count), tone: 'alt' })))),
      h('div', { class: 'card' }, h('h3', null, 'What the evidence shows was missing'), hbars(l.drivers.map((x) => ({ label: x.driver, value: x.count, display: num(x.count) })))),
    ),
    h('h3', { class: 'mt' }, 'Deal-by-deal audit'),
    table(
      [
        { label: 'Deal', render: (a) => h('div', null, h('strong', null, a.deal.name), h('div', { class: 'small muted' }, `${a.deal.competitor || 'no competitor'} · ${money(a.deal.amount)}`)) },
        { label: 'Logged', render: (a) => a.deal.loggedReason || h('span', { class: 'muted' }, 'none') },
        { label: 'Lostbot finding', render: (a) => h('div', null, a.mismatch ? pill('Mismatch', 'warn') : pill('Consistent', 'good'), h('div', { class: 'small', style: { marginTop: '4px' } }, a.finding)) },
        { label: 'Gaps', render: (a) => h('div', { class: 'row' }, a.gaps.map((g) => pill(g.short, 'bad'))) },
      ],
      l.audits,
    ),
  );
}

function renderDealbot(panel, ctx) {
  const s = ctx.state;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const alerts = dealbotAlerts(s.deals, todayISO(), s.rules);
    replaceChildren(
      out,
      h('div', { class: 'row' },
        h('strong', null, `${alerts.length} alert${alerts.length === 1 ? '' : 's'} on ${s.deals.filter((x) => x.outcome === 'open').length} open deals`),
        h('div', { style: { flex: 1 } }),
        alerts.length ? button('Copy all as Slack messages', () => copyText(alerts.map((a) => a.slack).join('\n'), 'Slack messages copied'), 'sm primary') : null,
      ),
      table(
        [
          { label: 'Severity', render: (a) => pill(a.severity === 'critical' ? '● Critical' : '▲ Warning', a.severity === 'critical' ? 'bad' : 'warn') },
          { label: 'Alert', render: (a) => h('div', null, h('div', null, a.message), h('div', { class: 'small muted' }, `Next step: ${a.nextStep}`)) },
          { label: '', render: (a) => button('Copy', () => copyText(a.slack), 'sm') },
        ],
        alerts,
        { empty: 'No alerts. Every open deal is on track against your rules.' },
      ),
    );
  };
  panel.append(
    callout('Rules from the brief: "You are 30 days into this cycle and have not engaged an economic buyer." Set the day limit for each step. Messages are formatted for a Slack deal channel.'),
    h('div', { class: 'card' },
      h('h3', null, 'Alert when a deal is this many days old without...'),
      h('div', { class: 'grid grid-3' }, EVIDENCE.map((e) => field(e.label, numberInput(s.rules[e.id], (v) => { s.rules[e.id] = v; ctx.save(); draw(); }, { min: 0 })))),
      h('p', { class: 'small muted mt' }, 'Optional: put a Slack member ID in the deal\'s owner field (via CSV) to @mention the rep.'),
    ),
    h('div', { class: 'mt' }, out),
  );
  draw();
}

function renderCards(panel, ctx) {
  const s = ctx.state;
  panel.append(
    h('div', { class: 'row mb' },
      button('+ New battlecard', () => { s.cards.push(blankCard()); ctx.save(); ctx.rerender(); }, 'sm primary'),
      field('Simulated buyer persona', textInput(s.persona, (v) => { s.persona = v; ctx.save(); }), null),
    ),
  );
  s.cards.forEach((card, i) => {
    const set = (k) => (v) => { card[k] = v; card.updatedOn = todayISO(); ctx.save(); };
    panel.append(
      h('div', { class: 'card stack mb' },
        h('div', { class: 'row', style: { justifyContent: 'space-between' } },
          h('h3', { class: 'mt-0' }, `vs. ${card.competitor || 'new competitor'}`),
          h('div', { class: 'row' },
            button('Copy Markdown', () => copyText(battlecardMarkdown(card)), 'sm'),
            button('Copy buyer simulation prompt', () => copyText(simulationPrompt(card, s.persona), 'Prompt copied. Paste it into any LLM.'), 'sm'),
            button('Delete', async () => { if (await ask(`Delete the battlecard for ${card.competitor || 'this competitor'}?`, { confirmLabel: 'Delete', danger: true })) { s.cards.splice(i, 1); ctx.save(); ctx.rerender(); } }, 'ghost sm danger'),
          ),
        ),
        h('div', { class: 'grid grid-2' },
          field('Competitor', textInput(card.competitor, set('competitor'))),
          field('Their pitch (in their words)', textInput(card.theirPitch, set('theirPitch'))),
          field('Where they win (one per line)', textArea(card.whereTheyWin, set('whereTheyWin'))),
          field('Where we win (one per line)', textArea(card.whereWeWin, set('whereWeWin'))),
          field('Landmines: questions to plant early', textArea(card.landmines, set('landmines')), 'Questions that expose their weak spot without naming them.'),
          field('Objections (objection => response)', textArea(card.objections, set('objections')), 'One per line, e.g. "They\'re cheaper => ..."'),
          field('Proof points (one per line)', textArea(card.proof, set('proof'))),
        ),
      ),
    );
  });
}
