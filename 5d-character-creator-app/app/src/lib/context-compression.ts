/**
 * Context Compression Utilities
 *
 * Reduces entity JSON to ~40-50% token usage while preserving essential information.
 * Uses selective field inclusion, prose truncation, and list summarization.
 */

import { Character } from '@/types/character';
import { World } from '@/types/world';
import { Project } from '@/types/project';

interface CompressedCharacter {
    id: string;
    name: string;
    genre?: string;
    role?: string;
    archetype?: string;
    coreConcept?: string;
    personalitySummary?: string;
    backstorySummary?: string;
    arcSummary?: string;
    keyMotivations?: string[];
    keyFlaws?: string[];
    keyFears?: string[];
}

interface CompressedWorld {
    id: string;
    name: string;
    genre?: string;
    tone?: string;
    timePeriod?: string;
    overviewSummary?: string;
    historySummary?: string;
    magicSystem?: string;
    factionSummary?: string[];
}

interface CompressedProject {
    id: string;
    name: string;
    genre?: string;
    logline?: string;
    synopsisSummary?: string;
    keyThemes?: string[];
}

/**
 * Truncate text to a maximum length, ending at a sentence boundary if possible
 */
function truncateText(text: string | undefined, maxLength: number): string | undefined {
    if (!text) return undefined;
    if (text.length <= maxLength) return text;

    // Try to cut at sentence boundary
    const truncated = text.slice(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastQuestion = truncated.lastIndexOf('?');

    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

    if (lastSentenceEnd > maxLength * 0.6) {
        return truncated.slice(0, lastSentenceEnd + 1);
    }

    return truncated + '...';
}

/**
 * Take first N items from an array
 */
function takeFirst<T>(arr: T[] | undefined, n: number): T[] {
    if (!arr) return [];
    return arr.slice(0, n);
}

/**
 * Compress a character for context injection
 * Reduces ~70% of typical character JSON size
 */
export function compressCharacterContext(char: Character): CompressedCharacter {
    return {
        id: char.id,
        name: char.name,
        genre: char.genre,
        role: char.role,
        archetype: char.archetype,
        coreConcept: truncateText(char.coreConcept, 200),
        personalitySummary: truncateText(char.personalityProse, 400),
        backstorySummary: truncateText(char.backstoryProse, 500),
        arcSummary: truncateText(char.arcProse, 300),
        keyMotivations: takeFirst(char.motivations, 3),
        keyFlaws: takeFirst(char.flaws, 3),
        keyFears: takeFirst(char.fears, 3)
    };
}

/**
 * Compress a world for context injection
 */
export function compressWorldContext(world: World): CompressedWorld {
    return {
        id: world.id,
        name: world.name,
        genre: world.genre,
        tone: world.tone,
        // timePeriod: world.timePeriod, // Property doesn't exist on World type
        overviewSummary: truncateText(world.overviewProse, 500),
        historySummary: truncateText(world.historyProse, 300),
        // magicSystem: truncateText(world.magicSystem, 200), // Property doesn't exist
        // factionSummary: world.factions?.slice(0, 4).map(f =>
        //     `${f.name}: ${truncateText(f.description, 100) || 'No description'}`
        // ) // Property doesn't exist
    };
}

/**
 * Compress a project for context injection
 */
export function compressProjectContext(project: Project): CompressedProject {
    return {
        id: project.id,
        name: project.name,
        genre: project.genre,
        // logline: project.logline, // Property doesn't exist
        synopsisSummary: truncateText(project.summary, 400),
        // keyThemes: takeFirst(project.themes, 4) // Property doesn't exist
    };
}

/**
 * Format compressed character as readable context string
 */
export function formatCharacterContext(char: CompressedCharacter | Character): string {
    const compressed: CompressedCharacter = 'personalitySummary' in char ? char : compressCharacterContext(char as Character);

    const sections: string[] = [
        `## CHARACTER: ${compressed.name}`,
        compressed.genre && `**Genre:** ${compressed.genre}`,
        compressed.role && `**Role:** ${compressed.role}`,
        compressed.archetype && `**Archetype:** ${compressed.archetype}`,
        compressed.coreConcept && `**Core Concept:** ${compressed.coreConcept}`,
        compressed.personalitySummary && `**Personality:** ${compressed.personalitySummary}`,
        compressed.backstorySummary && `**Backstory:** ${compressed.backstorySummary}`,
        compressed.arcSummary && `**Character Arc:** ${compressed.arcSummary}`,
        compressed.keyMotivations?.length && `**Motivations:** ${compressed.keyMotivations.join(', ')}`,
        compressed.keyFlaws?.length && `**Flaws:** ${compressed.keyFlaws.join(', ')}`,
        compressed.keyFears?.length && `**Fears:** ${compressed.keyFears.join(', ')}`
    ].filter(Boolean) as string[];

    return sections.join('\n');
}

/**
 * Format compressed world as readable context string
 */
export function formatWorldContext(world: CompressedWorld | World): string {
    const compressed: CompressedWorld = 'overviewSummary' in world ? world : compressWorldContext(world as World);

    const sections: string[] = [
        `## WORLD: ${compressed.name}`,
        compressed.genre && `**Genre:** ${compressed.genre}`,
        compressed.tone && `**Tone:** ${compressed.tone}`,
        compressed.timePeriod && `**Time Period:** ${compressed.timePeriod}`,
        compressed.overviewSummary && `**Overview:** ${compressed.overviewSummary}`,
        compressed.historySummary && `**History:** ${compressed.historySummary}`,
        compressed.magicSystem && `**Magic/Tech System:** ${compressed.magicSystem}`,
        compressed.factionSummary?.length && `**Key Factions:**\n${compressed.factionSummary.map(f => `- ${f}`).join('\n')}`
    ].filter(Boolean) as string[];

    return sections.join('\n');
}

/**
 * Format compressed project as readable context string
 */
export function formatProjectContext(project: CompressedProject | Project): string {
    const compressed: CompressedProject = 'synopsisSummary' in project ? project : compressProjectContext(project as Project);

    const sections: string[] = [
        `## PROJECT: ${compressed.name}`,
        compressed.genre && `**Genre:** ${compressed.genre}`,
        compressed.logline && `**Logline:** ${compressed.logline}`,
        compressed.synopsisSummary && `**Synopsis:** ${compressed.synopsisSummary}`,
        compressed.keyThemes?.length && `**Themes:** ${compressed.keyThemes.join(', ')}`
    ].filter(Boolean) as string[];

    return sections.join('\n');
}

/**
 * Estimate token count from text (rough approximation: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Compare compressed vs uncompressed size
 */
export function getCompressionStats(original: string, compressed: string): {
    originalTokens: number;
    compressedTokens: number;
    reduction: number;
} {
    const originalTokens = estimateTokens(original);
    const compressedTokens = estimateTokens(compressed);
    const reduction = Math.round((1 - compressedTokens / originalTokens) * 100);

    return { originalTokens, compressedTokens, reduction };
}
