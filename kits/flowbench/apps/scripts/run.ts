#!/usr/bin/env tsx
// run.ts — CLI entry point for FlowBench
//
// Usage:
//   npx tsx scripts/run.ts <testFile.jsonl> <flowId>
//
// Example:
//   npx tsx scripts/run.ts ../sample-tests/example.jsonl my-flow-id-here
//
// Reads .env from the apps/ directory automatically.

import * as fs from "node:fs";
import * as path from "node:path";
import { config } from "dotenv";
import { runFlow, type TestCaseInput } from "../actions/runFlow";
import { scoreOutput } from "../actions/scoreOutput";
import {
  compareBaseline,
  type RunResult,
  type CaseResult,
} from "../actions/compareBaseline";
import { generateRunId, percentile } from "../lib/metrics";

// ---------------------------------------------------------------------------
// Load .env from apps/ directory
// ---------------------------------------------------------------------------

config({ path: path.resolve(__dirname, "../.env") });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Schema for each line in the JSONL test file. */
interface TestCaseSpec {
  id: string;
  input: Record<string, unknown>;
  resultField: string;
  /** Reference output for similarity scoring. */
  expected?: string;
  /** If set, the output must contain this substring (case-insensitive). */
  expected_contains?: string;
  /** Override the default similarity threshold for this case. */
  min_similarity?: number;
}

// ---------------------------------------------------------------------------
// JSONL parser
// ---------------------------------------------------------------------------

function parseJsonl(filePath: string): TestCaseSpec[] {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`\n  ✗ Test file not found: ${absolutePath}\n`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(absolutePath, "utf-8")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  return lines.map((line, i) => {
    try {
      const parsed = JSON.parse(line) as TestCaseSpec;
      if (!parsed.id || !parsed.input || !parsed.resultField) {
        throw new Error("Missing required fields: id, input, resultField");
      }
      return parsed;
    } catch (err) {
      console.error(
        `\n  ✗ Invalid JSON on line ${i + 1}: ${err instanceof Error ? err.message : String(err)}\n`
      );
      process.exit(1);
    }
  });
}

// ---------------------------------------------------------------------------
// Baseline I/O
// ---------------------------------------------------------------------------

function getBaselinePath(flowId: string): string {
  return path.resolve(
    __dirname,
    "../../.flowbench/baselines",
    `${flowId}.json`
  );
}

function loadBaseline(flowId: string): RunResult | null {
  const p = getBaselinePath(flowId);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw) as RunResult;
  } catch {
    console.warn(`  ⚠ Could not parse baseline at ${p}, treating as no baseline.`);
    return null;
  }
}

