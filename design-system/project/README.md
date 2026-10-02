The GTM Toolkit is an instrument panel for revenue teams: ten working tools, each rebuilt from one result in the *Modern Product Marketing & GTM* executive brief. Pages are read by PMMs and GTM engineers mid-task, so everything here serves one job: get from a question to a number you can defend, fast.

The look follows from that. Cool slate neutrals so the data stays the loudest thing on screen. One **signal color per tool**, chosen for what the tool does. Mono numerals for every readout. Hairlines instead of shadows.

## Content fundamentals

Write like a sharp operator talking to a peer.

- **Direct address, active voice.** "Paste last month's leads and see how the agent would have routed them." Use *you* for the reader and *I* when the toolkit recommends something ("These are the orders I'd run them in").
- **Numbers as digits, with units.** "3,000 leads a month", "+31% engagement", "29 interviews for a 10% problem". Lifts are signed. Absolute changes are in points ("+8.6 pts").
- **Sentence case** for headings, buttons, tabs and labels. Tab labels that are steps are numbered: "1. Route leads", "2. Rules".
- **Buttons are verbs** that say what happens: "Load example", "Copy talk track", "Save .md". Toasts confirm in past tense: "Saved routed-leads.csv".
- **Short paragraphs, contractions, no em dashes.** Use commas, colons, periods or parentheses.
- **Say what something is.** Skip "not X, but Y" reframes, hype words and "it's worth noting". A callout leads with the verdict, then the number, then the fix: "Too small to detect. You need 1,850 users per group, but the holdout has 200. Grow the holdout or aim for a bigger lift."
- **Be honest about the math.** When a number is a heuristic, say so in one line ("It's a keyword heuristic: use it as a mirror, not a grade"). When the brief's claim needs context, give it ("97% is the chance a problem half your users share shows up in 5 interviews").
- **Mark examples as examples.** Pages open on the brief's case with a banner saying so. Example data is illustrative, never presented as company data.
- **No emoji.** State glyphs are ✓, ! and ×, always beside a word.

## Visual foundations

### Color

- Ground and text: `page` behind everything, `surface` for cards, inputs and tables, `surface-2` for table headers, flat cards and output blocks. Text is `ink`, secondary text `ink-2`, help text and captions `ink-3`. All three inks clear 4.5:1 on `page`, `surface` and `surface-2` in both themes.
- Borders: `line` for card and table hairlines, `line-2` for control edges and chart baselines (3:1 on surface).
- **Signals.** Each tool binds `accent` and `accent-wash` to its own `sig-<tool>` and `sig-<tool>-wash` by setting `data-tool="<tool-id>"` on the root. The hub keeps the default `accent` (Lift blue). Use `accent` for the primary button, the active tab underline, links, the tool number chip, the outcome line and single-series chart bars. Never use another tool's signal on a tool page except in navigation dots.
- **Status is separate from signals.** `good`, `warn`, `bad` and their `-wash` fills mean state only (routes, verdicts, test results). Each one ships with a glyph and a word. Risk red (`sig-risk-messaging`) and `bad` sit close in hue on purpose (both mean danger in context), so a status pill always carries its glyph.
- On a filled `accent` or `bad` surface, text is `on-accent`: white in light, deep ink in dark (the dark-theme signals are light enough to need dark text).
- Charts: the series is `accent`; a baseline, control or "before" bar is `bar-muted`. Highlights in the copy analyzer use `hl-risk` and `hl-upside` behind `ink` text.

### Type

- `display` (Archivo at 112% width, 700 to 750) for `display-hero`, `h1` and `h2` only. It's wide and sturdy, like a label on an instrument.
- `body` (IBM Plex Sans) for everything people read: `lede`, `body`, `h3`, `label`, `caption`.
- `mono` (IBM Plex Mono) for figures and machine-ish labels: `stat-value`, `kicker` (uppercase, 0.06 to 0.08em tracking), table headers, numeric cells, number inputs, the outcome line on tool cards.
- Numbers that line up in columns use `tabular-nums`. Big standalone figures keep proportional digits.
- Load the three families from Google Fonts with the fallbacks in `type.families`.

### Space and layout

- 4px base: `space-1` 4, `space-2` 8, `space-3` 12, `space-4` 16, `space-5` 24, `space-6` 32, `space-7` 48.
- Content max width 1180px with a `space-4` side gutter at every width. Cards sit in `grid-2`, `grid-3` or `grid-4` with `space-4` gaps; at 640px and under, 2 and 3 columns stack and stat rows go to 2 columns.
- A tool page reads top to bottom: ToolHeader, feature/benefit/use case table, toolbar, ExampleBanner, Tabs, then each tab's inputs above its outputs. Summary readouts (StatTiles) come before the detail they summarize.

### Shape, borders, depth

- `radius-sm` (4px) for controls and chips, `radius` (8px) for cards, tables, banners and dialogs, `radius-pill` for pills, meters and the toast.
- Borders do the separating: 1px `line` on cards. No shadows on cards. Menus and dialogs carry a heavier drop shadow because they float.
- No gradients, no colored side rails on cards, no decorative illustration.

### States and motion

- Hover: buttons and menu items fill with `surface-2`; tool cards swap their border to the signal; the primary button brightens slightly.
- Focus: a 2px solid `focus` ring (the page's signal) with 2px offset, on every interactive element.
- Motion is limited to a 150ms border transition on tool cards and the toast fading. `prefers-reduced-motion` turns it off.

## Iconography

There is no icon set and no logo file. Identity comes from:

- **The brand mark:** five 4 by 10px bars in the Lift, Adoption, Agent, Bake-off and Risk signals, drawn in CSS (`.brand-mark`). Pair it with the wordmark "GTM Toolkit" in `display`.
- **Signal dots:** a 10px disc in a tool's `sig-<tool>` color next to its name in menus, tables and cards.
- **State glyphs:** ✓, ! and × as text inside status pills.

Don't add emoji or pictograms to stand in for tools.

## Building a page in this system

- Load the fonts, then the bundle stylesheet, then `bundle.js` (it defines `window.GTMKit`). Set `data-tool` on the root of a tool page.
- Build with the factories: `GTMKit.ToolHeader`, `StatTile`, `BarChart`, `DataTable`, `Callout`, `Pill`, `Field`, `Tabs`, `Button`, `ConfirmDialog`. Each component's guideline says what you provide.
- Pages hosted on claude.ai can't use `confirm()`, `alert()`, print or plain download links. Confirm with `ConfirmDialog`, save files through the `downloads` capability, and keep each person's working data in their private `db` subtree with browser storage as the fallback. The gtme_tools repo (`assets/js/core/store.js`, `dom.js`) shows the pattern.
