import OzAPI from "oz-agent-sdk";

const POLL_BASE_MS = 15_000;
const POLL_JITTER_MS = 5_000;
const POLL_MAX_BACKOFF_MS = 120_000;
const SPAWN_STAGGER_MS = 500;
const POLL_MAX_TRANSIENT_RETRIES = 5;
const MAX_RUN_DURATION_MS = 10 * 60_000;
export const MAX_PROMPT_SIZE_BYTES = 1_048_576;
export const DEFAULT_MODEL_ID = "claude-4-5-haiku";

const TERMINAL_STATES = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);

// Only the three Oz operations the coordinator needs cross this seam.
export interface AgentClient {
  run(params: OzAPI.AgentRunParams): Promise<{ run_id: string }>;
  retrieve(runId: string): Promise<{ state: string }>;
  cancel(runId: string): Promise<unknown>;
}

export function ozClientAdapter(api: OzAPI): AgentClient {
  return {
    run: (params) => api.agent.run(params),
    retrieve: (runId) => api.agent.runs.retrieve(runId),
    cancel: (runId) => api.agent.runs.cancel(runId),
  };
}

export interface AgentJob {
  label: string;
  prompt: string;
  itemCount: number;
}

export interface AgentResult {
  label: string;
  runId: string;
  state: string;
  itemCount: number;
}

interface RunnerConfig {
  modelId: string;
  environmentId?: string;
}

// Internal timing seam: production uses wall time; tests use a fast clock.
export interface RunnerRuntime {
  now(): number;
  sleep(ms: number): Promise<void>;
  random(): number;
  log(message: string): void;
  write(message: string): void;
}

const defaultRuntime: RunnerRuntime = {
  now: Date.now,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  random: Math.random,
  log: console.log,
  write: (message) => process.stdout.write(message),
};

export function assertPromptSize(prompt: string, label: string): number {
  const bytes = Buffer.byteLength(prompt, "utf8");
  if (bytes > MAX_PROMPT_SIZE_BYTES) {
    throw new Error(`${label} prompt exceeds 1 MB limit (${bytes} bytes)`);
  }
  return bytes;
}

/**
 * Owns the life cycle of one set of cloud runs. Callers provide fully rendered
 * jobs; the coordinator validates all of them before spawning anything.
 */
export class AgentRunCoordinator {
  private readonly activeRunIds = new Set<string>();
  private cancellation: Promise<void> | null = null;
  private pendingSpawns: Promise<unknown> | null = null;
  private shuttingDown = false;

  constructor(
    private readonly client: AgentClient,
    private readonly config: RunnerConfig,
    private readonly runtime: RunnerRuntime = defaultRuntime
  ) {}

  async execute(jobs: readonly AgentJob[]): Promise<AgentResult[]> {
    for (const job of jobs) assertPromptSize(job.prompt, job.label);
    const detachSignals = this.attachShutdownHandlers();
    try {
      // Await every spawn, even if one fails. A rejected Promise.all would let
      // staggered spawns continue after the caller exited, orphaning runs.
      const spawnResults = Promise.allSettled(
        jobs.map((job, index) => this.spawn(job, index))
      );
      this.pendingSpawns = spawnResults;
      const settledSpawns = await spawnResults;
      this.pendingSpawns = null;
      if (this.shuttingDown) {
        await this.cancelActiveRuns();
        throw new Error("Agent dispatch interrupted by shutdown");
      }
      const spawnFailure = settledSpawns.find(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );
      if (spawnFailure) {
        await this.cancelActiveRuns();
        throw new Error("One or more agents failed to spawn", { cause: spawnFailure.reason });
      }
      const spawned = settledSpawns.map(
        (result) => (result as PromiseFulfilledResult<{ job: AgentJob; runId: string }>).value
      );
      this.runtime.log(`\nPolling ${spawned.length} agents for completion...`);

      const settledPolls = await Promise.allSettled(spawned.map(async ({ job, runId }) => {
        try {
          return {
            label: job.label,
            runId,
            state: await this.pollUntilComplete(runId),
            itemCount: job.itemCount,
          };
        } catch (error) {
          // Cancel siblings immediately; allSettled then waits for them to
          // observe their terminal state before we return to the caller.
          await this.cancelActiveRuns();
          throw error;
        } finally {
          this.activeRunIds.delete(runId);
        }
      }));
      const pollFailure = settledPolls.find(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );
      if (pollFailure) {
        throw new Error("One or more agents failed while polling", { cause: pollFailure.reason });
      }
      return settledPolls.map(
        (result) => (result as PromiseFulfilledResult<AgentResult>).value
      );
    } finally {
      detachSignals();
    }
  }

