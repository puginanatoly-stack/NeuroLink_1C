#!/usr/bin/env bun
/**
 * LintPipeline.ts - Fast heuristic scan of a .gitlab-ci.yml for known GitLab CI gotchas
 *
 * Usage:
 *   bun ~/.claude/skills/GitLabCiCd/Tools/LintPipeline.ts [path] [options]
 *
 * Options:
 *   --file <path>   Path to the pipeline file or a directory containing .gitlab-ci.yml (default: ./.gitlab-ci.yml)
 *   --json          Emit findings as JSON instead of formatted text
 *   --quiet         Print only the summary line
 *   --help          Show this message
 *
 * Exit codes:
 *   0  clean, or only INFO-level findings
 *   1  at least one WARN finding, no CRITICAL
 *   2  at least one CRITICAL finding
 *
 * No network calls, no credentials, no machine-specific paths — portable as-is.
 * This is a fast first pass, not a full YAML/GitLab semantic validator. It scopes
 * checks to each top-level block's direct children by indentation; it does not
 * build a real YAML AST. False negatives are possible on unusual formatting —
 * follow up with the reasoning-based review in Workflows/ReviewPipeline.md.
 */

import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";

type Severity = "CRITICAL" | "WARN" | "INFO";

interface Finding {
  severity: Severity;
  line: number;
  job?: string;
  message: string;
  ref?: string;
}

const NON_JOB_TOP_KEYS = new Set([
  "stages", "variables", "workflow", "include", "image", "services",
  "before_script", "after_script", "default", "cache", "stages:",
]);

function indentOf(line: string): number {
  const m = line.match(/^[ \t]*/);
  return m ? m[0].length : 0;
}

function usage(): void {
  console.log(`LintPipeline — fast heuristic scan of a .gitlab-ci.yml for known GitLab CI gotchas

Usage:
  bun LintPipeline.ts [path] [options]

Options:
  --file <path>   Path to the pipeline file or a directory containing .gitlab-ci.yml (default: ./.gitlab-ci.yml)
  --json          Emit findings as JSON
  --quiet         Print only the summary line
  --help          Show this message

Exit codes: 0 clean/info-only, 1 warnings present, 2 critical findings present.`);
}

function resolveTarget(rawArg: string | undefined, fileFlag: string | undefined): string {
  const candidate = fileFlag ?? rawArg ?? "./.gitlab-ci.yml";
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return join(candidate, ".gitlab-ci.yml");
  }
  return candidate;
}

