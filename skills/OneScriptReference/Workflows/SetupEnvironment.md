# SetupEnvironment Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the SetupEnvironment workflow in the OneScriptReference skill to set up a OneScript environment"}' \
  > /dev/null 2>&1 &
```

Running the **SetupEnvironment** workflow in the **OneScriptReference** skill to set up a OneScript environment...

## Step 0 — Sufficiency Check

Confirm the target OS (Windows/Linux/macOS), whether this is a one-off local setup or a CI runner image, and what's actually needed downstream (just OneScript itself, or a specific package like `vanessa-runner`).

## Deliverable

A setup sequence that:

- Installs OneScript itself for the confirmed target OS, pinned to a specific version via `ovm` rather than "whatever's latest," when reproducibility matters (CI images especially).
- Installs `opm`, then uses it for any downstream package (e.g. `opm install vanessa-runner` at a pinned version — cross-reference `VanessaAutomation` skill's version-syntax gotcha if that's the target package).
- States explicitly whether the resulting setup is genuinely COM-free (portable) or still depends on a Windows-only component somewhere in the chain — don't leave this implicit for a Linux-target setup.

## Constraints

- Don't assume `hub.oscript.io` is reachable in a locked-down CI network — note the `hub.oscript.ru` fallback exists if a package install needs troubleshooting.
