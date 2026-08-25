---
name: GitLabCiCd
version: 1.0.0
description: GitLab CI/CD pipeline engineering — designs and reviews .gitlab-ci.yml pipelines, GitLab Runner setup, stage/job structure, rules-based triggers, caching and artifact strategy, DAG needs, includes/extends, and security-scanning templates. USE WHEN gitlab ci, .gitlab-ci.yml, gitlab pipeline, gitlab runner, ci/cd config for gitlab, build stages, optimize pipeline, pipeline is slow, pipeline running twice, DAG needs, gitlab includes or extends, SAST or dependency scanning setup. NOT FOR GitHub Actions, Jenkins, or other non-GitLab CI systems.
---

# GitLabCiCd

Designs new GitLab CI/CD pipelines and reviews existing ones against GitLab-specific semantics that are easy to get subtly wrong — `rules:` vs the deprecated `only`/`except`, cache-key stability, `extends`/`include` merge behavior, and duplicate-pipeline triggers.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/LIFEOS/USER/CUSTOMIZATIONS/SKILLS/GitLabCiCd/`

If this directory exists, load and apply any `PREFERENCES.md` or additional files found there (e.g. a house-style stage naming convention, a preferred base image, an internal registry prefix). If the directory does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the GitLabCiCd skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **GitLabCiCd** skill to ACTION...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **ScaffoldPipeline** | "set up gitlab ci", "write a .gitlab-ci.yml", "add a pipeline for this project" | `Workflows/ScaffoldPipeline.md` |
| **ReviewPipeline** | "review my gitlab-ci.yml", "why is my pipeline slow/failing/duplicated", "optimize this pipeline" | `Workflows/ReviewPipeline.md` |

## Quick Reference

- **Full keyword semantics** (rules, needs, cache, extends/include, predefined variables, security templates): `KeywordReference.md` — read it before writing or reviewing any non-trivial pipeline.
- **Fast deterministic scan of an existing pipeline:** `bun Tools/LintPipeline.ts --file <path>` — catches the highest-frequency gotchas below without a model call; see `Tools/LintPipeline.help.md`. ReviewPipeline runs this automatically as its first pass.
- Always check for an existing `workflow:rules` block first — its absence is the single most common cause of duplicated pipelines (see Gotchas).
- Never guess a GitLab Runner's registered tags or executor type — ask, or read the project's Settings → CI/CD → Runners if the principal has given repo access.

## Examples

**Example 1: New pipeline from scratch**
```
User: "Set up GitLab CI for this Node project — build, test, deploy to staging on main"
→ Invokes ScaffoldPipeline workflow
→ Produces a .gitlab-ci.yml with stages, rules-based triggers, cache keyed on the lockfile, and a workflow:rules block that prevents duplicate MR+branch pipelines
→ Explains each non-obvious choice inline as YAML comments
```

**Example 2: Diagnosing a slow or duplicated pipeline**
```
User: "My pipeline runs twice on every push and takes 12 minutes — why?"
→ Invokes ReviewPipeline workflow
→ Reads the existing .gitlab-ci.yml, flags the missing workflow:rules and the unkeyed cache
→ Proposes a minimal diff, not a rewrite
```

**Example 3: Portable use on a different machine**
```
User: (on a second computer, skill folder copied over) "Review this .gitlab-ci.yml"
→ Skill has no machine-specific paths or credentials, so it runs identically
→ Invokes ReviewPipeline workflow directly
```

## Gotchas

- **No `workflow:rules` → duplicate pipelines.** A job with no `rules:`/`only:` runs on both a branch push AND the pipeline for any open MR against that branch — same commit, two pipelines, double CI minutes. Fix with a top-level `workflow:rules` block that picks one pipeline type per event (typically: MR pipeline when an MR is open, branch pipeline otherwise).
- **`rules:` and `only`/`except` cannot be mixed on the same job.** `only`/`except` are legacy and still parse, but combining them with `rules:` on one job is a hard config error, not a silent merge.
- **`extends` replaces arrays and hashes wholesale for a given key, it does not deep-merge them.** A job that extends a template and redefines `variables:` loses every variable from the template that it didn't repeat — a very common source of "why did my CI_ENV disappear."
- **`needs:` breaks implicit stage-ordering guarantees.** A job with `needs: [job_in_earlier_stage]` can start before other jobs in its own stage finish (DAG mode) — this is the point of `needs:`, but it also means `needs: []` means "start immediately, ignore stage order entirely," which surprises people who expect stage boundaries to still apply.
- **Cache is not reused unless the `key:` is stable.** A cache key built from `$CI_COMMIT_REF_SLUG` is branch-scoped and never shared across branches; a key from `$CI_COMMIT_SHA` never gets reused at all (it's unique every commit). Key from the lockfile hash (e.g. `${{ checksum ... }}`-equivalent via `cache:key:files:`) is usually what's actually wanted.
- **`include:`d local files resolve relative paths against the including project, not the included file's own repo.** A shared `include`d template referencing `./scripts/foo.sh` breaks silently for every consuming project unless it ships that path too.
- **Default `image`/`before_script` at top level apply to every job**, including ones that don't want them — a job needs an explicit empty override (`before_script: []`) to opt out, not just omission.
- **Masked CI/CD variables have hard requirements** (no line breaks, minimum length, restricted character set) — a variable that doesn't meet them silently fails to mask and prints in plaintext in job logs. Check the masking rule before assuming a secret is protected.
