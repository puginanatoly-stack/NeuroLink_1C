---
name: Naumen
version: 1.0.0
description: Naumen SMP / Service Desk ITSM platform — Groovy-based scripting engine conventions, REST/SOAP integration patterns, and case/SLA object-model gotchas. USE WHEN Naumen, Naumen SMP, Naumen Service Desk, naumen scripting, naumen groovy script, naumen REST API, naumen case automation, naumen integration, naumen SLA. NOT FOR other ITSM platforms (ServiceNow, Jira Service Management — no existing skill covers those).
---

# Naumen

Naumen SMP/Service Desk automates business rules and event handlers through an embedded Groovy scripting engine, and exposes REST (modern versions) or SOAP (legacy) APIs for integration. This skill covers general, version-independent platform conventions — see the Verification gotcha below before trusting any specific method or endpoint name against a real instance.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/LIFEOS/USER/CUSTOMIZATIONS/SKILLS/Naumen/`

If this directory exists, load and apply any `PREFERENCES.md` or additional files found there — this is the right place for a specific instance's confirmed API version, endpoint base URL, or attribute-code mappings once they're known. If it does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the Naumen skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **Naumen** skill to ACTION...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **DesignIntegration** | "integrate with Naumen", "call Naumen REST API for X" | `Workflows/DesignIntegration.md` |
| **DiagnoseScriptError** | "Naumen script error", "groovy business rule failing" | `Workflows/DiagnoseScriptError.md` |

## Quick Reference

- Business rules/event handlers run as **Groovy** inside the platform's JVM — think Groovy/JVM semantics (null-safe `?.`, closures, static vs dynamic typing choices), not 1C or Python conventions.
- Integration API surface is REST (JSON) on modern versions, SOAP on older/legacy deployments — confirm which is actually available on the target instance before assuming.
- Attribute **codes** (internal identifiers used by the scripting/REST API) are not the same string as the attribute's UI display label — resolve the code before writing integration code against a label-looking guess.
- SLA/deadline calculations are server-side, tied to calendar objects configured per case class — don't compute them client-side from raw timestamps.

## Examples

**Example 1: Building an integration**
```
User: "I need to create a case in Naumen from an external system via API"
→ Invokes DesignIntegration workflow
→ Asks which API generation is available (REST vs SOAP) if not already known
→ Designs the call using attribute codes, not guessed label text
→ Flags the version-dependency explicitly rather than presenting one syntax as universal
```

**Example 2: Debugging a script**
```
User: "A Naumen business rule throws an error when a case attribute changes"
→ Invokes DiagnoseScriptError workflow
→ Applies known Groovy/engine conventions (null handling, typing) to the error
→ Recommends checking the actual instance's admin console for the exact API/class signature before finalizing a fix
```

## Gotchas

- **The scripting engine is Groovy, running on the JVM — bring Groovy/JVM mental models, not 1C or Python ones.** Null-safe navigation (`?.`), Groovy truthiness (empty string/collection is falsy), and closures behave per Groovy semantics; a script written with 1C-language or Python assumptions about null-handling or typing will misbehave in ways that look like platform bugs but aren't.
- **Attribute internal codes and UI display labels are different strings, and integration code needs the code.** A field labeled "Приоритет"/"Priority" in the UI has a separate internal attribute code used by scripts and the REST API — resolving that code (via the admin console or a metadata-listing API call) is a required step before writing integration code, not an optional nicety.
- **SLA and deadline timers are computed server-side against a configured calendar object per case class**, accounting for working hours/holidays — recomputing a deadline from raw creation timestamp plus a duration on the client side will drift from the platform's own value whenever the calendar has any non-24/7 configuration.
- **API generation (REST vs SOAP) and exact endpoint/method availability vary by platform version.** Don't assume one API shape is universal across all Naumen deployments.
- **Verification gotcha (read this before shipping integration code):** this skill's coverage is general Naumen SMP platform knowledge, not a specific instance's confirmed API surface. Exact REST endpoint paths, method/class names, and attribute codes must be confirmed against the target instance's own admin console or API documentation (often under Администрирование → API, or a Swagger/OpenAPI export on versions that expose one) before relying on them for production integration code — a plausible-sounding name pattern-matched from general platform knowledge is not a substitute for that check.
