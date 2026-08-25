```
  ██████╗  █████╗  ██████╗
  ██╔══██╗██╔══██╗██╔════╝
  ██████╔╝███████║██║  ███╗
  ██╔══██╗██╔══██║██║   ██║
  ██║  ██║██║  ██║╚██████╔╝
  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝
```

# rag/ — retrieval layer over dialogue/ and research/

`SIGNAL: BM25 full-text retrieval, no external dependencies, no API keys`

---

## What this actually is

Full-text search (SQLite FTS5, BM25-ranked) over `dialogue/` and `research/`, built with `bun:sqlite` — native to the Bun runtime, zero npm packages, zero external services. **This is not dense-embedding vector search.** For a corpus this size (a few dozen markdown files), lexical BM25 retrieval is simpler, faster to build, requires no API key or model download, and works fully offline — while still doing the actual job of RAG: find the passages relevant to a query before an agent has to read everything.

If the corpus grows into the hundreds of files and lexical mismatch becomes a real problem (queries that mean the same thing but share no vocabulary with the answer), that's the point to revisit with dense embeddings — not before. See `ROADMAP.md`.

## Usage

```bash
# (Re)build the index — run after any change under dialogue/ or research/
bun rag/build.ts

# Query it
bun rag/query.ts "VanessaExt component missing"
bun rag/query.ts "фоновые задания" --limit 3
bun rag/query.ts "cache key stability" --json
```

## Scope

Indexes `dialogue/**/*.md` and `research/**/*.md`, chunked per `##` heading (each section is a separately searchable/rankable unit, not the whole file). `skills/` is intentionally NOT indexed here — those are meant to be read directly and fully by an agent that activates them, not searched piecemeal.

## Gotchas

- **`index.sqlite` is a committed build artifact, not computed on the fly.** Add or edit a file under `dialogue/`/`research/`, then run `bun rag/build.ts` and commit the updated `index.sqlite` alongside your content change — an agent querying a stale index will miss recent entries silently (no error, just absent from results).
- **FTS5 query syntax leaks through `query.ts`'s `--` arg.** Raw hyphens, quotes, or asterisks in a query string can hit FTS5's own operator syntax (`NOT`, phrase matching, prefix search) instead of being treated as plain text — the tool reports a clear error on a syntax failure rather than silently misinterpreting, but a query containing those characters may need adjusting.
- **No stemming is configured.** Mixed Russian/English corpus content made a single stemmer (e.g. Porter, English-only) actively wrong for half the content — exact-token matching only. A query in Russian needs to share actual word forms with the target text; "запускает" won't match "запуск" the way a stemmed index would.
