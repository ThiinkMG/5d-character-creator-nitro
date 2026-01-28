/**
 * API Response Enhancement Helpers
 *
 * Functions to enrich AI responses with entity links and metadata.
 * Supports Phase 1 context injection features.
 */

import type { Character } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';
import type { CanonicalFact } from '@/types/character';

export type Entity = Character | World | Project;

export interface EntityReference {
    name: string;
    type: 'character' | 'world' | 'project';
    id?: string;
    confidence: number; // 0-1, how confident we are this is an entity reference
}

export interface EnrichedResponse {
    text: string;
    entityReferences: EntityReference[];
    suggestedUpdates?: EntityUpdate[];
    detectedFacts?: DetectedFact[];
}

export interface EntityUpdate {
    entityId: string;
    entityType: 'character' | 'world' | 'project';
    field: string;
    currentValue: any;
    suggestedValue: any;
    confidence: number;
    reason: string;
}

export interface DetectedFact {
    entityId: string;
    entityType: 'character' | 'world' | 'project';
    category: CanonicalFact['category'];
    fact: string;
    confidence: 'definite' | 'implied' | 'tentative';
    quote: string; // The exact text from AI response
}

/**
 * Extract entity references from AI response
 *
 * Detects mentions of character, world, or project names in the AI's text.
 */
export function extractEntityReferences(
    aiResponse: string,
    knownEntities: Entity[]
): EntityReference[] {
    const references: EntityReference[] = [];

    // Build search patterns for each entity (including aliases)
    for (const entity of knownEntities) {
        const names: string[] = [entity.name];

        // Add aliases if available
        if (entity.aliases && Array.isArray(entity.aliases)) {
            names.push(...entity.aliases);
        }

        // Determine entity type based on ID prefix
        let entityType: 'character' | 'world' | 'project';
        if (entity.id.startsWith('#')) {
            entityType = 'character';
        } else if (entity.id.startsWith('@')) {
            entityType = 'world';
        } else {
            entityType = 'project';
        }

        // Search for each name variant
        for (const name of names) {
            const pattern = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
            const matches = aiResponse.match(pattern);

            if (matches && matches.length > 0) {
                // Calculate confidence based on match quality
                const confidence = calculateReferenceConfidence(name, matches, aiResponse);

                references.push({
                    name: entity.name, // Use canonical name, not alias
                    type: entityType,
                    id: entity.id,
                    confidence
                });

                break; // Only add each entity once
            }
        }
    }

    // Sort by confidence (highest first)
    return references.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Enrich AI response with entity links
 *
 * Converts entity names to markdown-style links: [@EntityName](type:id)
 */
export function enrichResponseWithLinks(
    aiResponse: string,
    entities: Entity[]
): string {
    let enriched = aiResponse;

    // Sort entities by name length (longest first) to avoid partial matches
    const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length);

    for (const entity of sortedEntities) {
        const names: string[] = [entity.name];

        // Add aliases
        if (entity.aliases && Array.isArray(entity.aliases)) {
            names.push(...entity.aliases);
        }

        // Determine entity type
        let entityType: 'character' | 'world' | 'project';
        if (entity.id.startsWith('#')) {
            entityType = 'character';
        } else if (entity.id.startsWith('@')) {
            entityType = 'world';
        } else {
            entityType = 'project';
        }

        // Replace each name with markdown link (but avoid replacing already-linked text)
        for (const name of names) {
            const pattern = new RegExp(
                `(?<!\\[)\\b(${escapeRegExp(name)})\\b(?!\\]\\()`,
                'gi'
            );

            enriched = enriched.replace(
                pattern,
                `[@$1](${entityType}:${entity.id})`
            );
        }
    }

    return enriched;
}

/**
 * Detect canonical facts established in AI response
 *
 * Identifies statements that should be tracked as canonical facts.
 */
