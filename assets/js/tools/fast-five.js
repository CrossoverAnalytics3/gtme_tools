import { mountTool } from '../core/shell.js';
import { h, field, textInput, textArea, numberInput, percentInput, dateInput, select, button, stat, pill, callout, table, replaceChildren, tabs, copyText, hbars } from '../core/dom.js';
import { pct } from '../core/format.js';
import { detectionProbability, interviewsNeeded, detectionTable, buildGuide, HELD, synthesize, readoutMarkdown } from '../lib/fastFive.js';

const blankInterview = (n) => ({ participant: `Participant ${n}`, segment: '', date: '', notes: '', quotes: '', tags: '', held: '' });

const defaults = {
  setup: { title: '', signal: '', hypothesis: '', audience: '', decision: '', owner: '', due: '' },
  interviews: [1, 2, 3, 4, 5].map(blankInterview),
  calc: { prevalence: 0.5, n: 5, confidence: 0.95 },
};

const example = {
  setup: {
    title: 'Why new teams stall in week 2',
    signal: 'Week-2 retention for new teams dropped from 41% to 33% since the new onboarding shipped 6 weeks ago.',
    hypothesis: 'New teams skip the template picker, land on a blank project, and never reach a first "aha".',
    audience: 'Team leads who created a workspace in the last 60 days',
    decision: 'Whether to bring back the guided template step or invest in an AI project starter',
    owner: 'PMM, onboarding',
    due: '',
  },
  interviews: [
    { participant: 'Maya (ops lead)', segment: 'Churned in week 2', date: '', held: 'yes', tags: 'blank project, no time to set up, invited team too early', notes: 'Created workspace during a planning week. Skipped templates because "I didn\'t know which one fit." Invited 8 people to an empty project. Team asked what they were supposed to do. Went back to spreadsheets.', quotes: 'I invited everyone into an empty room.\nI didn\'t know which template was mine.' },
    { participant: 'Jon (eng manager)', segment: 'Active', date: '', held: 'partly', tags: 'imported from spreadsheet, blank project', notes: 'Hit a blank project but imported a CSV from a spreadsheet, which saved him. Found the import by accident in settings.', quotes: 'The import is the only reason we stayed.' },
    { participant: 'Priya (marketing lead)', segment: 'Churned in week 2', date: '', held: 'yes', tags: 'blank project, no time to set up, wanted an example', notes: 'Wanted to see a finished example project. Said a blank board felt like homework.', quotes: 'A blank board feels like homework.' },
    { participant: 'Sam (agency founder)', segment: 'Low activity', date: '', held: 'yes', tags: 'invited team too early, blank project, pricing confusion', notes: 'Team showed up before structure existed. Also unsure if guests count as seats.', quotes: 'My team logged in once, saw nothing, and never came back.' },
    { participant: 'Lee (product manager)', segment: 'Active', date: '', held: 'no', tags: 'used template, wanted an example', notes: 'Picked a template right away because she\'d used the product at a past job. Never saw a blank project.', quotes: 'I already knew which template I wanted.' },
  ],
  calc: { prevalence: 0.5, n: 5, confidence: 0.95 },
};

mountTool('fast-five', {
  defaults,
  example,
  markdown: readoutMarkdown,
  render(app, ctx) {
    tabs(
      app,
      [
        { id: 'setup', label: '1. Signal & guide', render: (p) => renderSetup(p, ctx) },
        { id: 'interviews', label: '2. Interviews', render: (p) => renderInterviews(p, ctx) },
        { id: 'synthesis', label: '3. Synthesis', render: (p) => renderSynthesis(p, ctx) },
        { id: 'math', label: 'The math', render: (p) => renderMath(p, ctx) },
      ],
      'fast-five',
    );
  },
});

function guideText(guide) {
  return guide.map((b) => `${b.block} (${b.minutes} min)\n${b.prompts.map((p) => `- ${p}`).join('\n')}`).join('\n\n');
}

