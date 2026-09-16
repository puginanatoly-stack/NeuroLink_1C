---
name: sonarqube
description: "SonarQube quality gate and code analysis for 1C projects. Check quality gate status, search for issues (code smells, bugs, vulnerabilities), analyze metrics, and troubleshoot failed gates. Use when SonarQube scanner fails in CI, when investigating quality gate failures, or when analyzing project code quality."
---

# SonarQube skill

Query the SonarQube API to inspect quality gates, issues, and metrics for 1C projects.

## Configuration

Parameters from `.dev.env` (project root):

| Parameter | Description | Default |
|-----------|-------------|---------|
| `SONAR_URL` | SonarQube server URL | `https://sonar.example.com` |
| `SONAR_TOKEN` | API token for authentication | (from `.dev.env`) |
| `SONAR_PROJECT` | Default project key | `<your-project-key>` |

Authentication: HTTP Basic Auth with token as username, empty password.
```
Authorization: Basic base64(token:)
```

## API reference

Base URL: `{SONAR_URL}/api`

### Quality gate

Get project quality gate status:
```
GET /api/qualitygates/project_status?projectKey={projectKey}&branch={branch}
```

Response fields:
- `projectStatus.status` — `OK` or `ERROR`
- `projectStatus.conditions[]` — array of conditions with:
  - `metricKey` — metric name
  - `status` — `OK`, `ERROR`, or missing (= no data)
  - `errorThreshold` — threshold value
  - `actualValue` — current value
- `projectStatus.periods[0].parameter` — previous version for New Code period

### Issues search

Search for issues with the New Code (leak) period:
```
GET /api/issues/search?componentKeys={projectKey}&branch={branch}&sinceLeakPeriod=true&types=CODE_SMELL&statuses=OPEN,CONFIRMED,REOPENED&ps=10&facets=severities,rules
```

Key parameters:
- `componentKeys` — project key (not `project` or `projectKey`)
- `branch` — branch name
- `sinceLeakPeriod` — `true` for New Code only
- `types` — `CODE_SMELL`, `BUG`, `VULNERABILITY`
- `statuses` — `OPEN`, `CONFIRMED`, `REOPENED`, `RESOLVED`
- `severities` — `INFO`, `MINOR`, `MAJOR`, `CRITICAL`, `BLOCKER`
- `rules` — rule key filter (e.g. `bsl-language-server:CodeOutOfRegion`)
- `ps` — page size
- `facets` — aggregate counts: `severities`, `rules`, `types`
- `assigned` — `true` / `false`
- `resolved` — `true` / `false`
- `createdAfter` — ISO date filter

Response:
- `total` — total count
- `issues[]` — array of issues with:
  - `key` — issue key
  - `rule` — rule identifier
  - `severity` — INFO/MINOR/MAJOR/CRITICAL/BLOCKER
  - `component` — file path
  - `line` — line number
  - `status` — OPEN/CONFIRMED/REOPENED/RESOLVED
  - `resolution` — FALSE-POSITIVE/WONTFIX/FIXED (only when RESOLVED)
  - `message` — issue description
  - `author` — who introduced it
  - `creationDate` — ISO timestamp
  - `tags[]` — rule tags
  - `debt` — estimated remediation time

### Measures / metrics

Get project metrics:
```
GET /api/measures/component?component={projectKey}&branch={branch}&metricKeys=code_smells,bugs,vulnerabilities,new_code_smells,new_bugs,new_vulnerabilities
```

## Workflow: diagnose failed quality gate

1. Call `qualitygates/project_status` to see which condition(s) failed
2. Call `issues/search` with `sinceLeakPeriod=true&statuses=OPEN,CONFIRMED,REOPENED&facets=severities,rules` for each failed type (CODE_SMELL, BUG, VULNERABILITY)
3. Use facets to understand the distribution
4. If needed, drill down by rule or severity with additional filters
5. Report: count, top rules, affected extensions/paths, severity breakdown

## Common SonarQube 9.9 BSL rules

| Rule key | Description | Severity |
|----------|-------------|----------|
| `bsl-language-server:CodeOutOfRegion` | Code outside of any region block | INFO |
| `bsl-language-server:NonStandardRegion` | Non-standard region name | INFO |
| `bsl-language-server:RedundantAccessToObject` | Redundant `ЭтотОбъект` access | INFO |
| `bsl-language-server:UsingThisForm` | Deprecated `ЭтаФорма` usage | MINOR |
| `bsl-language-server:CompilationDirectiveLost` | Missing compilation directive | INFO |
| `bsl-language-server:CompilationDirectiveNeedLess` | Unnecessary compilation directive | INFO |

## PowerShell query pattern

```powershell
$token = "<token>"
$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${token}:"))
$uri = "{SONAR_URL}/api/<endpoint>"
Invoke-WebRequest -Uri $uri -Headers @{Authorization="Basic $base64"} -UseBasicParsing
```
