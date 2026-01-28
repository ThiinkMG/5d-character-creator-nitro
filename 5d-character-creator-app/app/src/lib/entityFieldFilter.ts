/**
 * Entity Field Filter
 * Extracts only specified fields from entities to reduce token usage
 */

import type { Character } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';
import type { FieldConfig } from './modeContextConfig';
import { estimateTokens } from './context-compression';

/**
 * Filtered entity result with metadata
 */
export interface FilteredEntity {
    entityType: 'character' | 'world' | 'project';
    entityId: string;
    entityName: string;
    fields: Record<string, any>;
    tokenCount: number;
    includedFields: string[];
    truncatedFields: string[];
}

/**
 * Filter character fields based on field configuration
 */
export function filterCharacterFields(
    character: Character,
    fieldConfigs: FieldConfig[],
    tokenBudget: number
): FilteredEntity {
    const fields: Record<string, any> = {};
    const includedFields: string[] = [];
    const truncatedFields: string[] = [];
    let currentTokens = 0;

    // Sort by priority (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...fieldConfigs].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    for (const config of sorted) {
        // Check if we've exceeded budget
        if (currentTokens >= tokenBudget) {
            break;
        }

        const value = extractFieldValue(character, config);
        if (value === undefined || value === null) {
            continue;
        }

        // Estimate tokens for this field
        const fieldStr = JSON.stringify(value);
        let fieldTokens = estimateTokens(fieldStr);

        // Check if field fits in remaining budget
        const remainingBudget = tokenBudget - currentTokens;
        if (fieldTokens <= remainingBudget) {
            // Field fits completely
            fields[config.field] = value;
            includedFields.push(config.field);
            currentTokens += fieldTokens;
        } else if (config.priority === 'high' && remainingBudget > 50) {
            // High priority field - try to truncate
            const truncated = truncateFieldValue(value, remainingBudget);
            if (truncated !== null) {
                fields[config.field] = truncated;
                includedFields.push(config.field);
                truncatedFields.push(config.field);
                currentTokens += estimateTokens(JSON.stringify(truncated));
            }
        }
        // Skip low/medium priority fields that don't fit
    }

    return {
        entityType: 'character',
        entityId: character.id,
        entityName: character.name,
        fields,
        tokenCount: currentTokens,
        includedFields,
        truncatedFields,
    };
}

/**
 * Filter world fields based on field configuration
 */
export function filterWorldFields(
    world: World,
    fieldConfigs: FieldConfig[],
    tokenBudget: number
): FilteredEntity {
    const fields: Record<string, any> = {};
    const includedFields: string[] = [];
    const truncatedFields: string[] = [];
    let currentTokens = 0;

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...fieldConfigs].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    for (const config of sorted) {
        if (currentTokens >= tokenBudget) {
            break;
        }

        const value = extractFieldValue(world, config);
        if (value === undefined || value === null) {
            continue;
        }

        const fieldStr = JSON.stringify(value);
        let fieldTokens = estimateTokens(fieldStr);

        const remainingBudget = tokenBudget - currentTokens;
        if (fieldTokens <= remainingBudget) {
            fields[config.field] = value;
            includedFields.push(config.field);
            currentTokens += fieldTokens;
        } else if (config.priority === 'high' && remainingBudget > 50) {
            const truncated = truncateFieldValue(value, remainingBudget);
            if (truncated !== null) {
                fields[config.field] = truncated;
                includedFields.push(config.field);
                truncatedFields.push(config.field);
                currentTokens += estimateTokens(JSON.stringify(truncated));
            }
        }
    }

    return {
        entityType: 'world',
        entityId: world.id,
        entityName: world.name,
        fields,
        tokenCount: currentTokens,
        includedFields,
        truncatedFields,
    };
}

/**
 * Filter project fields based on field configuration
 */
export function filterProjectFields(
    project: Project,
    fieldConfigs: FieldConfig[],
    tokenBudget: number
): FilteredEntity {
    const fields: Record<string, any> = {};
    const includedFields: string[] = [];
    const truncatedFields: string[] = [];
    let currentTokens = 0;

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...fieldConfigs].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    for (const config of sorted) {
        if (currentTokens >= tokenBudget) {
            break;
        }

        const value = extractFieldValue(project, config);
        if (value === undefined || value === null) {
            continue;
        }

        const fieldStr = JSON.stringify(value);
        let fieldTokens = estimateTokens(fieldStr);

        const remainingBudget = tokenBudget - currentTokens;
        if (fieldTokens <= remainingBudget) {
            fields[config.field] = value;
            includedFields.push(config.field);
            currentTokens += fieldTokens;
        } else if (config.priority === 'high' && remainingBudget > 50) {
            const truncated = truncateFieldValue(value, remainingBudget);
            if (truncated !== null) {
                fields[config.field] = truncated;
                includedFields.push(config.field);
                truncatedFields.push(config.field);
                currentTokens += estimateTokens(JSON.stringify(truncated));
            }
        }
    }

    return {
        entityType: 'project',
        entityId: project.id,
        entityName: project.name,
        fields,
        tokenCount: currentTokens,
        includedFields,
        truncatedFields,
    };
}

