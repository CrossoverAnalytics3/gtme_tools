# Button

Buttons do one thing and say it with a verb: "Load example", "Export JSON", "Copy talk track".

- **Primary** (`accent` fill, `on-accent` text): at most one per toolbar or card, for the action the view is for. On a tool page it takes that tool's signal color.
- **Default** (`surface`, `line-2` border): every other action.
- **Ghost**: low-stakes actions next to a primary one (Cancel, Keep the example, Print).
- **Danger** (`bad` fill): only inside a ConfirmDialog, for the irreversible step. In a toolbar, a destructive action is a default button that opens the dialog.
- **Small** (`sm`): inside tables, cards and banners.

Consumer provides `label`, `onClick`, optional `variant` and `size`. Labels are sentence case with no trailing punctuation. Never put two primary buttons side by side.
