"""Writes design-system/project/components/<Name>/{README.md,preview.html}.

Run from the repo root: python3 design-system/build_components.py
Previews use window.GTMKit from components/bundle.js (a port of the app's
assets/js/core/dom.js) and the app's own stylesheet as bundle.css.
"""
import os

OUT = os.path.join(os.path.dirname(__file__), 'project', 'components')
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">'


def preview(name, group, height, body_js, tool=None):
    attr = f' data-tool="{tool}"' if tool else ''
    return f'''<!-- @dsCard group="{group}" height={height} -->
<!doctype html>
<html>
<head><meta charset="utf-8"><title>{name} preview</title>{FONTS}</head>
<body>
<div id="root"{attr} style="padding:16px;background:var(--page);"></div>
<script>
  var K = window.GTMKit, root = document.getElementById('root');
{body_js}
</script>
</body>
</html>
'''


C = {}

C['Button'] = ('Actions', 120, None, """  root.className = 'row';
  root.append(
    K.Button({ label: 'Load example', variant: 'primary' }),
    K.Button({ label: 'Export JSON' }),
    K.Button({ label: 'Print', variant: 'ghost' }),
    K.Button({ label: 'Clear page', variant: 'danger' }),
    K.Button({ label: '+ Add deal', size: 'sm', variant: 'primary' }),
    K.Button({ label: 'Copy', size: 'sm' })
  );""", """# Button

Buttons do one thing and say it with a verb: "Load example", "Export JSON", "Copy talk track".

- **Primary** (`accent` fill, `on-accent` text): at most one per toolbar or card, for the action the view is for. On a tool page it takes that tool's signal color.
- **Default** (`surface`, `line-2` border): every other action.
- **Ghost**: low-stakes actions next to a primary one (Cancel, Keep the example, Print).
- **Danger** (`bad` fill): only inside a ConfirmDialog, for the irreversible step. In a toolbar, a destructive action is a default button that opens the dialog.
- **Small** (`sm`): inside tables, cards and banners.

Consumer provides `label`, `onClick`, optional `variant` and `size`. Labels are sentence case with no trailing punctuation. Never put two primary buttons side by side.
""")

C['Field'] = ('Inputs', 230, None, """  root.className = 'grid grid-2';
  root.append(
    K.Field({ id: 'f1', label: 'Inbound leads / month', kind: 'number', value: 3000 }),
    K.Field({ id: 'f2', label: 'Price per 1M input tokens ($)', kind: 'number', value: 3, help: 'Use your provider\\'s current list price.' }),
    K.Field({ id: 'f3', label: 'Goal type', kind: 'select', options: ['Drive new feature adoption', 'Re-engage churned users'] }),
    K.Field({ id: 'f4', label: 'Their pain today', kind: 'textarea', placeholder: 'What they do now, and what it costs them.' })
  );""", """# Field

A label above one control, with optional help text below. Every input in the toolkit is a Field.

- Label in `label` style (`ink-2`, 600). Name the thing and its unit: "Holdout share (%)", "Loaded cost per SDR ($/yr)".
- Help text in `caption` style (`ink-3`): where the number comes from, or what a good answer looks like. One sentence.
- Number inputs use the mono family so figures line up.
- Percentages are typed as whole numbers (30) and stored as fractions (0.30).
- Lay Fields out in `grid-2` or `grid-3` with `space-4` gaps; they collapse to one column under 640px.

Consumer provides `label`, `kind`, `value`, `onInput`, a stable `id`, optional `help` and `placeholder`.
""")

