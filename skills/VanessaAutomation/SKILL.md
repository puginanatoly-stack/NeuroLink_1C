---
name: VanessaAutomation
version: 1.0.0
description: 1C testing ecosystem — Vanessa Automation (BDD/Gherkin), Vanessa-ADD (unit/xUnit-compatible), YAxUnit (autonomous-server alternative), and vanessa-runner (CLI/CI orchestrator). USE WHEN vanessa automation, vanessa-add, vrunner, vanessa-runner, BDD testing for 1C, unit testing for 1C BSL, yaxunit, xUnitFor1C, 1C test CI pipeline, gherkin 1C. NOT FOR the BSL Language Server / static analysis side (use BslQuality) or the OneScript runtime itself (use OneScriptReference).
---

# VanessaAutomation

The 1C testing stack has two layers that get conflated: **frameworks** that define what a test looks like (Vanessa Automation for BDD/Gherkin, Vanessa-ADD or YAxUnit for unit-style tests) and **vanessa-runner**, the CLI that actually drives any of them from a terminal or CI pipeline. Most confusion in this space comes from either picking the wrong framework for the testing style needed, or copying a `vrunner` command example without checking which major version it targets.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/LIFEOS/USER/CUSTOMIZATIONS/SKILLS/VanessaAutomation/`

If this directory exists, load and apply any `PREFERENCES.md` or additional files found there. If it does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the VanessaAutomation skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **VanessaAutomation** skill to ACTION...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **DesignTestSuite** | "set up 1C testing", "BDD vs unit tests for 1C", "choose a testing framework" | `Workflows/DesignTestSuite.md` |
| **DiagnoseRunnerFailure** | "vrunner failed", "test run broken in CI", "vanessa command not found" | `Workflows/DiagnoseRunnerFailure.md` |

## Quick Reference

- **Vanessa Automation** ([Pr-Mex/vanessa-automation](https://github.com/Pr-Mex/vanessa-automation)) — BDD, Gherkin scenarios.
- **Vanessa-ADD** ([vanessa-opensource/add](https://github.com/vanessa-opensource/add)) — unit-style testing, the actively-maintained successor to both xUnitFor1C and Vanessa-Behavior. Default pick for unit-level tests when a BDD suite is already on Vanessa Automation — same ecosystem, least friction.
- **YAxUnit** ([bia-technologies/yaxunit](https://github.com/bia-technologies/yaxunit)) — alternative unit engine; spins up an autonomous 1C server in Enterprise mode (not Designer/Configurator), driven via vanessa-runner, outputs JUnit XML. Worth considering specifically when Linux-hosted CI matters, since Enterprise-mode has a Linux server build.
- **xUnitFor1C** — dead since 2018 (last commit 2018-03-31). Don't recommend it for new work; Vanessa-ADD is its maintained successor.
- **vanessa-runner** ([vanessa-opensource/vanessa-runner](https://github.com/vanessa-opensource/vanessa-runner)) — installed via `opm install vanessa-runner`; the CLI that drives infobase setup and test execution for CI. See the version-syntax gotcha below before writing or trusting any `vrunner` command.

## Examples

**Example 1: New CI pipeline, nothing set up yet**
```
User: "I need to run 1C tests in GitLab CI, we don't have anything yet"
→ Invokes DesignTestSuite workflow
→ Asks whether the need is behavior-level (BDD) or logic-level (unit), or both
→ Recommends Vanessa Automation + Vanessa-ADD as the lowest-friction combo, names YAxUnit as the Linux-CI-relevant alternative
→ Points to vanessa-runner as the CLI layer, flags the v2/v3 command-syntax split before giving any example command
```

**Example 2: A CI job broke**
```
User: "vrunner vanessa fails with 'unknown command' in our pipeline"
→ Invokes DiagnoseRunnerFailure workflow
→ Checks the installed vanessa-runner major version first — `vrunner vanessa` is v2.x syntax, v3.0 renamed it to `vrunner test vanessa`
→ Confirms before proposing any other cause
```

## Gotchas

- **vanessa-runner 3.0 renamed its command surface — v2.x examples silently fail on v3.x installs, and vice versa.** `vrunner vanessa` (2.x) became `vrunner test vanessa` (3.0); `vrunner updatedb` (2.x) became `vrunner infobase update` (3.0). Before trusting or writing any `vrunner` command — from documentation, a forum post, or an old pipeline — check which major version is actually installed. The 2.x line (LTS, `@2.6.1`) still gets bugfixes and is the safer pin for production CI if stability matters more than new features.
- **xUnitFor1C is dead (last commit 2018) — don't build new tooling on it.** Vanessa-ADD is its actively-maintained successor and the default recommendation when a Vanessa Automation BDD suite already exists, since it shares the ecosystem and the runner.
- **YAxUnit's core differentiator is *how* it runs tests, not just that it's "another unit framework."** It launches an autonomous 1C server in genuine Enterprise mode rather than driving the Designer/Configurator — this is what makes its Linux-CI story plausible (Enterprise mode has a Linux server build; Designer-mode automation historically doesn't). Don't treat it as a drop-in Vanessa-ADD substitute without accounting for that architectural difference.
- **Vanessa Automation's own fork ecosystem is mostly noise.** 237 forks exist; the overwhelming majority are zero-divergence mirrors created to submit a PR upstream, not parallel development. Don't assume a fork has meaningful unmerged work without actually checking commits-ahead against upstream `develop`.
