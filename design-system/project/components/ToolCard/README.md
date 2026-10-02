# ToolCard

The hub's link to one tool. The whole card is the link.

- Tool number in `kicker` style, the signal dot top right, name in `h3`, the brief outcome in mono `accent` (bound to that tool's signal), a one-sentence summary in `ink-2`, a role pill.
- Hover swaps the hairline border for the tool's signal.
- No colored rails or fills: the dot and the outcome line carry the identity.

Consumer provides `id`, `n`, `title`, `outcome`, `summary`, `role`, `href`, optional `meta`.
