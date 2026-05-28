/**
 * AgentProvider Interface
 * 
 * This interface defines the contract that all agent providers must implement.
 * It abstracts away the specifics of each provider's API, allowing the
 * orchestrator to work with any provider without knowing the implementation
 * details.
 * 
 * Implementation Notes:
 * - All methods are async to accommodate both local and remote providers
 * - Error handling uses custom error classes from errors.ts
 * - Providers should implement proper retry logic for transient errors
 * - Providers should emit structured logs for observability
 * 
 * Provider Implementations:
 * - WarpAgentProvider: Uses Warp Cloud Agents via oz-agent-sdk
 * - VibeAgentProvider: Uses Mistral Vibe CLI locally
 * 
 * @example
 * ```typescript
 * // Using the interface
 * class MyProvider implements AgentProvider {
 *   async spawn(prompt: string, config: RunConfig): Promise<SpawnResult> {
 *     // Implementation
 *   }
 *   
 *   async poll(runId: string): Promise<PollResult> {
 *     // Implementation
 *   }
 *   
 *   async cancel(runId: string): Promise<void> {
 *     // Implementation
 *   }
 *   
 *   async isAvailable(): Promise<boolean> {
 *     // Implementation
 *   }
 *   
 *   async getInfo(): Promise<ProviderInfo> {
 *     // Implementation
 *   }
 * }
 * ```
 */

import {
  RunState,
  SpawnResult,
  RunConfig,
  PollResult,
  ProviderInfo,
  ProviderConfig,
} from './types';

import {
  AgentProviderError,
  ProviderUnavailableError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderQuotaError,
  RunSpawnError,
  RunPollError,
  RunCancelError,
  RunTimeoutError,
} from './errors';

/**
 * AgentProvider defines the interface for agent execution providers.
 * 
 * All providers must implement these methods to be compatible with the
 * orchestrator. The interface is designed to be minimal while covering
 * all necessary operations for the collection workflow.
 */
export interface AgentProvider {
  /** Provider name (e.g., 'warp', 'vibe') */
  readonly name: string;
  
  /**
   * Spawns a new agent run with the given prompt and configuration.
   * 
   * This is the primary method for starting a collection operation.
   * The provider should:
   * - Validate the prompt and configuration
   * - Submit the run to the provider's backend
   * - Return a SpawnResult with a unique run ID
   * - Handle transient errors with retries (if configured)
   * 
   * @param prompt - The prompt/instructions for the agent to execute
   * @param config - Configuration options for the run
   * @returns Promise resolving to a SpawnResult with the run ID
   * @throws RunSpawnError if the run cannot be spawned
   * @throws ProviderAuthenticationError if authentication fails
   * @throws ProviderQuotaError if quota/credits are insufficient
   * @throws ProviderRateLimitError if rate limited
   * @throws ProviderUnavailableError if the provider cannot be reached
   * 
   * @example
   * ```typescript
   * try {
   *   const result = await provider.spawn(
   *     'Collect news from Reuters and output as JSON',
   *     { name: 'reuters-collection' }
   *   );
   *   console.log(`Spawned run: ${result.runId}`);
   * } catch (error) {
   *   if (error instanceof ProviderQuotaError) {
   *     console.log('Falling back to alternative provider...');
   *   }
   * }
   * ```
   */
  spawn(prompt: string, config: RunConfig): Promise<SpawnResult>;

  /**
   * Polls the status of a previously spawned run.
   * 
   * The provider should:
   * - Retrieve the current state of the run
   * - Return a PollResult with the state and any available output
   * - Handle transient errors with retries (if configured)
   * 
   * @param runId - The run ID returned from spawn()
   * @returns Promise resolving to a PollResult with the current state
   * @throws RunPollError if the run status cannot be retrieved
   * @throws ProviderUnavailableError if the provider cannot be reached
   * 
   * @example
   * ```typescript
   * const result = await provider.poll('run_12345');
   * console.log(`Run state: ${result.state}`);
   * 
   * if (result.state === 'SUCCEEDED') {
   *   console.log(`Output: ${result.output}`);
   * }
   * ```
   */
  poll(runId: string): Promise<PollResult>;

  /**
   * Cancels a previously spawned run.
   * 
   * The provider should:
   * - Attempt to cancel the run if it's still running
   * - Return without error if the run has already completed
   * - Handle transient errors with retries (if configured)
   * 
   * @param runId - The run ID to cancel
   * @returns Promise that resolves when the cancellation request is complete
   * @throws RunCancelError if the run cannot be cancelled
   * @throws ProviderUnavailableError if the provider cannot be reached
   * 
   * @example
   * ```typescript
   * try {
   *   await provider.cancel('run_12345');
   *   console.log('Run cancelled successfully');
   * } catch (error) {
   *   if (error instanceof RunCancelError) {
   *     console.log('Failed to cancel run');
   *   }
   * }
   * ```
   */
  cancel(runId: string): Promise<void>;

  /**
   * Checks if the provider is currently available and able to accept new runs.
   * 
   * The provider should:
   * - Check connectivity to the provider's backend
   * - Verify authentication is valid
   * - Check quota/credit availability
   * - Return true only if all checks pass
   * 
   * @returns Promise resolving to true if available, false otherwise
   * 
   * @example
   * ```typescript
   * const isAvailable = await provider.isAvailable();
   * if (isAvailable) {
   *   // Safe to spawn new runs
   * } else {
   *   // Use fallback provider
   * }
   * ```
   */
  isAvailable(): Promise<boolean>;

  /**
   * Gets metadata and status information about the provider.
   * 
   * The provider should:
   * - Return a ProviderInfo object with current status
   * - Include capabilities, version, and availability
   * 
   * @returns Promise resolving to a ProviderInfo object
   * 
   * @example
   * ```typescript
   * const info = await provider.getInfo();
   * console.log(`Provider: ${info.name} v${info.version}`);
   * console.log(`Available: ${info.isAvailable}`);
   * console.log(`Capabilities: ${[...info.capabilities].join(', ')}`);
   * ```
   */
  getInfo(): Promise<ProviderInfo>;

  /**
   * Optional: Sets up the provider for use.
   * 
   * This method is called once when the provider is initialized.
   * Providers can use this to:
   * - Initialize clients or connections
   * - Validate configuration
   * - Perform any one-time setup
   * 
   * @param config - Provider-level configuration
   * @returns Promise that resolves when setup is complete
   * 
   * @example
   * ```typescript
   * await provider.setup({
   *   apiKey: process.env.WARP_API_KEY,
   *   environmentId: process.env.WARP_ENVIRONMENT_ID,
   * });
   * ```
   */
  setup?(config: ProviderConfig): Promise<void>;

  /**
   * Optional: Cleans up resources used by the provider.
   * 
   * This method is called when the provider is no longer needed.
   * Providers can use this to:
   * - Close connections
   * - Clean up temporary files
   * - Release any held resources
   * 
   * @returns Promise that resolves when cleanup is complete
   * 
   * @example
   * ```typescript
   * await provider.cleanup();
   * ```
   */
  cleanup?(): Promise<void>;
}

/**
 * Re-export types for convenience
 */
export type {
  RunState,
  SpawnResult,
  RunConfig,
  PollResult,
  ProviderConfig,
  ProviderInfo,
};

export {
  AgentProviderError,
  ProviderUnavailableError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderQuotaError,
  RunSpawnError,
  RunPollError,
  RunCancelError,
  RunTimeoutError,
  isAgentProviderError,
  isRetryableError,
  isQuotaError,
} from './errors';
