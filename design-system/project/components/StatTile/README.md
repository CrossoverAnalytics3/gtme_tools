# StatTile

A labeled readout: label, value, one line of context. Rows of 3 or 4 sit above the detail they summarize.

- Value in `stat-value` (mono). Compact large numbers: $950K, 24M, $1.2B. Percent lifts are signed: +31%.
- The `sub` line says what the number is made of or compared to ("from 30% baseline", "$0.0300 per lead").
- `key: true` adds a 3px `accent` top rule to the one figure the view exists to produce. One per row at most.
- Under 640px a row of 4 becomes 2 columns.

Consumer provides `label`, `value` (already formatted), optional `sub` and `key`.
