/**
 * API Request Validation
 *
 * Validates and sanitizes incoming API requests for the chat endpoint.
 * Ensures data integrity and security.
 */

import { ChatMode } from './mode-registry';

export interface ChatRequestBody {
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
    provider?: 'anthropic' | 'openai';
    apiKey?: string;
    isAdminMode?: boolean;

    // Phase 1: New context injection fields
    pinnedEntityIds?: string[];
    mentionedEntityIds?: string[];

    // Existing structured context fields
    linkedCharacter?: any;
    linkedWorld?: any;
    linkedProject?: any;
    modeInstruction?: string;
    sessionSetup?: any;
    mode?: ChatMode;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    sanitized?: ChatRequestBody;
}

/**
 * Validate chat request body
 */
export function validateChatRequest(body: any): ValidationResult {
    const errors: string[] = [];

    // Check if body exists
    if (!body || typeof body !== 'object') {
        return {
            valid: false,
            errors: ['Request body is required']
        };
    }

    // Validate messages array
    if (!body.messages || !Array.isArray(body.messages)) {
        errors.push('Messages array is required');
    } else {
        if (body.messages.length === 0) {
            errors.push('Messages array must not be empty');
        }

        // Validate each message
        body.messages.forEach((msg: any, index: number) => {
            if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
                errors.push(`Message ${index}: Invalid role`);
            }
            if (typeof msg.content !== 'string') {
                errors.push(`Message ${index}: Content must be a string`);
            }
            // Check message length (50k characters max)
            if (msg.content && msg.content.length > 50000) {
                errors.push(`Message ${index}: Content exceeds maximum length (50,000 characters)`);
            }
        });
    }

    // Validate provider
    if (body.provider && !['anthropic', 'openai'].includes(body.provider)) {
        errors.push('Provider must be either "anthropic" or "openai"');
    }

    // Validate API key if provided
    if (body.apiKey && typeof body.apiKey !== 'string') {
        errors.push('API key must be a string');
    }

    // Validate pinned entity IDs (Phase 1)
    if (body.pinnedEntityIds) {
        if (!Array.isArray(body.pinnedEntityIds)) {
            errors.push('pinnedEntityIds must be an array');
        } else {
            body.pinnedEntityIds.forEach((id: any, index: number) => {
                if (!isValidEntityId(id)) {
                    errors.push(`pinnedEntityIds[${index}]: Invalid entity ID format`);
                }
            });
        }
    }

    // Validate mentioned entity IDs (Phase 1)
    if (body.mentionedEntityIds) {
        if (!Array.isArray(body.mentionedEntityIds)) {
            errors.push('mentionedEntityIds must be an array');
        } else {
            body.mentionedEntityIds.forEach((id: any, index: number) => {
                if (!isValidEntityId(id)) {
                    errors.push(`mentionedEntityIds[${index}]: Invalid entity ID format`);
                }
            });
        }
    }

    if (errors.length > 0) {
        return {
            valid: false,
            errors
        };
    }

    // Sanitize and return
    const sanitized: ChatRequestBody = {
        messages: sanitizeMessages(body.messages),
        provider: body.provider || 'anthropic',
        apiKey: body.apiKey ? sanitizeApiKey(body.apiKey) : undefined,
        isAdminMode: Boolean(body.isAdminMode),
        pinnedEntityIds: body.pinnedEntityIds || [],
        mentionedEntityIds: body.mentionedEntityIds || [],
        linkedCharacter: body.linkedCharacter,
        linkedWorld: body.linkedWorld,
        linkedProject: body.linkedProject,
        modeInstruction: body.modeInstruction,
        sessionSetup: body.sessionSetup,
        mode: body.mode
    };

    return {
        valid: true,
        errors: [],
        sanitized
    };
}

/**
 * Validate entity ID format
 * Valid formats: #CHAR_123, @WORLD_456, $PROJECT_789
 */
function isValidEntityId(id: any): boolean {
    if (typeof id !== 'string') return false;

    // Match patterns: #CID, @WID, $SID
    const pattern = /^[#@$][A-Z0-9_]+$/;
    return pattern.test(id);
}

/**
 * Sanitize messages array
 */
function sanitizeMessages(messages: any[]): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    return messages.map(msg => ({
        role: msg.role,
        content: sanitizeString(msg.content)
    }));
}

/**
 * Sanitize API key (trim whitespace)
 */
function sanitizeApiKey(key: string): string {
    return key.trim();
}

/**
 * Sanitize string input (remove null bytes, trim)
 */
function sanitizeString(str: string): string {
    if (typeof str !== 'string') return '';

    // Remove null bytes and other control characters except newlines/tabs
    return str
        .replace(/\0/g, '')
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim();
}

/**
 * Parse @ mentions from message content
 * Format: [@EntityName](type:id) or just @EntityName
 */
export function parseEntityMentions(content: string): Array<{ name: string; id?: string; type?: 'character' | 'world' | 'project' }> {
    const mentions: Array<{ name: string; id?: string; type?: 'character' | 'world' | 'project' }> = [];

    // Match markdown-style mentions: [@Name](type:id)
    const markdownPattern = /\[@([^\]]+)\]\((character|world|project):([#@$][A-Z0-9_]+)\)/g;
    let match;

    while ((match = markdownPattern.exec(content)) !== null) {
        mentions.push({
            name: match[1],
            type: match[2] as 'character' | 'world' | 'project',
            id: match[3]
        });
    }

    // Match plain @ mentions: @EntityName (for stub creation)
    const plainPattern = /@([A-Za-z0-9_]+)/g;
    while ((match = plainPattern.exec(content)) !== null) {
        // Only add if not already captured in markdown format
        if (!mentions.some(m => m.name === match[1])) {
            mentions.push({
                name: match[1]
            });
        }
    }

    return mentions;
}

/**
 * Validate total request size (to prevent memory issues)
 */
export function validateRequestSize(body: any): { valid: boolean; error?: string } {
    try {
        const size = JSON.stringify(body).length;
        const maxSize = 1024 * 1024; // 1MB

        if (size > maxSize) {
            return {
                valid: false,
                error: `Request size (${Math.round(size / 1024)}KB) exceeds maximum allowed size (${Math.round(maxSize / 1024)}KB)`
            };
        }

        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            error: 'Failed to calculate request size'
        };
    }
}
