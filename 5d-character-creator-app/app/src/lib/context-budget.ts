/**
 * Context Budget Manager
 *
 * Priority-based context composition that fits within token budgets.
 * Higher priority sections are included first; lower priorities are truncated or dropped.
 */

import { estimateTokens } from './context-compression';

/**
 * Priority levels for context sections
 * Higher number = higher priority = included first
 */
export const CONTEXT_PRIORITIES = {
    SYSTEM_PROMPT: 100,    // Base system prompt - always included
    MODE_INSTRUCTION: 90,  // Mode-specific instructions
    LINKED_ENTITY: 80,     // Primary linked character/world/project
    SESSION_SETUP: 75,     // Session configuration and user preferences
    SECONDARY_ENTITY: 70,  // Secondary linked entities (multi-entity sessions)
    RAG_KNOWLEDGE: 70,     // Retrieved knowledge bank content (increased priority)
    SESSION_SUMMARY: 30,   // AI-generated session summary
    CONVERSATION_HISTORY: 20, // Older conversation context
} as const;

export type ContextPriority = typeof CONTEXT_PRIORITIES[keyof typeof CONTEXT_PRIORITIES];

/**
 * A section of context to be composed into the final prompt
 */
export interface ContextSection {
    id: string;
    content: string;
    priority: ContextPriority;
    /** Can this section be truncated if needed? */
    truncatable?: boolean;
    /** Minimum tokens to keep if truncated */
    minTokens?: number;
    /** Label for debugging */
    label?: string;
}

/**
 * Result of context composition
 */
export interface ComposedContext {
    content: string;
    totalTokens: number;
    includedSections: string[];
    truncatedSections: string[];
    droppedSections: string[];
}

/**
 * Options for context composition
 */
export interface ComposeContextOptions {
    maxTokens: number;
    /** Reserve tokens for AI response */
    responseBuffer?: number;
    /** Separator between sections */
    separator?: string;
}

/**
 * Compose context sections into a single string within token budget
 */
export function composeContext(
    sections: ContextSection[],
    options: ComposeContextOptions
): ComposedContext {
    const {
        maxTokens,
        responseBuffer = 1000,
        separator = '\n\n---\n\n'
    } = options;

    const effectiveMax = maxTokens - responseBuffer;
    const separatorTokens = estimateTokens(separator);

    // Sort by priority (highest first)
    const sorted = [...sections].sort((a, b) => b.priority - a.priority);

    const includedSections: string[] = [];
    const truncatedSections: string[] = [];
    const droppedSections: string[] = [];
    const finalContent: string[] = [];

    let currentTokens = 0;

    for (const section of sorted) {
        const sectionTokens = estimateTokens(section.content);
        const totalWithSeparator = sectionTokens + (finalContent.length > 0 ? separatorTokens : 0);

        // Check if section fits entirely
        if (currentTokens + totalWithSeparator <= effectiveMax) {
            finalContent.push(section.content);
            currentTokens += totalWithSeparator;
            includedSections.push(section.id);
            continue;
        }

        // Check if section can be truncated
        if (section.truncatable) {
            const availableTokens = effectiveMax - currentTokens - (finalContent.length > 0 ? separatorTokens : 0);
            const minTokens = section.minTokens || 100;

            if (availableTokens >= minTokens) {
                // Truncate the content
                const truncated = truncateToTokens(section.content, availableTokens);
                finalContent.push(truncated);
                currentTokens += estimateTokens(truncated) + (finalContent.length > 1 ? separatorTokens : 0);
                truncatedSections.push(section.id);
                continue;
            }
        }

        // Section doesn't fit and can't be truncated
        droppedSections.push(section.id);
    }

    return {
        content: finalContent.join(separator),
        totalTokens: currentTokens,
        includedSections,
        truncatedSections,
        droppedSections
    };
}

/**
 * Truncate text to approximately the specified token count
 */
function truncateToTokens(text: string, maxTokens: number): string {
    const estimatedChars = maxTokens * 4; // ~4 chars per token

    if (text.length <= estimatedChars) {
        return text;
    }

    // Try to cut at paragraph boundary
    const truncated = text.slice(0, estimatedChars);
    const lastParagraph = truncated.lastIndexOf('\n\n');

    if (lastParagraph > estimatedChars * 0.6) {
        return truncated.slice(0, lastParagraph) + '\n\n[Truncated for context limits]';
    }

    // Try to cut at sentence boundary
    const lastSentence = Math.max(
        truncated.lastIndexOf('. '),
        truncated.lastIndexOf('! '),
        truncated.lastIndexOf('? ')
    );

    if (lastSentence > estimatedChars * 0.6) {
        return truncated.slice(0, lastSentence + 1) + ' [Truncated]';
    }

    return truncated + '... [Truncated]';
}

