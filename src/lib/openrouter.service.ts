// src/lib/openrouter.service.ts
// OpenRouter Service – warstwa integracyjna dla komunikacji z openrouter.ai
// =============================================================================

import type {
  SystemMessage,
  UserMessage,
  AssistantMessage,
  ChatOptions,
  ModelParams,
  LLMResponse,
  ResponseFormatSchema,
  OpenRouterMessage,
  OpenRouterRequestPayload,
  OpenRouterResponse,
  OpenRouterServiceOptions,
  RetryConfig,
} from "./openrouter.types";

import {
  OpenRouterError,
  AuthError,
  RateLimitError,
  ServiceUnavailableError,
  SchemaValidationError,
  TimeoutError,
} from "./openrouter.types";

// ---------------------------------------------------------------------------
// OPENROUTER SERVICE CLASS
// ---------------------------------------------------------------------------

/**
 * OpenRouter Service – unified interface for LLM communication.
 *
 * Features:
 * - Unified interface for sending LLM requests
 * - Support for multiple models via OpenRouter
 * - Message validation and serialization
 * - Comprehensive error handling with automatic retry
 * - Rate limiting and cost tracking
 * - Security best practices
 */
export class OpenRouterService {
  readonly #apiKey: string;
  readonly #defaultModel: string;
  readonly #defaultParams: ModelParams;
  readonly #httpClient: typeof fetch;
  readonly #timeout: number;
  readonly #maxRetries: number;
  #rateLimitDelay = 0;
  #remainingBudget = 0;

  constructor(options: OpenRouterServiceOptions) {
    // Validate API key
    if (!options.apiKey || options.apiKey.trim() === "") {
      throw new AuthError("OpenRouter API key is required");
    }

    this.#apiKey = options.apiKey;
    this.#defaultModel = options.defaultModel ?? "openai/gpt-4o";
    this.#defaultParams = options.defaultParams ?? {
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 1000,
    };
    this.#httpClient = options.httpClient ?? fetch;
    this.#timeout = options.timeout ?? 30000;
    this.#maxRetries = options.maxRetries ?? 3;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------

