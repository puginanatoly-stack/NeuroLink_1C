# DiagnoseScriptError Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DiagnoseScriptError workflow in the Naumen skill to diagnose a Groovy business rule error"}' \
  > /dev/null 2>&1 &
```

Running the **DiagnoseScriptError** workflow in the **Naumen** skill to diagnose a Groovy business rule error...

## Step 0 — Sufficiency Check

Read the actual script and the error message/stack trace before diagnosing — Groovy errors (NPE on a non-null-safe chain, type coercion failures) are usually precise about the failing line, and reasoning from a paraphrase loses that.

## Deliverable

A diagnosis grounded in Groovy/JVM semantics first:

- Null-handling: is a `?.`/`?:` missing where the platform can legitimately hand the script a null (e.g. an optional attribute)?
- Truthiness: is the script relying on Groovy's truthy/falsy coercion (empty string, empty collection, zero) in a way that doesn't match what the author intended?
- Typing: is a dynamic-vs-static typing mismatch producing a `ClassCastException` or `MissingMethodException` at a point where the actual runtime type differs from what the script assumed?
- Only after those are ruled out, treat it as a genuine platform/API usage error — and flag per the Verification gotcha that the exact API surface should be checked against the instance if the fix depends on a specific method signature.

## Constraints

- Don't propose a fix that depends on a specific Naumen class/method name without flagging it as unverified against the actual instance.
