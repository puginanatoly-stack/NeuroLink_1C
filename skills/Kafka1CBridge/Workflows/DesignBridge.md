# DesignBridge Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the DesignBridge workflow in the Kafka1CBridge skill to design a 1C-Kafka bridge"}' \
  > /dev/null 2>&1 &
```

Running the **DesignBridge** workflow in the **Kafka1CBridge** skill to design a 1C-Kafka bridge...

## Step 0 — Sufficiency Check

Confirm the direction (1C → Kafka producer, or Kafka → 1C consumer, or both), the expected throughput/volume, whether ordering matters per-entity, and whether the target data is tolerant of at-least-once duplication or genuinely needs stronger guarantees. Ask rather than assume when throughput or ordering requirements aren't stated — they determine the partition-key and batching design.

## Deliverable

A bridge design that states, explicitly:

- **Topology**: which side is producer, which is consumer, and confirmation that 1C talks to the bridge only via HTTP-service/OData — never a proposal to give 1C a direct Kafka connection.
- **Partition-key choice** and the ordering guarantee it does or doesn't provide, tied to the actual entity whose order matters.
- **Delivery-semantics choice**: at-least-once with idempotent 1C writes (the practical default) vs. the added complexity of a dedup/exactly-once layer, with the tradeoff named, not silently picked.
- **Throughput handling**: per-message HTTP calls only justified for low volume; batching, throttling, or a staging-table-plus-poll pattern named explicitly for anything higher.
- **Failure behavior**: what happens to a message if the 1C write fails (retry policy, dead-letter handling) — not left implicit.

## Constraints

- Recommend an implementation language/client library only when one isn't already implied by the conversation — default to whichever of Python or Kotlin the surrounding context favors, both have solid Kafka client support.
- Don't propose exactly-once semantics as the default — it's real added complexity (transactional producer/consumer, idempotency-key storage) that most 1C integration scenarios don't need once the 1C-side write is idempotent.
