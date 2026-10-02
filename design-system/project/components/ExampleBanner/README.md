# ExampleBanner

Says plainly that the page is showing the brief's example rather than the viewer's data, and offers the way out.

- Shown on a first visit, when the tool opens on the example. Hidden after "Keep the example", "Start blank" or an import.
- `accent-wash` ground with a 35% `accent` border; text in `ink`.
- "Start blank" is the primary action and goes through a ConfirmDialog.

Consumer provides `onStartBlank` and `onKeep`; `title` and `body` are optional overrides.