function renderSetup(panel, ctx) {
  const s = ctx.state.setup;
  const guideBox = h('div', { class: 'stack' });
  const drawGuide = () => {
    const g = buildGuide(s);
    const total = g.reduce((a, b) => a + b.minutes, 0);
    replaceChildren(
      guideBox,
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h3', { class: 'mt-0' }, `Interview guide (${total} min, unscripted)`), button('Copy guide', () => copyText(guideText(g)), 'sm primary')),
      g.map((b) => h('div', { class: 'card flat' }, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('strong', null, b.block), pill(`${b.minutes} min`)), h('ul', { class: 'list-tight small mt' }, b.prompts.map((p) => h('li', null, p))))),
    );
  };
  const set = (k) => (v) => { s[k] = v; ctx.save(); drawGuide(); };
  panel.append(
    callout('Fast Five starts from a number, not a hunch. Name the signal, write the hypothesis you\'d bet on, then go talk to 5 people this week.'),
    h('div', { class: 'grid grid-2' },
      h('div', { class: 'card stack' },
        field('Study name', textInput(s.title, set('title'), { placeholder: 'Why new teams stall in week 2' })),
        field('The quantitative signal', textArea(s.signal, set('signal'), { placeholder: 'Metric, before → after, when it changed.' })),
        field('Hypothesis', textArea(s.hypothesis, set('hypothesis'), { placeholder: 'An educated guess you can be wrong about.' }), 'Be specific. "Users are confused" is not a hypothesis.'),
        field('Who to interview', textInput(s.audience, set('audience'), { placeholder: 'Team leads who signed up in the last 60 days' })),
        field('Decision this informs', textInput(s.decision, set('decision'))),
        h('div', { class: 'grid grid-2' }, field('Owner', textInput(s.owner, set('owner'))), field('Readout due', dateInput(s.due, set('due')))),
      ),
      h('div', { class: 'card' }, guideBox),
    ),
  );
  drawGuide();
}

function renderInterviews(panel, ctx) {
  const ivs = ctx.state.interviews;
  panel.append(
    callout('Tag each interview with short, reusable labels (comma-separated). Use the same words across interviews so synthesis can count them.'),
    h('div', { class: 'grid grid-2' },
      ivs.map((iv, i) => {
        const set = (k) => (v) => { iv[k] = v; ctx.save(); };
        return h('div', { class: 'card stack' },
          h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h3', { class: 'mt-0' }, `Interview ${i + 1}`), select(HELD, iv.held, set('held'), { style: { width: 'auto' }, 'aria-label': 'Did the hypothesis hold?' })),
          h('div', { class: 'grid grid-3' },
            field('Participant', textInput(iv.participant, set('participant'))),
            field('Segment', textInput(iv.segment, set('segment'), { placeholder: 'Churned, active...' })),
            field('Date', dateInput(iv.date, set('date'))),
          ),
          field('Notes', textArea(iv.notes, set('notes'), { rows: 4 })),
          field('Quotes (one per line)', textArea(iv.quotes, set('quotes'), { rows: 2 })),
          field('Tags', textInput(iv.tags, set('tags'), { placeholder: 'blank project, no time to set up' })),
        );
      }),
    ),
  );
}

