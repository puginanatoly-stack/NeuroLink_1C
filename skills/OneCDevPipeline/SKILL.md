---
name: OneCDevPipeline
version: 1.0.0
description: End-to-end 1C development pipeline — routes across BslQuality (lint), OneCEdt (headless build), VanessaAutomation (test), OneScriptReference (runtime), and GitLabCiCd (CI orchestration) into one coherent write-lint-build-test-ship reference, flagging the seam gotchas between tools. USE WHEN 1C dev pipeline, full 1C CI/CD, how do these 1C tools fit together, 1C write code and test end to end, pipeline for 1C project. NOT FOR any single tool's own details — this skill routes to the sibling skill that owns them.
---

# OneCDevPipeline

No tool in the 1C ecosystem covers the whole path from writing BSL to a green CI pipeline — this skill doesn't add new facts, it's the map showing which sibling skill owns which stage, and the two places where getting the handoff wrong breaks the pipeline in ways that don't show up until later.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/LIFEOS/USER/CUSTOMIZATIONS/SKILLS/OneCDevPipeline/`

If this directory exists, load and apply any `PREFERENCES.md` or additional files found there. If it does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the OneCDevPipeline skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **OneCDevPipeline** skill to ACTION...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **DesignFullPipeline** | "design the full 1C pipeline", "how do these tools fit together", "write to ship for 1C" | `Workflows/DesignFullPipeline.md` |

## Quick Reference — the pipeline order

```
write BSL  →  BslQuality (lint)  →  OneCEdt (headless export/build)  →  VanessaAutomation (test, via vanessa-runner)  →  GitLabCiCd (CI orchestration)
                                                                              ↑
                                                                    runs on OneScriptReference's runtime
```

- **BslQuality** owns: static analysis, `.bsl`/`.os` diagnostics, the `claude-code-bsl-lsp` plugin.
- **OneCEdt** owns: headless export/build (`1cedtcli`), Designer-format conversion, deploy mechanics.
- **VanessaAutomation** owns: BDD/unit test frameworks and `vanessa-runner`, the CLI that drives them.
- **OneScriptReference** owns: the runtime `vanessa-runner` itself is built on — not a pipeline stage on its own, but a dependency of the test stage.
- **GitLabCiCd** owns: the CI config wrapping all of the above into stages.

## Examples

**Example 1: Setting up CI from nothing**
```
User: "We have a 1C:EDT project with no CI at all — design the full pipeline"
→ Invokes DesignFullPipeline workflow
→ Produces a stage plan: lint (BslQuality) → build (OneCEdt, export-before-Designer) → test (VanessaAutomation, pinned vrunner major version) → orchestrated by GitLabCiCd
→ Flags both seam gotchas explicitly rather than letting them surface as mystery CI failures later
```

**Example 2: An existing pipeline has a mystery failure at a stage boundary**
```
User: "Our build stage passes but the test stage can't find what it expects"
→ Invokes DesignFullPipeline workflow's diagnostic framing
→ Checks the OneCEdt export-format seam first, then the vanessa-runner version-pinning seam
→ Routes to the owning sibling skill (OneCEdt or VanessaAutomation) for the actual fix once the seam is identified
```

## Gotchas

- **Seam 1 — EDT format vs Designer-XML.** If any pipeline stage after the build step assumes Designer-XML input, the build stage MUST run `1cedtcli`'s export first — an EDT project's native format and Designer's XML dump are not interchangeable (see `OneCEdt` skill). A pipeline that skips this because "it's just a build step" fails downstream, not at the build step itself, which makes it look like a test-stage bug instead of a build-stage omission.
- **Seam 2 — vanessa-runner version drift across stages.** If the build stage's container/image has a different `vanessa-runner` major version than the test stage expects (2.x vs 3.0 command syntax — see `VanessaAutomation` skill), the failure surfaces as "unknown command" in the test stage, not as a version-mismatch error. Pin the version explicitly in one place (the CI config, not per-stage assumption) rather than letting each stage resolve "latest" independently.
- **This skill is a router, not a knowledge source.** Any question about the specific mechanics of one stage (why a diagnostic fired, what a specific flag does) belongs to the owning sibling skill — resist the temptation to answer it here from memory instead of deferring to the skill that actually owns and maintains that fact.
