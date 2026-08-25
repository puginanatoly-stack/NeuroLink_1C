#!/usr/bin/env bun
/**
 * query.ts - BM25 full-text search over the index built by build.ts.
 *
 * Usage:
 *   bun rag/query.ts "<query>" [--limit N] [--json]
 *
 * Options:
 *   --limit N   Max results (default 5)
 *   --json      Emit JSON instead of formatted text
 *   --help      Show this message
 */

import { Database } from "bun:sqlite";
import { join } from "path";
import { existsSync } from "fs";

const DB_PATH = join(import.meta.dir, "index.sqlite");

interface Row {
  path: string;
  heading: string;
  content: string;
  score: number;
}

function usage(): void {
  console.log(`RAG query — BM25 full-text search over dialogue/ and research/

Usage:
  bun rag/query.ts "<query>" [options]

Options:
  --limit N   Max results (default 5)
  --json      Emit JSON instead of formatted text
  --help      Show this message

Run "bun rag/build.ts" first (or after adding new dialogue/research content) to (re)build the index.`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help")) {
    usage();
    return;
  }
  if (!existsSync(DB_PATH)) {
    console.error(`No index found at ${DB_PATH}. Run: bun rag/build.ts`);
    process.exit(1);
  }

  const jsonOut = args.includes("--json");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 5;
  const query = args.find((a, i) => !a.startsWith("-") && args[i - 1] !== "--limit");

  if (!query) {
    console.error("No query text provided.");
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });
  let rows: Row[];
  try {
    rows = db
      .query(
        `SELECT path, heading, content, bm25(chunks) AS score
         FROM chunks
         WHERE chunks MATCH ?
         ORDER BY score
         LIMIT ?`
      )
      .all(query, limit) as Row[];
  } catch (e) {
    console.error(`Query failed (FTS5 MATCH syntax error?): ${e}`);
    console.error(`Tip: avoid raw FTS5 operators (- " * ) in free-text queries, or quote the whole query.`);
    process.exit(1);
  } finally {
    db.close();
  }

  if (jsonOut) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  if (rows.length === 0) {
    console.log(`No matches for "${query}".`);
    return;
  }

  for (const r of rows) {
    const snippet = r.content.length > 300 ? r.content.slice(0, 300) + "…" : r.content;
    console.log(`\n[score ${r.score.toFixed(3)}] ${r.path} — ${r.heading}`);
    console.log(snippet);
  }
}

main();
