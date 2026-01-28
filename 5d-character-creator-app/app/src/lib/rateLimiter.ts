/**
 * Rate Limiter
 *
 * Simple token bucket rate limiter for API endpoints.
 * Tracks requests per user/session in memory.
 *
 * TODO Phase 2: Upgrade to Redis for production/distributed systems
 */

interface TokenBucket {
    tokens: number;
    lastRefill: number;
}

interface RateLimitConfig {
    maxTokens: number;      // Maximum tokens in bucket
    refillRate: number;     // Tokens added per second
    windowMs: number;       // Time window for tracking (milliseconds)
}

// Default configuration: 20 requests per minute
const DEFAULT_CONFIG: RateLimitConfig = {
    maxTokens: 20,
    refillRate: 20 / 60, // 20 tokens per 60 seconds = 0.33 tokens/second
    windowMs: 60 * 1000  // 1 minute
};

// In-memory storage (TODO: Replace with Redis in production)
const buckets = new Map<string, TokenBucket>();

/**
 * Check if request is within rate limit
 *
 * @param identifier - Unique identifier (user ID, IP address, session ID)
 * @param config - Optional custom rate limit configuration
 * @returns Object with allowed status and remaining tokens
 */
export function checkRateLimit(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // Get or create bucket for this identifier
    let bucket = buckets.get(identifier);
    const now = Date.now();

    if (!bucket) {
        bucket = {
            tokens: cfg.maxTokens - 1, // Consume one token immediately
            lastRefill: now
        };
        buckets.set(identifier, bucket);

        return {
            allowed: true,
            remaining: bucket.tokens,
            resetAt: now + cfg.windowMs
        };
    }

    // Calculate tokens to add based on time elapsed
    const timeSinceLastRefill = (now - bucket.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = timeSinceLastRefill * cfg.refillRate;

    // Refill bucket (up to max)
    bucket.tokens = Math.min(cfg.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if request is allowed
    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        buckets.set(identifier, bucket);

        return {
            allowed: true,
            remaining: Math.floor(bucket.tokens),
            resetAt: now + cfg.windowMs
        };
    }

    // Rate limit exceeded
    return {
        allowed: false,
        remaining: 0,
        resetAt: now + Math.ceil((1 - bucket.tokens) / cfg.refillRate * 1000)
    };
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual overrides
 */
export function resetRateLimit(identifier: string): void {
    buckets.delete(identifier);
}

/**
 * Clear all rate limit data
 * Useful for cleanup or testing
 */
export function clearAllRateLimits(): void {
    buckets.clear();
}

/**
 * Get current rate limit status without consuming a token
 */
export function getRateLimitStatus(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
): { remaining: number; resetAt: number } {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const bucket = buckets.get(identifier);
    const now = Date.now();

    if (!bucket) {
        return {
            remaining: cfg.maxTokens,
            resetAt: now + cfg.windowMs
        };
    }

    // Calculate current tokens without modifying bucket
    const timeSinceLastRefill = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timeSinceLastRefill * cfg.refillRate;
    const currentTokens = Math.min(cfg.maxTokens, bucket.tokens + tokensToAdd);

    return {
        remaining: Math.floor(currentTokens),
        resetAt: now + cfg.windowMs
    };
}

/**
 * Cleanup old buckets (run periodically)
 * Removes buckets that haven't been used in the last hour
 */
export function cleanupOldBuckets(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const [identifier, bucket] of buckets.entries()) {
        if (bucket.lastRefill < oneHourAgo) {
            buckets.delete(identifier);
        }
    }
}

// Auto-cleanup every 10 minutes
if (typeof globalThis !== 'undefined') {
    setInterval(cleanupOldBuckets, 10 * 60 * 1000);
}
