"use server";

// TODO: compareBaseline — Diff current run against the last saved baseline
//
// INPUT:
//   - flowId: string — identifies which baseline file to load
//   - currentResults: TestCaseResult[] — array of results from the current run
//
// WHAT IT DOES:
//   1. Load the most recent baseline from .flowbench/baselines/{flowId}.json
//      - If no baseline exists, return { isFirstRun: true, diffs: [] }
//   2. Match current results to baseline results by test case name/ID
//   3. For each matched pair, compute diffs:
//
// REGRESSION THRESHOLDS:
//   - Latency regression:   current latencyMs > baseline latencyMs × 1.20
//   - Similarity regression: baseline similarity - current similarity > 0.1
//   - New failure:           baseline.pass === true && current.pass === false
//
// IMPROVEMENT DETECTION (symmetric logic):
//   - Latency improvement:   current latencyMs < baseline latencyMs × 0.80
//   - Similarity improvement: current similarity - baseline similarity > 0.1
//   - New pass:              baseline.pass === false && current.pass === true
//
// OUTPUT:
//   - isFirstRun: boolean
//   - summary: { regressions: number, improvements: number, unchanged: number }
//   - diffs: Array<{
//       testCaseName: string,
//       latencyDelta: { baseline: number, current: number, regressed: boolean },
//       similarityDelta: { baseline: number, current: number, regressed: boolean },
//       passChanged: "new_failure" | "new_pass" | "unchanged",
//     }>
//
// EDGE CASES:
//   - Test case exists in current but not in baseline → mark as "new_test"
//   - Test case exists in baseline but not in current → mark as "removed_test"

export interface TestCaseResult {
  name: string;
  latencyMs: number;
  similarity: number;
  pass: boolean;
}

export interface BaselineDiff {
  testCaseName: string;
  latencyDelta: { baseline: number; current: number; regressed: boolean };
  similarityDelta: { baseline: number; current: number; regressed: boolean };
  passChanged: "new_failure" | "new_pass" | "unchanged" | "new_test" | "removed_test";
}

export interface CompareResult {
  isFirstRun: boolean;
  summary: { regressions: number; improvements: number; unchanged: number };
  diffs: BaselineDiff[];
}

export async function compareBaseline(
  flowId: string,
  currentResults: TestCaseResult[]
): Promise<CompareResult> {
  // TODO: Implement baseline loading and diff computation
  throw new Error("compareBaseline not implemented yet");
}
