# ToolHeader

The top of every tool: number chip, role and signal name, the tool's name, a one-sentence lede, and a readout of the brief result it reproduces.

- The number chip is the only filled block of signal color in the header. The outcome line is in `accent` at `readout-figure` size; everything else is ink.
- The readout always has Outcome, Metric, Source and Method, in that order, labeled in `kicker` style. It ties the tool back to its row of the brief's metrics table.
- The lede is one sentence in `lede` style.

Consumer provides `n`, `title`, `role`, `signalName`, `summary`, `outcome`, `metric`, `source`, `method`, and sets `data-tool` on an ancestor so `accent` resolves to the tool's signal.
