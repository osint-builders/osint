/**
 * WarpAgentProvider - AgentProvider implementation using Warp Cloud Agents via oz-agent-sdk.
 */

import OzAPI from 'oz-agent-sdk';
import {
  AgentProvider,
  SpawnResult,
  RunConfig,
  PollResult,
  ProviderInfo,
  ProviderConfig,
  RunState,
} from './AgentProvider';

import {
  ProviderUnavailableError,
  ProviderAuthenticationError,
  ProviderQuotaError,
  RunSpawnError,
  RunPollError,
  RunCancelError,
} from './errors';

// ============================================================================
// Configuration
// ============================================================================

export interface WarpProviderConfig extends ProviderConfig {
  apiKey: string;
  environmentId?: string;
  baseUrl?: string;
  poll?: {
    baseIntervalMs: number;
    jitterMs: number;
    maxBackoffMs: number;
  };
}

const DEFAULT_POLL_CONFIG = {
  baseIntervalMs: 15_000,
  jitterMs: 5_000,
  maxBackoffMs: 120_000,
};

// ============================================================================
// State Mapping
// ============================================================================

const WARP_STATE_MAP: Record<string, RunState> = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  INPROGRESS: 'RUNNING',
  QUEUED: 'PENDING',
  CLAIMED: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  ERROR: 'FAILED',
  CANCELLED: 'CANCELLED',
  BLOCKED: 'FAILED',
};

function mapWarpState(warpState: string): RunState {
  return WARP_STATE_MAP[warpState] ?? 'RUNNING';
}

// ============================================================================
// Provider Implementation
// ============================================================================

export class WarpAgentProvider implements AgentProvider {
  public readonly name = 'warp';
  
  private client: OzAPI | null = null;
  private config: WarpProviderConfig;
  private activeRunIds = new Set<string>();

  constructor(config: Partial<WarpProviderConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.WARP_API_KEY || '',
      environmentId: config.environmentId || process.env.WARP_ENVIRONMENT_ID,
      baseUrl: config.baseUrl,
      poll: config.poll || DEFAULT_POLL_CONFIG,
    };
  }

  async setup(config?: ProviderConfig): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config, apiKey: config.apiKey || this.config.apiKey };
    }

    if (!this.config.apiKey) {
      throw new ProviderAuthenticationError(
        'WARP_API_KEY is required for WarpAgentProvider',
        { providerName: this.name }
      );
    }

    this.client = new OzAPI({ apiKey: this.config.apiKey, baseURL: this.config.baseUrl });

    try {
      await this.client.agent.list();
    } catch (error) {
      throw new ProviderAuthenticationError(
        `Failed to authenticate with Warp API: ${(error as Error).message}`,
        { providerName: this.name, cause: error as Error }
      );
    }
  }

  async cleanup(): Promise<void> {
    if (!this.client || this.activeRunIds.size === 0) return;

    await Promise.allSettled(
      Array.from(this.activeRunIds).map(async (runId) => {
        try {
          await this.client!.agent.runs.cancel(runId);
          this.activeRunIds.delete(runId);
        } catch {
          // Ignore cleanup errors
        }
      })
    );
    this.client = null;
    this.activeRunIds.clear();
  }

  async spawn(prompt: string, config: RunConfig): Promise<SpawnResult> {
    this.ensureClient();

    const runParams: OzAPI.AgentRunParams = {
      prompt,
      config: {
        name: config.name,
        ...(config.description && { description: config.description }),
        ...(this.config.environmentId && { environment_id: this.config.environmentId }),
        ...(config.env && { env: config.env }),
      },
    };

    try {
      const response = await this.client!.agent.run(runParams);
      this.activeRunIds.add(response.run_id);
      return { runId: response.run_id };
    } catch (error) {
      const err = error as Error & { code?: string; status?: number };
      const message = err.message.toLowerCase();
      
      if (message.includes('quota') || message.includes('credit') || message.includes('insufficient')) {
        throw new ProviderQuotaError(`Warp quota exhausted: ${err.message}`, {
          providerName: this.name, cause: err
        });
      }
      if (message.includes('auth') || message.includes('unauthorized') || 
          (err as { status?: number }).status === 401 || err.code === 'UNAUTHORIZED') {
        throw new ProviderAuthenticationError(`Warp authentication failed: ${err.message}`, {
          providerName: this.name, cause: err
        });
      }
      throw new RunSpawnError(`Failed to spawn Warp agent: ${err.message}`, {
        providerName: this.name, cause: err
      });
    }
  }

  async poll(runId: string): Promise<PollResult> {
    this.ensureClient();

    let backoffMs = this.config.poll?.baseIntervalMs || DEFAULT_POLL_CONFIG.baseIntervalMs;
    let lastError: Error & { status?: number } = new Error('Unknown error');

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const run = await this.client!.agent.runs.retrieve(runId);
        return {
          state: mapWarpState(run.state),
          updatedAt: run.updated_at,
        };
      } catch (error) {
        lastError = error as Error & { status?: number };
        if (lastError.status === 429) {
          const jitter = Math.random() * (this.config.poll?.jitterMs || DEFAULT_POLL_CONFIG.jitterMs);
          const delay = Math.min(
            backoffMs + jitter,
            this.config.poll?.maxBackoffMs || DEFAULT_POLL_CONFIG.maxBackoffMs
          );
          await new Promise(r => setTimeout(r, delay));
          backoffMs *= 2;
          continue;
        }
        throw new RunPollError(
          `Failed to poll Warp run ${runId}: ${lastError.message}`,
          { providerName: this.name, runId, cause: lastError }
        );
      }
    }

    throw new RunPollError(
      `Failed to poll Warp run ${runId} after 3 attempts: ${lastError.message}`,
      { providerName: this.name, runId, cause: lastError, isRetryable: false }
    );
  }

  async cancel(runId: string): Promise<void> {
    this.ensureClient();
    try {
      await this.client!.agent.runs.cancel(runId);
      this.activeRunIds.delete(runId);
    } catch (error) {
      throw new RunCancelError(
        `Failed to cancel Warp run ${runId}: ${(error as Error).message}`,
        { providerName: this.name, runId, cause: error as Error }
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      this.ensureClient();
      await this.client!.agent.list();
      return true;
    } catch {
      return false;
    }
  }

  async getInfo(): Promise<ProviderInfo> {
    if (!this.client) {
      return {
        name: this.name,
        version: '1.0.0',
        isAvailable: false,
        unavailabilityReason: 'Client not initialized',
        capabilities: new Set(['spawn', 'poll', 'cancel']),
      };
    }

    try {
      await this.client.agent.list();
      return {
        name: this.name,
        version: '1.0.0',
        isAvailable: true,
        maxConcurrency: 10,
        capabilities: new Set(['spawn', 'poll', 'cancel', 'custom_image', 'persistent_storage']),
      };
    } catch (error) {
      return {
        name: this.name,
        version: '1.0.0',
        isAvailable: false,
        unavailabilityReason: (error as Error).message,
        capabilities: new Set(['spawn', 'poll', 'cancel']),
      };
    }
  }

  private ensureClient(): void {
    if (!this.client) {
      throw new ProviderUnavailableError(
        'Warp provider not initialized. Call setup() first.',
        { providerName: this.name, isRetryable: false }
      );
    }
  }
}

export default WarpAgentProvider;
