/**
 * Agent Providers Module
 * 
 * This module exports all types, interfaces, and classes related to
 * agent providers. Import from this file for a clean API.
 * 
 * @example
 * ```typescript
 * // Import the interface
 * import { AgentProvider } from './providers';
 * 
 * // Import types
 * import { RunState, SpawnResult, RunConfig } from './providers';
 * 
 * // Import error classes
 * import { ProviderQuotaError, isQuotaError } from './providers';
 * ```
 */

// Re-export the main interface
export { AgentProvider } from './AgentProvider';

// Re-export types
export type {
  RunState,
  SpawnResult,
  RunConfig,
  PollResult,
  ProviderConfig,
  ProviderInfo,
  ProviderCapability,
} from './types';

// Re-export constants
export { TERMINAL_STATES, PROVIDER_CAPABILITIES } from './types';

// Re-export error classes and type guards
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
