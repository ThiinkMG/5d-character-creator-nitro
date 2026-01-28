/**
 * Just-in-Time Context Injection
 * Assembles optimized context for AI prompts based on mode and linked entities
 */

import type { Character } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';
import type { ChatMode } from './mode-registry';
import {
    getModeContextConfig,
    calculateEntityBudgets,
    getFieldsByPriority,
} from './modeContextConfig';
import {
    filterCharacterFields,
    filterWorldFields,
    filterProjectFields,
    formatEntityContext,
    type FilteredEntity,
} from './entityFieldFilter';
import { estimateTokens } from './context-compression';

/**
 * Entities that can be linked to a chat session
 */
export interface LinkedEntities {
    characters?: Character[];
    worlds?: World[];
    projects?: Project[];
}

/**
 * Context assembly result with metadata
 */
export interface AssembledContext {
    contextString: string;
    tokenCount: number;
    fieldsIncluded: {
        character: string[];
        world: string[];
        project: string[];
    };
    entitiesIncluded: {
        characters: string[];
        worlds: string[];
        projects: string[];
    };
    truncatedFields: string[];
    debugInfo?: {
        mode: ChatMode;
        tokenBudget: number;
        entityBudgets: {
            character: number;
            world: number;
            project: number;
        };
        filteredEntities: FilteredEntity[];
    };
}

/**
 * Assemble context for AI prompt based on mode and linked entities
 *
 * @param mode - Current chat mode
 * @param linkedEntities - Characters, worlds, projects linked to session
 * @param userMessage - Current user message (for context relevance)
 * @param tokenBudget - Maximum tokens for context (default: 3000)
 * @param includeDebugInfo - Include debug metadata in result
 */
export function assembleContextForPrompt(
    mode: ChatMode,
    linkedEntities: LinkedEntities,
    userMessage: string,
    tokenBudget: number = 3000,
    includeDebugInfo: boolean = false
): AssembledContext {
    const config = getModeContextConfig(mode);
    const entityBudgets = calculateEntityBudgets(mode, tokenBudget);

    // Track results
    const filteredEntities: FilteredEntity[] = [];
    const fieldsIncluded = { character: [] as string[], world: [] as string[], project: [] as string[] };
    const entitiesIncluded = { characters: [] as string[], worlds: [] as string[], projects: [] as string[] };
    const truncatedFields: string[] = [];
    let contextParts: string[] = [];
    let totalTokens = 0;

    // Filter and format characters
    if (linkedEntities.characters && linkedEntities.characters.length > 0) {
        const characterBudgetPerEntity = Math.floor(
            entityBudgets.character / linkedEntities.characters.length
        );

        for (const character of linkedEntities.characters) {
            const filtered = filterCharacterFields(
                character,
                config.characterFields,
                characterBudgetPerEntity
            );

            filteredEntities.push(filtered);
            fieldsIncluded.character.push(...filtered.includedFields);
            truncatedFields.push(...filtered.truncatedFields.map(f => `character.${f}`));
            entitiesIncluded.characters.push(character.name);

            const formatted = formatEntityContext(filtered, includeDebugInfo);
            contextParts.push(formatted);
            totalTokens += filtered.tokenCount;
        }
    }

    // Filter and format worlds
    if (linkedEntities.worlds && linkedEntities.worlds.length > 0) {
        const worldBudgetPerEntity = Math.floor(
            entityBudgets.world / linkedEntities.worlds.length
        );

        for (const world of linkedEntities.worlds) {
            const filtered = filterWorldFields(
                world,
                config.worldFields,
                worldBudgetPerEntity
            );

            filteredEntities.push(filtered);
            fieldsIncluded.world.push(...filtered.includedFields);
            truncatedFields.push(...filtered.truncatedFields.map(f => `world.${f}`));
            entitiesIncluded.worlds.push(world.name);

            const formatted = formatEntityContext(filtered, includeDebugInfo);
            contextParts.push(formatted);
            totalTokens += filtered.tokenCount;
        }
    }

    // Filter and format projects
    if (linkedEntities.projects && linkedEntities.projects.length > 0) {
        const projectBudgetPerEntity = Math.floor(
            entityBudgets.project / linkedEntities.projects.length
        );

        for (const project of linkedEntities.projects) {
            const filtered = filterProjectFields(
                project,
                config.projectFields,
                projectBudgetPerEntity
            );

            filteredEntities.push(filtered);
            fieldsIncluded.project.push(...filtered.includedFields);
            truncatedFields.push(...filtered.truncatedFields.map(f => `project.${f}`));
            entitiesIncluded.projects.push(project.name);

            const formatted = formatEntityContext(filtered, includeDebugInfo);
            contextParts.push(formatted);
            totalTokens += filtered.tokenCount;
        }
    }

    // Deduplicate field lists
    fieldsIncluded.character = [...new Set(fieldsIncluded.character)];
    fieldsIncluded.world = [...new Set(fieldsIncluded.world)];
    fieldsIncluded.project = [...new Set(fieldsIncluded.project)];

    // Assemble final context string
    let contextString = '';
    if (contextParts.length > 0) {
        contextString = `## Context for this conversation\n\n${contextParts.join('\n---\n\n')}`;
    }

    // Re-estimate tokens from final string (more accurate)
    totalTokens = estimateTokens(contextString);

    const result: AssembledContext = {
        contextString,
        tokenCount: totalTokens,
        fieldsIncluded,
        entitiesIncluded,
        truncatedFields,
    };

    if (includeDebugInfo) {
        result.debugInfo = {
            mode,
            tokenBudget,
            entityBudgets,
            filteredEntities,
        };
    }

    return result;
}

