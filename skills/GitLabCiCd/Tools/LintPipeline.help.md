# LintPipeline.ts

Fast, deterministic first pass over a `.gitlab-ci.yml` before the reasoning-based review — catches the highest-frequency GitLab CI mistakes without spending a model call. No network access, no credentials, no machine-specific paths; the skill folder stays portable to another computer as-is.

## Usage

```bash
bun ~/.claude/skills/GitLabCiCd/Tools/LintPipeline.ts [path] [options]
```

| Option | Effect |
|---|---|
| `[path]` (positional) | Path to a pipeline file or a directory containing `.gitlab-ci.yml`. Defaults to `./.gitlab-ci.yml`. |
| `--file <path>` | Same as the positional argument; takes precedence if both given. |
| `--json` | Emit findings as a JSON object (`{file, findings[]}`) instead of formatted text. |
| `--quiet` | Print only the one-line summary, suppress individual findings. |
| `--help` | Show usage. |

## What it checks

- Tab characters in indentation (invalid YAML)
- Duplicate top-level keys (YAML mapping keys must be unique — last one silently wins)
- Missing top-level `workflow:` block (the duplicate-pipeline trap)
- `rules:` mixed with `only:`/`except:` in the same job (hard config error)
- `cache:` with no explicit `key:` (shared default key across jobs/branches)
- `cache:key:` built from `$CI_COMMIT_SHA` or `$CI_COMMIT_REF_SLUG` (never reused, or never shared)
- `artifacts:` without `expire_in:` (relies on instance default retention)
- `extends:` combined with a local `variables:` override (extends doesn't deep-merge)

Each finding cites the file:line and points back to the fuller explanation in `SKILL.md`'s Gotchas section or `KeywordReference.md`.

## What it is not

A heuristic indentation-scoped scanner, not a real YAML parser or a GitLab API call — it cannot catch everything a full `gitlab-ci-local` run or GitLab's own CI Lint endpoint would. Treat CRITICAL/WARN findings as "check this," not as ground truth, and always let the ReviewPipeline workflow's reasoning pass follow up on anything it flags, especially before concluding a pipeline is broken.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | No findings, or INFO-only |
| `1` | At least one WARN, no CRITICAL |
| `2` | At least one CRITICAL, or the target file doesn't exist |

## Example

```bash
$ bun ~/.claude/skills/GitLabCiCd/Tools/LintPipeline.ts --file ./.gitlab-ci.yml
CRITICAL .gitlab-ci.yml:1 — No top-level workflow: block found — ...
   see: SKILL.md Gotchas: 'No workflow:rules → duplicate pipelines'; KeywordReference.md § workflow:rules
WARN [build_job] .gitlab-ci.yml:14 — job "build_job" cache key is unique per commit ...
   see: SKILL.md Gotchas: 'Cache is not reused unless the key: is stable'

LintPipeline: 1 critical, 1 warning(s), 0 info — .gitlab-ci.yml
```
