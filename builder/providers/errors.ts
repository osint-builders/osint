/**
 * Custom error classes for agent provider operations.
 * 
 * These errors provide structured information about failures and allow
 * the orchestrator to handle different error types appropriately.
 * 
 * Error Hierarchy:
 * - AgentProviderError (base class for all provider errors)
 *   ├── ProviderUnavailableError (provider cannot be reached)
 *   ├── ProviderAuthenticationError (authentication failed)
 *   ├── ProviderRateLimitError (rate limit exceeded)
 *   ├── ProviderQuotaError (quota/credits exhausted)
 *   ├── RunSpawnError (failed to spawn a run)
 *   ├── RunPollError (failed to poll a run)
 *   ├── RunCancelError (failed to cancel a run)
 *   └── RunTimeoutError (run exceeded timeout)
 */

// ============================================================================
// Base Error Class
// ============================================================================

/**
 * Base class for all agent provider errors.
 * 
 * All provider-specific errors should extend this class to enable
 * consistent error handling in the orchestrator.
 * 
 * @example
 * ```typescript
 * try {
 *   await provider.spawn(prompt, config);
 * } catch (error) {
 *   if (error instanceof AgentProviderError) {
 *     console.error(`Provider error: ${error.message}`);
 *     console.error(`Provider: ${error.providerName}`);
 *     console.error(`Run ID: ${error.runId}`);
 *   }
 * }
 * ```
 */
export class AgentProviderError extends Error {
  /** Name of the provider that generated this error */
  public readonly providerName: string;
  /** Run ID associated with this error, if applicable */
  public readonly runId?: string;
  /** Whether this error is retryable */
  public readonly isRetryable: boolean;
  /** Original error that caused this, if any */
  public readonly cause?: Error;
  /** Timestamp when the error occurred */
  public readonly timestamp: Date;

  constructor(
    message: string,
    options: {
      providerName: string;
      runId?: string;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.providerName = options.providerName;
    this.runId = options.runId;
    this.isRetryable = options.isRetryable ?? false;
    this.cause = options.cause;
    this.timestamp = new Date();
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to a plain object for logging/serialization.
   */
  toJSON(): Record<string, unknown> {
    return {
      error: this.name,
      message: this.message,
      providerName: this.providerName,
      runId: this.runId,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp.toISOString(),
      cause: this.cause?.message,
    };
  }
}

// ============================================================================
// Provider-Level Errors
// ============================================================================

/**
 * Error thrown when a provider cannot be reached or is not available.
 * 
 * This typically indicates network issues, service outages, or
 * misconfiguration.
 * 
 * @example
 * ```typescript
 * throw new ProviderUnavailableError('Cannot connect to Warp API', {
 *   providerName: 'warp',
 *   isRetryable: true,
 * });
 * ```
 */
export class ProviderUnavailableError extends AgentProviderError {
  public readonly statusCode?: number;

  constructor(
    message: string,
    options: {
      providerName: string;
      statusCode?: number;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      isRetryable: options.isRetryable ?? true,
    });
    this.statusCode = options.statusCode;
  }
}

/**
 * Error thrown when provider authentication fails.
 * 
 * This typically indicates invalid or expired API keys.
 * 
 * @example
 * ```typescript
 * throw new ProviderAuthenticationError('Invalid API key', {
 *   providerName: 'warp',
 *   isRetryable: false, // Don't retry auth errors
 * });
 * ```
 */
export class ProviderAuthenticationError extends AgentProviderError {
  constructor(
    message: string,
    options: {
      providerName: string;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      isRetryable: options.isRetryable ?? false,
    });
  }
}

/**
 * Error thrown when provider rate limits are exceeded.
 * 
 * This typically indicates too many requests in a short time period.
 * 
 * @example
 * ```typescript
 * throw new ProviderRateLimitError('Rate limit exceeded', {
 *   providerName: 'warp',
 *   isRetryable: true,
 *   resetAt: new Date(Date.now() + 60000), // Reset in 1 minute
 * });
 * ```
 */
export class ProviderRateLimitError extends AgentProviderError {
  public readonly resetAt?: Date;

  constructor(
    message: string,
    options: {
      providerName: string;
      resetAt?: Date;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      isRetryable: options.isRetryable ?? true,
    });
    this.resetAt = options.resetAt;
  }
}

/**
 * Error thrown when provider quota/credits are exhausted.
 * 
 * This is the primary trigger for fallback to an alternative provider.
 * 
 * @example
 * ```typescript
 * throw new ProviderQuotaError('Insufficient credits', {
 *   providerName: 'warp',
 *   isRetryable: false, // Don't retry quota errors
 * });
 * ```
 */
export class ProviderQuotaError extends AgentProviderError {
  public readonly currentQuota?: number;
  public readonly requiredQuota?: number;

  constructor(
    message: string,
    options: {
      providerName: string;
      currentQuota?: number;
      requiredQuota?: number;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      isRetryable: options.isRetryable ?? false,
    });
    this.currentQuota = options.currentQuota;
    this.requiredQuota = options.requiredQuota;
  }
}

// ============================================================================
// Run-Level Errors
// ============================================================================

/**
 * Error thrown when failing to spawn a new run.
 * 
 * This typically indicates validation errors, missing resources, or
 * provider-specific constraints.
 */
export class RunSpawnError extends AgentProviderError {
  constructor(
    message: string,
    options: {
      providerName: string;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      isRetryable: options.isRetryable ?? false,
    });
  }
}

/**
 * Error thrown when failing to poll a run's status.
 * 
 * This typically indicates transient network issues.
 */
export class RunPollError extends AgentProviderError {
  constructor(
    message: string,
    options: {
      providerName: string;
      runId: string;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      isRetryable: options.isRetryable ?? true,
    });
  }
}

/**
 * Error thrown when failing to cancel a run.
 * 
 * This typically indicates the run has already completed or cannot be cancelled.
 */
export class RunCancelError extends AgentProviderError {
  constructor(
    message: string,
    options: {
      providerName: string;
      runId: string;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      isRetryable: options.isRetryable ?? false,
    });
  }
}

/**
 * Error thrown when a run exceeds its timeout.
 * 
 * This typically indicates the run is taking too long to complete.
 */
export class RunTimeoutError extends AgentProviderError {
  public readonly timeoutMs: number;

  constructor(
    message: string,
    options: {
      providerName: string;
      runId: string;
      timeoutMs: number;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      isRetryable: options.isRetryable ?? false,
    });
    this.timeoutMs = options.timeoutMs;
  }
}

// ============================================================================
// Error Type Guard
// ============================================================================

/**
 * Type guard to check if an error is an AgentProviderError.
 * 
 * @example
 * ```typescript
 * if (isAgentProviderError(error)) {
 *   console.log(`Provider: ${error.providerName}`);
 * }
 * ```
 */
export function isAgentProviderError(error: unknown): error is AgentProviderError {
  return error instanceof AgentProviderError;
}

/**
 * Type guard to check if an error is retryable.
 * 
 * @example
 * ```typescript
 * if (isRetryableError(error)) {
 *   await retryOperation();
 * }
 * ```
 */
export function isRetryableError(error: unknown): boolean {
  return isAgentProviderError(error) && error.isRetryable;
}

/**
 * Type guard to check if an error indicates quota exhaustion.
 * 
 * @example
 * ```typescript
 * if (isQuotaError(error)) {
 *   // Trigger fallback to alternative provider
 *   switchToFallbackProvider();
 * }
 * ```
 */
export function isQuotaError(error: unknown): error is ProviderQuotaError {
  return error instanceof ProviderQuotaError;
}
