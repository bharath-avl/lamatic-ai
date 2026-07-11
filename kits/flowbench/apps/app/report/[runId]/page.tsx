// TODO: FlowBench — Single Run Report Page
//
// This page renders the detailed results for a specific benchmark run.
// It receives the runId from the dynamic route segment [runId].
//
// DATA SOURCE:
// - Read the run results JSON from .flowbench/baselines/{runId}.json
// - The file contains: flowId, timestamp, test case results, baseline diff
//
// SECTIONS TO RENDER:
//
// 1. RUN HEADER
//    - Run ID, timestamp, flow ID tested
//    - Overall verdict: PASS / FAIL / REGRESSION DETECTED
//    - Summary stats: total cases, passed, failed, avg latency, avg similarity
//
// 2. REGRESSION SUMMARY (from compareBaseline)
//    - Latency regressions: cases where current > baseline × 1.20
//    - Similarity regressions: cases where similarity dropped > 0.1
//    - New failures: cases that passed in baseline but fail now
//    - Improvements: inverse of the above (symmetric logic)
//    - If no baseline exists, show "First run — no baseline to compare"
//
// 3. PER-TEST-CASE TABLE
//    - Columns: test case name, input (truncated), expected, actual,
//      similarity score, latency (ms), pass/fail, delta vs baseline
//    - Color-code rows: green = pass, red = fail, yellow = regression
//    - Expandable rows to show full input/output text
//
// 4. ACTIONS
//    - "Save as Baseline" button — overwrites the current baseline for this flow
//    - "Export JSON" — download the raw run results
//    - "Re-run" — navigate back to home with this flow ID pre-filled

interface ReportPageProps {
  params: Promise<{ runId: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { runId } = await params;

  return (
    <main>
      <h1>Run Report: {runId}</h1>
      {/* TODO: Implement run header, regression summary, test case table, and actions */}
      <p>Detailed benchmark results will appear here.</p>
    </main>
  );
}
