// TODO: FlowBench — Main Dashboard Page
//
// This page is the primary entry point for FlowBench. It should:
//
// 1. CONFIGURATION PANEL
//    - Input field for the Lamatic Flow ID to test against
//    - File picker / path input to select a test cases file (.jsonl)
//    - "Run Benchmark" button that triggers the full test suite
//
// 2. RUN TRIGGER
//    - On submit, call the `runFlow` server action for each test case
//    - Call `scoreOutput` on each result to compute similarity scores
//    - Call `compareBaseline` to diff against the last saved baseline
//    - Persist the run results to .flowbench/baselines/ as a JSON file
//    - Generate a unique runId (timestamp-based is fine for v1)
//
// 3. RUN HISTORY
//    - List previous benchmark runs (read from .flowbench/baselines/)
//    - Each entry links to /report/[runId] for the detailed report
//    - Show summary: date, pass/fail count, avg latency, avg similarity
//
// 4. STATUS INDICATOR
//    - While a run is in progress, show a progress bar or spinner
//    - Display real-time count: "Running test 3/10..."
//
// IMPORTANT CONSTRAINTS:
// - executeWorkflow is a QUERY type in the Lamatic GraphQL API, not a mutation
// - Latency must be measured client-side (not in API response)
// - No cost/token tracking in v1 (API doesn't support it)
// - Single flow, single test file per run — not multi-flow

export default function HomePage() {
  return (
    <main>
      <h1>FlowBench</h1>
      {/* TODO: Implement configuration panel, run trigger, and run history */}
      <p>Automated testing &amp; benchmarking for Lamatic flows.</p>
    </main>
  );
}
