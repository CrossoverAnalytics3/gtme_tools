# ToolHeader

The top of every tool: number chip, role and signal name, the tool's name, a one-sentence lede, and a readout of the brief result it reproduces.

- The number chip is the only filled block of signal color in the header. The outcome line is in `accent` at `readout-figure` size; everything else is ink.
- The readout always has Reported, Metric, Source and Method, in that order, labeled in `kicker` style, and ends with the note "Outcomes as reported in the source brief; not independently verified." It ties the tool back to its row of the brief's metrics table without presenting the brief's figure as fact.
- The lede is one sentence in `lede` style.

Consumer provides `n`, `title`, `role`, `signalName`, `summary`, `outcome`, `metric`, `source`, `method`, optional `note`, and sets `data-tool` on an ancestor so `accent` resolves to the tool's signal.
