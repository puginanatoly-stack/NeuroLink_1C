# DiagnoseRunnerFailure Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DiagnoseRunnerFailure workflow in the VanessaAutomation skill to diagnose a vrunner failure"}' \
  > /dev/null 2>&1 &
```

Running the **DiagnoseRunnerFailure** workflow in the **VanessaAutomation** skill to diagnose a vrunner failure...

## Step 0 — Sufficiency Check

Get the actual failing command and its exact error output, and the installed `vanessa-runner` version (`vrunner --version` or the `opm` install line in the pipeline config) before diagnosing.

## Deliverable

A diagnosis that checks, in order:

1. **Version/command-syntax mismatch** — is the command using 2.x syntax (`vrunner vanessa`, `vrunner updatedb`) against a 3.x install, or vice versa? This is the single most likely cause of "unknown command"-style failures given the 3.0 rename.
2. **Framework mismatch** — is the command targeting Vanessa Automation when the actual test suite is Vanessa-ADD or YAxUnit (or vice versa)?
3. **Connection/config** — `ibconnection`/`v8version` parameters in `autumn-properties.json` or `VRUNNER_*` env vars actually matching the target infobase.
4. **Genuine test failure** — only after 1–3 are ruled out, treat the failing tests as real defects rather than a runner/config problem.

State which check confirmed the cause before proposing a fix.

## Constraints

- Don't propose a fix that assumes a specific vanessa-runner version without confirming the installed version first.
