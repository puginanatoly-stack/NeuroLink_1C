# ScaffoldPipeline Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the ScaffoldPipeline workflow in the GitLabCiCd skill to write a new pipeline"}' \
  > /dev/null 2>&1 &
```

Running the **ScaffoldPipeline** workflow in the **GitLabCiCd** skill to write a new pipeline...

## Step 0 — Sufficiency Check

Before writing anything, confirm you know: the project's language/stack (to pick a base image and cache paths), the intended stages (at minimum build/test; ask if deploy targets exist and how many environments), and whether an MR workflow is in use (almost always yes on GitLab — assume it unless told otherwise). If any of these is genuinely unclear from the repo and the conversation, ask up to 3 questions rather than guessing a stack. If close enough to proceed, ship the best-effort version with an inline `⚠️` comment flagging the assumption.

## Deliverable

A `.gitlab-ci.yml` that:

- Opens with a `workflow:rules` block that prevents the MR-pipeline / branch-pipeline duplication described in `KeywordReference.md` — this is not optional, it is the default failure mode of a pipeline written without it.
- Declares explicit `stages:` matching what the project actually needs (resist adding stages nobody asked for).
- Uses `rules:` (not `only`/`except`) for job-level gating.
- Keys any `cache:` on a lockfile/manifest hash via `cache:key:files:`, not on a commit SHA or branch slug — see `KeywordReference.md` for why those two are broken defaults.
- Declares `artifacts:` with an explicit `expire_in` wherever a later stage depends on them, rather than relying on the instance default.
- Includes the relevant GitLab-maintained security-scanning templates (`Security/SAST.gitlab-ci.yml` etc.) when the project has a language they cover, unless told to skip them.
- Comments the non-obvious choices inline — a reader six months from now should understand *why* the workflow:rules block exists, not just that it does.

Check every keyword choice against `KeywordReference.md` before finalizing — in particular `extends:` merge behavior if templates are used, and the `needs:`/DAG interaction if stages are parallelized.

## Constraints

- Nothing machine-specific: no hardcoded absolute paths, no embedded credentials or tokens (use `$CI_JOB_TOKEN` / project CI/CD variables by name only), no assumptions about a specific Runner's tags unless the principal has stated them.
- Prefer the smallest pipeline that actually satisfies the stated stages over a maximal one with speculative jobs "for completeness."
