# DesignExchangeType Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DesignExchangeType workflow in the XdtoReference skill to design an XDTO exchange type"}' \
  > /dev/null 2>&1 &
```

Running the **DesignExchangeType** workflow in the **XdtoReference** skill to design an XDTO exchange type...

## Step 0 — Sufficiency Check

Confirm you know: the data structure being exchanged (fields, types, nesting), which side owns the schema (are you matching an existing partner WSDL/XSD, or defining a new contract), and whether this is a one-off web-service parameter type or a recurring exchange-plan format. If the partner's schema already exists, ask for it rather than inventing a compatible-looking one — a guessed namespace URI is the most common source of the silent-Undefined gotcha.

## Deliverable

An XDTO package/type definition (as 1C configuration XML or as the equivalent `XDTOFactory`-facing description, whichever the conversation's context calls for) that:

- Uses an explicit, deliberately chosen namespace URI — never a placeholder left for later, since a mismatch fails silently rather than erroring.
- States precision/scale facets for every numeric field and whether date fields need timezone qualification, rather than leaving platform defaults to decide silently.
- Notes explicitly whether the design targets `XDTOFactory` (schema-first, for a web-service contract) or is really better served by `XDTOSerializer` (no schema needed) — don't build schema machinery for a problem that's actually "just serialize this value."
- Flags any field whose type can't be pinned down from the conversation with a `⚠️` note rather than guessing.

## Constraints

- Don't assume a namespace URI convention that hasn't been stated — ask if the target system's contract isn't known.
- Keep the type as narrow as the actual exchange need — don't add speculative fields "in case they're needed later."
