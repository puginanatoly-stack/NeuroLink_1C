---
name: OneCEdt
version: 1.0.0
description: 1C:Enterprise Development Tools (EDT) — the official IDE and its headless CLI build tooling (1cedtcli, deprecated ring), export/import to Designer-XML, and dynamic vs full deploy via 1cv8.exe DESIGNER/rac.exe. USE WHEN 1C:EDT, 1cedtcli, ring edt, headless EDT build, DumpConfigToFiles, LoadConfigFromFiles, UpdateDBCfg, rac.exe, EDT CI/CD, export EDT project to XML. NOT FOR the testing frameworks (use VanessaAutomation) or BSL static analysis (use BslQuality).
---

# OneCEdt

1C:Enterprise Development Tools (EDT) is the official IDE, and its CLI is the only way to build/export a 1C project headlessly for CI — but the CLI has a documented history of lying about success, and its native project format isn't the same thing as what the classic Designer needs to actually load a database.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/LIFEOS/USER/CUSTOMIZATIONS/SKILLS/OneCEdt/`

If this directory exists, load and apply any `PREFERENCES.md` or additional files found there. If it does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the OneCEdt skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **OneCEdt** skill to ACTION...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **DesignHeadlessBuild** | "build EDT project in CI", "headless export", "1cedtcli pipeline step" | `Workflows/DesignHeadlessBuild.md` |
| **DiagnoseEdtCliFailure** | "1cedtcli said success but output is wrong", "EDT build step passed but deploy broke" | `Workflows/DiagnoseEdtCliFailure.md` |

## Quick Reference

- **CLI tool**: `1cedtcli` — the current, supported CLI. `ring` (`ring edt workspace export ...`) is **deprecated as of EDT 2024.1**; still works for back-compat but don't build new pipelines on it.
- **Export command shape**: `1cedtcli.exe -data <workspace> -command export --project <path> --configuration-files <output>` — exports an EDT project (.mdo files) to Designer-compatible XML.
- **Deploy tools**: `1cv8.exe DESIGNER ... LoadConfigFromFiles` loads XML into a database; `UpdateDBCfg -Dynamic+` applies a hot update (BSL-only, no session interrupt) vs a full config update (needs session termination); `rac.exe` blocks/terminates sessions before a full deploy and requires the `1CEnterprise83RAS` service running on the target.

## Examples

**Example 1: Setting up a CI build step**
```
User: "Add a CI step that headlessly builds our EDT project"
→ Invokes DesignHeadlessBuild workflow
→ Uses 1cedtcli (not ring), exports to XML explicitly before any Designer-mode step
→ Adds output-content verification alongside the exit code if the target EDT version is pre-2024.1
```

**Example 2: A CI step "passed" but the deploy broke**
```
User: "Our EDT export step shows green but the deploy after it fails"
→ Invokes DiagnoseEdtCliFailure workflow
→ Checks the EDT version first — if pre-2024.1, treats the green exit code as unreliable and inspects actual command output
→ Checks whether a Designer-mode step tried to consume the EDT project format directly instead of the exported XML
```

## Gotchas

- **`1cedtcli` returns exit code 0 even on failure, on EDT versions before 2024.1.** Documented and fixed in the 2024.1 milestone (GitHub issue 1C-Company/1c-edt-issues#1344) — reproduced case: a "workspace already in use" failure still returned `%ERRORLEVEL% == 0`. A CI pipeline on a pre-2024.1 EDT install that trusts only the exit code will report success on a failed export. Until confirmed running 2024.1+, a build step must also check command output/log content, not the exit code alone.
- **`ring` is deprecated as of EDT 2024.1** — it still runs for backward compatibility, but new pipeline work should target `1cedtcli` directly. Don't copy a `ring edt workspace export` example into a new pipeline without checking whether the target EDT version still needs it.
- **An EDT project's native file format and the classic Designer's XML dump format are NOT interchangeable.** `1cv8.exe DESIGNER ... LoadConfigFromFiles` cannot directly consume EDT project files — they must be exported to XML via `1cedtcli ... -command export --configuration-files` first. A pipeline that tries to point Designer's batch-mode load command straight at an EDT workspace will fail; the export step is not optional scaffolding, it's a genuine format conversion.
- **`UpdateDBCfg -Dynamic+` is not always safe to use unconditionally.** It's the right choice for BSL-only changes (no session interruption), but a full configuration change needs session termination first — applying `-Dynamic+` to a change that actually requires a full update risks database inconsistency, not just a slower deploy.
- **`rac.exe` session-blocking commands fail silently-ish if the `1CEnterprise83RAS` service isn't running on the target** — a common gap when a deploy target is freshly provisioned. Confirm the RAS service is running (and set to auto-start) before relying on `rac.exe` to gate a deploy.
