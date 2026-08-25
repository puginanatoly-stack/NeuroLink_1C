---
name: BslQuality
version: 1.0.0
description: BSL Language Server — LSP-based static analysis/linting for 1C:Enterprise BSL and OneScript .os files, including its native MCP-server mode and the ready-made claude-code-bsl-lsp Claude Code plugin. USE WHEN BSL Language Server, bsl-language-server, lint BSL code, 1C code diagnostics, .bsl-language-server.json, install BSL LSP plugin, MCP for BSL, review 1C code quality. NOT FOR the testing frameworks (use VanessaAutomation) or the OneScript runtime itself (use OneScriptReference).
---

# BslQuality

BSL Language Server is the open-source static-analysis backbone for 1C's BSL language and OneScript's `.os` files — and the fastest path to using it inside a Claude Code session is not a hand-written MCP config, it's an official ready-made plugin.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/LIFEOS/USER/CUSTOMIZATIONS/SKILLS/BslQuality/`

If this directory exists, load and apply any `PREFERENCES.md` or additional files found there — a good place for a project's own `.bsl-language-server.json` severity overrides once established. If it does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the BslQuality skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **BslQuality** skill to ACTION...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **ReviewBslCode** | "review this BSL", "lint this module", "check this .bsl file" | `Workflows/ReviewBslCode.md` |

## Quick Reference

- **Core project**: [1c-syntax/bsl-language-server](https://github.com/1c-syntax/bsl-language-server) — LSP for `.bsl` and `.os` files: diagnostics, navigation, formatting, up to LSP 3.18. Config via `.bsl-language-server.json` in the project root.
- **MCP mode**: the server itself can run as an MCP server, exposing `analyze_file`, `document_symbols`, `find_references`, `call_hierarchy`, `hover`, `definition`, `type_info`.
- **Fastest install path — the plugin, not a manual MCP config:**
  ```
  claude /plugin marketplace add 1c-syntax/claude-code-bsl-lsp
  claude /plugin install bsl-language-server@bsl-language-server
  ```
  Auto-downloads the right native binary per OS (no Java dependency), auto-updates, cleans up old versions. On Windows it works via Git Bash (default) or PowerShell 6+.

## Examples

**Example 1: First-time setup**
```
User: "I want AI code review for our BSL modules in Claude Code"
→ Invokes ReviewBslCode workflow
→ Points to the claude-code-bsl-lsp plugin install (two commands) rather than proposing a hand-rolled MCP integration
→ Confirms the plugin installed correctly before running any actual review
```

**Example 2: Reviewing a specific module**
```
User: "Check this module for issues" (with a .bsl file in context)
→ Invokes ReviewBslCode workflow
→ Distinguishes genuine defects (nil-dereference risks, unreachable code) from configurable-severity style rules per .bsl-language-server.json
→ Doesn't report a style-only finding as a bug
```

## Gotchas

- **The Claude Code plugin (`claude-code-bsl-lsp`) is the intended integration path, not a manual MCP server entry.** It's maintained by the same org (`1c-syntax`) as BSL Language Server itself, handles binary installation/updates automatically, and needs no Java runtime — reach for it before building or recommending a custom MCP wrapper for the same capability.
- **BSL Language Server diagnostics are configurable per-severity via `.bsl-language-server.json`** — a finding flagged by the tool isn't automatically "wrong code," some are style/convention rules a project may have deliberately disabled or downgraded. Check the project's config file before reporting a finding as a defect.
- **The server covers both `.bsl` (1C:Enterprise) and `.os` (OneScript) files** — relevant when a project mixes actual 1C configuration code with OneScript automation scripts (e.g. a `vanessa-runner`-adjacent script); both file types get real analysis, not just the 1C side.
