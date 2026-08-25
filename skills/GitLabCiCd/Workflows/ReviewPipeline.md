# ReviewPipeline Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the ReviewPipeline workflow in the GitLabCiCd skill to audit an existing pipeline"}' \
  > /dev/null 2>&1 &
```

Running the **ReviewPipeline** workflow in the **GitLabCiCd** skill to audit an existing pipeline...

## Step 0 — Sufficiency Check

Read the actual `.gitlab-ci.yml` (and any `include:`d local files it references) before diagnosing anything — do not reason about a pipeline's behavior from a description of symptoms alone when the file is available to read.

## Fast First Pass

Before the reasoning-based read, run the deterministic scanner — it catches the highest-frequency mistakes for free and gives the reasoning pass a starting point instead of a blank file:

```bash
bun ~/.claude/skills/GitLabCiCd/Tools/LintPipeline.ts --file <path-to-.gitlab-ci.yml>
```

Its findings are heuristic (see `Tools/LintPipeline.help.md` for exact coverage and limits) — confirm each one against the actual file content during the deeper review rather than reporting it verbatim, and don't stop at its output if the symptom described isn't explained by anything it flagged.

## Deliverable

A findings list, most-impactful first, where each finding:

- Names the specific keyword or block responsible (e.g. "missing top-level `workflow:rules`", "cache keyed on `$CI_COMMIT_SHA`").
- States the observable symptom it causes (duplicate pipelines, cache never hits, secret leaking in logs, job order not what's expected).
- Cross-checks against `KeywordReference.md` and the Gotchas section in `SKILL.md` before being reported — don't report a "problem" that's actually correct GitLab behavior.
- Comes with a minimal diff, not a rewrite of the file — the goal is the smallest change that fixes the finding, preserving everything else about the pipeline's existing structure and style.

If the reported symptom is "slow," check in order: whether jobs that could run in parallel are serialized by unnecessary `needs:`/stage ordering, whether cache is actually being hit (key stability), and whether artifacts larger than necessary are being passed between stages — in that order, since they're the three most common causes.

If the reported symptom is "runs twice" or "duplicate pipeline," check `workflow:rules` first — this is the cause in the large majority of cases.

## Constraints

- Read before speculating: don't propose fixes for keywords you haven't confirmed are actually present or absent in the file.
- Keep the diff minimal — a review is not an invitation to also restyle unrelated jobs.