  private async spawn(job: AgentJob, index: number): Promise<{ job: AgentJob; runId: string }> {
    await this.runtime.sleep(index * SPAWN_STAGGER_MS);
    if (this.shuttingDown) throw new Error("Agent dispatch interrupted by shutdown");
    try {
      const response = await this.client.run({
        prompt: job.prompt,
        config: {
          name: `${job.label}-${new Date(this.runtime.now()).toISOString()}`,
          model_id: this.config.modelId,
          ...(this.config.environmentId ? { environment_id: this.config.environmentId } : {}),
        },
      });
      this.activeRunIds.add(response.run_id);
      this.runtime.log(`  ✓ ${job.label}: spawned (run ID: ${response.run_id})`);
      return { job, runId: response.run_id };
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 402 || status === 403) {
        this.runtime.log(`  ✗ ${job.label}: spawn rejected (HTTP ${status}); check WARP_API_KEY and credits.`);
      } else {
        this.runtime.log(`  ✗ ${job.label}: failed to spawn - ${error}`);
      }
      throw error;
    }
  }

  private async pollUntilComplete(runId: string): Promise<string> {
    this.runtime.write(`Polling run ${runId}`);
    const deadline = this.runtime.now() + MAX_RUN_DURATION_MS;
    await this.runtime.sleep(this.runtime.random() * POLL_BASE_MS);
    let backoffMs = POLL_BASE_MS;
    let transientRetries = 0;

    while (true) {
      if (this.runtime.now() > deadline) {
        this.runtime.write(`\n  ⚠ Run ${runId} exceeded its 10-minute deadline — cancelling.\n`);
        await this.cancelOne(runId);
        return "CANCELLED";
      }
      try {
        const run = await this.client.retrieve(runId);
        this.runtime.write(` [${run.state}]`);
        transientRetries = 0;
        if (TERMINAL_STATES.has(run.state)) {
          this.runtime.write("\n");
          return run.state;
        }
        if (run.state === "BLOCKED") {
          this.runtime.write(`\n  ⚠ Run ${runId} entered BLOCKED — cancelling.\n`);
          await this.cancelOne(runId);
          return "CANCELLED";
        }
        backoffMs = POLL_BASE_MS;
        await this.runtime.sleep(POLL_BASE_MS + this.runtime.random() * POLL_JITTER_MS);
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 429) {
          this.runtime.write(` [429, retrying in ${(backoffMs / 1000).toFixed(0)}s]`);
          await this.runtime.sleep(backoffMs);
          backoffMs = Math.min(backoffMs * 2, POLL_MAX_BACKOFF_MS);
        } else {
          transientRetries++;
          if (transientRetries > POLL_MAX_TRANSIENT_RETRIES) {
            this.runtime.write(` [fatal poll error after ${transientRetries} retries]\n`);
            throw error;
          }
          const delay = Math.min(backoffMs * transientRetries, POLL_MAX_BACKOFF_MS);
          this.runtime.write(` [transient error ${transientRetries}/${POLL_MAX_TRANSIENT_RETRIES}, retry in ${(delay / 1000).toFixed(0)}s]`);
          await this.runtime.sleep(delay);
        }
      }
    }
  }

  private async cancelOne(runId: string): Promise<void> {
    try {
      await this.client.cancel(runId);
    } catch (error) {
      this.runtime.log(`  ⚠ Could not cancel ${runId}: ${error}`);
    }
  }

  private async cancelActiveRuns(): Promise<void> {
    if (this.cancellation) return this.cancellation;
    const runIds = [...this.activeRunIds];
    if (runIds.length === 0) return;
    this.runtime.log(`\nCancelling ${runIds.length} in-progress run(s) before exit...`);
    this.cancellation = Promise.allSettled(runIds.map((runId) => this.cancelOne(runId))).then(() => {});
    try {
      await this.cancellation;
    } finally {
      this.cancellation = null;
    }
  }

  private attachShutdownHandlers(): () => void {
    const shutdown = async (code: number) => {
      if (this.shuttingDown) return;
      this.shuttingDown = true;
      // A spawn request may already be in flight. Wait for its run ID before
      // cancelling, so shutdown cannot leave that newly created run behind.
      await this.pendingSpawns;
      await this.cancelActiveRuns();
      process.exit(code);
    };
    const onTerm = () => { void shutdown(143); };
    const onInt = () => { void shutdown(130); };
    process.on("SIGTERM", onTerm);
    process.on("SIGINT", onInt);
    return () => {
      process.off("SIGTERM", onTerm);
      process.off("SIGINT", onInt);
    };
  }
}
