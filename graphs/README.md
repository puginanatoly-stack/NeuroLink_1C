# Graphs

## What's here

- **`xdto27_graph.json`** — type graph of an XDTO EnterpriseData exchange package (generic 2.7-profile schema). 200 object types, 38 enums, 626 property edges. Generated from the Designer `Package.bin` export. Rebuildable with the `xdto-graph` skill (`skills/xdto-graph/`).

## The full configuration graph (metadata graph)

The whole 1C configuration is indexed as a **graph in Neo4j**, served through the `1c-graph-metadata-mcp` server. Last build: ~541k nodes / ~1.35M edges — 12 028 metadata objects, 12 714 modules, 237 962 routines, 4 712 forms, 120 305 form controls, 526 event subscriptions.

It is **not a file in this repo** — it lives server-side and is queried through MCP tools. `graphs/` holds only the XDTO artifact above; the metadata graph has no JSON export by design (addressable tools replace a monolithic dump).

## Why it matters

The graph answers, without manual grep, the questions that cost the most time before any change to typical configuration code:

- **Impact before editing** — "if I change X, what breaks" (transitive, with the shortest explanation why).
- **Call navigation** — "who calls this routine / what does it call".
- **Reverse dependencies** — "where is object X used as a type".
- **Register movements** — "which documents post to register R".
- **Reports** — data-composition lineage (data sets, queries, fields, parameters, groupings, filters).
- **Rights/roles** — what a role grants, down to a single field.
- **Extensions** — what an extension overrides in the base configuration, and which layer actually runs.
- **Semantic search** — find code by meaning, not by remembered name.

Every fact carries **evidence** — source path and coordinates — so an answer can be checked against the actual `.bsl`/`.xml`.

## How to use it

Map question → tool (all take a 1C qualified name as `object_name`, e.g. `Справочник.Сотрудники`):

| Question | Tool |
|---|---|
| Tell me everything about object O | `get_object_dossier` |
| Where is O used as a type / what references O | `find_usages_of_object`, `find_objects_using_object` |
| If I change O, what's affected (transitive) | `trace_impact` (direction `downstream`) |
| What does O depend on | `trace_impact` (direction `upstream`) |
| Who calls routine R / what R calls | `trace_call_chain` (direction `callers` / `callees`) |
| Which documents post to register R | `find_register_movement_docs` |
| Find BSL by meaning or by name | `search_code` (`hybrid` / `semantic` / `fulltext`) |
| Find an object by business description | `search_metadata_by_description`, `business_search` |
| What rights does role R carry | `get_access_rights` |
| What extension E overrides in the base | `compare_base_and_extension` |
| Report lineage (СКД) | `get_report_dcs_lineage` |
| Where are the tests for O | `find_test_artifacts` |

Argument discipline: object-scoped tools take **`object_name`** (dotted 1C name), `trace_call_chain` takes **`routine_name`**, `find_register_movement_docs` takes **`register_name`**, `find_by_guid` takes **`guid`**. Do not invent aliases — check `skills/mcp-1c-tools/docs/1c-graph-metadata-mcp.md` before a parameter-rich call.

## State

The metadata graph is built server-side and served by MCP; its availability depends on the `1c-graph-metadata-mcp` server being indexed (search lanes: exact / fulltext / vector). If search tools return nothing, the index is stale or the server needs (re-)ingestion — not a reason to fall back to raw `grep` silently.
