# GitLab CI/CD Keyword Reference

Condensed semantics for the keywords that most often get misused. This is a reference to check claims against, not a tutorial — read the section that matters for the job at hand.

## `workflow:rules` (pipeline-level gate)

Runs once, before any job is evaluated, and decides whether a pipeline for this event exists at all. The most common correct pattern is: run an MR pipeline when one is open, otherwise run a branch pipeline, and skip everything else:

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG
```

Without this block, GitLab's default is to run a pipeline for every push AND every MR event independently — the duplicate-pipeline trap.

## `rules:` (job-level gate)

Evaluated top-to-bottom per job; first matching entry wins, and its `when:` (default `on_success`) decides whether the job runs, and how. Common entries:

```yaml
rules:
  - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    changes: [src/**/*]
  - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    when: manual
  - when: never
```

`changes:` only evaluates reliably in MR pipelines (GitLab needs a diff target); in branch/tag pipelines it falls back to comparing against the previous pipeline's SHA, which is a weaker signal — don't rely on it there for correctness-critical gating.

## `needs:` (DAG execution)

Overrides stage-sequential execution for the job that declares it. `needs: [job_a, job_b]` starts as soon as `job_a` and `job_b` finish, regardless of what else is still running in earlier stages. `needs: []` means no dependencies at all — starts immediately at pipeline start. A job's own `stage:` still determines its position for `needs`-less jobs that depend on "the previous stage," so mixing DAG and non-DAG jobs in one pipeline needs care about which jobs implicitly depend on stage completion.

`needs: [{job: build, artifacts: true}]` (the default) pulls that job's artifacts; `artifacts: false` skips them if only the pass/fail signal is needed, saving transfer time.

## `extends:` (template reuse)

Static, config-time merge — resolved before the pipeline runs, unlike `include:` which pulls in whole files. Merge behavior per key type:

- **Hashes** (e.g. `variables:`): merged key-by-key, child wins on conflicts — but *only one level deep*. A nested hash inside a hash is replaced wholesale, not merged further.
- **Arrays** (e.g. `script:`, `tags:`): replaced wholesale, never concatenated. A job extending a template and adding one script line must repeat the template's script lines too, or lose them.
- Multiple inheritance is allowed (`extends: [.template_a, .template_b]`) — later entries win on conflicts.

## `include:` (file composition)

Four forms: `local`, `file` (another project), `remote` (URL), `template` (GitLab-maintained). Included YAML is merged into the root config *before* `extends` resolution happens, so an `include`d template's job can itself be `extends`ed by a job in the root file. Relative paths referenced *inside* an included file (e.g. a `script:` calling `./scripts/foo.sh`) resolve against the **including** project's repository root, not the included file's own project — a shared template referencing its own bundled scripts will not find them in a consuming project unless that path is copied too.

## `cache:` vs `artifacts:`

- **`cache:`** — speeds up subsequent runs; not guaranteed to exist (best-effort, can be evicted); use for dependency directories (`node_modules`, `.m2`, `vendor/`).
- **`artifacts:`** — guaranteed to pass between jobs/stages in the same pipeline; has an `expire_in` (defaults to the instance setting, commonly 30 days) after which GitLab deletes them — a later manual/scheduled job that needs an artifact from an old pipeline will fail once it expires.

Cache key stability matters more than almost anything else for cache to actually help:

```yaml
cache:
  key:
    files: [package-lock.json]   # cache invalidates only when the lockfile changes
  paths: [node_modules/]
```

A key built from `$CI_COMMIT_SHA` is unique per commit (never reused — pointless). A key built from `$CI_COMMIT_REF_SLUG` is branch-scoped (never shared across branches — wastes cache on every new branch). `cache:key:files:` keyed on the lockfile is almost always the right default.

## Predefined variables worth knowing by name

| Variable | What it is | Common misuse |
|---|---|---|
| `CI_PIPELINE_SOURCE` | Why this pipeline exists (`push`, `merge_request_event`, `schedule`, `web`, `api`, ...) | The correct thing to branch `workflow:rules` on, not `CI_COMMIT_BRANCH` alone |
| `CI_COMMIT_BRANCH` | Set only on branch pipelines, empty on MR/tag pipelines | Checking it in a job that also needs to run in MR pipelines silently no-ops |
| `CI_MERGE_REQUEST_IID` | Set only inside MR pipelines | Using it unconditionally breaks branch pipelines |
| `CI_DEFAULT_BRANCH` | The project's actual default branch name | Prefer this over hardcoding `main`/`master` |
| `CI_COMMIT_REF_SLUG` | URL/DNS-safe branch or tag name | Good for dynamic environment URLs, bad for cache keys (see above) |

## Security scanning templates

GitLab ships maintained `include: template:` files for SAST, dependency scanning, secret detection, and container scanning:

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
```

These auto-detect the project's languages and add jobs to a `test` stage (configurable). They're maintained upstream — pin a specific version via `include: - project: ...  ref: <tag>` only if reproducibility matters more than picking up template fixes automatically; otherwise track the default branch of the template.