C['Tabs'] = ('Navigation', 150, 'inbound-agent', """  root.append(K.Tabs({ items: [
    { id: 'a', label: '1. Route leads', render: function (p) { p.append(K.Callout({ body: 'Paste a CSV of inbound leads to see how the agent routes each one.' })); } },
    { id: 'b', label: '2. Rules', render: function (p) { p.textContent = 'Rules'; } },
    { id: 'c', label: '3. Agent prompt', render: function (p) { p.textContent = 'Prompt'; } },
    { id: 'd', label: '4. SDR capacity', render: function (p) { p.textContent = 'Capacity'; } }
  ] }));""", """# Tabs

Splits a tool into the steps of its method. Number the tabs when the order is the workflow ("1. Route leads", "2. Rules"); leave a reference tab unnumbered ("The math", "Preview").

- Active tab: `ink` text over a 3px `accent` underline. Inactive: `ink-3`.
- The bar scrolls sideways on phones and never wraps.
- Tools remember the last open tab per viewer; a bare `#tab-id` in the URL opens that tab.

Consumer provides `items` (`id`, `label`, `render(panel)`) and an optional `initial` id.
""")

C['TopBar'] = ('Navigation', 300, None, """  root.style.minHeight = '280px';
  var tools = [['launch-lift','Launch Lift Planner'],['adoption-campaign','Adoption Campaign Builder'],['inbound-agent','Inbound Qualification Agent'],['win-room','Competitive Win Room'],['risk-messaging','Risk-First Messaging Studio']].map(function (t, i) { return { id: t[0], n: i + 1, title: t[1] }; });
  var bar = K.TopBar({ tools: tools, current: 'win-room' });
  bar.style.position = 'static';
  root.append(bar);
  bar.querySelector('details').open = true;""", """# TopBar

The sticky bar on every page: the five-bar brand mark and wordmark on the left (home link), the tool menu on the right.

- The brand mark is five 4 by 10px bars in five tools' signal colors. It is the toolkit's only logo; there is no image file.
- The menu is a `details` element with real links, one row per tool with its signal dot. The current tool is marked `aria-current="page"`.
- Under 480px the wordmark hides and the mark stays.
- Sticks at `top: env(safe-area-inset-top)`.

Consumer provides `tools` (`id`, `n`, `title`, `href`), `current` and `homeHref`.
""")

C['ToolHeader'] = ('Layout', 300, 'agent-roi', """  root.append(K.ToolHeader({ n: 5, role: 'GTM engineering', signalName: 'Ledger amber', title: 'Agent Economics Model',
    summary: 'Model what an agent really costs to run per lead and per year, what it saves, and what the freed-up SDRs can produce.',
    outcome: '~$1,000 per year in compute cost', metric: 'Inbound Agent Operating Cost', source: 'Vercel AI Cloud infrastructure', method: 'Unit economics of an AI agent vs. headcount, plus redeployment upside' }));""", """# ToolHeader

The top of every tool: number chip, role and signal name, the tool's name, a one-sentence lede, and a readout of the brief result it reproduces.

- The number chip is the only filled block of signal color in the header. The outcome line is in `accent` at `readout-figure` size; everything else is ink.
- The readout always has Reported, Metric, Source and Method, in that order, labeled in `kicker` style, and ends with the note "Outcomes as reported in the source brief; not independently verified." It ties the tool back to its row of the brief's metrics table without presenting the brief's figure as fact.
- The lede is one sentence in `lede` style.

Consumer provides `n`, `title`, `role`, `signalName`, `summary`, `outcome`, `metric`, `source`, `method`, optional `note`, and sets `data-tool` on an ancestor so `accent` resolves to the tool's signal.
""")

C['ExampleBanner'] = ('Layout', 100, 'adoption-campaign', """  root.append(K.ExampleBanner({}));""", """# ExampleBanner

Says plainly that the page is showing the brief's example rather than the viewer's data, and offers the way out.

- Shown on a first visit, when the tool opens on the example. Hidden after "Keep the example", "Start blank" or an import.
- `accent-wash` ground with a 35% `accent` border; text in `ink`.
- "Start blank" is the primary action and goes through a ConfirmDialog.

Consumer provides `onStartBlank` and `onKeep`; `title` and `body` are optional overrides.
""")