export function detectCanonicalFactUpdates(
    aiResponse: string,
    context: {
        entities: Entity[];
        mode?: string;
    }
): DetectedFact[] {
    const facts: DetectedFact[] = [];

    // Patterns that indicate definite facts
    const definitePatterns = [
        /(?:has|have|is|are|was|were)\s+([^.!?]+)/gi,
        /(?:named|called)\s+([^.!?]+)/gi,
        /(?:born|died|created)\s+([^.!?]+)/gi
    ];

    // Patterns that indicate physical descriptions
    const physicalPatterns = [
        /(?:has|have|with)\s+(blue|green|brown|hazel|gray|red|black|white|golden|silver)\s+(eyes|hair|skin)/gi,
        /(?:is|are)\s+(\d+)\s+(feet|ft|inches|in|meters|m|centimeters|cm)\s+tall/gi,
        /(?:wears|dressed in|clothed in)\s+([^.!?]+)/gi
    ];

    // For each entity in context, look for facts about them
    for (const entity of context.entities) {
        const entityType = entity.id.startsWith('#')
            ? 'character'
            : entity.id.startsWith('@')
                ? 'world'
                : 'project';

        // Search for sentences mentioning this entity
        const sentences = aiResponse.split(/[.!?]+/);
        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(entity.name.toLowerCase())) {
                // Check for physical descriptions
                for (const pattern of physicalPatterns) {
                    const matches = sentence.matchAll(pattern);
                    for (const match of matches) {
                        facts.push({
                            entityId: entity.id,
                            entityType,
                            category: 'physical',
                            fact: match[0].trim(),
                            confidence: 'definite',
                            quote: sentence.trim()
                        });
                    }
                }

                // Check for other definite facts
                for (const pattern of definitePatterns) {
                    const matches = sentence.matchAll(pattern);
                    for (const match of matches) {
                        // Determine category based on keywords
                        const fact = match[0].trim();
                        const category = categorizeFact(fact);

                        facts.push({
                            entityId: entity.id,
                            entityType,
                            category,
                            fact,
                            confidence: 'definite',
                            quote: sentence.trim()
                        });
                    }
                }
            }
        }
    }

    return facts;
}

/**
 * Suggest entity profile updates based on AI response
 *
 * Analyzes AI response and suggests updates to entity fields.
 */
export function suggestEntityUpdates(
    aiResponse: string,
    entities: Entity[],
    context: {
        mode?: string;
        currentFocus?: string; // e.g., "personality", "backstory"
    }
): EntityUpdate[] {
    const updates: EntityUpdate[] = [];

    // TODO: Implement AI-powered update detection
    // This is a placeholder for Phase 2 implementation
    // Will use pattern matching and NLP to identify:
    // - New motivations mentioned
    // - Character traits described
    // - Relationship dynamics established
    // - Backstory elements revealed
    // - Arc developments

    // For Phase 1, return empty array (manual updates only)
    return updates;
}

/**
 * Calculate confidence score for entity reference
 */
function calculateReferenceConfidence(
    name: string,
    matches: RegExpMatchArray,
    fullText: string
): number {
    let confidence = 0.5; // Base confidence

    // More matches = higher confidence
    confidence += Math.min(matches.length * 0.1, 0.3);

    // Capitalized matches = higher confidence
    const capitalizedMatches = matches.filter(m =>
        m.charAt(0) === m.charAt(0).toUpperCase()
    );
    confidence += capitalizedMatches.length / matches.length * 0.2;

    return Math.min(confidence, 1.0);
}

/**
 * Categorize a fact based on keywords
 */
function categorizeFact(fact: string): CanonicalFact['category'] {
    const lower = fact.toLowerCase();

    if (lower.match(/\b(eyes|hair|skin|tall|height|weight|appearance|looks?|face)\b/)) {
        return 'physical';
    }

    if (lower.match(/\b(personality|trait|behavior|always|never|tends to)\b/)) {
        return 'personality';
    }

    if (lower.match(/\b(born|childhood|past|history|used to|ago|before)\b/)) {
        return 'history';
    }

    if (lower.match(/\b(friend|enemy|ally|rival|family|parent|sibling|child|spouse)\b/)) {
        return 'relationship';
    }

    if (lower.match(/\b(ability|power|skill|talent|can|able to)\b/)) {
        return 'ability';
    }

    if (lower.match(/\b(owns|has|carries|wears|weapon|item|possession)\b/)) {
        return 'possession';
    }

    return 'other';
}

/**
 * Escape special regex characters
 */
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format entity references as a summary
 */
export function formatEntityReferencesSummary(references: EntityReference[]): string {
    if (references.length === 0) {
        return 'No entity references detected.';
    }

    const byType = references.reduce((acc, ref) => {
        if (!acc[ref.type]) acc[ref.type] = [];
        acc[ref.type].push(ref.name);
        return acc;
    }, {} as Record<string, string[]>);

    const parts: string[] = [];

    if (byType.character) {
        parts.push(`Characters: ${byType.character.join(', ')}`);
    }
    if (byType.world) {
        parts.push(`Worlds: ${byType.world.join(', ')}`);
    }
    if (byType.project) {
        parts.push(`Projects: ${byType.project.join(', ')}`);
    }

    return parts.join(' | ');
}
