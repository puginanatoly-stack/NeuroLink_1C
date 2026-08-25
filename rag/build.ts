#!/usr/bin/env bun
/**
 * build.ts - Builds a BM25 full-text search index over dialogue/ and research/
 * into rag/index.sqlite, using bun:sqlite's native FTS5 support (no external deps).
 *
 * Usage:
 *   bun rag/build.ts
 *
 * Run this after adding or editing any file under dialogue/ or research/ —
 * the index is a committed build artifact, not computed on the fly.
 */

import { Database } from "bun:sqlite";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = join(import.meta.dir, "..");
const DB_PATH = join(import.meta.dir, "index.sqlite");

interface Chunk {
  path: string;
  heading: string;
  content: string;
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkMarkdown(full));
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

function chunkMarkdown(filePath: string, text: string): Chunk[] {
  const relPath = relative(ROOT, filePath).replace(/\\/g, "/");
  const lines = text.split(/\r?\n/);
  const chunks: Chunk[] = [];
  let currentHeading = "(intro)";
  let buffer: string[] = [];

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content.length > 0) {
      chunks.push({ path: relPath, heading: currentHeading, content });
    }
    buffer = [];
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)/);
    if (h2) {
      flush();
      currentHeading = h2[1].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();

  return chunks;
}

function main() {
  const targets = [join(ROOT, "dialogue"), join(ROOT, "research")].filter((d) => {
    try {
      return statSync(d).isDirectory();
    } catch {
      return false;
    }
  });

  const files = targets.flatMap(walkMarkdown);

  const db = new Database(DB_PATH, { create: true });
  db.exec("DROP TABLE IF EXISTS chunks");
  db.exec(`
    CREATE VIRTUAL TABLE chunks USING fts5(
      path UNINDEXED,
      heading,
      content
    )
  `);

  const insert = db.prepare("INSERT INTO chunks (path, heading, content) VALUES (?, ?, ?)");
  const allChunks: Chunk[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf-8");
    allChunks.push(...chunkMarkdown(file, text));
  }

  const insertMany = db.transaction((chunks: Chunk[]) => {
    for (const c of chunks) insert.run(c.path, c.heading, c.content);
  });
  insertMany(allChunks);

  db.close();

  console.log(`RAG index built: ${allChunks.length} chunks from ${files.length} files -> ${DB_PATH}`);
}

main();
