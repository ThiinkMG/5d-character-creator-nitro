/**
 * API Error Handler
 *
 * Standardized error handling for API routes.
 * Provides user-friendly messages and fallback strategies.
 */

export type ProviderType = 'anthropic' | 'openai' | 'google';

export interface ApiError {
    status: number;
    message: string;
    code?: string;
    provider?: ProviderType;
    invalidKey?: 'anthropicKey' | 'openaiKey' | 'googleKey';
    retryable?: boolean;
    details?: any;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
    error: string;
    code?: string;
    provider?: ProviderType;
    invalidKey?: string;
    retryAfter?: number; // Seconds until retry is allowed
    details?: any;
}

/**
 * Handle API errors with provider-specific logic
 */
export function handleApiError(
    error: unknown,
    provider: ProviderType,
    isAdminMode: boolean = false
): ApiError {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorLower = errorMsg.toLowerCase();

    // Determine environment variable name based on provider
    const envVarMap: Record<ProviderType, string> = {
        anthropic: 'ANTHROPIC_API_KEY',
        openai: 'OPENAI_API_KEY',
        google: 'GOOGLE_API_KEY'
    };

    const keyFieldMap: Record<ProviderType, 'anthropicKey' | 'openaiKey' | 'googleKey'> = {
        anthropic: 'anthropicKey',
        openai: 'openaiKey',
        google: 'googleKey'
    };

    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    const envVarName = envVarMap[provider];
    const keyField = keyFieldMap[provider];

    // 401: Authentication/Invalid API Key
    if (errorLower.includes('401') ||
        errorLower.includes('unauthorized') ||
        errorLower.includes('authentication') ||
        errorLower.includes('invalid api key')) {

        return {
            status: 401,
            message: isAdminMode
                ? `Invalid ${providerName} API key. The ${envVarName} environment variable may be incorrect or expired. Please check your API key in Netlify project settings.`
                : `Invalid ${providerName} API key. Please check your ${providerName} API key in Settings.`,
            code: 'INVALID_API_KEY',
            provider,
            invalidKey: keyField,
            retryable: false
        };
    }

    // 404: Model Not Found / Invalid Endpoint
    if (errorLower.includes('404') ||
        errorLower.includes('not found') ||
        errorLower.includes('model not found')) {

        const possibleCauses = [
            `Your ${providerName} API key may lack permissions to access the requested model`,
            `The AI service endpoint may be temporarily unavailable`,
            `There may be a configuration issue with your API key or account`
        ].join(', ');

        return {
            status: 404,
            message: isAdminMode
                ? `API key or model not found (404). ${possibleCauses}. Please verify your ${envVarName} environment variable.`
                : `API key or model not found (404). ${possibleCauses}. Please verify your ${providerName} API key in Settings.`,
            code: 'MODEL_NOT_FOUND',
            provider,
            invalidKey: keyField,
            retryable: false
        };
    }

    // 429: Rate Limit Exceeded
    if (errorLower.includes('429') || errorLower.includes('rate limit')) {
        // Try to extract retry-after header if available
        let retryAfter = 60; // Default to 60 seconds
        const retryMatch = errorMsg.match(/retry[_\s]after[:\s]+(\d+)/i);
        if (retryMatch) {
            retryAfter = parseInt(retryMatch[1], 10);
        }

        return {
            status: 429,
            message: `Rate limit exceeded for ${providerName}. Please try again in ${retryAfter} seconds.`,
            code: 'RATE_LIMIT_EXCEEDED',
            provider,
            retryable: true,
            details: { retryAfter }
        };
    }

    // 500: Internal Server Error
    if (errorLower.includes('500') || errorLower.includes('internal server error')) {
        return {
            status: 500,
            message: `${providerName} service is experiencing issues. Please try again later.`,
            code: 'PROVIDER_ERROR',
            provider,
            retryable: true
        };
    }

    // 503: Service Unavailable
    if (errorLower.includes('503') || errorLower.includes('service unavailable')) {
        return {
            status: 503,
            message: `${providerName} service is temporarily unavailable. Please try again later.`,
            code: 'SERVICE_UNAVAILABLE',
            provider,
            retryable: true
        };
    }

    // 504: Timeout
    if (errorLower.includes('timeout') ||
        errorLower.includes('504') ||
        errorLower.includes('etimedout')) {

        return {
            status: 504,
            message: 'Request timed out. Please try again with a shorter message or fewer entities.',
            code: 'TIMEOUT',
            provider,
            retryable: true
        };
    }

    // Network errors
    if (errorLower.includes('enotfound') ||
        errorLower.includes('network') ||
        errorLower.includes('econnrefused')) {

        return {
            status: 503,
            message: 'Network error. Please check your internet connection and try again.',
            code: 'NETWORK_ERROR',
            provider,
            retryable: true
        };
    }

    // Context length exceeded
    if (errorLower.includes('context length') ||
        errorLower.includes('token limit') ||
        errorLower.includes('maximum context')) {

        return {
            status: 400,
            message: 'Message is too long or includes too much context. Please reduce the message length or unpin some entities.',
            code: 'CONTEXT_LENGTH_EXCEEDED',
            provider,
            retryable: false
        };
    }

    // Generic error
    return {
        status: 500,
        message: `AI Error: ${errorMsg}`,
        code: 'UNKNOWN_ERROR',
        provider,
        retryable: false,
        details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
    };
}

/**
 * Convert ApiError to ErrorResponse
 */
export function toErrorResponse(apiError: ApiError): ErrorResponse {
    const response: ErrorResponse = {
        error: apiError.message,
        code: apiError.code,
        provider: apiError.provider,
        invalidKey: apiError.invalidKey
    };

    if (apiError.details?.retryAfter) {
        response.retryAfter = apiError.details.retryAfter;
    }

    if (process.env.NODE_ENV === 'development' && apiError.details) {
        response.details = apiError.details;
    }

    return response;
}

/**
 * Create a standardized Response object for errors
 */
export function createErrorResponse(apiError: ApiError, corsHeaders: Record<string, string> = {}): Response {
    return new Response(
        JSON.stringify(toErrorResponse(apiError)),
        {
            status: apiError.status,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        }
    );
}

/**
 * Fallback strategy for provider errors
 *
 * TODO Phase 2: Implement automatic fallback to alternative providers
 */
export function getFallbackProvider(failedProvider: ProviderType): ProviderType | null {
    // TODO Phase 2: Implement multi-provider fallback logic
    // For now, return null (no fallback)

    // Future implementation:
    // - Check if alternative provider API key is configured
    // - Return alternative provider (e.g., if Anthropic fails, try OpenAI)
    // - Consider provider-specific capabilities (some tasks better suited for certain providers)

    return null;
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(apiError: ApiError): boolean {
    return apiError.retryable === true;
}

/**
 * Calculate exponential backoff delay for retries
 */
export function calculateRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
    const delay = baseDelay * Math.pow(2, attemptNumber - 1);

    // Add jitter (random 0-500ms) to prevent thundering herd
    const jitter = Math.random() * 500;

    // Cap at 30 seconds
    return Math.min(delay + jitter, 30000);
}
