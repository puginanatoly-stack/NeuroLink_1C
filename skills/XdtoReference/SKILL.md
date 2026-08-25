---
name: XdtoReference
version: 1.0.0
description: 1C:Enterprise XDTO — the factory-based XML type system behind web-service serialization and EnterpriseData/exchange-plan XML formats. USE WHEN XDTO, XDTOFactory, ФабрикаXDTO, XDTOSerializer, 1C web service parameter types, SOAP data exchange in 1C, XDTO package or namespace, exchange plan XML format, WSDL type mismatch in 1C. NOT FOR 1C query language or general metadata work, or non-1C XML/SOAP.
---

# XdtoReference

1C:Enterprise's XDTO subsystem — an XML-Schema-like type system used for web-service parameters and for the XML exchange formats behind EnterpriseData-style exchange plans. Two mechanisms get confused constantly: `XDTOFactory` (schema-defined types you register yourself) and `XDTOSerializer` (generic serialization of ordinary platform values with no schema needed) — most XDTO bugs trace back to using the wrong one.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/LIFEOS/USER/CUSTOMIZATIONS/SKILLS/XdtoReference/`

If this directory exists, load and apply any `PREFERENCES.md` or additional files found there. If it does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the XdtoReference skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **XdtoReference** skill to ACTION...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **DesignExchangeType** | "define an XDTO package/type for X", "design an exchange format" | `Workflows/DesignExchangeType.md` |
| **DiagnoseSerializationError** | "XDTO error", "web service returns Undefined/null unexpectedly", "WSDL type mismatch" | `Workflows/DiagnoseSerializationError.md` |

## Quick Reference

- **`XDTOFactory`** — for schema-defined types you (or a web-service contract) declared: `XDTOFactory.Type(namespaceURI, typeName)` then `XDTOFactory.Create(type)`. Requires an exact namespace-URI match.
- **`XDTOSerializer`** — for turning ordinary 1C values (references, primitives, structures) into XDTO without declaring a schema first. Different object, different mental model — don't reach for `XDTOFactory` when the real need is "just serialize this value."
- 1C metadata objects (catalogs, documents, etc.) are **not** directly XDTO-serializable via `XDTOFactory` — they need either `XDTOSerializer` (generic) or an explicit exchange-format type definition.

## Examples

**Example 1: New exchange format**
```
User: "I need to define an XDTO type for exchanging Order documents with a partner system"
→ Invokes DesignExchangeType workflow
→ Produces the XDTO package/type structure, with namespace-URI and facet choices explained
→ Flags date/decimal serialization choices that need a decision, not guesses
```

**Example 2: Debugging a web-service call**
```
User: "Our 1C web service returns Undefined for a parameter that should have data"
→ Invokes DiagnoseSerializationError workflow
→ Checks namespace-URI match first (the most common silent-failure cause)
→ Walks through the remaining known failure modes if that's not it
```

## Gotchas

- **`XDTOFactory.Type(namespaceURI, typeName)` returns `Undefined`, not an error, when the namespace URI doesn't match exactly** (including trailing-slash differences) — this is the single most common "XDTO isn't working" report, and it looks like a data problem, not a lookup problem, until you check the type lookup itself.
- **`XDTOFactory` and `XDTOSerializer` are not interchangeable and solve different problems.** `XDTOFactory` requires a pre-declared schema (an XDTO package) and gives exact control over the wire format — needed for web-service contracts and WSDL compliance. `XDTOSerializer` needs no schema and serializes 1C values generically — needed for ad hoc value transport, not for matching an external contract.
- **Date/time serialization depends on the XDTO type's facets, not on 1C's internal representation.** 1C `Date` values are naive (no timezone); if the XDTO type is a timezone-qualified `dateTime`, the platform's own timezone-handling choice at serialization time can silently shift values by the local UTC offset — verify against the actual bytes on the wire, not just the 1C-side value, when a partner system reports off-by-hours discrepancies.
- **Numeric facets (precision/scale) on an XDTO type are enforced at write time**, not just documentation — a 1C `Number` with more decimal places than the type's `scale` facet allows is truncated or raises an exception depending on the facet's `whiteSpace`/validation settings, not preserved as-is.
- **Exchange-plan XML formats (EnterpriseData and similar) layer their own type/package conventions on top of raw XDTO** — treat "I need an EnterpriseData-compatible format" as a stricter, more constrained case of general XDTO type design, not the same task with different names.
