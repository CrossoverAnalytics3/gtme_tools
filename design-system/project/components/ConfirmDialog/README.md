# ConfirmDialog

The in-page confirmation for anything that replaces or deletes the viewer's work. Browser `confirm()` is blocked inside the claude.ai viewer, so the toolkit never uses it.

- One question, written as what will happen ("Replace what is on this page with the example from the brief?").
- The confirm button names the action ("Load example", "Clear page", "Delete"). `danger` makes it a `bad` fill for irreversible steps.
- Escape and the backdrop cancel. Focus starts on the confirm button and returns to the trigger.

Consumer provides `message`, `confirmLabel`, optional `danger`; read the answer from `.result`.
