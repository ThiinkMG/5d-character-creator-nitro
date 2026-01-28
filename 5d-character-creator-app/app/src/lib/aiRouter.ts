/**
 * AI Provider Router (Phase 2 Foundation)
 *
 * Multi-provider routing system for intelligent provider selection.
 * Currently provides interfaces and configuration.
 *
 * TODO Phase 2:
 * - Implement automatic provider selection based on task type
 * - Add fallback logic for provider failures
 * - Implement load balancing across providers
 * - Add provider capability detection
 * - Track provider performance metrics
 */

export type ProviderType = 'anthropic' | 'openai' | 'google';

export type TaskType =
    | 'chat'           // General conversation
    | 'brainstorm'     // Creative ideation
    | 'analysis'       // Deep analytical tasks
    | 'creative'       // Story/prose generation
    | 'technical'      // Code/technical content
    | 'summarization'  // Condensing content
    | 'completion';    // Filling gaps

export interface ProviderConfig {
    provider: ProviderType;
    apiKey: string;
    model: string;
    enabled: boolean;
    priority: number; // Higher = preferred (1-10)

    // Provider capabilities
    capabilities: {
        maxTokens: number;
        supportsStreaming: boolean;
        supportsVision: boolean;
        supportsFunctions: boolean;
    };

    // Task-specific suitability scores (0-10)
    taskSuitability: {
        [key in TaskType]: number;
    };

    // Rate limiting
    rateLimit?: {
        maxRequestsPerMinute: number;
        maxTokensPerMinute: number;
    };
}

export interface RouterConfig {
    providers: ProviderConfig[];
    fallbackEnabled: boolean;
    loadBalancing: 'priority' | 'round-robin' | 'least-loaded';
    retryAttempts: number;
}

/**
 * Default provider configurations
 *
 * TODO Phase 2: Make these configurable via environment variables or UI
 */
export const DEFAULT_PROVIDER_CONFIGS: Partial<ProviderConfig>[] = [
    {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        enabled: true,
        priority: 10,
        capabilities: {
            maxTokens: 200000,
            supportsStreaming: true,
            supportsVision: true,
            supportsFunctions: true
        },
        taskSuitability: {
            chat: 9,
            brainstorm: 10,
            analysis: 10,
            creative: 10,
            technical: 8,
            summarization: 9,
            completion: 9
        }
    },
    {
        provider: 'openai',
        model: 'gpt-4o',
        enabled: true,
        priority: 8,
        capabilities: {
            maxTokens: 128000,
            supportsStreaming: true,
            supportsVision: true,
            supportsFunctions: true
        },
        taskSuitability: {
            chat: 9,
            brainstorm: 8,
            analysis: 9,
            creative: 8,
            technical: 10,
            summarization: 9,
            completion: 8
        }
    }
    // TODO Phase 2: Add Google Gemini configuration
];

/**
 * Select best provider for a given task
 *
 * TODO Phase 2: Implement intelligent provider selection
 *
 * @param taskType - Type of task to perform
 * @param config - Router configuration
 * @param context - Additional context for decision making
 * @returns Selected provider type
 */
export function selectProvider(
    taskType: TaskType,
    config: RouterConfig,
    context?: {
        estimatedTokens?: number;
        requiresVision?: boolean;
        requiresFunctions?: boolean;
    }
): ProviderType {
    // TODO Phase 2: Implement selection logic
    // For now, return first enabled provider

    const enabledProviders = config.providers.filter(p => p.enabled);

    if (enabledProviders.length === 0) {
        throw new Error('No providers enabled');
    }

    // Sort by priority (highest first)
    const sorted = [...enabledProviders].sort((a, b) => b.priority - a.priority);

    return sorted[0].provider;
}

/**
 * Get fallback provider if primary fails
 *
 * TODO Phase 2: Implement intelligent fallback selection
 *
 * @param failedProvider - Provider that failed
 * @param taskType - Type of task
 * @param config - Router configuration
 * @returns Fallback provider or null if none available
 */
export function getFallbackProvider(
    failedProvider: ProviderType,
    taskType: TaskType,
    config: RouterConfig
): ProviderType | null {
    // TODO Phase 2: Implement fallback logic
    // Should consider:
    // - Task suitability scores
    // - Provider availability
    // - Rate limit status
    // - Recent failure history

    return null; // No fallback for Phase 1
}

/**
 * Check if provider can handle the request
 *
 * TODO Phase 2: Implement capability checking
 */
export function canProviderHandle(
    provider: ProviderConfig,
    requirements: {
        estimatedTokens: number;
        requiresVision?: boolean;
        requiresFunctions?: boolean;
    }
): boolean {
    // TODO Phase 2: Implement checks
    // For now, assume all providers can handle all requests

    if (requirements.estimatedTokens > provider.capabilities.maxTokens) {
        return false;
    }

    if (requirements.requiresVision && !provider.capabilities.supportsVision) {
        return false;
    }

    if (requirements.requiresFunctions && !provider.capabilities.supportsFunctions) {
        return false;
    }

    return true;
}

/**
 * Create default router configuration
 */
export function createDefaultRouterConfig(): RouterConfig {
    return {
        providers: [], // Will be populated with actual API keys at runtime
        fallbackEnabled: true,
        loadBalancing: 'priority',
        retryAttempts: 2
    };
}

/**
 * Map chat mode to task type
 *
 * Helps router understand which provider is best suited for each mode
 */
export function mapModeToTaskType(mode: string): TaskType {
    const modeTaskMap: Record<string, TaskType> = {
        'chat': 'chat',
        'character': 'creative',
        'world': 'creative',
        'project': 'brainstorm',
        'lore': 'creative',
        'scene': 'creative',
        'workshop': 'analysis',
        'chat_with': 'chat',
        'script': 'creative',
        // Phase 3 modes (future)
        'continuity_check': 'analysis',
        'voice_match': 'analysis',
        'completion_assistant': 'analysis'
    };

    return modeTaskMap[mode] || 'chat';
}

/**
 * Estimate tokens required for request
 *
 * Helps determine if provider can handle the request
 */
export function estimateRequestTokens(params: {
    systemPrompt: string;
    messages: Array<{ role: string; content: string }>;
    context?: string;
}): number {
    // Simple estimation: ~4 characters per token
    const totalChars =
        params.systemPrompt.length +
        params.messages.reduce((sum, m) => sum + m.content.length, 0) +
        (params.context?.length || 0);

    return Math.ceil(totalChars / 4);
}

// Phase 2 TODOs:
// - [ ] Implement intelligent provider selection algorithm
// - [ ] Add provider health checking (ping/status endpoints)
// - [ ] Implement rate limit tracking per provider
// - [ ] Add provider performance metrics (latency, success rate)
// - [ ] Create provider cost tracking
// - [ ] Implement A/B testing for provider quality comparison
// - [ ] Add user preferences for provider selection
// - [ ] Create admin UI for provider configuration
// - [ ] Implement provider circuit breaker pattern
// - [ ] Add provider usage analytics dashboard
