# DiagnoseEdtCliFailure Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DiagnoseEdtCliFailure workflow in the OneCEdt skill to diagnose an EDT CLI failure"}' \
  > /dev/null 2>&1 &
```

Running the **DiagnoseEdtCliFailure** workflow in the **OneCEdt** skill to diagnose an EDT CLI failure...

## Step 0 — Sufficiency Check

Get the actual CLI command, its full output/log (not just the exit code), and the installed EDT version before diagnosing.

## Deliverable

A diagnosis that checks, in order:

1. **Exit-code trust** — is the EDT version pre-2024.1? If so, a green exit code proves nothing by itself; the actual output/log must be inspected for the real result, since this is a confirmed platform bug, not a hypothesis.
2. **Format mismatch** — did a downstream step (`LoadConfigFromFiles` or similar) try to consume the EDT project's native format directly instead of the `1cedtcli`-exported XML?
3. **`ring` vs `1cedtcli` drift** — is the failing command using deprecated `ring` syntax against an EDT install where it's no longer fully supported, or a `1cedtcli` example copied for a different version?
4. **Genuine build/export error** — only after 1–3 are ruled out.

State which check confirmed the cause.

## Constraints

- Don't conclude "it passed" from an exit code alone on a pre-2024.1 install — that conclusion requires the actual output.
