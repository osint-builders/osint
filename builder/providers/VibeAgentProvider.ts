/**
 * VibeAgentProvider - AgentProvider implementation using Mistral Vibe CLI.
 * Uses local subprocess execution with file-based state tracking.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execa } from 'execa';
import {
  AgentProvider,
  SpawnResult,
  RunConfig,
  PollResult,
  ProviderInfo,
  ProviderConfig,
  RunState,
} from './AgentProvider';
import { TERMINAL_STATES } from './types';

import {
  ProviderUnavailableError,
  ProviderAuthenticationError,
  RunSpawnError,
  RunPollError,
  RunCancelError,
} from './errors';

// ============================================================================
// Configuration
// ============================================================================

export interface VibeProviderConfig extends ProviderConfig {
  apiKey: string;
  vibePath?: string;
  workDir?: string;
  model?: string;
  defaultTimeoutMs?: number;
}

const DEFAULT_VIBE_CONFIG: Omit<VibeProviderConfig, 'apiKey'> = {
  vibePath: 'vibe',
  workDir: path.join(os.tmpdir(), 'vibe-osint-runs'),
  model: 'mistral-large',
  defaultTimeoutMs: 60 * 60 * 1000, // 1 hour
};

// ============================================================================
// State Management Types
// ============================================================================

interface VibeRunState {
  state: RunState;
  taskId: string;
  process?: any;
  outputPath: string;
  statusPath: string;
  errorPath: string;
  startedAt: string;
  updatedAt: string;
  timeoutTimer?: NodeJS.Timeout;
}

interface VibeStatusFile {
  state: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress?: number;
  output?: string;
  error?: string;
  updatedAt: string;
}

// ============================================================================
// State Mapping
// ============================================================================

const VIBE_STATE_MAP: Record<string, RunState> = {
  pending: 'PENDING',
  running: 'RUNNING',
  succeeded: 'SUCCEEDED',
  failed: 'FAILED',
  cancelled: 'CANCELLED',
};

function mapVibeState(vibeState: string): RunState {
  return VIBE_STATE_MAP[vibeState.toLowerCase()] ?? 'RUNNING';
}

// ============================================================================
// Provider Implementation
// ============================================================================

export class VibeAgentProvider implements AgentProvider {
  public readonly name = 'vibe';
  
  private config: VibeProviderConfig;
  private runs = new Map<string, VibeRunState>();
  private activeProcesses = new Set<any>();

  constructor(config: Partial<VibeProviderConfig> = {}) {
    this.config = {
      ...DEFAULT_VIBE_CONFIG,
      apiKey: config.apiKey || process.env.MISTRAL_API_KEY || '',
      vibePath: config.vibePath || DEFAULT_VIBE_CONFIG.vibePath,
      workDir: config.workDir || DEFAULT_VIBE_CONFIG.workDir,
      model: config.model || DEFAULT_VIBE_CONFIG.model,
      defaultTimeoutMs: config.defaultTimeoutMs || DEFAULT_VIBE_CONFIG.defaultTimeoutMs,
    };
  }

  async setup(_config?: ProviderConfig): Promise<void> {
    if (!this.config.apiKey) {
      throw new ProviderAuthenticationError(
        'MISTRAL_API_KEY is required for VibeAgentProvider',
        { providerName: this.name }
      );
    }

    const vibePath = this.config.vibePath!;
    const workDir = this.config.workDir!;

    // Verify Vibe CLI is installed
    try {
      await execa(vibePath, ['--version'], { timeout: 5000 });
    } catch (error) {
      throw new ProviderUnavailableError(
        `Vibe CLI not found at ${vibePath}. Install: curl -LsSf https://mistral.ai/vibe/install.sh | bash`,
        { providerName: this.name, cause: error as Error, isRetryable: false }
      );
    }

    // Verify work directory
    try {
      await fs.promises.mkdir(workDir, { recursive: true });
      await fs.promises.access(workDir, fs.constants.W_OK);
    } catch (error) {
      throw new ProviderUnavailableError(
        `Cannot write to work directory: ${workDir}: ${(error as Error).message}`,
        { providerName: this.name, cause: error as Error, isRetryable: false }
      );
    }
  }

  async cleanup(): Promise<void> {
    // Kill all processes
    Array.from(this.activeProcesses).forEach(proc => {
      try { proc.kill('SIGTERM'); } catch {}
    });
    this.activeProcesses.clear();

    // Clean up run files
    Array.from(this.runs.values()).forEach(runState => {
      try {
        if (runState.timeoutTimer) clearTimeout(runState.timeoutTimer);
        fs.promises.unlink(runState.statusPath).catch(() => {});
        fs.promises.unlink(runState.outputPath).catch(() => {});
        fs.promises.unlink(runState.errorPath).catch(() => {});
      } catch {}
    });
    this.runs.clear();
  }

  async spawn(prompt: string, config: RunConfig): Promise<SpawnResult> {
    const runId = `vibe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const workDir = this.config.workDir!;
    const model = this.config.model!;
    const vibePath = this.config.vibePath!;
    const runDir = path.join(workDir, runId);
    const outputPath = path.join(runDir, 'output.jsonl');
    const statusPath = path.join(runDir, 'status.json');
    const errorPath = path.join(runDir, 'error.txt');
    const taskFile = path.join(runDir, 'task.md');

    await fs.promises.mkdir(runDir, { recursive: true });

    // Write task file
    const taskContent = `---\nname: ${config.name || runId}\ndescription: ${config.description || 'OSINT collection'}\nmodel: ${model}\n---\n\n${prompt}`;
    await fs.promises.writeFile(taskFile, taskContent, 'utf8');

    // Initialize status
    const initialStatus: VibeStatusFile = { state: 'pending', updatedAt: new Date().toISOString() };
    await fs.promises.writeFile(statusPath, JSON.stringify(initialStatus, null, 2), 'utf8');

    // Build vibe command
    const args = ['task', '--file', taskFile, '--output', outputPath, '--model', model, '--yes'];
    const env = { ...process.env, MISTRAL_API_KEY: this.config.apiKey, ...config.env };

    try {
      const process = execa(vibePath, args, {
        cwd: runDir,
        env,
        preferLocal: true,
        cleanup: false,
      });

      this.activeProcesses.add(process);

      const runState: VibeRunState = {
        state: 'PENDING',
        taskId: runId,
        process,
        outputPath,
        statusPath,
        errorPath,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Setup timeout
      const timeoutMs = config.timeoutMs || this.config.defaultTimeoutMs;
      runState.timeoutTimer = setTimeout(() => this.handleTimeout(runId), timeoutMs);

      this.runs.set(runId, runState);

      // Update state on spawn
      process.on('spawn', () => this.updateRunState(runId, 'RUNNING'));
      process.on('exit', (code, signal) => this.handleProcessExit(runId, code, signal));
      process.on('error', (error) => this.handleProcessError(runId, error));

      return { runId, metadata: { workDir: runDir, model: this.config.model } };
    } catch (error) {
      await fs.promises.rm(runDir, { recursive: true, force: true }).catch(() => {});
      throw new RunSpawnError(
        `Failed to spawn Vibe task: ${(error as Error).message}`,
        { providerName: this.name, cause: error as Error }
      );
    }
  }

  async poll(runId: string): Promise<PollResult> {
    const runState = this.runs.get(runId);
    if (!runState) {
      throw new RunPollError(`Run ${runId} not found`, {
        providerName: this.name, runId, isRetryable: false
      });
    }

    if (TERMINAL_STATES.has(runState.state)) {
      return this.createPollResult(runId, runState);
    }

    // Try reading status file
    try {
      const statusFile = await fs.promises.readFile(runState.statusPath, 'utf8');
      const status: VibeStatusFile = JSON.parse(statusFile);
      runState.state = mapVibeState(status.state);
      runState.updatedAt = status.updatedAt;

      // Check if process exited but state isn't terminal
      if (runState.process?.exitCode !== null && !TERMINAL_STATES.has(runState.state)) {
        runState.state = 'FAILED';
      }
      return this.createPollResult(runId, runState);
    } catch {
      // Status file not available - check process
      if (runState.process) {
        if (runState.process.exitCode !== null) {
          const signal = runState.process.killed ? runState.process.signal : undefined;
          runState.state = runState.process.exitCode === 0 ? 'SUCCEEDED' :
                           signal === 'SIGTERM' || signal === 'SIGKILL' ? 'CANCELLED' : 'FAILED';
        } else {
          runState.state = 'RUNNING';
        }
        return this.createPollResult(runId, runState);
      }
      runState.state = 'RUNNING';
      return this.createPollResult(runId, runState);
    }
  }

  async cancel(runId: string): Promise<void> {
    const runState = this.runs.get(runId);
    if (!runState) {
      throw new RunCancelError(`Run ${runId} not found`, {
        providerName: this.name, runId, isRetryable: false
      });
    }

    if (TERMINAL_STATES.has(runState.state)) return;

    try {
      if (runState.timeoutTimer) {
        clearTimeout(runState.timeoutTimer);
        runState.timeoutTimer = undefined;
      }
      if (runState.process) {
        this.activeProcesses.delete(runState.process);
        runState.process.kill('SIGTERM');
      }
      runState.state = 'CANCELLED';
      runState.updatedAt = new Date().toISOString();

      const status: VibeStatusFile = { state: 'cancelled', updatedAt: runState.updatedAt };
      await fs.promises.writeFile(runState.statusPath, JSON.stringify(status, null, 2), 'utf8');
    } catch (error) {
      throw new RunCancelError(
        `Failed to cancel Vibe run ${runId}: ${(error as Error).message}`,
        { providerName: this.name, runId, cause: error as Error }
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const vibePath = this.config.vibePath!;
      const result = await execa(vibePath, ['--version'], { timeout: 5000 });
      return !!this.config.apiKey && result.exitCode === 0;
    } catch {
      return false;
    }
  }

  async getInfo(): Promise<ProviderInfo> {
    try {
      const vibePath = this.config.vibePath!;
      let version = 'unknown';
      try {
        const result = await execa(vibePath, ['--version'], { timeout: 5000 });
        version = result.stdout?.trim().split('\n')[0] || version;
      } catch {}

      const isAvailable = await this.isAvailable();
      return {
        name: this.name,
        version,
        isAvailable,
        maxConcurrency: 5,
        capabilities: new Set(['spawn', 'poll', 'cancel', 'env_vars']),
      };
    } catch (error) {
      return {
        name: this.name,
        version: 'unknown',
        isAvailable: false,
        unavailabilityReason: (error as Error).message,
        capabilities: new Set(['spawn', 'poll', 'cancel']),
      };
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private async createPollResult(runId: string, runState: VibeRunState): Promise<PollResult> {
    const run = this.runs.get(runId);
    if (!run) throw new RunPollError(`Run ${runId} not found`, { providerName: this.name, runId, isRetryable: false });

    let output: string | undefined;
    let error: string | undefined;

    try { output = await fs.promises.readFile(run.outputPath, 'utf8'); } catch {}
    try { error = await fs.promises.readFile(run.errorPath, 'utf8'); } catch {}

    return { state: runState.state, updatedAt: runState.updatedAt, output, error };
  }

  private updateRunState(runId: string, state: RunState): void {
    const runState = this.runs.get(runId);
    if (!runState) return;
    runState.state = state;
    runState.updatedAt = new Date().toISOString();

    const status: VibeStatusFile = {
      state: state.toLowerCase() as VibeStatusFile['state'],
      updatedAt: runState.updatedAt,
    };
    fs.promises.writeFile(runState.statusPath, JSON.stringify(status, null, 2), 'utf8').catch(() => {});
  }

  private handleProcessExit(runId: string, code: number | null, signal: string | null): void {
    const runState = this.runs.get(runId);
    if (!runState) return;

    if (runState.process) {
      this.activeProcesses.delete(runState.process);
      runState.process = undefined;
    }

    if (code === 0) runState.state = 'SUCCEEDED';
    else if (signal === 'SIGTERM' || signal === 'SIGKILL') runState.state = 'CANCELLED';
    else runState.state = 'FAILED';
    runState.updatedAt = new Date().toISOString();
    this.updateRunState(runId, runState.state);
  }

  private handleProcessError(runId: string, error: Error): void {
    const runState = this.runs.get(runId);
    if (!runState) return;

    if (runState.process) {
      this.activeProcesses.delete(runState.process);
      runState.process = undefined;
    }
    runState.state = 'FAILED';
    runState.updatedAt = new Date().toISOString();

    fs.promises.writeFile(runState.errorPath, error.message, 'utf8').catch(() => {});
    this.updateRunState(runId, runState.state);
  }

  private handleTimeout(runId: string): void {
    const runState = this.runs.get(runId);
    if (!runState) return;

    if (runState.timeoutTimer) {
      clearTimeout(runState.timeoutTimer);
      runState.timeoutTimer = undefined;
    }

    if (runState.process) {
      this.activeProcesses.delete(runState.process);
      try { runState.process.kill('SIGTERM'); } catch {}
      runState.process = undefined;
    }

    runState.state = 'FAILED';
    runState.updatedAt = new Date().toISOString();

    const timeoutMs = this.config.defaultTimeoutMs;
    fs.promises.writeFile(runState.errorPath, `Run timed out after ${timeoutMs}ms`, 'utf8').catch(() => {});
    this.updateRunState(runId, runState.state);
  }
}

export default VibeAgentProvider;
