# Tabs

Splits a tool into the steps of its method. Number the tabs when the order is the workflow ("1. Route leads", "2. Rules"); leave a reference tab unnumbered ("The math", "Preview").

- Active tab: `ink` text over a 3px `accent` underline. Inactive: `ink-3`.
- The bar scrolls sideways on phones and never wraps.
- Tools remember the last open tab per viewer; a bare `#tab-id` in the URL opens that tab.

Consumer provides `items` (`id`, `label`, `render(panel)`) and an optional `initial` id.