function saveBaseline(flowId: string, run: RunResult): void {
  const p = getBaselinePath(flowId);
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(p, JSON.stringify(run, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Console formatting
// ---------------------------------------------------------------------------

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(`
  ${BOLD}FlowBench CLI${RESET}

  Usage:  npx tsx scripts/run.ts <testFile.jsonl> <flowId>

  Example:
    npx tsx scripts/run.ts ../sample-tests/example.jsonl abc-123-def
`);
    process.exit(1);
  }

  const [testFilePath, flowId] = args;

  // ── 1. Parse test file ──
  console.log(
    `\n  ${colorize("FlowBench", BOLD + CYAN)} — running tests against flow ${colorize(flowId, BOLD)}\n`
  );

  const specs = parseJsonl(testFilePath);
  console.log(`  ${DIM}Loaded ${specs.length} test case(s) from ${testFilePath}${RESET}\n`);

  // ── 2. Run all test cases ──
  const testCases: TestCaseInput[] = specs.map((s) => ({
    id: s.id,
    input: s.input,
    resultField: s.resultField,
  }));

  console.log(`  ${DIM}Executing flows (concurrency: 3, timeout: 30s)...${RESET}`);
  const runResults = await runFlow(flowId, testCases);

  // ── 3. Score each case ──
  console.log(`  ${DIM}Scoring outputs...${RESET}\n`);

  const runId = generateRunId();
  const caseResults: CaseResult[] = [];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const run = runResults[i];

    let similarity: number | null = null;
    let passed = run.error === null;

    // Similarity scoring (if expected is provided and we got output)
    if (spec.expected && run.output && passed) {
      const threshold = spec.min_similarity ?? 0.7;
      const score = await scoreOutput(run.output, spec.expected, threshold);
      similarity = score.similarity;
      if (!score.pass) {
        passed = false;
      }
    }

    // Substring check (if expected_contains is provided)
    if (spec.expected_contains && run.output && passed) {
      const contains = run.output
        .toLowerCase()
        .includes(spec.expected_contains.toLowerCase());
      if (!contains) {
        passed = false;
      }
    }

    caseResults.push({
      id: spec.id,
      passed,
      latencyMs: run.latencyMs,
      similarity,
      output: run.output,
      error: run.error,
    });
  }

  // ── 4. Assemble RunResult ──
  const currentRun: RunResult = {
    runId,
    flowId,
    timestamp: new Date().toISOString(),
    cases: caseResults,
  };

  // ── 5. Compare against baseline ──
  const baseline = loadBaseline(flowId);
  const diff = compareBaseline(currentRun, baseline);

  // ── 6. Print results ──

  // Per-case table
  console.log(
    `  ${BOLD}${"ID".padEnd(25)} ${"Status".padEnd(8)} ${"Latency".padEnd(10)} ${"Similarity".padEnd(12)} Error${RESET}`
  );
  console.log(`  ${"─".repeat(75)}`);

  for (const c of caseResults) {
    const status = c.passed
      ? colorize("PASS", GREEN)
      : colorize("FAIL", RED);
    const latency = `${c.latencyMs.toFixed(0)}ms`;
    const sim = c.similarity !== null ? c.similarity.toFixed(4) : "—";
    const err = c.error ? colorize(c.error.slice(0, 40), DIM) : "";

    console.log(
      `  ${c.id.padEnd(25)} ${status.padEnd(8 + (status.length - 4))} ${latency.padEnd(10)} ${sim.padEnd(12)} ${err}`
    );
  }

  // Summary stats
  const passedCount = caseResults.filter((c) => c.passed).length;
  const failedCount = caseResults.length - passedCount;
  const latencies = caseResults
    .filter((c) => c.latencyMs > 0)
    .map((c) => c.latencyMs)
    .sort((a, b) => a - b);

  const p50 = latencies.length > 0 ? percentile(latencies, 50) : 0;
  const p95 = latencies.length > 0 ? percentile(latencies, 95) : 0;

  const passRate = caseResults.length > 0
    ? ((passedCount / caseResults.length) * 100).toFixed(0)
    : "0";

  console.log(`\n  ${BOLD}Summary${RESET}`);
  console.log(`  ${"─".repeat(40)}`);
  console.log(
    `  Pass rate:    ${passRate === "100" ? colorize(`${passRate}%`, GREEN) : colorize(`${passRate}%`, passedCount > 0 ? YELLOW : RED)} (${passedCount}/${caseResults.length})`
  );
  console.log(`  Latency p50:  ${p50.toFixed(0)}ms`);
  console.log(`  Latency p95:  ${p95.toFixed(0)}ms`);

  // Regression / improvement summary
  if (diff.isFirstRun) {
    console.log(
      `\n  ${colorize("ℹ", CYAN)} First run — no baseline to compare. This run will be saved as the baseline.`
    );
  } else {
    if (diff.regressions.length > 0) {
      console.log(
        `\n  ${colorize(`⚠ ${diff.regressions.length} regression(s) detected:`, RED + BOLD)}`
      );
      for (const r of diff.regressions) {
        const parts: string[] = [];
        if (r.latency.regressed) {
          parts.push(
            `latency: ${r.latency.baseline.toFixed(0)}ms → ${r.latency.current.toFixed(0)}ms (+${r.latency.pctChange.toFixed(0)}%)`
          );
        }
        if (r.similarity?.regressed) {
          parts.push(
            `similarity: ${r.similarity.baseline.toFixed(4)} → ${r.similarity.current.toFixed(4)} (${r.similarity.delta.toFixed(4)})`
          );
        }
        if (r.passChange === "new_failure") {
          parts.push("new failure (was passing)");
        }
        console.log(`    ${colorize("✗", RED)} ${r.id}: ${parts.join(", ")}`);
      }
    }

    if (diff.improvements.length > 0) {
      console.log(
        `\n  ${colorize(`✓ ${diff.improvements.length} improvement(s):`, GREEN)}`
      );
      for (const imp of diff.improvements) {
        const parts: string[] = [];
        if (imp.latency.improved) {
          parts.push(
            `latency: ${imp.latency.baseline.toFixed(0)}ms → ${imp.latency.current.toFixed(0)}ms (${imp.latency.pctChange.toFixed(0)}%)`
          );
        }
        if (imp.similarity?.improved) {
          parts.push(
            `similarity: ${imp.similarity.baseline.toFixed(4)} → ${imp.similarity.current.toFixed(4)} (+${imp.similarity.delta.toFixed(4)})`
          );
        }
        if (imp.passChange === "new_pass") {
          parts.push("now passing (was failing)");
        }
        console.log(`    ${colorize("✓", GREEN)} ${imp.id}: ${parts.join(", ")}`);
      }
    }

    if (diff.newCases.length > 0) {
      console.log(`\n  ${colorize("ℹ", CYAN)} New cases: ${diff.newCases.join(", ")}`);
    }
    if (diff.removedCases.length > 0) {
      console.log(
        `\n  ${colorize("ℹ", YELLOW)} Removed cases: ${diff.removedCases.join(", ")}`
      );
    }
  }

  // ── 7. Baseline save decision ──
  const allPassed = failedCount === 0;
  const noRegressions = diff.regressions.length === 0;

  console.log(`\n  ${BOLD}Baseline${RESET}`);
  console.log(`  ${"─".repeat(40)}`);

  if (allPassed && noRegressions) {
    saveBaseline(flowId, currentRun);
    console.log(
      `  ${colorize("✓", GREEN)} Saved as new baseline: .flowbench/baselines/${flowId}.json`
    );
  } else {
    const reasons: string[] = [];
    if (!allPassed) reasons.push(`${failedCount} case(s) failed`);
    if (!noRegressions)
      reasons.push(`${diff.regressions.length} regression(s)`);
    console.log(
      `  ${colorize("⚠", YELLOW)} Baseline NOT updated — ${reasons.join(", ")}`
    );
    console.log(
      `  ${DIM}Fix the issues and re-run to update the baseline.${RESET}`
    );
  }

  console.log();

  // Exit with non-zero if there are failures or regressions
  if (!allPassed || !noRegressions) {
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error(`\n  ${colorize("✗ Fatal error:", RED + BOLD)}`, err);
  process.exit(2);
});
