```
  ██████╗  ██████╗  █████╗ ██████╗ ███╗   ███╗ █████╗ ██████╗ 
  ██╔══██╗██╔═══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗
  ██████╔╝██║   ██║███████║██║  ██║██╔████╔██║███████║██████╔╝
  ██╔══██╗██║   ██║██╔══██║██║  ██║██║╚██╔╝██║██╔══██║██╔═══╝ 
  ██║  ██║╚██████╔╝██║  ██║██████╔╝██║ ╚═╝ ██║██║  ██║██║     
  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     
```

# ROADMAP

`SIGNAL TRACE: cognition layer expansion, phased`

---

## PHASE_I — SYNAPTIC BOOTSTRAP `[COMPLETE]`

![Status](https://img.shields.io/badge/status-complete-5EC8A8?style=for-the-badge&labelColor=1A1A2E)

Initial neural pathways established. Substrate seeded.

- [x] `skills/VanessaAutomation` — BDD/xUnit cognition (Vanessa Automation, Vanessa-ADD, YAxUnit, vanessa-runner)
- [x] `skills/OneScriptReference` — runtime substrate (oscript, opm, ovm)
- [x] `skills/BslQuality` — diagnostic subroutine (BSL Language Server + Claude Code plugin)
- [x] `skills/XdtoReference` — serialization interface (XDTOFactory / XDTOSerializer)
- [x] `skills/Kafka1CBridge` — event-stream bridge (1C ↔ Kafka, external bridge pattern)
- [x] `research/` — long-term memory substrate, 7 source-verified files

---

## PHASE_II — BUILD & ORCHESTRATION LAYER `[COMPLETE]`

![Status](https://img.shields.io/badge/status-complete-5EC8A8?style=for-the-badge&labelColor=1A1A2E)

Closed the loop from source to shipped artifact.

- [x] `skills/OneCEdt` — headless build interface (1cedtcli, Designer-format bridging, exit-code integrity gotchas)
- [x] `skills/GitLabCiCd` — pipeline orchestration (duplicate-trigger suppression, cache-key stability)
- [x] `skills/OneCDevPipeline` — meta-router, cross-module seam mapping
- [x] Pastel-cyber visual identity locked in (README, badges)
- [x] Bilingual (RU/ZH) hidden channel — signature easter egg, source-only
- [x] `dialogue/` — cross-agent temporal memory channel opened; first inbound handoff received (`001`, TooLi @ opencode/deepseek-v4-flash, status `ANSWERED`)
- [x] `rag/` — BM25 full-text retrieval over `dialogue/` + `research/` via `bun:sqlite` FTS5, zero external dependencies, 53 chunks indexed at launch

---

## PHASE_III — VERIFICATION LAYER `[PLANNED]`

![Status](https://img.shields.io/badge/status-planned-A78BC9?style=for-the-badge&labelColor=1A1A2E)

Nothing in `skills/` has been run against a live 1C instance yet — every gotcha is source-verified, not field-verified.

- [ ] Run `VanessaAutomation` + `OneCEdt` against a real disposable infobase, confirm the two documented seam gotchas actually reproduce as described
- [ ] Confirm YAxUnit's Linux-server claim on an actual Linux target (currently: promising, unconfirmed)
- [ ] Add field-verification notes to `research/` once confirmed — upgrade claims from "documented" to "reproduced"

---

## PHASE_IV — MCP INTEGRATION `[EXPLORATORY]`

![Status](https://img.shields.io/badge/status-exploratory-E08FA8?style=for-the-badge&labelColor=1A1A2E)

`research/MCP-Servers.md` catalogs 45 candidate servers. None are wired in yet — quality unverified across the board.

- [ ] Install and trial `1c-syntax/claude-code-bsl-lsp` (highest-confidence candidate — official, zero-config)
- [ ] Evaluate `alkoleft`'s tool line (`mcp-onec-test-runner`, `v8-runner-rust`, `mcp-bsl-platform-context`) against a real project
- [ ] Only after a candidate proves out — consider a wrapper skill; premature packaging is explicitly out of scope until then

---

## PHASE_V — DENSE RETRIEVAL `[BACKLOG]`

![Status](https://img.shields.io/badge/status-backlog-6FB8D9?style=for-the-badge&labelColor=1A1A2E)

`rag/` runs on BM25 lexical search today — correct for the current corpus size, not the ceiling of the idea.

- [ ] Revisit once `dialogue/` + `research/` grow into the hundreds of files, or lexical mismatch (semantically related, no shared vocabulary) becomes a repeated real problem — not before, that's premature optimization
- [ ] If triggered: embeddings + vector index, still favoring a zero/low-infra option (a local embedding model, not a hosted API dependency) to keep the "clone and go" promise intact
- [ ] `research/MCP-Servers.md` already lists relevant prior art to study first — `mcp-1c-v1` (Qdrant), `1c-mcp-metacode` (Neo4j), `onec-help-mcp` (hybrid BM25+semantic) — don't reinvent before checking what these do

---

```
ROADMAP STATUS:  ████████████░░░░░░░░  2/5 PHASES LINKED
NEXT SIGNAL:     PHASE_III — awaiting live-instance verification
```

---

**Connected. Optimized. Compliant.**
