# Field

A label above one control, with optional help text below. Every input in the toolkit is a Field.

- Label in `label` style (`ink-2`, 600). Name the thing and its unit: "Holdout share (%)", "Loaded cost per SDR ($/yr)".
- Help text in `caption` style (`ink-3`): where the number comes from, or what a good answer looks like. One sentence.
- Number inputs use the mono family so figures line up.
- Percentages are typed as whole numbers (30) and stored as fractions (0.30).
- Lay Fields out in `grid-2` or `grid-3` with `space-4` gaps; they collapse to one column under 640px.

Consumer provides `label`, `kind`, `value`, `onInput`, a stable `id`, optional `help` and `placeholder`.
