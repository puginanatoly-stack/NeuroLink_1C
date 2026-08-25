# DesignTestSuite Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DesignTestSuite workflow in the VanessaAutomation skill to design a 1C test suite"}' \
  > /dev/null 2>&1 &
```

Running the **DesignTestSuite** workflow in the **VanessaAutomation** skill to design a 1C test suite...

## Step 0 — Sufficiency Check

Confirm what's already in place (nothing? an existing BDD suite? an existing unit framework?), whether the CI host is Windows or Linux (or undecided), and whether the testing need is behavior-level (user-facing scenarios), logic-level (calculation/business-rule correctness), or both. Don't default to "set up everything" when the actual need is narrower.

## Deliverable

A testing-stack design that states, explicitly:

- **Framework choice per level**: Vanessa Automation for BDD if behavior-level coverage is needed; Vanessa-ADD for unit-level if a BDD suite already exists or is planned (lowest ecosystem friction); YAxUnit named as the alternative specifically when Linux CI is a real requirement, with the caveat that its Linux-compatibility claim needs a technical check on the actual target infrastructure, not just documentation.
- **vanessa-runner as the CLI layer**, with the major version pinned explicitly (2.x LTS vs 3.0) and commands written for that version only — never a mixed example.
- **What's out of scope**: don't propose BSL static analysis/linting as part of a "testing" deliverable — that's `BslQuality`, a separate concern.

## Constraints

- Don't recommend xUnitFor1C — it's dead, this is a factual gotcha not a preference.
- Don't present YAxUnit's Linux-server architecture as a confirmed solution to a Windows-to-Linux CI migration question — name it as the promising, unverified lead that it is, and say what a real verification would involve (a test run against the actual target Linux host).