  /**
   * Sends a chat completion request to OpenRouter.
   *
   * @param messages - Array of messages (system, user, assistant)
   * @param options - Optional chat options (model, params, response format)
   * @returns Promise resolving to LLM response
   *
   * @example
   * ```ts
   * const response = await service.chat([
   *   { role: "system", content: "You are a helpful assistant." },
   *   { role: "user", content: "Hello!" }
   * ]);
   * ```
   */
  async chat(
    messages: (SystemMessage | UserMessage | AssistantMessage)[],
    options?: ChatOptions
  ): Promise<LLMResponse> {
    // Validate messages
    if (!messages || messages.length === 0) {
      throw new SchemaValidationError("Messages array cannot be empty");
    }

    // Merge options with defaults
    const model = options?.model ?? this.#defaultModel;
    const params = { ...this.#defaultParams, ...options?.params };
    const responseFormat = options?.responseFormat;
    const signal = options?.signal;

    // Validate response format schema if provided
    if (responseFormat) {
      this.#validateResponseFormat(responseFormat);
    }

    // Build request payload
    const payload = this.#buildPayload(messages, model, params, responseFormat);

    // Execute request with retry logic
    const retryConfig: RetryConfig = {
      maxRetries: this.#maxRetries,
      currentAttempt: 0,
      baseDelay: 1000,
    };

    return this.#executeWithRetry(payload, signal, retryConfig);
  }

  /**
   * Creates a new instance with a different model.
   * Useful for chaining or testing different models.
   *
   * @param model - Model identifier (e.g., "anthropic/claude-3-opus")
   * @returns New OpenRouterService instance with the specified model
   *
   * @example
   * ```ts
   * const gpt4 = service.withModel("openai/gpt-4o");
   * const claude = service.withModel("anthropic/claude-3-opus");
   * ```
   */
  withModel(model: string): OpenRouterService {
    return new OpenRouterService({
      apiKey: this.#apiKey,
      defaultModel: model,
      defaultParams: this.#defaultParams,
      httpClient: this.#httpClient,
      timeout: this.#timeout,
      maxRetries: this.#maxRetries,
    });
  }

  /**
   * Estimates the cost of a request based on token count and model.
   * Note: This is an approximation. Actual costs may vary.
   *
   * @param tokens - Number of tokens (prompt + completion)
   * @param model - Optional model identifier (uses default if not provided)
   * @returns Estimated cost in USD
   */
  estimateCost(tokens: number, model?: string): number {
    const targetModel = model ?? this.#defaultModel;

    // Cost per 1M tokens (approximate, should be updated based on OpenRouter pricing)
    const costPerMillionTokens: Record<string, number> = {
      "openai/gpt-4o": 5.0,
      "openai/gpt-3.5-turbo": 0.5,
      "anthropic/claude-3-opus": 15.0,
      "anthropic/claude-3-sonnet": 3.0,
      "anthropic/claude-3-haiku": 0.25,
    };

    const cost = costPerMillionTokens[targetModel] ?? 5.0; // Default to GPT-4 pricing
    return (tokens / 1_000_000) * cost;
  }

  /**
   * Returns the remaining budget from the last API call.
   * Budget is tracked via the `x-remaining-budget` header from OpenRouter.
   *
   * @returns Remaining budget in USD
   */
  getRemainingBudget(): number {
    return this.#remainingBudget;
  }

  /**
   * Sets a rate limit delay between requests.
   * Useful for controlling request throughput.
   *
   * @param delayMs - Delay in milliseconds between requests
   */
  setRateLimit(delayMs: number): void {
    if (delayMs < 0) {
      throw new Error("Rate limit delay must be non-negative");
    }
    this.#rateLimitDelay = delayMs;
  }

  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------

  /**
   * Builds HTTP headers for OpenRouter API requests.
   */
  #buildHeaders(): Headers {
    return new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.#apiKey}`,
      "HTTP-Referer": "https://daily-meal-plan.app", // Replace with actual domain
      "X-Title": "Daily Meal Plan",
    });
  }

  /**
   * Serializes internal message format to OpenRouter API format.
   */
  #serializeMessages(messages: (SystemMessage | UserMessage | AssistantMessage)[]): OpenRouterMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Builds the complete request payload for OpenRouter API.
   */
  #buildPayload(
    messages: (SystemMessage | UserMessage | AssistantMessage)[],
    model: string,
    params: ModelParams,
    responseFormat?: ResponseFormatSchema
  ): OpenRouterRequestPayload {
    const payload: OpenRouterRequestPayload = {
      model,
      messages: this.#serializeMessages(messages),
      ...params,
    };

    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    return payload;
  }

  /**
   * Validates the response format schema structure.
   */
  #validateResponseFormat(format: ResponseFormatSchema): void {
    if (format.type !== "json_schema") {
      throw new SchemaValidationError('Response format type must be "json_schema"');
    }

    if (!format.json_schema?.name) {
      throw new SchemaValidationError("Response format must include json_schema.name");
    }

    if (format.json_schema.strict !== true) {
      throw new SchemaValidationError("Response format json_schema.strict must be true");
    }

    if (!format.json_schema.schema || typeof format.json_schema.schema !== "object") {
      throw new SchemaValidationError("Response format must include valid json_schema.schema");
    }
  }

  /**
   * Executes the API request with retry logic and error handling.
   */
  async #executeWithRetry(
    payload: OpenRouterRequestPayload,
    signal?: AbortSignal,
    retryConfig?: RetryConfig
  ): Promise<LLMResponse> {
    const config = retryConfig ?? {
      maxRetries: this.#maxRetries,
      currentAttempt: 0,
      baseDelay: 1000,
    };

    try {
      // Apply rate limiting if configured
      if (this.#rateLimitDelay > 0 && config.currentAttempt > 0) {
        await this.#sleep(this.#rateLimitDelay);
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

      // Merge signals if provided
      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
      }

      try {
        const response = await this.#httpClient("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: this.#buildHeaders(),
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Extract remaining budget from headers
        const remainingBudget = response.headers.get("x-remaining-budget");
        if (remainingBudget) {
          this.#remainingBudget = parseFloat(remainingBudget);
        }

        // Handle error responses
        if (!response.ok) {
          return this.#handleHttpError(response, payload, config);
        }

        // Parse successful response
        const data = (await response.json()) as OpenRouterResponse;
        return this.#parseResponse(response, data);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      // Handle abort/timeout errors
      if (error instanceof Error && error.name === "AbortError") {
        if (signal?.aborted) {
          throw error; // User-initiated abort
        }
        throw new TimeoutError(`Request timed out after ${this.#timeout}ms`);
      }

      // Handle other errors
      throw this.#handleError(error);
    }
  }

  /**
   * Handles HTTP error responses with appropriate retry logic.
   */
  async #handleHttpError(
    response: Response,
    payload: OpenRouterRequestPayload,
    config: RetryConfig
  ): Promise<LLMResponse> {
    const status = response.status;
    const errorBody = await response.text();

    // 401/403 - Authentication errors (no retry)
    if (status === 401 || status === 403) {
      throw new AuthError(`Authentication failed: ${errorBody || "Invalid or expired API key"}`);
    }

    // 429 - Rate limit (retry with exponential backoff)
    if (status === 429) {
      if (config.currentAttempt < config.maxRetries) {
        const delay = this.#calculateBackoff(config);
        await this.#sleep(delay);

        return this.#executeWithRetry(payload, undefined, {
          ...config,
          currentAttempt: config.currentAttempt + 1,
        });
      }

      throw new RateLimitError(`Rate limit exceeded after ${config.maxRetries} retries`);
    }

    // 5xx - Server errors (retry with jitter)
    if (status >= 500 && status < 600) {
      if (config.currentAttempt < config.maxRetries) {
        const delay = this.#calculateBackoff(config, true);
        await this.#sleep(delay);

        return this.#executeWithRetry(payload, undefined, {
          ...config,
          currentAttempt: config.currentAttempt + 1,
        });
      }

      throw new ServiceUnavailableError(`Service unavailable after ${config.maxRetries} retries: ${errorBody}`);
    }

    // Other errors (no retry)
    throw new OpenRouterError(`Request failed with status ${status}: ${errorBody}`, "REQUEST_FAILED", status);
  }

  /**
   * Handles generic errors and maps them to appropriate error types.
   */
  #handleError(error: unknown): never {
    if (error instanceof OpenRouterError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new OpenRouterError(`Unexpected error: ${error.message}`, "UNEXPECTED_ERROR");
    }

    throw new OpenRouterError("An unknown error occurred", "UNKNOWN_ERROR");
  }

  /**
   * Parses successful API response into LLMResponse format.
   */
  #parseResponse(rawResponse: Response, data: OpenRouterResponse): LLMResponse {
    if (!data.choices || data.choices.length === 0) {
      throw new OpenRouterError("Invalid response: no choices returned", "INVALID_RESPONSE");
    }

    const choice = data.choices[0];
    if (!choice.message || choice.message.role !== "assistant") {
      throw new OpenRouterError("Invalid response: missing or invalid assistant message", "INVALID_RESPONSE");
    }

    return {
      raw: rawResponse,
      usage: {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      },
      message: {
        role: "assistant",
        content: choice.message.content,
      },
    };
  }

  /**
   * Calculates exponential backoff delay with optional jitter.
   */
  #calculateBackoff(config: RetryConfig, withJitter = false): number {
    const exponentialDelay = config.baseDelay * Math.pow(2, config.currentAttempt);

    if (withJitter) {
      // Add random jitter (0-50% of delay)
      const jitter = Math.random() * exponentialDelay * 0.5;
      return exponentialDelay + jitter;
    }

    return exponentialDelay;
  }

  /**
   * Sleep utility for implementing delays.
   */
  #sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ---------------------------------------------------------------------------
// FACTORY FUNCTION
// ---------------------------------------------------------------------------

/**
 * Creates an OpenRouterService instance with API key from environment.
 * Throws if OPENROUTER_API_KEY is not set.
 *
 * @param options - Optional service configuration (excluding apiKey)
 * @returns Configured OpenRouterService instance
 *
 * @example
 * ```ts
 * // In an Astro API route
 * const service = createOpenRouterService();
 * const response = await service.chat([...]);
 * ```
 */
export function createOpenRouterService(options?: Omit<OpenRouterServiceOptions, "apiKey">): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new AuthError("OPENROUTER_API_KEY environment variable is not set");
  }

  return new OpenRouterService({
    apiKey,
    ...options,
  });
}