/**
 * Calculate priority-based field allocation
 * Ensures high-priority fields get maximum tokens first
 */
export function allocateFieldBudgets(
    fieldConfigs: Array<{ field: string; priority: 'high' | 'medium' | 'low' }>,
    totalBudget: number
): Record<string, number> {
    const allocation: Record<string, number> = {};

    // Allocate by priority
    const highPriority = fieldConfigs.filter(f => f.priority === 'high');
    const mediumPriority = fieldConfigs.filter(f => f.priority === 'medium');
    const lowPriority = fieldConfigs.filter(f => f.priority === 'low');

    const highBudget = Math.floor(totalBudget * 0.6);
    const mediumBudget = Math.floor(totalBudget * 0.3);
    const lowBudget = Math.floor(totalBudget * 0.1);

    // Distribute high priority budget
    if (highPriority.length > 0) {
        const perFieldHigh = Math.floor(highBudget / highPriority.length);
        highPriority.forEach(f => {
            allocation[f.field] = perFieldHigh;
        });
    }

    // Distribute medium priority budget
    if (mediumPriority.length > 0) {
        const perFieldMedium = Math.floor(mediumBudget / mediumPriority.length);
        mediumPriority.forEach(f => {
            allocation[f.field] = perFieldMedium;
        });
    }

    // Distribute low priority budget
    if (lowPriority.length > 0) {
        const perFieldLow = Math.floor(lowBudget / lowPriority.length);
        lowPriority.forEach(f => {
            allocation[f.field] = perFieldLow;
        });
    }

    return allocation;
}

/**
 * Get minimal context (name, id, type only) for any entity
 * Used when full context exceeds budget
 */
export function getMinimalEntityContext(
    entity: Character | World | Project,
    entityType: 'character' | 'world' | 'project'
): string {
    const icon = entityType === 'character' ? '👤' : entityType === 'world' ? '🌍' : '📁';
    const name = entity.name;
    const id = entity.id;

    let summary = '';
    if (entityType === 'character' && 'coreConcept' in entity) {
        summary = entity.coreConcept ? `\n- ${entity.coreConcept}` : '';
    } else if (entityType === 'world' && 'tagline' in entity) {
        summary = entity.tagline ? `\n- ${entity.tagline}` : '';
    } else if (entityType === 'project' && 'summary' in entity) {
        summary = entity.summary ? `\n- ${entity.summary}` : '';
    }

    return `### ${icon} ${entityType.toUpperCase()}: ${name} (${id})${summary}\n`;
}

/**
 * Check if context fits within budget, and provide recommendations
 */
export function validateContextBudget(
    assembled: AssembledContext,
    maxBudget: number
): {
    fits: boolean;
    overageTokens: number;
    recommendation: string;
} {
    const fits = assembled.tokenCount <= maxBudget;
    const overageTokens = Math.max(0, assembled.tokenCount - maxBudget);

    let recommendation = '';
    if (!fits) {
        if (assembled.truncatedFields.length > 0) {
            recommendation = `Context exceeds budget by ${overageTokens} tokens. Consider removing low-priority fields or switching to a mode with smaller context.`;
        } else {
            recommendation = `Context exceeds budget by ${overageTokens} tokens. Some fields were already truncated. Consider unlinking entities or using minimal mode.`;
        }
    } else {
        const utilization = (assembled.tokenCount / maxBudget) * 100;
        recommendation = `Context fits within budget (${utilization.toFixed(1)}% utilization).`;
    }

    return { fits, overageTokens, recommendation };
}
