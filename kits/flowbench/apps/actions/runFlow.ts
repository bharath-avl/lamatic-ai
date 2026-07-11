"use server";

// TODO: runFlow — Execute a single test case against a Lamatic flow
//
// INPUT:
//   - flowId: string — the Lamatic flow ID to execute
//   - input: Record<string, unknown> — the input payload for the flow
//
// WHAT IT DOES:
//   1. Record start timestamp (performance.now() or Date.now())
//   2. Call the Lamatic GraphQL API via lamatic-client.ts
//      - Uses the `executeWorkflow` QUERY (not mutation!)
//      - Passes flowId and input variables
//   3. Record end timestamp, compute latencyMs = end - start
//   4. Return { status, result, requestId, latencyMs }
//
// IMPORTANT:
//   - executeWorkflow is a QUERY type despite executing an action
//   - The API response only contains { status, result, requestId }
//   - Latency MUST be measured here client-side — it's not in the response
//   - `result` shape varies per flow — the caller knows which field to score
//
// ERROR HANDLING:
//   - If the GraphQL call fails, return { status: "error", error: message, latencyMs }
//   - If the flow returns status !== "success", preserve the original status
//   - Always include latencyMs even on errors (measures total round-trip)

export async function runFlow(
  flowId: string,
  input: Record<string, unknown>
): Promise<{
  status: string;
  result?: Record<string, unknown>;
  requestId?: string;
  latencyMs: number;
  error?: string;
}> {
  // TODO: Implement using lamatic-client.ts
  throw new Error("runFlow not implemented yet");
}
