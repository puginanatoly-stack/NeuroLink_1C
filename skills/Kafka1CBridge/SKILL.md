---
name: Kafka1CBridge
version: 1.0.0
description: Architecture and gotchas for bridging 1C:Enterprise (no native Kafka client) to Apache Kafka via an external HTTP-service-backed middleware bridge. USE WHEN 1C kafka, kafka integration for 1C, publish 1C events to kafka, consume kafka into 1C, kafka bridge for 1C, kafka producer or consumer for 1C, exactly-once vs at-least-once from 1C, 1C event streaming. NOT FOR generic Kafka administration/tuning unrelated to 1C, or non-Kafka 1C integration such as EnterpriseData, COM, or OData.
---

# Kafka1CBridge

1C:Enterprise has no native Kafka client — every real "1C ↔ Kafka" integration is a bridge: a separate service (Python/Kotlin, using a real Kafka client library) that talks Kafka on one side and 1C's HTTP-service/OData on the other. This skill covers designing that bridge correctly and diagnosing the delivery failures that show up when it isn't.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/LIFEOS/USER/CUSTOMIZATIONS/SKILLS/Kafka1CBridge/`

If this directory exists, load and apply any `PREFERENCES.md` or additional files found there (e.g. a preferred bridge language/client library, a house pattern for the staging table). If it does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:31337/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the Kafka1CBridge skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **Kafka1CBridge** skill to ACTION...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **DesignBridge** | "design a kafka bridge for 1C", "publish 1C events to kafka", "consume kafka into 1C" | `Workflows/DesignBridge.md` |
| **DiagnoseDelivery** | "messages missing", "duplicate messages", "bridge dropping data" | `Workflows/DiagnoseDelivery.md` |

## Quick Reference

- No native client exists — don't propose embedding a Kafka client inside 1C's own language; the bridge is always a separate process.
- At-least-once delivery is the practical default (Kafka consumer groups rebalance, bridges crash) — the 1C-side write endpoint must be idempotent (upsert on natural key), not append-only.
- Commit the Kafka offset *after* the 1C write succeeds, never before — committing early is the classic silent-message-loss bug.
- 1C HTTP-services are synchronous and consume rphost worker capacity per in-flight request — a bridge pushing one HTTP call per Kafka message under high throughput can starve the instance; batch, throttle, or switch to a staging-table-plus-poll pattern instead.

## Examples

**Example 1: New event-publishing bridge**
```
User: "I want 1C to publish document-posted events to Kafka"
→ Invokes DesignBridge workflow
→ Recommends a producer bridge service, partition-key choice tied to document/entity id for ordering, acks/idempotence config for the producer side
→ Flags that 1C itself only needs to expose an HTTP-service or write to a staging table — it does not talk Kafka directly
```

**Example 2: Diagnosing lost or duplicated messages**
```
User: "We're seeing duplicate rows land in 1C from our Kafka consumer bridge"
→ Invokes DiagnoseDelivery workflow
→ Checks offset-commit timing and 1C-side write idempotency first — the two most common causes
→ Distinguishes a crash-duplicate from a rebalance-duplicate scenario before proposing a fix
```

## Gotchas

- **There is no native Kafka client in 1C:Enterprise.** Any plan that involves "1C connects to Kafka directly" is solving the wrong problem — the correct shape is always an external bridge process using a real Kafka client library (kafka-python, confluent-kafka, or the JVM/Kotlin kafka-clients), talking to 1C over its own HTTP-service or OData interface.
- **Offset-commit-before-write loses messages on a bridge crash.** If the consumer commits the offset and then calls 1C, a crash between those two steps means that message is gone forever (offset already advanced, 1C never got it). Commit only after the 1C write is confirmed.
- **At-least-once delivery WILL redeliver** — both after a bridge crash-and-restart and after a consumer-group rebalance (a partition briefly processed by two consumer instances before the old session times out). The 1C-side write endpoint must be idempotent (upsert keyed on the entity's natural id) or duplicates land in 1C data; this is not an edge case, it's the normal operating condition of the pattern.
- **1C HTTP-services are synchronous and bounded by rphost worker capacity.** A bridge that fires one HTTP call per Kafka message at high throughput can exhaust available workers and start timing out or queuing behind unrelated 1C traffic. For high-volume topics, batch multiple messages per call, throttle the bridge's concurrency, or write to a staging table that 1C polls on its own schedule instead of pushing per-message.
- **Partition key choice determines ordering, and getting it wrong silently reorders data.** Messages with the same key land in the same partition and are processed in order; a random or round-robin key means no ordering guarantee at all. When 1C write order matters per entity (e.g. a document's state transitions must apply in sequence), key by that entity's id — not by a load-balancing scheme.
- **Producer `acks`/idempotence settings trade latency for durability, and defaults are not always the safe choice.** For data where a duplicate or a silent drop matters (financial postings, state transitions), use `acks=all` with `enable.idempotence=true` on the producer side, not just relying on the consumer side to dedupe everything.
