---
name: Naparnik
version: 1.0.0
description: Direct internet API client for 1С:Напарник (code.1c.ai) when the local onec-code-check-mcp MCP server (port 8007) is unavailable or unconfigured — ping token, ask questions, agentic code review with severity categories, and a full GitLab MR review / feature-branch analysis workflow parameterized for any GitLab instance, with a publish-only-after-explicit-approval gate for GitLab/Jira comments. USE WHEN ask Напарник напрямую, 1С:Напарник без локального MCP, review a merge request, agentic code review with severity, check ONEC_AI_TOKEN, code.1c.ai. NOT FOR the local MCP flow when onec-code-check-mcp:8007 is up (use its MCP tools directly instead).
---

# Naparnik

Direct HTTPS client for 1С:Напарник (`https://code.1c.ai`, model 1C:Workmate) — bypasses
a local `onec-code-check-mcp` MCP server entirely. Use when that server (if you run one) is
down or unconfigured, or from a machine that doesn't have it wired up.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the Naparnik skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```
2. **Output text notification**: `Running the **WorkflowName** workflow in the **Naparnik** skill to ACTION...`

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **AskNaparnik** | "ask Напарник", "ping token", quick question about 1C syntax/code | `Workflows/AskNaparnik.md` |
| **ReviewMergeRequest** | "review this MR", "review merge request !<IID>" | `Workflows/ReviewMergeRequest.md` |
| **AnalyzeFeatureBranches** | "check recent feature branches", "what got committed recently" | `Workflows/AnalyzeFeatureBranches.md` |

## Quick Reference

- **Base URL:** `https://code.1c.ai`. Token from `https://code.1c.ai/tokens/` (1С:ИТС auth). Resolution order in `Tools/Naparnik.ps1`: `-Token` → `$env:ONEC_AI_TOKEN` → `ONEC_AI_TOKEN=` line in `~/.claude/.env` → `ONEC_AI_TOKEN=` line in `.dev.env` in the current directory.
- **GitLab host/project are never hardcoded** — `Tools/FetchMrDiff.ps1` and the MR-review workflow read `$env:NAPARNIK_GITLAB_HOST` / `$env:NAPARNIK_GITLAB_PROJECT` / `$env:NAPARNIK_GITLAB_PROJECT_ID`. Set these once as persistent user env vars for your own GitLab instance and project before running the MR workflows.
- **`glab` CLI** (`%LOCALAPPDATA%\Programs\GLab\glab.exe`, falls back to `glab` on PATH) does the actual GitLab API calls — install and `glab auth login --hostname <your-host>` first.
- **`review` mode is agentic** — Напарник calls its own tools (syntax check, doc search) and returns severity-tagged findings. `raw` is a plain answer, no tool loop.

## Examples

**Example 1: Quick syntax question, no MR involved**
```
User: "ask Напарник how to find duplicates in a catalog"
→ AskNaparnik workflow, Command=ask, SkillName=raw
```

**Example 2: Review an open MR end-to-end**
```
User: "review MR !2138"
→ ReviewMergeRequest workflow: FetchMrDiff.ps1 → Naparnik.ps1 ask -SkillName review
→ Format findings by severity → show user → wait for explicit approval → post via glab
```

## Gotchas

- **Never publish a GitLab/Jira comment without explicit user approval, every single time.** Show the formatted text, wait for an explicit go-ahead, then publish. A prior approval on a different MR/ticket is not a standing approval.
- **`.ps1` files with Cyrillic content must be UTF-8-with-BOM**, or PowerShell 5.1 parses them as ANSI and the Cyrillic/dashes break the script's own syntax. After any edit to `Tools/*.ps1`, re-save with BOM: `[System.IO.File]::WriteAllText($p, [System.IO.File]::ReadAllText($p,[Text.Encoding]::UTF8), (New-Object System.Text.UTF8Encoding($true)))`.
- **Encoding corruption from `glab` output causes false "critical" findings.** If a diff is captured without `[Console]::OutputEncoding = UTF8` set first, PowerShell reads `glab`'s stdout as cp866 and Cyrillic (`ВЫБРАТЬ` → `╨Т╨л╨С…`) reaches Напарник mangled — it will then flag a false positive ("malformed query") instead of reviewing the actual code. Both `Tools/*.ps1` already set this; don't strip it when editing. Verify with `$text.IndexOf([char]0x2568) -eq -1` before sending.
- **A `tool_calls` response with no final text means the agent loop didn't converge** — if you see `ERR: API не вернул текстовый ответ`, rerun with `-NewSession -SkillName raw`.
- **Session continuity is filesystem-based** (`%TEMP%\naparnik_session.json`) — a stale session from an unrelated earlier task will silently continue that conversation unless `-NewSession` is passed. Default to `-NewSession` for anything that isn't an explicit follow-up.
- **The token is a secret** — never echo it, never commit it. `ping` reports validity only, never the token value itself.

## Errors

| Симптом | Действие |
|---------|----------|
| `401`/`403` on `ping` | Токен невалиден/истёк — новый на `https://code.1c.ai/tokens/` |
| No network / timeout | Проверить доступность `code.1c.ai` |
| `ERR: токен не найден` | Задать `-Token`, `ONEC_AI_TOKEN` в `~/.claude/.env`, или `.dev.env` в текущей директории |