function lint(content: string): Finding[] {
  const lines = content.split(/\r?\n/);
  const findings: Finding[] = [];

  // Tab-in-indentation check (invalid YAML)
  for (let i = 0; i < lines.length; i++) {
    if (/^[ ]*\t/.test(lines[i])) {
      findings.push({
        severity: "CRITICAL",
        line: i + 1,
        message: "Tab character in leading whitespace — YAML forbids tabs for indentation, this will fail to parse.",
      });
      break; // one report is enough to point at the problem class
    }
  }

  // Top-level block segmentation
  type Block = { key: string; startLine: number; bodyLines: { text: string; line: number }[] };
  const blocks: Block[] = [];
  let current: Block | null = null;
  const topKeySeen = new Map<string, number[]>();

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const indent = indentOf(raw);
    if (indent === 0) {
      const m = raw.match(/^([A-Za-z0-9_.\-]+):(.*)$/);
      if (m) {
        const key = m[1];
        topKeySeen.set(key, [...(topKeySeen.get(key) ?? []), i + 1]);
        current = { key, startLine: i + 1, bodyLines: [] };
        blocks.push(current);
        continue;
      }
    }
    if (current && indent > 0) {
      current.bodyLines.push({ text: raw, line: i + 1 });
    }
  }

  // Duplicate top-level keys
  for (const [key, occurrences] of topKeySeen) {
    if (occurrences.length > 1) {
      findings.push({
        severity: "WARN",
        line: occurrences[occurrences.length - 1],
        message: `Top-level key "${key}" defined ${occurrences.length} times (lines ${occurrences.join(", ")}) — YAML mapping keys must be unique, only one definition takes effect.`,
      });
    }
  }

  // No top-level workflow: block at all
  if (!topKeySeen.has("workflow")) {
    findings.push({
      severity: "CRITICAL",
      line: 1,
      message: "No top-level workflow: block found — without workflow:rules, GitLab runs a separate pipeline for both a branch push and any open MR against it, doubling CI minutes.",
      ref: "SKILL.md Gotchas: 'No workflow:rules → duplicate pipelines'; KeywordReference.md § workflow:rules",
    });
  }

  // Per-job/template analysis
  for (const block of blocks) {
    if (NON_JOB_TOP_KEYS.has(block.key)) continue;
    if (block.bodyLines.length === 0) continue;

    const jobIndent = Math.min(...block.bodyLines.map((l) => indentOf(l.text)));
    const directChildren = block.bodyLines.filter((l) => indentOf(l.text) === jobIndent);
    const label = block.key.startsWith(".") ? `template "${block.key}"` : `job "${block.key}"`;

    const has = (keyPattern: RegExp) => directChildren.find((l) => keyPattern.test(l.text.trim()));

    const rulesLine = has(/^rules:/);
    const onlyLine = has(/^only:/);
    const exceptLine = has(/^except:/);
    if (rulesLine && (onlyLine || exceptLine)) {
      const other = onlyLine ?? exceptLine!;
      findings.push({
        severity: "CRITICAL",
        line: other.line,
        job: block.key,
        message: `${label} mixes rules: (line ${rulesLine.line}) with only:/except: (line ${other.line}) — this is a hard config error in GitLab CI, not a merge.`,
        ref: "SKILL.md Gotchas: 'rules: and only:/except: cannot be mixed'",
      });
    }

    const cacheLine = has(/^cache:/);
    if (cacheLine) {
      const cacheIndent = indentOf(cacheLine.text);
      // Contiguous sub-block right after cacheLine at indent > cacheIndent
      const subBlock: typeof block.bodyLines = [];
      for (const l of block.bodyLines) {
        if (l.line <= cacheLine.line) continue;
        const ind = indentOf(l.text);
        if (ind <= cacheIndent) break;
        subBlock.push(l);
      }
      const keyLine = subBlock.find((l) => /^key:/.test(l.text.trim()));
      if (!keyLine) {
        findings.push({
          severity: "WARN",
          line: cacheLine.line,
          job: block.key,
          message: `${label} declares cache: with no explicit key: — falls back to a shared default key across all jobs/branches, likely unintended sharing or eviction.`,
          ref: "KeywordReference.md § cache: vs artifacts:",
        });
      } else if (/\$\{?CI_COMMIT_(SHA|REF_SLUG)\}?/.test(keyLine.text)) {
        const unstable = /CI_COMMIT_SHA/.test(keyLine.text) ? "unique per commit — cache is never reused" : "branch-scoped — cache is never shared across branches";
        findings.push({
          severity: "WARN",
          line: keyLine.line,
          job: block.key,
          message: `${label} cache key is ${unstable}. Prefer cache:key:files: keyed on a lockfile/manifest.`,
          ref: "SKILL.md Gotchas: 'Cache is not reused unless the key: is stable'",
        });
      }
    }

    const artifactsLine = has(/^artifacts:/);
    if (artifactsLine) {
      const artIndent = indentOf(artifactsLine.text);
      const hasExpire = block.bodyLines.some((l) => {
        if (l.line <= artifactsLine.line) return false;
        const ind = indentOf(l.text);
        if (ind <= artIndent) return false;
        return /^expire_in:/.test(l.text.trim());
      });
      if (!hasExpire) {
        findings.push({
          severity: "INFO",
          line: artifactsLine.line,
          job: block.key,
          message: `${label} declares artifacts: without expire_in: — relies on the instance default retention.`,
          ref: "KeywordReference.md § cache: vs artifacts:",
        });
      }
    }

    const extendsLine = has(/^extends:/);
    const variablesLine = has(/^variables:/);
    if (extendsLine && variablesLine) {
      findings.push({
        severity: "INFO",
        line: variablesLine.line,
        job: block.key,
        message: `${label} both extends: (line ${extendsLine.line}) and redefines variables: — extends does not deep-merge hashes beyond one level; confirm no template variables were meant to survive.`,
        ref: "KeywordReference.md § extends: (template reuse)",
      });
    }
  }

  return findings;
}

function severityRank(s: Severity): number {
  return s === "CRITICAL" ? 0 : s === "WARN" ? 1 : 2;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }
  const jsonOut = args.includes("--json");
  const quiet = args.includes("--quiet");
  const fileFlagIdx = args.indexOf("--file");
  const fileFlag = fileFlagIdx >= 0 ? args[fileFlagIdx + 1] : undefined;
  const positional = args.find((a, i) => !a.startsWith("-") && args[i - 1] !== "--file");

  const target = resolveTarget(positional, fileFlag);

  if (!existsSync(target)) {
    console.error(`LintPipeline: file not found: ${target}`);
    process.exit(2);
  }

  const content = readFileSync(target, "utf-8");
  const findings = lint(content).sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.line - b.line);

  if (jsonOut) {
    console.log(JSON.stringify({ file: target, findings }, null, 2));
  } else {
    const critical = findings.filter((f) => f.severity === "CRITICAL").length;
    const warn = findings.filter((f) => f.severity === "WARN").length;
    const info = findings.filter((f) => f.severity === "INFO").length;

    if (!quiet) {
      for (const f of findings) {
        const jobPart = f.job ? ` [${f.job}]` : "";
        console.log(`${f.severity}${jobPart} ${target}:${f.line} — ${f.message}`);
        if (f.ref) console.log(`   see: ${f.ref}`);
      }
      if (findings.length > 0) console.log("");
    }
    console.log(`LintPipeline: ${critical} critical, ${warn} warning(s), ${info} info — ${target}`);
  }

  process.exit(findings.some((f) => f.severity === "CRITICAL") ? 2 : findings.some((f) => f.severity === "WARN") ? 1 : 0);
}

main();