/**
 * Create a context section helper
 */
export function createSection(
    id: string,
    content: string,
    priority: ContextPriority,
    options?: Partial<Omit<ContextSection, 'id' | 'content' | 'priority'>>
): ContextSection {
    return {
        id,
        content,
        priority,
        ...options
    };
}

/**
 * Default token budgets for different models
 */
export const MODEL_CONTEXT_LIMITS = {
    'claude-3-haiku-20240307': 200000,
    'claude-3-5-sonnet-20241022': 200000,
    'claude-3-opus-20240229': 200000,
    'gpt-4o': 128000,
    'gpt-4-turbo': 128000,
    'gpt-3.5-turbo': 16000,
} as const;

/**
 * Get recommended context budget for a model
 * Uses 70% of model limit to leave room for response and safety margin
 */
export function getRecommendedBudget(model: string): number {
    const limit = MODEL_CONTEXT_LIMITS[model as keyof typeof MODEL_CONTEXT_LIMITS];
    if (limit) {
        return Math.floor(limit * 0.7);
    }
    // Default to conservative limit
    return 10000;
}

/**
 * Build context sections from session data
 */
export function buildContextSections(params: {
    systemPrompt: string;
    modeInstruction?: string;
    linkedCharacter?: string;
    linkedWorld?: string;
    linkedProject?: string;
    secondaryEntities?: string[];
    ragContext?: string;
    sessionSummary?: string;
    conversationHistory?: string;
}): ContextSection[] {
    const sections: ContextSection[] = [];

    // System prompt (always required)
    sections.push(createSection(
        'system-prompt',
        params.systemPrompt,
        CONTEXT_PRIORITIES.SYSTEM_PROMPT,
        { label: 'Base System Prompt' }
    ));

    // Mode instruction
    if (params.modeInstruction) {
        sections.push(createSection(
            'mode-instruction',
            `### MODE INSTRUCTIONS\n${params.modeInstruction}`,
            CONTEXT_PRIORITIES.MODE_INSTRUCTION,
            { label: 'Mode Instructions' }
        ));
    }

    // Primary linked entity
    if (params.linkedCharacter) {
        sections.push(createSection(
            'linked-character',
            `### LINKED CHARACTER\n${params.linkedCharacter}`,
            CONTEXT_PRIORITIES.LINKED_ENTITY,
            { label: 'Linked Character', truncatable: true, minTokens: 200 }
        ));
    }

    if (params.linkedWorld) {
        sections.push(createSection(
            'linked-world',
            `### LINKED WORLD\n${params.linkedWorld}`,
            CONTEXT_PRIORITIES.LINKED_ENTITY,
            { label: 'Linked World', truncatable: true, minTokens: 200 }
        ));
    }

    if (params.linkedProject) {
        sections.push(createSection(
            'linked-project',
            `### LINKED PROJECT\n${params.linkedProject}`,
            CONTEXT_PRIORITIES.LINKED_ENTITY,
            { label: 'Linked Project', truncatable: true, minTokens: 150 }
        ));
    }

    // Secondary entities
    if (params.secondaryEntities?.length) {
        params.secondaryEntities.forEach((entity, i) => {
            sections.push(createSection(
                `secondary-entity-${i}`,
                entity,
                CONTEXT_PRIORITIES.SECONDARY_ENTITY,
                { label: `Secondary Entity ${i + 1}`, truncatable: true, minTokens: 100 }
            ));
        });
    }

    // RAG knowledge
    if (params.ragContext) {
        sections.push(createSection(
            'rag-knowledge',
            `### RELEVANT KNOWLEDGE BANK EXTRACTS\n${params.ragContext}`,
            CONTEXT_PRIORITIES.RAG_KNOWLEDGE,
            { label: 'RAG Knowledge', truncatable: true, minTokens: 100 }
        ));
    }

    // Session summary
    if (params.sessionSummary) {
        sections.push(createSection(
            'session-summary',
            `### SESSION SUMMARY\n${params.sessionSummary}`,
            CONTEXT_PRIORITIES.SESSION_SUMMARY,
            { label: 'Session Summary', truncatable: true, minTokens: 50 }
        ));
    }

    // Conversation history
    if (params.conversationHistory) {
        sections.push(createSection(
            'conversation-history',
            `### EARLIER CONVERSATION\n${params.conversationHistory}`,
            CONTEXT_PRIORITIES.CONVERSATION_HISTORY,
            { label: 'Conversation History', truncatable: true, minTokens: 100 }
        ));
    }

    return sections;
}
