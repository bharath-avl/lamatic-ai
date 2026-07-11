"use server";

// TODO: scoreOutput — Compute output quality score for a single test case
//
// INPUT:
//   - actual: string — the actual output string from the flow
//   - expected: string — the reference/expected output string
//
// WHAT IT DOES:
//   1. Generate sentence embeddings for both `actual` and `expected`
//      - Use a LOCAL embedding model (no external API calls)
//      - Options: @xenova/transformers (ONNX), or a similar JS-native library
//      - Model suggestion: all-MiniLM-L6-v2 (small, fast, good for similarity)
//   2. Compute cosine similarity between the two embedding vectors
//   3. Return { similarity, pass } where pass = similarity >= threshold
//
// SCORING PHILOSOPHY (from feature brief):
//   - Fully offline — zero ongoing cost per test run
//   - Cosine similarity against reference string
//   - Default pass threshold: 0.7 (configurable)
//   - Score range: 0.0 (completely different) to 1.0 (identical meaning)
//
// EDGE CASES:
//   - Empty actual or expected → similarity = 0.0, pass = false
//   - Identical strings → should return ~1.0 (not necessarily exact 1.0 due to float math)
//   - Very short strings (< 3 words) may score unreliably — consider a warning flag

export async function scoreOutput(
  actual: string,
  expected: string,
  threshold: number = 0.7
): Promise<{
  similarity: number;
  pass: boolean;
}> {
  // TODO: Implement local embedding + cosine similarity
  throw new Error("scoreOutput not implemented yet");
}
