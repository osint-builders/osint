/**
 * agent-runner — shared Oz cloud agent orchestration helpers.
 *
 * Extracted from builder/index.ts so both the legacy per-source collector
 * (index.ts) and the Tip & Queue qualify orchestrator (qualify.ts) share one
 * implementation of spawn tracking, graceful shutdown, template rendering,
 * and — critically — the poll loop's per-run deadline / BLOCKED handling.
 * Fixing a bug here (e.g. a stuck-run heuristic) fixes it for both callers.
 */

import OzAPI from "oz-agent-sdk";

export const POLL_BASE_MS = 15_000;         // base poll interval
export const POLL_JITTER_MS = 5_000;         // ±jitter added to every poll sleep
export const POLL_MAX_BACKOFF_MS = 120_000;  // max backoff on 429: 2 minutes
export const SPAWN_STAGGER_MS = 500;         // delay between consecutive agent spawns
export const POLL_MAX_TRANSIENT_RETRIES = 5; // retry non-429 transient errors before giving up
export const TERMINAL_STATES = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);

// A run that reaches BLOCKED is waiting on human approval/input — input that
// will never arrive in unattended CI. Cancel it immediately instead of
// polling a run that can never self-resolve.
export const STUCK_STATES = new Set(["BLOCKED"]);

// Hard per-run deadline so one hung/stuck run can never hold a whole job
// hostage until the outer GitHub Actions job timeout kills everything
// (including healthy runs). Set with headroom under each job's 15-minute
// timeout-minutes ceiling.
export const MAX_RUN_DURATION_MS = 10 * 60_000; // 10 minutes

// Warp's hard prompt size limit (1 MB).
export const MAX_PROMPT_SIZE_BYTES = 1_048_576;

// Pinned model for every agent run. Overridable via WARP_MODEL_ID so we
// never silently fall back to whatever default model the Warp account or
// environment resolves to (which could be a non-Warp-native model).
export const DEFAULT_MODEL_ID = "claude-4-5-haiku";

// Track spawned run IDs so the SIGTERM handler can cancel them before the
// process exits. This prevents the Warp platform from leaving runs orphaned
// and auto-cancelling them as "Cancelled by user".
export const activeRunIds = new Set<string>();
let ozClient: OzAPI | null = null;

export function setOzClient(client: OzAPI | null): void {
  ozClient = client;
}

export async function cancelActiveRuns(): Promise<void> {
  if (!ozClient || activeRunIds.size === 0) return;
  console.log(`\nCancelling ${activeRunIds.size} in-progress run(s) before exit...`);
  await Promise.allSettled(
    [...activeRunIds].map(id =>
      ozClient!.agent.runs.cancel(id)
        .then(() => console.log(`  ✓ Cancelled ${id}`))
        .catch(err => console.warn(`  ⚠ Could not cancel ${id}: ${err?.message ?? err}`))
    )
  );
}

let shutdownHandlersRegistered = false;
export function registerShutdownHandlers(): void {
  if (shutdownHandlersRegistered) return;
  shutdownHandlersRegistered = true;

  process.on("SIGTERM", async () => {
    console.log("\nSIGTERM received — cancelling outstanding runs...");
    await cancelActiveRuns();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("\nSIGINT received — cancelling outstanding runs...");
    await cancelActiveRuns();
    process.exit(0);
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Substitutes `${KEY}` placeholders in the template with values from `vars`.
 * Throws on unknown placeholder OR unfilled placeholder, so drift between
 * the template and the orchestrator surfaces immediately.
 */
export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  const placeholderRe = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const seen = new Set<string>();
  const result = template.replace(placeholderRe, (_match, key: string) => {
    seen.add(key);
    if (!(key in vars)) {
      throw new Error(`Prompt template references unknown placeholder \${${key}}`);
    }
    return String(vars[key]);
  });
  for (const k of Object.keys(vars)) {
    if (!seen.has(k)) {
      throw new Error(`Prompt template never used variable ${k}; check for drift`);
    }
  }
  return result;
}

/**
 * Polls a run until it reaches a terminal state, a stuck state (BLOCKED), or
 * its own deadline — whichever comes first. A stuck or overdue run gets
 * cancelled immediately rather than polled indefinitely.
 *
 * Uses an initial random jitter delay to spread concurrent pollers apart so
 * they don't all fire at the same instant and trigger API rate limits. On a
 * 429 response the backoff doubles (capped at POLL_MAX_BACKOFF_MS) instead
 * of crashing the whole run.
 */
export async function pollUntilComplete(
  client: OzAPI,
  runId: string
): Promise<string> {
  process.stdout.write(`Polling run ${runId}`);

  // Stagger concurrent pollers: random initial offset in [0, POLL_BASE_MS).
  await sleep(Math.random() * POLL_BASE_MS);

  const deadline = Date.now() + MAX_RUN_DURATION_MS;
  let backoffMs = POLL_BASE_MS;
  let transientRetries = 0;

  while (true) {
    try {
      const run = await client.agent.runs.retrieve(runId);
      process.stdout.write(` [${run.state}]`);
      transientRetries = 0; // reset on successful poll

      if (TERMINAL_STATES.has(run.state)) {
        process.stdout.write("\n");
        return run.state;
      }
      if (STUCK_STATES.has(run.state)) {
        process.stdout.write(
          `\n  ⚠ Run ${runId} entered ${run.state} (waiting on human input that will never arrive here) — cancelling.\n`
        );
        await client.agent.runs.cancel(runId).catch(() => {});
        return "CANCELLED";
      }
      if (Date.now() > deadline) {
        process.stdout.write(
          `\n  ⚠ Run ${runId} exceeded its ${MAX_RUN_DURATION_MS / 60_000}-minute deadline while still ${run.state} — cancelling instead of waiting indefinitely.\n`
        );
        await client.agent.runs.cancel(runId).catch(() => {});
        return "CANCELLED";
      }

      backoffMs = POLL_BASE_MS;
      await sleep(POLL_BASE_MS + Math.random() * POLL_JITTER_MS);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        process.stdout.write(` [429, retrying in ${(backoffMs / 1000).toFixed(0)}s]`);
        await sleep(backoffMs);
        backoffMs = Math.min(backoffMs * 2, POLL_MAX_BACKOFF_MS);
      } else {
        // Retry transient errors (5xx, network blips) up to the limit before
        // giving up. Re-throwing immediately was crashing Promise.all and
        // leaving other in-progress runs orphaned.
        transientRetries++;
        if (transientRetries > POLL_MAX_TRANSIENT_RETRIES) {
          process.stdout.write(` [fatal poll error after ${transientRetries} retries]\n`);
          throw err;
        }
        const delay = Math.min(backoffMs * transientRetries, POLL_MAX_BACKOFF_MS);
        process.stdout.write(` [transient error ${transientRetries}/${POLL_MAX_TRANSIENT_RETRIES}, retry in ${(delay / 1000).toFixed(0)}s]`);
        await sleep(delay);
      }
    }
  }
}