C['StatTile'] = ('Data display', 120, 'agent-roi', """  root.className = 'grid grid-4';
  root.append(
    K.StatTile({ label: 'Compute / year', value: '$1,080', sub: '$0.0300 per lead', key: true }),
    K.StatTile({ label: 'Inbound cost before', value: '$950K', sub: '$26.39 per lead' }),
    K.StatTile({ label: 'Inbound cost after', value: '$151K', sub: '$4.20 per lead' }),
    K.StatTile({ label: 'Payback on the build', value: '0.4 mo', sub: 'build \\u2248 $25,385' })
  );""", """# StatTile

A labeled readout: label, value, one line of context. Rows of 3 or 4 sit above the detail they summarize.

- Value in `stat-value` (mono). Compact large numbers: $950K, 24M, $1.2B. Percent lifts are signed: +31%.
- The `sub` line says what the number is made of or compared to ("from 30% baseline", "$0.0300 per lead").
- `key: true` adds a 3px `accent` top rule to the one figure the view exists to produce. One per row at most.
- Under 640px a row of 4 becomes 2 columns.

Consumer provides `label`, `value` (already formatted), optional `sub` and `key`.
""")

C['Pill'] = ('Data display', 80, None, """  root.className = 'row';
  root.append(K.Pill({ text: 'AE fast-track', tone: 'good' }), K.Pill({ text: 'SDR QA review', tone: 'warn' }), K.Pill({ text: 'Disqualify', tone: 'bad' }), K.Pill({ text: 'Nurture', tone: 'info' }), K.Pill({ text: 'Product marketing' }));""", """# Pill

A short state or category label: a route, a verdict, a strength.

- Status tones (`good`, `warn`, `bad`) always carry a glyph (check, !, x) and a word, so state never depends on color alone.
- `info` uses the page's `accent` and `accent-wash` for categories that belong to the tool.
- Neutral (no tone) for roles and tags.
- Keep the text to 1 to 3 words.

Consumer provides `text` and `tone`.
""")

C['Callout'] = ('Data display', 190, None, """  root.append(
    K.Callout({ body: 'Set targets before launch. If your holdout is too small to detect the lift you want, you will ship and never know if it worked.' }),
    K.Callout({ tone: 'good', title: 'Winner: B: feminine graphic tees.', body: '+50% conversion vs. control (p < 0.001).' }),
    K.Callout({ tone: 'warn', body: 'No variant beats control with significance yet.' }),
    K.Callout({ tone: 'bad', body: 'Too small to detect. You need 1,850 users per group, but the holdout has 200.' })
  );""", """# Callout

One or two sentences that explain a method, or the verdict a calculation just reached.

- Neutral (`surface-2`): the method in plain words at the top of a tab.
- `good`, `warn`, `bad`: a computed verdict. Lead with the verdict in bold, then the number behind it.
- Write the fix into a bad or warn callout ("Grow the holdout, widen the audience, or aim for a bigger lift").
- No colored side rails; tone comes from the wash and a 40% border.

Consumer provides `body`, optional `title` and `tone`.
""")

C['DataTable'] = ('Data display', 200, 'positioning-lab', """  root.append(K.DataTable({ columns: [{ label: 'Variant', key: 'v' }, { label: 'Conv. rate', key: 'r', num: true }, { label: 'Lift', key: 'l', num: true }, { label: 'p-value', key: 'p', num: true }],
    rows: [{ v: 'Control: unisex athletic', r: '3%', l: 'control', p: '-' }, { v: 'B: feminine graphic tees', r: '4.5%', l: '+50%', p: 'p < 0.001' }, { v: 'C: retro lifestyle', r: '3.3%', l: '+10%', p: 'p = 0.442' }] }));""", """# DataTable

Rows of records or results, wrapped in a scroll container so a wide table never pushes the page sideways.

- Header cells in `kicker` style on `surface-2`.
- Numeric columns (`num: true`) right-align in mono with tabular figures.
- Editable tables put compact inputs straight in the cells (deal log, cohorts, segments).
- Every table that backs a chart shows the same numbers, so nothing lives only in color.

Consumer provides `columns` (`label`, `key`, `num`) and `rows`.
""")