function renderSynthesis(panel, ctx) {
  const syn = synthesize(ctx.state.interviews);
  if (!syn.completed) return panel.append(h('p', { class: 'muted' }, 'No interview notes yet. Fill in the Interviews tab or load the example.'));
  const tone = { Supported: 'good', Mixed: 'warn', 'Not supported': 'bad' }[syn.hypothesis] || 'warn';
  panel.append(
    h('div', { class: 'grid grid-4' },
      stat('Interviews done', `${syn.completed} / 5`),
      stat('Hypothesis', syn.hypothesis, `held ${syn.tally.yes} · partly ${syn.tally.partly} · no ${syn.tally.no}`),
      stat('Patterns (3+)', String(syn.patterns.length)),
      stat('Quotes captured', String(syn.quotes.length)),
    ),
    callout(h('span', null, h('strong', null, 'Hypothesis: '), ctx.state.setup.hypothesis || '(not set)', ' → ', pill(syn.hypothesis, tone))),
    h('div', { class: 'card' },
      h('h3', null, 'How many interviews raised each theme'),
      hbars(syn.tags.map((t) => ({ label: t.tag, value: t.count, display: `${t.count}/5 · ${t.label}`, tone: t.count >= 3 ? '' : 'alt', tip: t.who.join(', ') })), { max: 5 }),
    ),
    table(
      [
        { label: 'Theme', render: (t) => h('strong', null, t.tag) },
        { label: 'Count', num: true, render: (t) => `${t.count}/5` },
        { label: 'Strength', render: (t) => pill(t.label, t.count >= 3 ? 'good' : t.count === 2 ? 'warn' : '') },
        { label: 'Who', render: (t) => t.who.join(', ') },
      ],
      syn.tags,
    ),
    syn.quotes.length
      ? h('div', { class: 'card mt' }, h('h3', null, 'In their words'), syn.quotes.map((q) => h('blockquote', { style: { margin: '0 0 10px', paddingLeft: '12px', borderLeft: '3px solid var(--line-2)' } }, `"${q.quote}"`, h('div', { class: 'small muted' }, `${q.who}${q.segment ? ` · ${q.segment}` : ''}`))))
      : null,
  );
}

function renderMath(panel, ctx) {
  const c = ctx.state.calc;
  const out = h('div', { class: 'stack' });
  const draw = () => {
    const prob = detectionProbability(c.prevalence, c.n);
    const need = interviewsNeeded(c.prevalence, c.confidence);
    replaceChildren(
      out,
      h('div', { class: 'grid grid-2' },
        stat(`Chance it shows up in ${c.n} interviews`, pct(prob, 1), `for a problem ${pct(c.prevalence, 0)} of users have`),
        stat(`Interviews for ${pct(c.confidence, 0)} confidence`, need == null ? '-' : String(need), `at ${pct(c.prevalence, 0)} prevalence`),
      ),
    );
  };
  const upd = (k) => (v) => { c[k] = v; ctx.save(); draw(); };
  const tbl = detectionTable();
  panel.append(
    callout(h('span', null, h('strong', null, 'Where 97% comes from. '), 'If half your users share a problem, the chance that at least one of 5 random interviews surfaces it is 1 − 0.5⁵ = 96.9%. Five interviews reliably find the big, common problems. They don\'t tell you exactly how common a problem is, and rare problems need more conversations.')),
    h('div', { class: 'card' },
      h('div', { class: 'grid grid-3' },
        field('Share of users with the problem (%)', percentInput(c.prevalence, upd('prevalence'), { min: 1, max: 99 })),
        field('Interviews', numberInput(c.n, upd('n'), { min: 1, step: 1 })),
        field('Target confidence (%)', percentInput(c.confidence, upd('confidence'), { min: 50, max: 99.9 })),
      ),
    ),
    h('div', { class: 'mt' }, out),
    h('h3', { class: 'mt' }, 'Chance of hearing a problem at least once'),
    h('div', { class: 'table-wrap' },
      h('table', { class: 'heat' },
        h('thead', null, h('tr', null, h('th', null, 'Problem affects'), tbl[0].cells.map((x) => h('th', { class: 'num' }, `${x.n} interview${x.n > 1 ? 's' : ''}`)))),
        h('tbody', null,
          tbl.map((r) =>
            h('tr', null,
              h('td', null, h('strong', null, `${pct(r.prevalence, 0)} of users`)),
              r.cells.map((x) => h('td', { class: 'cell', style: { background: `color-mix(in srgb, var(--accent) ${Math.round(x.prob * 45)}%, transparent)` } }, pct(x.prob, x.prob > 0.99 ? 1 : 0))),
            ),
          ),
        ),
      ),
    ),
  );
  draw();
}
