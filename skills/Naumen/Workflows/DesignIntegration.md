# DesignIntegration Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DesignIntegration workflow in the Naumen skill to design a Naumen API integration"}' \
  > /dev/null 2>&1 &
```

Running the **DesignIntegration** workflow in the **Naumen** skill to design a Naumen API integration...

## Step 0 — Sufficiency Check

Confirm: which API generation is available on the target instance (REST or SOAP — ask if unknown, don't assume the newer one), the case class/attribute set involved, and whether attribute internal codes are already known or need to be resolved first. If the instance's exact API surface isn't confirmed, say so explicitly in the output rather than presenting a guessed syntax as settled.

## Deliverable

An integration design that:

- States the API generation being targeted and flags it as an assumption if not confirmed by the user.
- Uses attribute codes, not display labels, for every field reference — and calls out any field where the code hasn't been confirmed yet.
- Accounts for auth (API key/token on modern REST, differing on legacy SOAP) without inventing a specific header/scheme name unless it's been stated or is a documented platform default.
- Notes that SLA/deadline fields, if involved, are read from the platform's own computed value rather than recomputed by the integration.

## Constraints

- Don't present a specific endpoint path or method signature as certain when it hasn't been confirmed against the real instance — mark it as "typical shape, verify against your instance" instead.
