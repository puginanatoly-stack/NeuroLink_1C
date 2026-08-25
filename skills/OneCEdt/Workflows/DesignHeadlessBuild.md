# DesignHeadlessBuild Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DesignHeadlessBuild workflow in the OneCEdt skill to design a headless EDT build step"}' \
  > /dev/null 2>&1 &
```

Running the **DesignHeadlessBuild** workflow in the **OneCEdt** skill to design a headless EDT build step...

## Step 0 — Sufficiency Check

Confirm the target EDT version (or whether it's known at all) and what happens downstream of the export — does anything try to load the result via classic Designer (`LoadConfigFromFiles`)? If the version is unknown, treat the exit-code-bug gotcha as active by default rather than assuming it's fixed.

## Deliverable

A build-step design that:

- Uses `1cedtcli` directly, not `ring`, unless there's a stated reason the target still requires `ring` (e.g. an EDT version predating the 2024.1 CLI).
- Exports to XML explicitly (`-command export --configuration-files <output>`) as its own step before anything downstream assumes Designer-XML input — never lets a Designer-mode command point directly at an EDT project.
- Verifies success by parsing actual command output/log content in addition to the exit code, when the target EDT version is pre-2024.1 or unconfirmed — states this explicitly as a required step, not an optional hardening.
- For any deploy stage that follows: names whether it's a dynamic (`-Dynamic+`, BSL-only) or full update, and if full, confirms `rac.exe` session-blocking is wired in with the RAS service's running state checked first.

## Constraints

- Don't assume the exit-code bug is fixed without the version being stated or confirmed — default to the safer "verify output" behavior.
- Don't propose `-Dynamic+` for a change scope that includes non-BSL configuration changes.
