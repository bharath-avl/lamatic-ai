// TODO: metrics — Utility functions for scoring and measurement
//
// This module contains pure functions used by the server actions.
// No side effects, no API calls — just math.
//
// FUNCTIONS TO IMPLEMENT:
//
// 1. cosineSimilarity(a: number[], b: number[]): number
//    - Standard cosine similarity between two vectors
//    - Returns value between -1 and 1 (in practice 0–1 for embedding vectors)
//    - Throw if vectors have different lengths
//
// 2. isLatencyRegression(current: number, baseline: number, threshold?: number): boolean
//    - Default threshold: 1.20 (20% slower = regression)
//    - Returns true if current > baseline * threshold
//
// 3. isSimilarityRegression(current: number, baseline: number, threshold?: number): boolean
//    - Default threshold: 0.1 (drop of >0.1 = regression)
//    - Returns true if (baseline - current) > threshold
//
// 4. generateRunId(): string
//    - Timestamp-based unique ID for a benchmark run
//    - Format suggestion: "run_YYYYMMDD_HHmmss_SSS" or similar

export function cosineSimilarity(a: number[], b: number[]): number {
  // TODO: Implement dot product / (magnitude_a * magnitude_b)
  void a;
  void b;
  throw new Error("cosineSimilarity not implemented yet");
}

export function isLatencyRegression(
  current: number,
  baseline: number,
  threshold: number = 1.2
): boolean {
  // TODO: return current > baseline * threshold
  void current;
  void baseline;
  void threshold;
  throw new Error("isLatencyRegression not implemented yet");
}

export function isSimilarityRegression(
  current: number,
  baseline: number,
  threshold: number = 0.1
): boolean {
  // TODO: return (baseline - current) > threshold
  void current;
  void baseline;
  void threshold;
  throw new Error("isSimilarityRegression not implemented yet");
}

export function generateRunId(): string {
  // TODO: Generate timestamp-based run ID
  throw new Error("generateRunId not implemented yet");
}
