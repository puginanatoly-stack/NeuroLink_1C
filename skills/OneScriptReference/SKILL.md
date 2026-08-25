---
name: OneScriptReference
version: 1.0.0
description: OneScript (oscript) — the cross-platform headless runtime that executes 1C-like script syntax without a full 1C:Enterprise server, plus its opm package manager and ovm version manager. USE WHEN OneScript, oscript, opm install, ovm, oscript-library, headless 1C script, 1C script without a server, cross-platform 1C automation. NOT FOR the testing frameworks that run on top of it (use VanessaAutomation) or BSL static analysis (use BslQuality).
---

# OneScriptReference

OneScript is the runtime almost everything else in the open-source 1C tooling ecosystem is quietly built on — vanessa-runner is itself a OneScript program. Knowing it exists, and that it's genuinely cross-platform (no COM dependency), changes what's actually possible for CI hosted on Linux.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/LIFEOS/USER/CUSTOMIZATIONS/SKILLS/OneScriptReference/`

If this directory exists, load and apply any `PREFERENCES.md` or additional files found there. If it does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the OneScriptReference skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **OneScriptReference** skill to ACTION...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **SetupEnvironment** | "install OneScript", "set up opm/ovm", "get vanessa-runner working locally" | `Workflows/SetupEnvironment.md` |

## Quick Reference

- **Runtime**: [EvilBeaver/OneScript](https://github.com/evilbeaver/onescript) — headless, cross-platform (.NET/Mono), executes syntax matching 1C's built-in language without needing a real 1C:Enterprise server.
- **Package manager**: `opm` ([oscript-library/opm](https://github.com/oscript-library/opm)) — packages hosted at `hub.oscript.io` (primary), falls back to `hub.oscript.ru` if the primary is unreachable.
- **Version manager**: `ovm` ([oscript-library/ovm](https://github.com/oscript-library/ovm)) — the nvm/pyenv equivalent for switching OneScript versions.
- **Package library**: [oscript-library](https://github.com/oscript-library) org — 200+ community packages.

## Examples

**Example 1: First-time setup**
```
User: "I need OneScript and vanessa-runner working on a fresh Linux CI runner"
→ Invokes SetupEnvironment workflow
→ Walks through installing OneScript itself, then opm, then `opm install vanessa-runner`
→ Confirms the runner is genuinely COM-free before treating Linux compatibility as settled
```

## Gotchas

- **OneScript's cross-platform nature is the actual leverage point for any Windows→Linux CI migration involving 1C tooling** — it has no COM dependency, unlike classic Configurator batch-mode automation (`1cv8.exe DESIGNER ...`) which is Windows-only. When evaluating whether a 1C build/test step can move to Linux, the real question is whether that step goes through OneScript (portable) or through COM/the classic thick client (not portable) — don't assume portability without confirming which path the actual pipeline uses.
- **opm has a fallback package host (`hub.oscript.ru`) for a reason** — if a package install fails from `hub.oscript.io`, that's a known failure mode with a documented workaround, not a sign the package doesn't exist.
- **`ovm` exists specifically because OneScript version mismatches break package compatibility** — a package or script written against one OneScript version isn't guaranteed to run cleanly on another; pin the version deliberately for CI rather than tracking "latest."
