# BarChart

Horizontal bars from one zero baseline, for comparing magnitudes in one unit. It is the toolkit's only chart form.

- One series per chart, in `accent`. A baseline or "before" bar uses `bar-muted`, so the comparison reads without a legend.
- Bars are 16px thick with 4px rounded ends, square at the baseline; the baseline is a `line-2` hairline.
- Value labels sit at the bar end in mono `ink`, never in the bar color.
- Hover or focus shows the full label and value.
- Two measures with different units get two charts, never two axes.

Consumer provides `rows` (`label`, `value`, `display`, optional `muted`) and optional `max`.
