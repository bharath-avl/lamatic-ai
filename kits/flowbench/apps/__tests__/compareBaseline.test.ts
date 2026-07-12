import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  compareBaseline,
  type RunResult,
  type CaseResult,
} from "../actions/compareBaseline";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal CaseResult with sensible defaults. */
function makeCase(overrides: Partial<CaseResult> & { id: string }): CaseResult {
  return {
    passed: true,
    latencyMs: 500,
    similarity: 0.9,
    output: "some output",
    error: null,
    ...overrides,
  };
}

/** Create a minimal RunResult wrapping an array of cases. */
function makeRun(
  cases: CaseResult[],
  overrides?: Partial<Omit<RunResult, "cases">>
): RunResult {
  return {
    runId: "run-test",
    flowId: "flow-123",
    timestamp: new Date().toISOString(),
    ...overrides,
    cases,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("compareBaseline", () => {
  // ── 1. No baseline (first run) ──
  it("returns all cases as newCases when baseline is null", () => {
    const current = makeRun([
      makeCase({ id: "a" }),
      makeCase({ id: "b" }),
    ]);

    const result = compareBaseline(current, null);

    assert.deepStrictEqual(result.regressions, []);
    assert.deepStrictEqual(result.improvements, []);
    assert.deepStrictEqual(result.newCases, ["a", "b"]);
    assert.deepStrictEqual(result.removedCases, []);
    assert.equal(
      result.note,
      "no baseline, this run becomes the baseline"
    );
  });

  // ── 2. Clean pass-through (no regressions, no improvements) ──
  it("reports no changes when current matches baseline within thresholds", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.9, passed: true }),
      makeCase({ id: "b", latencyMs: 600, similarity: 0.85, passed: true }),
    ]);
    const current = makeRun([
      // 10% slower — under the 20% threshold
      makeCase({ id: "a", latencyMs: 550, similarity: 0.9, passed: true }),
      // 0.05 drop — under the 0.1 threshold
      makeCase({ id: "b", latencyMs: 600, similarity: 0.80, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.deepStrictEqual(result.regressions, []);
    assert.deepStrictEqual(result.improvements, []);
    assert.deepStrictEqual(result.newCases, []);
    assert.deepStrictEqual(result.removedCases, []);
    assert.equal(result.note, null);
  });

  // ── 3. Latency regression ──
  it("flags latency regression when current > baseline × 1.20", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 1000, similarity: 0.9, passed: true }),
    ]);
    const current = makeRun([
      // 1210ms > 1000 × 1.20 = 1200 → regression
      makeCase({ id: "a", latencyMs: 1210, similarity: 0.9, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.regressions.length, 1);
    assert.equal(result.regressions[0].id, "a");
    assert.equal(result.regressions[0].latency.regressed, true);
    assert.equal(result.regressions[0].latency.baseline, 1000);
    assert.equal(result.regressions[0].latency.current, 1210);
    // Similarity should not be flagged
    assert.equal(result.regressions[0].similarity?.regressed, false);
    assert.equal(result.regressions[0].passChange, "unchanged");
  });

  // ── 4. Similarity regression ──
  it("flags similarity regression when drop > 0.1", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.95, passed: true }),
    ]);
    const current = makeRun([
      // 0.95 - 0.80 = 0.15 > 0.1 → regression
      makeCase({ id: "a", latencyMs: 500, similarity: 0.80, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.regressions.length, 1);
    assert.equal(result.regressions[0].id, "a");
    assert.equal(result.regressions[0].similarity?.regressed, true);
    assert.equal(result.regressions[0].similarity?.baseline, 0.95);
    assert.equal(result.regressions[0].similarity?.current, 0.80);
    // Latency should not be flagged
    assert.equal(result.regressions[0].latency.regressed, false);
    assert.equal(result.regressions[0].passChange, "unchanged");
  });

  // ── 5. New failure ──
  it("flags new_failure when baseline passed but current failed", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.9, passed: true }),
      makeCase({ id: "b", latencyMs: 600, similarity: 0.85, passed: true }),
    ]);
    const current = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.9, passed: true }),
      // Case "b" now fails — should always be flagged regardless of thresholds
      makeCase({ id: "b", latencyMs: 600, similarity: 0.85, passed: false }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.regressions.length, 1);
    assert.equal(result.regressions[0].id, "b");
    assert.equal(result.regressions[0].passChange, "new_failure");
    // Latency and similarity are unchanged — only the pass/fail flip matters
    assert.equal(result.regressions[0].latency.regressed, false);
    assert.equal(result.regressions[0].similarity?.regressed, false);
  });
});
