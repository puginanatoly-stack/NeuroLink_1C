# DiagnoseSerializationError Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DiagnoseSerializationError workflow in the XdtoReference skill to diagnose an XDTO error"}' \
  > /dev/null 2>&1 &
```

Running the **DiagnoseSerializationError** workflow in the **XdtoReference** skill to diagnose an XDTO error...

## Step 0 — Sufficiency Check

Read the actual type definition and the calling code before diagnosing — don't reason purely from the symptom description when the source is available.

## Deliverable

A diagnosis that checks, in order (most common cause first), and stops at the first confirmed match rather than listing every possibility regardless of relevance:

1. **Namespace-URI mismatch** — is `XDTOFactory.Type(...)` actually resolving (non-`Undefined`), or is the symptom really a failed type lookup masquerading as a data problem?
2. **Wrong mechanism for the job** — is the code using `XDTOFactory` where `XDTOSerializer` was actually needed, or vice versa?
3. **Facet mismatch** — precision/scale on numeric fields, or date/timezone handling, inconsistent with what the wire format actually contains.
4. **Genuine data issue** — only after 1–3 are ruled out.

State which check confirmed the diagnosis and why the others were ruled out, so the fix is traceable — not just "try this."

## Constraints

- Don't propose a fix for a cause that hasn't been confirmed against the actual code/config.
- Reference `SKILL.md` Gotchas by name in the diagnosis rather than re-deriving the explanation from scratch.
