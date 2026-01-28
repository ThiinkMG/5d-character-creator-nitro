/**
 * Context Entity Helpers
 *
 * Functions to fetch and prepare entities for context injection.
 * Supports Phase 1 features: pinned entities and @ mentions.
 */

import type { Character } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';

export type Entity = Character | World | Project;

export interface FetchedEntities {
    characters: Character[];
    worlds: World[];
    projects: Project[];
    all: Entity[];
    missing: string[]; // IDs that couldn't be found
}

/**
 * Fetch entities from store by IDs
 *
 * @param entityIds - Array of entity IDs (#CID, @WID, $SID)
 * @param store - Zustand store instance
 * @returns Fetched entities organized by type
 */
export function fetchEntitiesByIds(
    entityIds: string[],
    store: {
        characters: Character[];
        worlds: World[];
        projects: Project[];
        getCharacter: (id: string) => Character | undefined;
        getWorld: (id: string) => World | undefined;
        getProject: (id: string) => Project | undefined;
    }
): FetchedEntities {
    const result: FetchedEntities = {
        characters: [],
        worlds: [],
        projects: [],
        all: [],
        missing: []
    };

    for (const id of entityIds) {
        if (id.startsWith('#')) {
            // Character
            const char = store.getCharacter(id);
            if (char) {
                result.characters.push(char);
                result.all.push(char);
            } else {
                result.missing.push(id);
            }
        } else if (id.startsWith('@')) {
            // World
            const world = store.getWorld(id);
            if (world) {
                result.worlds.push(world);
                result.all.push(world);
            } else {
                result.missing.push(id);
            }
        } else if (id.startsWith('$')) {
            // Project
            const project = store.getProject(id);
            if (project) {
                result.projects.push(project);
                result.all.push(project);
            } else {
                result.missing.push(id);
            }
        } else {
            // Invalid ID format
            result.missing.push(id);
        }
    }

    return result;
}

/**
 * Combine pinned and mentioned entities, removing duplicates
 *
 * @param pinnedIds - Entity IDs pinned in Context Sidecar
 * @param mentionedIds - Entity IDs from @ mentions in message
 * @returns Deduplicated array of entity IDs
 */
export function combineEntityIds(
    pinnedIds: string[] = [],
    mentionedIds: string[] = []
): string[] {
    const combined = [...pinnedIds, ...mentionedIds];
    return Array.from(new Set(combined)); // Remove duplicates
}

/**
 * Serialize entity for context injection
 *
 * Converts entity to JSON string with relevant fields only.
 * Different fields are included based on mode requirements.
 *
 * TODO: Coordinate with context-engineer for mode-specific field filtering
 */
export function serializeEntityForContext(
    entity: Entity,
    mode?: string,
    options: {
        includeRelationships?: boolean;
        includeCanonicalFacts?: boolean;
        includeVoiceProfile?: boolean;
        maxLength?: number;
    } = {}
): string {
    const {
        includeRelationships = true,
        includeCanonicalFacts = true,
        includeVoiceProfile = true,
        maxLength
    } = options;

    // Create filtered copy of entity
    const filtered: any = {
        id: entity.id,
        name: entity.name,
        aliases: entity.aliases
    };

    // Add type-specific fields
    if ('role' in entity) {
        // Character
        const char = entity as Character;
        filtered.role = char.role;
        filtered.genre = char.genre;
        filtered.coreConcept = char.coreConcept;
        filtered.motivations = char.motivations;
        filtered.flaws = char.flaws;
        filtered.personalityProse = char.personalityProse;
        filtered.backstoryProse = char.backstoryProse;

        if (includeVoiceProfile && char.voiceProfile) {
            filtered.voiceProfile = char.voiceProfile;
        }

        if (includeCanonicalFacts && char.canonicalFacts) {
            filtered.canonicalFacts = char.canonicalFacts;
        }

        if (includeRelationships) {
            filtered.allies = char.allies;
            filtered.enemies = char.enemies;
            filtered.relationshipsProse = char.relationshipsProse;
        }
    } else if ('description' in entity && 'rules' in entity) {
        // World
        const world = entity as World;
        filtered.genre = world.genre;
        filtered.description = world.description;
        filtered.tone = world.tone;
        filtered.rules = world.rules;
        filtered.overviewProse = world.overviewProse;
        filtered.historyProse = world.historyProse;

        if (includeCanonicalFacts && world.canonicalFacts) {
            filtered.canonicalFacts = world.canonicalFacts;
        }
    } else {
        // Project
        const project = entity as Project;
        filtered.genre = project.genre;
        filtered.description = project.description;
    }

    let serialized = JSON.stringify(filtered, null, 2);

    // Truncate if needed
    if (maxLength && serialized.length > maxLength) {
        serialized = serialized.slice(0, maxLength) + '\n... [Truncated for context limits]';
    }

    return serialized;
}

/**
 * Format entity context with header
 */
export function formatEntityContext(entity: Entity, mode?: string): string {
    const type = entity.id.startsWith('#')
        ? 'CHARACTER'
        : entity.id.startsWith('@')
            ? 'WORLD'
            : 'PROJECT';

    const serialized = serializeEntityForContext(entity, mode);

    return `### ${type}: ${entity.name} (${entity.id})
${serialized}`;
}

/**
 * Format multiple entities for context injection
 */
export function formatMultipleEntitiesContext(
    entities: Entity[],
    mode?: string
): string {
    if (entities.length === 0) {
        return '';
    }

    const sections = entities.map(entity => formatEntityContext(entity, mode));

    return `### REFERENCED ENTITIES (${entities.length})

${sections.join('\n\n---\n\n')}`;
}

/**
 * Log missing entities (for debugging)
 */
export function logMissingEntities(missingIds: string[]): void {
    if (missingIds.length > 0) {
        console.warn('[Context] Missing entities:', missingIds);
        console.warn('[Context] These entities were referenced but not found in store. They may have been deleted.');
    }
}

/**
 * Check if entity is a stub (needs development)
 */
export function isEntityStub(entity: Entity): boolean {
    return entity.tags?.includes('stub') || entity.tags?.includes('needs-development') || false;
}

/**
 * Filter out stub entities if configured
 */
export function filterStubEntities(entities: Entity[], includeStubs: boolean = true): Entity[] {
    if (includeStubs) {
        return entities;
    }

    return entities.filter(entity => !isEntityStub(entity));
}

/**
 * Get entity display name (handles aliases)
 */
export function getEntityDisplayName(entity: Entity): string {
    if (entity.aliases && entity.aliases.length > 0) {
        return `${entity.name} (aka ${entity.aliases.join(', ')})`;
    }
    return entity.name;
}

/**
 * Create context summary for debugging
 */
export function createContextSummary(entities: FetchedEntities): string {
    const parts: string[] = [];

    if (entities.characters.length > 0) {
        parts.push(`${entities.characters.length} character(s)`);
    }
    if (entities.worlds.length > 0) {
        parts.push(`${entities.worlds.length} world(s)`);
    }
    if (entities.projects.length > 0) {
        parts.push(`${entities.projects.length} project(s)`);
    }
    if (entities.missing.length > 0) {
        parts.push(`${entities.missing.length} missing`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No entities';
}
