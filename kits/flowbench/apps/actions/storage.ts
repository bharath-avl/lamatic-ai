import * as fs from "node:fs";
import * as path from "node:path";
import { type RunResult } from "./compareBaseline";

const BASELINES_DIR = path.resolve(process.cwd(), "../.flowbench/baselines");
const RUNS_DIR = path.resolve(process.cwd(), "../.flowbench/runs");

// ---------------------------------------------------------------------------
// Path-traversal guard
// ---------------------------------------------------------------------------

const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function assertSafeId(id: string, label: string): void {
  if (!SAFE_ID_PATTERN.test(id)) throw new Error(`Invalid ${label}: "${id}"`);
}

// ---------------------------------------------------------------------------

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Gets the path to the baseline file for a given flow.
 */
export function getBaselinePath(flowId: string): string {
  assertSafeId(flowId, "flowId");
  return path.join(BASELINES_DIR, `${flowId}.json`);
}

/**
 * Gets the path to a specific run file.
 */
export function getRunPath(runId: string): string {
  assertSafeId(runId, "runId");
  return path.join(RUNS_DIR, `${runId}.json`);
}

/**
 * Loads the baseline for a flow, or null if it doesn't exist.
 */
export function loadBaseline(flowId: string): RunResult | null {
  assertSafeId(flowId, "flowId");
  const p = getBaselinePath(flowId);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw) as RunResult;
  } catch {
    console.warn(`⚠ Could not parse baseline at ${p}`);
    return null;
  }
}

/**
 * Saves a run as the new baseline for a flow.
 */
export function saveBaseline(flowId: string, run: RunResult): void {
  assertSafeId(flowId, "flowId");
  ensureDir(BASELINES_DIR);
  const p = getBaselinePath(flowId);
  fs.writeFileSync(p, JSON.stringify(run, null, 2), "utf-8");
}

/**
 * Saves a historical run.
 */
export function saveRun(run: RunResult): void {
  assertSafeId(run.runId, "runId");
  ensureDir(RUNS_DIR);
  const p = getRunPath(run.runId);
  fs.writeFileSync(p, JSON.stringify(run, null, 2), "utf-8");
}

/**
 * Loads a specific historical run.
 */
export function loadRun(runId: string): RunResult | null {
  assertSafeId(runId, "runId");
  const p = getRunPath(runId);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw) as RunResult;
  } catch {
    return null;
  }
}

/**
 * Lists all historical runs, sorted newest first.
 */
export function listAllRuns(): RunResult[] {
  if (!fs.existsSync(RUNS_DIR)) return [];
  
  const files = fs.readdirSync(RUNS_DIR).filter(f => f.endsWith(".json"));
  const runs: RunResult[] = [];
  
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(RUNS_DIR, file), "utf-8");
      const run = JSON.parse(raw) as RunResult;
      runs.push(run);
    } catch {
      // Ignore unparseable
    }
  }
  
  // Sort descending by timestamp
  return runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
