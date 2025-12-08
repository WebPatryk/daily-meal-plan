// src/lib/openrouter.types.ts
// Type definitions for OpenRouter Service
// =============================================================================

// ---------------------------------------------------------------------------
// MESSAGE TYPES
// ---------------------------------------------------------------------------

/**
 * Role types for LLM messages.
 */
export type Role = "system" | "user" | "assistant";

/**
 * Generic message interface for LLM communication.
 */
export interface Message<T extends Role = Role> {
  role: T;
  content: string;
}

/**
 * System message type.
 */
export type SystemMessage = Message<"system">;

/**
 * User message type.
 */
export type UserMessage = Message<"user">;

/**
 * Assistant message type.
 */
export type AssistantMessage = Message<"assistant">;

// ---------------------------------------------------------------------------
// REQUEST OPTIONS
// ---------------------------------------------------------------------------

/**
 * JSON Schema configuration for structured LLM responses.
 */
export interface ResponseFormatSchema {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: object;
  };
}

/**
 * Model parameters for LLM inference.
 */
export interface ModelParams {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  [key: string]: unknown;
}

/**
 * Options for chat completion requests.
 */
export interface ChatOptions {
  model?: string;
  params?: ModelParams;
  responseFormat?: ResponseFormatSchema;
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// RESPONSE TYPES
// ---------------------------------------------------------------------------

/**
 * Token usage statistics for LLM responses.
 */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Structured response from LLM chat completion.
 */
export interface LLMResponse {
  raw: Response;
  usage: TokenUsage;
  message: AssistantMessage;
}

// ---------------------------------------------------------------------------
// ERROR TYPES
// ---------------------------------------------------------------------------

/**
 * Base error class for OpenRouter service errors.
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Authentication error (401/403).
 */
export class AuthError extends OpenRouterError {
  constructor(message: string) {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

/**
 * Rate limit exceeded error (429).
 */
export class RateLimitError extends OpenRouterError {
  constructor(message: string) {
    super(message, "RATE_LIMIT_ERROR", 429);
    this.name = "RateLimitError";
  }
}

/**
 * Service unavailable error (5xx).
 */
export class ServiceUnavailableError extends OpenRouterError {
  constructor(message: string) {
    super(message, "SERVICE_UNAVAILABLE", 503);
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Schema validation error (400).
 */
export class SchemaValidationError extends OpenRouterError {
  constructor(message: string) {
    super(message, "SCHEMA_VALIDATION_ERROR", 400);
    this.name = "SchemaValidationError";
  }
}

/**
 * Request timeout error (408).
 */
export class TimeoutError extends OpenRouterError {
  constructor(message: string) {
    super(message, "TIMEOUT_ERROR", 408);
    this.name = "TimeoutError";
  }
}

// ---------------------------------------------------------------------------
// INTERNAL API TYPES
// ---------------------------------------------------------------------------

/**
 * OpenRouter API message format.
 * @internal
 */
export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * OpenRouter API request payload.
 * @internal
 */
export interface OpenRouterRequestPayload {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: ResponseFormatSchema;
  [key: string]: unknown;
}

/**
 * OpenRouter API response structure.
 * @internal
 */
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ---------------------------------------------------------------------------
// SERVICE CONFIGURATION
// ---------------------------------------------------------------------------

/**
 * Constructor options for OpenRouterService.
 */
export interface OpenRouterServiceOptions {
  /** OpenRouter API Key (should be loaded from environment variables) */
  apiKey: string;
  /** Default model to use (e.g., "openai/gpt-4o") */
  defaultModel?: string;
  /** Default model parameters */
  defaultParams?: ModelParams;
  /** Custom HTTP client (for testing purposes) */
  httpClient?: typeof fetch;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
}

/**
 * Internal retry configuration.
 * @internal
 */
export interface RetryConfig {
  maxRetries: number;
  currentAttempt: number;
  baseDelay: number;
}
