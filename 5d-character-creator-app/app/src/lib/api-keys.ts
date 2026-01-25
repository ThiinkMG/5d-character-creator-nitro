/**
 * Utility functions for retrieving API keys
 * Checks admin keys first (from .env), then falls back to user-entered keys
 */

export interface ApiKeys {
    anthropicKey?: string;
    openaiKey?: string;
    geminiKey?: string;
    dalleKey?: string;
}

/**
 * Get API keys, checking admin keys first if admin mode is active
 */
export function getApiKeys(): ApiKeys {
    if (typeof window === 'undefined') {
        return {};
    }

    const isAdminMode = localStorage.getItem('5d-admin-mode') === 'true';
    
    if (isAdminMode) {
        // Try to get admin keys first
        const adminKeys = localStorage.getItem('5d-api-keys-admin');
        if (adminKeys) {
            try {
                return JSON.parse(adminKeys);
            } catch (e) {
                console.error('Failed to parse admin keys:', e);
            }
        }
    }

    // Fall back to regular config
    const savedConfig = localStorage.getItem('5d-api-config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            return {
                anthropicKey: config.anthropicKey && config.anthropicKey !== '••••••••••••' ? config.anthropicKey : undefined,
                openaiKey: config.openaiKey && config.openaiKey !== '••••••••••••' ? config.openaiKey : undefined,
                geminiKey: config.geminiKey && config.geminiKey !== '••••••••••••' ? config.geminiKey : undefined,
                dalleKey: config.dalleKey && config.dalleKey !== '••••••••••••' ? config.dalleKey : undefined,
            };
        } catch (e) {
            console.error('Failed to parse API config:', e);
        }
    }

    return {};
}

/**
 * Get the current chat API key based on provider
 */
export function getChatApiKey(provider: 'anthropic' | 'openai' = 'anthropic'): string {
    const keys = getApiKeys();
    return provider === 'openai' ? (keys.openaiKey || '') : (keys.anthropicKey || '');
}

/**
 * Get API config object (includes provider and other settings)
 */
export function getApiConfig(): {
    provider: 'anthropic' | 'openai';
    anthropicKey: string;
    openaiKey: string;
    geminiKey: string;
    dalleKey: string;
    imageProvider: string;
} {
    if (typeof window === 'undefined') {
        return {
            provider: 'anthropic',
            anthropicKey: '',
            openaiKey: '',
            geminiKey: '',
            dalleKey: '',
            imageProvider: 'free',
        };
    }

    const isAdminMode = localStorage.getItem('5d-admin-mode') === 'true';
    const savedConfig = localStorage.getItem('5d-api-config');
    
    const defaultConfig = {
        provider: 'anthropic' as const,
        anthropicKey: '',
        openaiKey: '',
        geminiKey: '',
        dalleKey: '',
        imageProvider: 'free',
    };

    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            const keys = getApiKeys(); // Get actual keys (admin or user)
            
            return {
                provider: config.provider || 'anthropic',
                anthropicKey: keys.anthropicKey || '',
                openaiKey: keys.openaiKey || '',
                geminiKey: keys.geminiKey || '',
                dalleKey: keys.dalleKey || keys.openaiKey || '',
                imageProvider: config.imageProvider || 'free',
            };
        } catch (e) {
            console.error('Failed to parse API config:', e);
        }
    }

    return defaultConfig;
}

/**
 * Get API config in the format expected by existing code (for backward compatibility)
 * Returns config object that can be used like: savedConfig.geminiKey, savedConfig.openaiKey, etc.
 */
export function getApiConfigForImageGeneration(): {
    anthropicKey?: string;
    openaiKey?: string;
    geminiKey?: string;
    dalleKey?: string;
    provider?: string;
    imageProvider?: string;
} {
    const keys = getApiKeys();
    const savedConfig = typeof window !== 'undefined' ? localStorage.getItem('5d-api-config') : null;
    
    let baseConfig: any = {};
    if (savedConfig) {
        try {
            baseConfig = JSON.parse(savedConfig);
        } catch (e) {
            console.error('Failed to parse config:', e);
        }
    }
    
    // Merge actual keys (from admin or user) into config
    return {
        ...baseConfig,
        anthropicKey: keys.anthropicKey || baseConfig.anthropicKey,
        openaiKey: keys.openaiKey || baseConfig.openaiKey,
        geminiKey: keys.geminiKey || baseConfig.geminiKey,
        dalleKey: keys.dalleKey || keys.openaiKey || baseConfig.dalleKey || baseConfig.openaiKey,
    };
}
