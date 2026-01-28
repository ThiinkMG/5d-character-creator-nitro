/**
 * Mode-Specific Context Configuration
 * Defines which entity fields to include for each chat mode
 *
 * Strategy: Just-in-Time Context Injection
 * - Each mode gets only the fields it needs
 * - High priority fields are always included
 * - Medium/low priority fields are included if token budget allows
 */

import type { ChatMode } from './mode-registry';

export type FieldPriority = 'high' | 'medium' | 'low';

export interface FieldConfig {
    field: string;
    priority: FieldPriority;
    /** Optional nested path for deep fields like "voiceProfile.sampleDialogue" */
    path?: string[];
    /** Max items if field is an array */
    maxItems?: number;
}

export interface ModeContextConfig {
    mode: ChatMode;
    description: string;
    characterFields: FieldConfig[];
    worldFields: FieldConfig[];
    projectFields: FieldConfig[];
    /** Token budget allocation for this mode (% of total) */
    tokenBudgetPercentage: {
        character: number; // %
        world: number; // %
        project: number; // %
    };
    /** How to format the context */
    formatHint: 'minimal' | 'standard' | 'detailed';
}

/**
 * Mode-specific context configurations for all 9 modes
 */
export const MODE_CONTEXT_CONFIGS: Record<ChatMode, ModeContextConfig> = {
    // CHAT MODE: Minimal context - just basics for general conversation
    chat: {
        mode: 'chat',
        description: 'General freeform conversation with minimal entity context',
        characterFields: [
            { field: 'name', priority: 'high' },
            { field: 'role', priority: 'high' },
            { field: 'coreConcept', priority: 'high' },
        ],
        worldFields: [
            { field: 'name', priority: 'high' },
            { field: 'genre', priority: 'high' },
            { field: 'tagline', priority: 'medium' },
        ],
        projectFields: [
            { field: 'name', priority: 'high' },
            { field: 'genre', priority: 'high' },
            { field: 'summary', priority: 'high' },
        ],
        tokenBudgetPercentage: { character: 20, world: 20, project: 20 },
        formatHint: 'minimal',
    },

    // CHARACTER MODE: Full character fields for creation/editing
    character: {
        mode: 'character',
        description: 'Character creation and development - all character fields',
        characterFields: [
            { field: 'name', priority: 'high' },
            { field: 'role', priority: 'high' },
            { field: 'phase', priority: 'high' },
            { field: 'progress', priority: 'high' },
            { field: 'coreConcept', priority: 'high' },
            { field: 'archetype', priority: 'high' },
            { field: 'motivations', priority: 'high', maxItems: 5 },
            { field: 'flaws', priority: 'high', maxItems: 5 },
            { field: 'fears', priority: 'medium', maxItems: 3 },
            { field: 'origin', priority: 'medium' },
            { field: 'ghost', priority: 'medium' },
            { field: 'allies', priority: 'medium', maxItems: 5 },
            { field: 'enemies', priority: 'medium', maxItems: 5 },
            { field: 'arcType', priority: 'medium' },
            { field: 'climax', priority: 'medium' },
            { field: 'personalityProse', priority: 'low' },
            { field: 'backstoryProse', priority: 'low' },
            { field: 'relationshipsProse', priority: 'low' },
            { field: 'arcProse', priority: 'low' },
        ],
        worldFields: [
            { field: 'name', priority: 'medium' },
            { field: 'genre', priority: 'medium' },
            { field: 'tone', priority: 'medium' },
            { field: 'rules', priority: 'low', maxItems: 3 },
        ],
        projectFields: [
            { field: 'name', priority: 'medium' },
            { field: 'genre', priority: 'medium' },
            { field: 'summary', priority: 'low' },
        ],
        tokenBudgetPercentage: { character: 70, world: 15, project: 15 },
        formatHint: 'detailed',
    },

    // WORLD MODE: Full world fields for world-building
    world: {
        mode: 'world',
        description: 'World-building - all world fields plus linked characters',
        characterFields: [
            { field: 'name', priority: 'medium' },
            { field: 'role', priority: 'medium' },
            { field: 'coreConcept', priority: 'medium' },
            { field: 'origin', priority: 'low' },
        ],
        worldFields: [
            { field: 'name', priority: 'high' },
            { field: 'genre', priority: 'high' },
            { field: 'tone', priority: 'high' },
            { field: 'tagline', priority: 'high' },
            { field: 'description', priority: 'high' },
            { field: 'rules', priority: 'high', maxItems: 10 },
            { field: 'history', priority: 'medium' },
            { field: 'geography', priority: 'medium' },
            { field: 'societies', priority: 'medium', maxItems: 5 },
            { field: 'factions', priority: 'medium', maxItems: 5 },
            { field: 'locations', priority: 'medium', maxItems: 5 },
            { field: 'magicSystem', priority: 'medium' },
            { field: 'technology', priority: 'medium' },
            { field: 'overviewProse', priority: 'low' },
            { field: 'historyProse', priority: 'low' },
            { field: 'factionsProse', priority: 'low' },
            { field: 'geographyProse', priority: 'low' },
        ],
        projectFields: [
            { field: 'name', priority: 'medium' },
            { field: 'genre', priority: 'medium' },
            { field: 'summary', priority: 'low' },
        ],
        tokenBudgetPercentage: { character: 15, world: 70, project: 15 },
        formatHint: 'detailed',
    },

    // PROJECT MODE: Project management with all linked entities
    project: {
        mode: 'project',
        description: 'Project management - project fields plus all linked entities',
        characterFields: [
            { field: 'name', priority: 'high' },
            { field: 'role', priority: 'high' },
            { field: 'coreConcept', priority: 'high' },
            { field: 'arcType', priority: 'medium' },
            { field: 'progress', priority: 'medium' },
        ],
        worldFields: [
            { field: 'name', priority: 'high' },
            { field: 'genre', priority: 'high' },
            { field: 'tone', priority: 'medium' },
            { field: 'tagline', priority: 'medium' },
        ],
        projectFields: [
            { field: 'name', priority: 'high' },
            { field: 'genre', priority: 'high' },
            { field: 'summary', priority: 'high' },
            { field: 'description', priority: 'medium' },
            { field: 'timeline', priority: 'medium', maxItems: 10 },
            { field: 'tags', priority: 'low', maxItems: 5 },
        ],
        tokenBudgetPercentage: { character: 35, world: 25, project: 40 },
        formatHint: 'standard',
    },

    // LORE MODE: World history, culture, magic systems
    lore: {
        mode: 'lore',
        description: 'Lore exploration - world fields with history and cultural elements',
        characterFields: [
            { field: 'name', priority: 'medium' },
            { field: 'role', priority: 'medium' },
            { field: 'origin', priority: 'medium' },
            { field: 'ghost', priority: 'low' },
        ],
        worldFields: [
            { field: 'name', priority: 'high' },
            { field: 'genre', priority: 'high' },
            { field: 'tone', priority: 'high' },
            { field: 'history', priority: 'high' },
            { field: 'historyProse', priority: 'high' },
            { field: 'rules', priority: 'high', maxItems: 10 },
            { field: 'magicSystem', priority: 'high' },
            { field: 'technology', priority: 'high' },
            { field: 'factions', priority: 'medium', maxItems: 8 },
            { field: 'factionsProse', priority: 'medium' },
            { field: 'societies', priority: 'medium', maxItems: 5 },
            { field: 'geography', priority: 'low' },
            { field: 'locations', priority: 'low', maxItems: 5 },
        ],
        projectFields: [
            { field: 'name', priority: 'medium' },
            { field: 'genre', priority: 'medium' },
            { field: 'timeline', priority: 'medium', maxItems: 10 },
        ],
        tokenBudgetPercentage: { character: 15, world: 75, project: 10 },
        formatHint: 'detailed',
    },

    // SCENE MODE: Character voice profiles + relationships for roleplay
    scene: {
        mode: 'scene',
        description: 'Scene writing - voice profiles, personalities, relationships',
        characterFields: [
            { field: 'name', priority: 'high' },
            { field: 'role', priority: 'high' },
            { field: 'coreConcept', priority: 'high' },
            { field: 'voiceProfile', priority: 'high', path: ['voiceProfile'] },
            { field: 'motivations', priority: 'high', maxItems: 5 },
            { field: 'flaws', priority: 'high', maxItems: 5 },
            { field: 'fears', priority: 'medium', maxItems: 3 },
            { field: 'personalityProse', priority: 'medium' },
            { field: 'allies', priority: 'medium', maxItems: 5 },
            { field: 'enemies', priority: 'medium', maxItems: 5 },
            { field: 'relationshipsProse', priority: 'medium' },
            { field: 'origin', priority: 'low' },
            { field: 'ghost', priority: 'low' },
        ],
        worldFields: [
            { field: 'name', priority: 'medium' },
            { field: 'genre', priority: 'medium' },
            { field: 'tone', priority: 'high' },
            { field: 'rules', priority: 'medium', maxItems: 5 },
        ],
        projectFields: [
            { field: 'name', priority: 'low' },
            { field: 'summary', priority: 'low' },
        ],
        tokenBudgetPercentage: { character: 70, world: 20, project: 10 },
        formatHint: 'detailed',
    },

    // WORKSHOP MODE: Character arc, conflicts, motivations deep-dive
    workshop: {
        mode: 'workshop',
        description: 'Workshop mode - deep-dive into character sections',
        characterFields: [
            { field: 'name', priority: 'high' },
            { field: 'role', priority: 'high' },
            { field: 'phase', priority: 'high' },
            { field: 'coreConcept', priority: 'high' },
            { field: 'motivations', priority: 'high', maxItems: 10 },
            { field: 'flaws', priority: 'high', maxItems: 10 },
            { field: 'fears', priority: 'high', maxItems: 10 },
            { field: 'arcType', priority: 'high' },
            { field: 'climax', priority: 'high' },
            { field: 'origin', priority: 'medium' },
            { field: 'ghost', priority: 'medium' },
            { field: 'allies', priority: 'medium', maxItems: 5 },
            { field: 'enemies', priority: 'medium', maxItems: 5 },
            { field: 'personalityProse', priority: 'medium' },
            { field: 'backstoryProse', priority: 'medium' },
            { field: 'relationshipsProse', priority: 'medium' },
            { field: 'arcProse', priority: 'high' },
        ],
        worldFields: [
            { field: 'name', priority: 'low' },
            { field: 'genre', priority: 'low' },
            { field: 'tone', priority: 'low' },
        ],
        projectFields: [
            { field: 'name', priority: 'low' },
            { field: 'summary', priority: 'low' },
        ],
        tokenBudgetPercentage: { character: 80, world: 10, project: 10 },
        formatHint: 'detailed',
    },

    // CHAT_WITH MODE: Voice profile + personality + speech patterns for roleplay
    chat_with: {
        mode: 'chat_with',
        description: 'Character roleplay - voice profile, personality, speech patterns',
        characterFields: [
            { field: 'name', priority: 'high' },
            { field: 'role', priority: 'high' },
            { field: 'coreConcept', priority: 'high' },
            { field: 'voiceProfile', priority: 'high', path: ['voiceProfile'] },
            { field: 'motivations', priority: 'high', maxItems: 5 },
            { field: 'flaws', priority: 'high', maxItems: 5 },
            { field: 'fears', priority: 'high', maxItems: 3 },
            { field: 'personalityProse', priority: 'high' },
            { field: 'origin', priority: 'medium' },
            { field: 'ghost', priority: 'medium' },
            { field: 'backstoryProse', priority: 'medium' },
            { field: 'allies', priority: 'low', maxItems: 3 },
            { field: 'enemies', priority: 'low', maxItems: 3 },
        ],
        worldFields: [
            { field: 'name', priority: 'medium' },
            { field: 'genre', priority: 'medium' },
            { field: 'tone', priority: 'high' },
            { field: 'rules', priority: 'low', maxItems: 3 },
        ],
        projectFields: [
            { field: 'name', priority: 'low' },
        ],
        tokenBudgetPercentage: { character: 80, world: 15, project: 5 },
        formatHint: 'detailed',
    },

    // SCRIPT MODE: Dialogue samples + voice profile + scene context
    script: {
        mode: 'script',
        description: 'Script creation - dialogue samples, voice profiles, scene context',
        characterFields: [
            { field: 'name', priority: 'high' },
            { field: 'role', priority: 'high' },
            { field: 'coreConcept', priority: 'high' },
            { field: 'voiceProfile', priority: 'high', path: ['voiceProfile'] },
            { field: 'motivations', priority: 'high', maxItems: 5 },
            { field: 'flaws', priority: 'high', maxItems: 5 },
            { field: 'personalityProse', priority: 'medium' },
            { field: 'allies', priority: 'medium', maxItems: 5 },
            { field: 'enemies', priority: 'medium', maxItems: 5 },
            { field: 'relationshipsProse', priority: 'medium' },
        ],
        worldFields: [
            { field: 'name', priority: 'medium' },
            { field: 'genre', priority: 'medium' },
            { field: 'tone', priority: 'high' },
            { field: 'rules', priority: 'medium', maxItems: 5 },
            { field: 'societies', priority: 'low', maxItems: 3 },
        ],
        projectFields: [
            { field: 'name', priority: 'medium' },
            { field: 'summary', priority: 'low' },
            { field: 'timeline', priority: 'low', maxItems: 5 },
        ],
        tokenBudgetPercentage: { character: 65, world: 25, project: 10 },
        formatHint: 'detailed',
    },
};

/**
 * Get context configuration for a specific mode
 */
export function getModeContextConfig(mode: ChatMode): ModeContextConfig {
    return MODE_CONTEXT_CONFIGS[mode];
}

/**
 * Calculate token budget for each entity type based on mode and total budget
 */
export function calculateEntityBudgets(
    mode: ChatMode,
    totalBudget: number
): { character: number; world: number; project: number } {
    const config = getModeContextConfig(mode);
    return {
        character: Math.floor(totalBudget * (config.tokenBudgetPercentage.character / 100)),
        world: Math.floor(totalBudget * (config.tokenBudgetPercentage.world / 100)),
        project: Math.floor(totalBudget * (config.tokenBudgetPercentage.project / 100)),
    };
}

/**
 * Get fields for a specific priority level
 */
export function getFieldsByPriority(
    fields: FieldConfig[],
    priority: FieldPriority
): FieldConfig[] {
    return fields.filter(f => f.priority === priority);
}
