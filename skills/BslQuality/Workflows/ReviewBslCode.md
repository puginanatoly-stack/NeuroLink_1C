# ReviewBslCode Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the ReviewBslCode workflow in the BslQuality skill to review BSL code"}' \
  > /dev/null 2>&1 &
```

Running the **ReviewBslCode** workflow in the **BslQuality** skill to review BSL code...

## Step 0 — Sufficiency Check

Check whether the `claude-code-bsl-lsp` plugin is already installed for this session — if not, that's the first step, not an optional aside, since it's what actually provides the diagnostics rather than reasoning about the code from general BSL knowledge alone. If a `.bsl-language-server.json` exists in the project, read it before interpreting any finding's severity.

## Deliverable

A review that:

- Uses actual LSP diagnostics from the plugin/server where available, rather than a from-scratch manual read when the tooling is present and working.
- Separates findings into genuine defects (correctness risks) vs. style/convention findings whose severity is project-configurable — and says which is which, not just "here are the issues."
- For `.os` (OneScript) files mixed into the same project, applies the same rigor — don't skip them as "just scripts."

## Constraints

- Don't fabricate a specific diagnostic rule name or code if the plugin/server isn't actually available in this session — say so and offer to install it, rather than inventing a plausible-sounding finding.