/**
 * Extract field value from entity, handling nested paths
 */
function extractFieldValue(entity: any, config: FieldConfig): any {
    let value = entity[config.field];

    // Handle nested paths (e.g., voiceProfile.sampleDialogue)
    if (config.path) {
        let current = entity;
        for (const key of config.path) {
            current = current?.[key];
            if (current === undefined) {
                return undefined;
            }
        }
        value = current;
    }

    // Handle array truncation
    if (Array.isArray(value) && config.maxItems && value.length > config.maxItems) {
        value = value.slice(0, config.maxItems);
    }

    return value;
}

/**
 * Truncate field value to fit within token budget
 */
function truncateFieldValue(value: any, tokenBudget: number): any | null {
    // Can't truncate primitive values meaningfully
    if (typeof value === 'string') {
        return truncateString(value, tokenBudget);
    }

    if (Array.isArray(value)) {
        return truncateArray(value, tokenBudget);
    }

    if (typeof value === 'object' && value !== null) {
        return truncateObject(value, tokenBudget);
    }

    return null;
}

/**
 * Truncate string to fit token budget
 */
function truncateString(str: string, tokenBudget: number): string | null {
    const estimatedChars = tokenBudget * 4; // ~4 chars per token
    if (str.length <= estimatedChars) {
        return str;
    }

    // Try to cut at sentence boundary
    const truncated = str.slice(0, estimatedChars);
    const lastSentence = Math.max(
        truncated.lastIndexOf('. '),
        truncated.lastIndexOf('! '),
        truncated.lastIndexOf('? ')
    );

    if (lastSentence > estimatedChars * 0.6) {
        return truncated.slice(0, lastSentence + 1) + ' [...]';
    }

    // Cut at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > estimatedChars * 0.6) {
        return truncated.slice(0, lastSpace) + '...';
    }

    return truncated + '...';
}

/**
 * Truncate array to fit token budget
 */
function truncateArray(arr: any[], tokenBudget: number): any[] | null {
    const result: any[] = [];
    let currentTokens = 0;

    for (const item of arr) {
        const itemStr = JSON.stringify(item);
        const itemTokens = estimateTokens(itemStr);

        if (currentTokens + itemTokens > tokenBudget) {
            break;
        }

        result.push(item);
        currentTokens += itemTokens;
    }

    return result.length > 0 ? result : null;
}

/**
 * Truncate object to fit token budget (keep most important keys)
 */
function truncateObject(obj: Record<string, any>, tokenBudget: number): Record<string, any> | null {
    const result: Record<string, any> = {};
    let currentTokens = 0;

    // Priority order for object keys (common important fields first)
    const priorityKeys = ['name', 'id', 'type', 'description', 'content'];
    const allKeys = Object.keys(obj);
    const sortedKeys = [
        ...priorityKeys.filter(k => allKeys.includes(k)),
        ...allKeys.filter(k => !priorityKeys.includes(k))
    ];

    for (const key of sortedKeys) {
        const value = obj[key];
        const itemStr = JSON.stringify({ [key]: value });
        const itemTokens = estimateTokens(itemStr);

        if (currentTokens + itemTokens > tokenBudget) {
            break;
        }

        result[key] = value;
        currentTokens += itemTokens;
    }

    return Object.keys(result).length > 0 ? result : null;
}

/**
 * Format filtered entity as markdown context
 */
export function formatEntityContext(filtered: FilteredEntity, showDebug: boolean = false): string {
    const { entityType, entityName, entityId, fields, truncatedFields } = filtered;

    const icon = entityType === 'character' ? '👤' : entityType === 'world' ? '🌍' : '📁';
    let md = `### ${icon} ${entityType.toUpperCase()}: ${entityName} (${entityId})\n\n`;

    // Format fields
    for (const [key, value] of Object.entries(fields)) {
        const wasTruncated = truncatedFields.includes(key);
        const label = formatFieldLabel(key);

        if (Array.isArray(value)) {
            md += `**${label}:**\n`;
            value.forEach((item, i) => {
                if (typeof item === 'string') {
                    md += `- ${item}\n`;
                } else if (typeof item === 'object') {
                    md += `- ${JSON.stringify(item)}\n`;
                }
            });
            if (wasTruncated) {
                md += `  _(truncated)_\n`;
            }
        } else if (typeof value === 'object' && value !== null) {
            md += `**${label}:**\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`;
            if (wasTruncated) {
                md += `_(truncated)_\n`;
            }
        } else {
            md += `**${label}:** ${value}${wasTruncated ? ' _(truncated)_' : ''}\n`;
        }
        md += '\n';
    }

    if (showDebug) {
        md += `\n_Debug: ${filtered.includedFields.length} fields included, ${filtered.tokenCount} tokens_\n`;
    }

    return md;
}

/**
 * Format field name as readable label
 */
function formatFieldLabel(fieldName: string): string {
    // Convert camelCase to Title Case
    return fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}
