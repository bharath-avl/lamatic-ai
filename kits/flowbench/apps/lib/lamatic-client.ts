// TODO: lamatic-client — GraphQL client for the Lamatic flow execution API
//
// This module provides a typed wrapper around the Lamatic GraphQL endpoint.
//
// SETUP:
//   - Reads LAMATIC_API_URL and LAMATIC_API_KEY from environment variables
//   - Exports a single `executeWorkflow` function
//
// CRITICAL IMPLEMENTATION NOTE:
//   executeWorkflow is a QUERY, not a MUTATION, in the Lamatic GraphQL schema.
//   This is confirmed behavior, not a bug. Using a mutation type will fail.
//
// GRAPHQL QUERY SHAPE:
//   query ExecuteWorkflow($flowId: String!, $input: JSON!) {
//     executeWorkflow(flowId: $flowId, payload: $input) {
//       status
//       result
//       requestId
//     }
//   }
//
// RESPONSE:
//   - status: string (e.g., "success", "error")
//   - result: Record<string, unknown> — shape depends on the flow's Response node
//   - requestId: string — unique ID for this execution
//
// NO latency, cost, or token data in the response. That's a hard API constraint.
//
// ERROR HANDLING:
//   - Throw on network errors (fetch failure, non-200 status)
//   - Throw on GraphQL-level errors (response.errors array)
//   - Return the data payload on success

const LAMATIC_API_URL = process.env.LAMATIC_API_URL ?? "";
const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY ?? "";

export interface ExecuteWorkflowResponse {
  status: string;
  result: Record<string, unknown>;
  requestId: string;
}

export async function executeWorkflow(
  flowId: string,
  input: Record<string, unknown>
): Promise<ExecuteWorkflowResponse> {
  // TODO: Implement GraphQL fetch using the query above
  // Remember: this is a QUERY, not a mutation
  void LAMATIC_API_URL;
  void LAMATIC_API_KEY;
  throw new Error("executeWorkflow not implemented yet");
}
