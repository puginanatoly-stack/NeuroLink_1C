# DiagnoseDelivery Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DiagnoseDelivery workflow in the Kafka1CBridge skill to diagnose message delivery issues"}' \
  > /dev/null 2>&1 &
```

Running the **DiagnoseDelivery** workflow in the **Kafka1CBridge** skill to diagnose message delivery issues...

## Step 0 — Sufficiency Check

Read the bridge's actual offset-commit code and the 1C-side write endpoint before diagnosing — "messages are missing/duplicated" has a small number of concrete causes and guessing without the code wastes a round-trip.

## Deliverable

A diagnosis that checks, in this order, and stops at the first confirmed match:

1. **Missing messages** → is the offset committed before or after the 1C write succeeds? Commit-before-write is the near-universal cause.
2. **Duplicate messages** → is the 1C-side write idempotent (upsert on natural key) or append-only? Given at-least-once delivery is the practical default, non-idempotent writes duplicate on any crash or rebalance — distinguish which one actually occurred (check bridge restart logs vs. consumer-group rebalance logs) since the fix framing differs even though the root fix (idempotent writes) is the same.
3. **Out-of-order writes** → does the partition key match the entity whose order matters, or is it round-robin/random?
4. **Timeouts/backpressure** → is the bridge pushing one HTTP call per message into 1C at a volume the rphost workers can't sustain?

State which check confirmed the diagnosis before proposing a fix.

## Constraints

- Don't recommend exactly-once semantics as the fix for a duplication bug that idempotent writes would already solve more simply.
- Reference the relevant `SKILL.md` Gotcha by name in the diagnosis.
