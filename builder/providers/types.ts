/**
 * Shared type definitions for agent providers.
 *
 * These types ensure consistency between different provider implementations
 * and provide a common vocabulary for the orchestrator.
 */

// ============================================================================
// Run Lifecycle Types
// ============================================================================

/**
 * Represents the possible states of an agent run.
 *
 * All providers must map their native states to these canonical values.
 *
 * @example
 * ```typescript
 * const state: RunState = 'PENDING';
 * if (state === 'SUCCEEDED') {
 *   console.log('Run completed successfully');
 * }
 * ```
 */
export type RunState = 
  | 'PENDING'    // Run has been created but not yet started
  | 'RUNNING'    // Run is actively executing
  | 'SUCCEEDED'  // Run completed successfully
  | 'FAILED'     // Run completed with errors
  | 'CANCELLED'; // Run was explicitly cancelled

/**
 * Terminal states are those where the run will not transition further.
 * Used for determining when to stop polling.
 */
export const TERMINAL_STATES: Set<RunState> = new Set <RunState>([
  'SUCCEEDED',
  'FAILED',
  'CANCELLED'
]);

/**
 * Result of spawning a new agent run.
 *
 * The runId is used for subsequent polling and cancellation operations.
 * Different providers may have different formats for their run IDs:
 * - Warp: UUID string (e.g., "run_1234567890")
 * - Vibe: Task ID string (e.g., "task_abc123")
 *
 * The orchestrator treats run IDs as opaque strings.
 */
export interface SpawnResult {
  /** Unique identifier for the spawned run */
  runId: string;
  /** Optional metadata about the spawned run */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration options for spawning an agent run.
 *
 * These are the minimum options needed by all providers.
 * Provider-specific implementations may accept additional options.
 */
export interface RunConfig {
  /** Human-readable name for the run (used for logging and identification) */
  name: string;
  /** Optional description of what the run will do */
  description?: string;
  /** Optional timeout in milliseconds (provider-specific behavior) */
  timeoutMs?: number;
  /** Optional environment variables to pass to the agent */
  env?: Record<string, string>;
}

/**
 * Configuration for the agent provider itself.
 *
 * These are provider-level settings that don't change per-run.
 */
export interface ProviderConfig {
  /** API key or authentication token */
  apiKey?: string;
  /** Optional environment ID or region */
  environmentId?: string;
  /** Optional base URL for API endpoints */
  baseUrl?: string;
  /** Optional retry configuration */
  retry?: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
}

// ============================================================================
// Polling Types
// ============================================================================

/**
 * Result of polling a run's status.
 *
 * Includes the current state and optionally additional information
 * like progress, output, or error details.
 */
export interface PollResult {
  /** Current state of the run */
  state: RunState;
  /** Progress percentage (0-100) if available */
  progress?: number;
  /** Partial or complete output from the run */
  output?: string;
  /** Error message if the run failed */
  error?: string;
  /** Timestamp of the last state change */
  updatedAt?: string;
}

// ============================================================================
// Provider Information Types
// ============================================================================

/**
 * Metadata about a provider's capabilities and status.
 *
 * Used for observability and making decisions about which provider to use.
 */
export interface ProviderInfo {
  /** Provider name (e.g., 'warp', 'vibe') */
  name: string;
  /** Provider version */
  version: string;
  /** Whether the provider is currently available */
  isAvailable: boolean;
  /** Reason for unavailability, if applicable */
  unavailabilityReason?: string;
  /** Maximum concurrent runs supported */
  maxConcurrency?: number;
  /** Provider-specific capabilities */
  capabilities: Set<string>;
}

/**
 * Well-known capability identifiers.
 *
 * Providers should include these in their capabilities set to indicate
 * which features they support.
 */
export const PROVIDER_CAPABILITIES = {
  // Core capabilities
  SPAWN: 'spawn',
  POLL: 'poll',
  CANCEL: 'cancel',
  
  // Advanced capabilities
  STREAMING: 'streaming',
  METRICS: 'metrics',
  LOGS: 'logs',
  
  // Environment capabilities
  ENV_VARS: 'env_vars',
  CUSTOM_IMAGE: 'custom_image',
  PERSISTENT_STORAGE: 'persistent_storage',
} as const;

export type ProviderCapability = typeof PROVIDER_CAPABILITIES[keyof typeof PROVIDER_CAPABILITIES];
