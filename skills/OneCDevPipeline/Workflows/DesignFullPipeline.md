# DesignFullPipeline Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DesignFullPipeline workflow in the OneCDevPipeline skill to design the full 1C pipeline"}' \
  > /dev/null 2>&1 &
```

Running the **DesignFullPipeline** workflow in the **OneCDevPipeline** skill to design the full 1C pipeline...

## Step 0 — Sufficiency Check

Confirm what already exists (nothing? partial CI? a specific stage failing?) and whether the project uses EDT (relevant to the OneCEdt stage) or classic Configurator-only development (in which case the OneCEdt export step doesn't apply the same way — say so rather than forcing it in).

## Deliverable

A stage plan that:

- Names each stage (lint / build / test / ship) and the sibling skill that owns it — don't restate that skill's internal details here, just route to it.
- States both seam gotchas explicitly wherever they're relevant to the stated project (export-before-Designer if EDT is in use; vanessa-runner version pinning if VanessaAutomation is in use) — don't leave them implicit even if the user didn't ask about them directly, since they're the most likely source of a "passes in isolation, fails in the full pipeline" bug.
- For a diagnostic request (something already failing) rather than a from-scratch design: checks the two seams first, before delegating to the owning skill's own diagnostic workflow for anything seam-unrelated.

## Constraints

- Don't answer a stage-specific technical question from general knowledge when the owning sibling skill (BslQuality, OneCEdt, VanessaAutomation, OneScriptReference, GitLabCiCd) should be the source — route to it.
