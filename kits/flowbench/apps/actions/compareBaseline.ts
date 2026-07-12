// compareBaseline.ts — Diff a current benchmark run against a saved baseline
//
// Pure function: no I/O, no server action directive, no file reads.
// The caller is responsible for loading/saving baselines from disk.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single test case result within a run. */
export interface CaseResult {
  id: string;
  passed: boolean;
  latencyMs: number;
  /** Cosine similarity score, or null if scoring was skipped/errored. */
  similarity: number | null;
  output: string | null;
  error: string | null;
}

/** A complete benchmark run. */
export interface RunResult {
  runId: string;
  flowId: string;
  timestamp: string;
  cases: CaseResult[];
}

// ── Diff output types ──

export interface LatencyDelta {
  baseline: number;
  current: number;
  /** Percentage change: positive = slower, negative = faster. */
  pctChange: number;
  regressed: boolean;
  improved: boolean;
}

export interface SimilarityDelta {
  baseline: number;
  current: number;
  delta: number;
  regressed: boolean;
  improved: boolean;
}

export interface CaseDiff {
  id: string;
  latency: LatencyDelta;
  similarity: SimilarityDelta | null;
  passChange: "new_failure" | "new_pass" | "unchanged";
}

export interface CompareResult {
  /** Cases that got worse in at least one dimension. */
  regressions: CaseDiff[];
  /** Cases that got better in at least one dimension. */
  improvements: CaseDiff[];
  /** Case IDs present in current but not in baseline. */
  newCases: string[];
  /** Case IDs present in baseline but not in current. */
  removedCases: string[];
  /** Human-readable note (e.g. "no baseline, this run becomes the baseline"). */
  note: string | null;
}

// ---------------------------------------------------------------------------
// Constants — named so they're greppable and easy to tune
// ---------------------------------------------------------------------------

/**
 * Latency regression threshold: current > baseline × 1.20 (20% slower).
 * Symmetric: improvement if current < baseline × 0.80 (20% faster).
 */
export const LATENCY_REGRESSION_THRESHOLD_PCT = 20;

/**
 * Similarity regression threshold: baseline - current > 0.1.
 * Symmetric: improvement if current - baseline > 0.1.
 */
export const SIMILARITY_REGRESSION_THRESHOLD = 0.1;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Compare a current benchmark run against a baseline.
 *
 * @param current  - The run that just completed.
 * @param baseline - The previous saved run, or null if this is the first run.
 * @returns A structured diff with regressions, improvements, and case changes.
 */
export function compareBaseline(
  current: RunResult,
  baseline: RunResult | null
): CompareResult {
  // ── No baseline: first run ──
  if (baseline === null) {
    return {
      regressions: [],
      improvements: [],
      newCases: current.cases.map((c) => c.id),
      removedCases: [],
      note: "no baseline, this run becomes the baseline",
    };
  }

  // ── Index baseline cases by id for O(1) lookup ──
  const baselineMap = new Map<string, CaseResult>();
  for (const c of baseline.cases) {
    baselineMap.set(c.id, c);
  }

  const currentIds = new Set(current.cases.map((c) => c.id));
  const baselineIds = new Set(baseline.cases.map((c) => c.id));

  // Cases only in current / only in baseline
  const newCases = current.cases
    .filter((c) => !baselineIds.has(c.id))
    .map((c) => c.id);

  const removedCases = baseline.cases
    .filter((c) => !currentIds.has(c.id))
    .map((c) => c.id);

  // ── Compare matched cases ──
  const regressions: CaseDiff[] = [];
  const improvements: CaseDiff[] = [];

  for (const cur of current.cases) {
    const base = baselineMap.get(cur.id);
    if (!base) continue; // new case, already handled above

    // — Latency —
    const latencyPctChange =
      base.latencyMs === 0
        ? 0
        : ((cur.latencyMs - base.latencyMs) / base.latencyMs) * 100;

    const latencyRegressed =
      cur.latencyMs > base.latencyMs * (1 + LATENCY_REGRESSION_THRESHOLD_PCT / 100);
    const latencyImproved =
      cur.latencyMs < base.latencyMs * (1 - LATENCY_REGRESSION_THRESHOLD_PCT / 100);

    const latency: LatencyDelta = {
      baseline: base.latencyMs,
      current: cur.latencyMs,
      pctChange: Math.round(latencyPctChange * 100) / 100,
      regressed: latencyRegressed,
      improved: latencyImproved,
    };

    // — Similarity —
    let similarity: SimilarityDelta | null = null;
    let similarityRegressed = false;
    let similarityImproved = false;

    if (base.similarity !== null && cur.similarity !== null) {
      const delta = cur.similarity - base.similarity;
      similarityRegressed =
        base.similarity - cur.similarity > SIMILARITY_REGRESSION_THRESHOLD;
      similarityImproved =
        cur.similarity - base.similarity > SIMILARITY_REGRESSION_THRESHOLD;

      similarity = {
        baseline: base.similarity,
        current: cur.similarity,
        delta: Math.round(delta * 10000) / 10000,
        regressed: similarityRegressed,
        improved: similarityImproved,
      };
    }

    // — Pass/fail change —
    let passChange: "new_failure" | "new_pass" | "unchanged" = "unchanged";
    if (base.passed && !cur.passed) {
      passChange = "new_failure";
    } else if (!base.passed && cur.passed) {
      passChange = "new_pass";
    }

    // — Classify ──
    const isRegression =
      latencyRegressed || similarityRegressed || passChange === "new_failure";
    const isImprovement =
      latencyImproved || similarityImproved || passChange === "new_pass";

    const diff: CaseDiff = { id: cur.id, latency, similarity, passChange };

    // A case can be a regression in one dimension and an improvement in another.
    // We report it in both arrays so the user sees the full picture.
    if (isRegression) {
      regressions.push(diff);
    }
    if (isImprovement) {
      improvements.push(diff);
    }
  }

  return {
    regressions,
    improvements,
    newCases,
    removedCases,
    note: null,
  };
}