C['BarChart'] = ('Data display', 170, 'agent-roi', """  root.className = 'card';
  root.append(K.BarChart({ rows: [
    { label: 'Before: SDR team', value: 950000, display: '$950,000', muted: true },
    { label: 'After: QA SDR(s)', value: 95000, display: '$95,000' },
    { label: 'After: GTME upkeep', value: 55000, display: '$55,000' },
    { label: 'After: compute', value: 1080, display: '$1,080' }
  ] }));""", """# BarChart

Horizontal bars from one zero baseline, for comparing magnitudes in one unit. It is the toolkit's only chart form.

- One series per chart, in `accent`. A baseline or "before" bar uses `bar-muted`, so the comparison reads without a legend.
- Bars are 16px thick with 4px rounded ends, square at the baseline; the baseline is a `line-2` hairline.
- Value labels sit at the bar end in mono `ink`, never in the bar color.
- Hover or focus shows the full label and value.
- Two measures with different units get two charts, never two axes.

Consumer provides `rows` (`label`, `value`, `display`, optional `muted`) and optional `max`.
""")

C['Meter'] = ('Data display', 70, 'launch-lift', """  root.append(K.Meter({ value: 0.67, label: 'Launch readiness' }));""", """# Meter

A single 0 to 100% progress bar, used for launch readiness across the 6 GTM phases.

- `accent` fill on an `accent-wash` track, 8px tall, pill ends.
- Always paired with the number in text and the list of what is still open.

Consumer provides `value` (0 to 1) and an accessible `label`.
""")

C['ToolCard'] = ('Layout', 230, None, """  root.className = 'grid grid-2';
  root.append(
    K.ToolCard({ id: 'inbound-agent', n: 4, title: 'Inbound Qualification Agent', outcome: 'Reduced from 10 SDRs to 1 SDR + agent', summary: 'Encode your inbound qualification rules once, route every lead with reasons, and send only the gray zone to a human.', role: 'GTM engineering', meta: '4 features \\u00b7 Agent teal' }),
    K.ToolCard({ id: 'risk-messaging', n: 9, title: 'Risk-First Messaging Studio', outcome: '80% risk avoidance vs. 20% upside', summary: 'Check if your copy speaks to the risk buyers are trying to avoid.', role: 'PMM + GTME', meta: '3 features \\u00b7 Risk red' })
  );""", """# ToolCard

The hub's link to one tool. The whole card is the link.

- Tool number in `kicker` style, the signal dot top right, name in `h3`, the brief outcome in mono `accent` (bound to that tool's signal), a one-sentence summary in `ink-2`, a role pill.
- Hover swaps the hairline border for the tool's signal.
- No colored rails or fills: the dot and the outcome line carry the identity.

Consumer provides `id`, `n`, `title`, `outcome`, `summary`, `role`, `href`, optional `meta`.
""")

C['ConfirmDialog'] = ('Feedback', 150, None, """  root.append(K.ConfirmDialog({ inline: true, message: 'Clear everything on this page? This can\\'t be undone.', confirmLabel: 'Clear page', danger: true }));""", """# ConfirmDialog

The in-page confirmation for anything that replaces or deletes the viewer's work. Browser `confirm()` is blocked inside the claude.ai viewer, so the toolkit never uses it.

- One question, written as what will happen ("Replace what is on this page with the example from the brief?").
- The confirm button names the action ("Load example", "Clear page", "Delete"). `danger` makes it a `bad` fill for irreversible steps.
- Escape and the backdrop cancel. Focus starts on the confirm button and returns to the trigger.

Consumer provides `message`, `confirmLabel`, optional `danger`; read the answer from `.result`.
""")

C['Toast'] = ('Feedback', 80, None, """  root.append(K.Toast({ text: 'Saved routed-leads.csv', inline: true }));""", """# Toast

A short confirmation after an action completes: "Copied to clipboard", "Saved routed-leads.csv", "Imported".

- `ink` pill, bottom center, gone after about 2 seconds.
- Past tense for done ("Saved"). For a failure, plain words plus the fix ("Saving files is off here. Use Copy instead.").
- Never the only record of something important: errors that block work go in a Callout.

Consumer provides `text`.
""")

for name, (group, height, tool, js, readme) in C.items():
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'README.md'), 'w').write(readme)
    open(os.path.join(d, 'preview.html'), 'w').write(preview(name, group, height, js, tool))
print(f'{len(C)} components written')
