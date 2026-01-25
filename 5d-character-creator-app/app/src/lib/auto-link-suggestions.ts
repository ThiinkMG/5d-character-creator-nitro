import { Character } from '@/types/character';
import { World } from '@/types/world';
import { Project } from '@/types/project';

/**
 * Represents a suggested link between entities
 */
export interface LinkSuggestion {
    id: string;
    sourceId: string;
    sourceType: 'character' | 'world';
    sourceName: string;
    targetId: string;
    targetType: 'world' | 'project';
    targetName: string;
    confidence: number;
    reason: string;
}

/**
 * Extract keywords from text for matching
 */
function extractKeywords(text: string): string[] {
    if (!text) return [];

    // Common words to exclude
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
        'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
        'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
        'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
        'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
        'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
        'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
        'because', 'while', 'although', 'this', 'that', 'these', 'those', 'i',
        'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'he', 'him',
        'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what',
        'which', 'who', 'whom'
    ]);

    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word))
        .slice(0, 30);
}

/**
 * Calculate similarity between two sets of keywords
 */
function keywordSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    let matches = 0;
    set1.forEach(word => {
        if (set2.has(word)) matches++;
    });

    // Jaccard similarity
    const union = new Set([...keywords1, ...keywords2]);
    return matches / union.size;
}

/**
 * Calculate compatibility score between character and world
 */
function calculateCharacterWorldScore(char: Character, world: World): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Genre match (highest weight)
    if (char.genre && world.genre) {
        const charGenre = char.genre.toLowerCase();
        const worldGenre = world.genre.toLowerCase();

        if (charGenre === worldGenre) {
            score += 0.4;
            reasons.push(`Same genre: ${world.genre}`);
        } else if (charGenre.includes(worldGenre) || worldGenre.includes(charGenre)) {
            score += 0.2;
            reasons.push(`Similar genre`);
        }
    }

    // Tone match
    if (world.tone && char.arcProse) {
        const worldTone = world.tone.toLowerCase();
        const charContent = (char.arcProse + ' ' + (char.personalityProse || '')).toLowerCase();

        if (charContent.includes(worldTone)) {
            score += 0.1;
            reasons.push(`Tone alignment: ${world.tone}`);
        }
    }

    // Keyword overlap in content
    const charKeywords = extractKeywords(
        [
            char.backstoryProse,
            char.personalityProse,
            char.coreConcept,
            char.origin,
            ...(char.motivations || []),
            ...(char.fears || [])
        ].filter(Boolean).join(' ')
    );

    const worldKeywords = extractKeywords(
        [
            world.description,
            world.overviewProse,
            world.historyProse,
            world.magicSystem,
            ...(world.factions?.map(f => f.name + ' ' + (f.description || '')) || [])
        ].filter(Boolean).join(' ')
    );

    const similarity = keywordSimilarity(charKeywords, worldKeywords);
    if (similarity > 0.1) {
        score += Math.min(similarity * 2, 0.3);
        reasons.push(`Content similarity (${Math.round(similarity * 100)}%)`);
    }

    // Name mention check
    if (world.overviewProse?.toLowerCase().includes(char.name.toLowerCase())) {
        score += 0.15;
        reasons.push(`Character mentioned in world`);
    }
    if (char.backstoryProse?.toLowerCase().includes(world.name.toLowerCase())) {
        score += 0.15;
        reasons.push(`World mentioned in backstory`);
    }

    return { score: Math.min(score, 1), reasons };
}

/**
 * Calculate compatibility score between character and project
 */
function calculateCharacterProjectScore(char: Character, project: Project): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Genre match
    if (char.genre && project.genre) {
        const charGenre = char.genre.toLowerCase();
        const projectGenre = project.genre.toLowerCase();

        if (charGenre === projectGenre) {
            score += 0.5;
            reasons.push(`Same genre: ${project.genre}`);
        }
    }

    // Content overlap
    const charKeywords = extractKeywords(
        [char.backstoryProse, char.personalityProse, char.coreConcept].filter(Boolean).join(' ')
    );

    const projectKeywords = extractKeywords(
        [project.description, project.summary].filter(Boolean).join(' ')
    );

    const similarity = keywordSimilarity(charKeywords, projectKeywords);
    if (similarity > 0.1) {
        score += Math.min(similarity * 2, 0.3);
        reasons.push(`Story alignment (${Math.round(similarity * 100)}%)`);
    }

    // Role/archetype match
    if (char.role && project.summary) {
        const roleKeywords = ['protagonist', 'antagonist', 'hero', 'villain', 'mentor', 'sidekick'];
        const charRole = char.role.toLowerCase();
        const projectContent = project.summary.toLowerCase();

        roleKeywords.forEach(role => {
            if (charRole.includes(role) && projectContent.includes(role)) {
                score += 0.1;
                reasons.push(`Role fits story: ${char.role}`);
            }
        });
    }

    return { score: Math.min(score, 1), reasons };
}

/**
 * Calculate compatibility score between world and project
 */
function calculateWorldProjectScore(world: World, project: Project): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Genre match
    if (world.genre && project.genre) {
        if (world.genre.toLowerCase() === project.genre.toLowerCase()) {
            score += 0.5;
            reasons.push(`Same genre: ${project.genre}`);
        }
    }

    // Content overlap
    const worldKeywords = extractKeywords(
        [world.description, world.overviewProse, world.historyProse].filter(Boolean).join(' ')
    );

    const projectKeywords = extractKeywords(
        [project.description, project.summary].filter(Boolean).join(' ')
    );

    const similarity = keywordSimilarity(worldKeywords, projectKeywords);
    if (similarity > 0.1) {
        score += Math.min(similarity * 2, 0.3);
        reasons.push(`Setting alignment (${Math.round(similarity * 100)}%)`);
    }

    // Name mention
    if (project.summary?.toLowerCase().includes(world.name.toLowerCase())) {
        score += 0.2;
        reasons.push(`World referenced in synopsis`);
    }

    return { score: Math.min(score, 1), reasons };
}

/**
 * Generate link suggestions based on content analysis
 */
export function generateLinkSuggestions(
    characters: Character[],
    worlds: World[],
    projects: Project[],
    options: {
        minConfidence?: number;
        maxSuggestions?: number;
        includeWorldLinks?: boolean;
        includeProjectLinks?: boolean;
    } = {}
): LinkSuggestion[] {
    const {
        minConfidence = 0.3,
        maxSuggestions = 10,
        includeWorldLinks = true,
        includeProjectLinks = true
    } = options;

    const suggestions: LinkSuggestion[] = [];

    // For each unlinked character, find matching worlds
    if (includeWorldLinks) {
        characters
            .filter(c => !c.worldId)
            .forEach(char => {
                worlds.forEach(world => {
                    const { score, reasons } = calculateCharacterWorldScore(char, world);
                    if (score >= minConfidence) {
                        suggestions.push({
                            id: `${char.id}-${world.id}`,
                            sourceId: char.id,
                            sourceType: 'character',
                            sourceName: char.name,
                            targetId: world.id,
                            targetType: 'world',
                            targetName: world.name,
                            confidence: score,
                            reason: reasons[0] || 'Similar content'
                        });
                    }
                });
            });
    }

    // For each unlinked character, find matching projects
    if (includeProjectLinks) {
        characters
            .filter(c => !c.projectId)
            .forEach(char => {
                projects.forEach(project => {
                    const { score, reasons } = calculateCharacterProjectScore(char, project);
                    if (score >= minConfidence) {
                        suggestions.push({
                            id: `${char.id}-${project.id}`,
                            sourceId: char.id,
                            sourceType: 'character',
                            sourceName: char.name,
                            targetId: project.id,
                            targetType: 'project',
                            targetName: project.name,
                            confidence: score,
                            reason: reasons[0] || 'Story alignment'
                        });
                    }
                });
            });

        // For each unlinked world, find matching projects
        worlds
            .filter(w => !w.projectId)
            .forEach(world => {
                projects.forEach(project => {
                    const { score, reasons } = calculateWorldProjectScore(world, project);
                    if (score >= minConfidence) {
                        suggestions.push({
                            id: `${world.id}-${project.id}`,
                            sourceId: world.id,
                            sourceType: 'world',
                            sourceName: world.name,
                            targetId: project.id,
                            targetType: 'project',
                            targetName: project.name,
                            confidence: score,
                            reason: reasons[0] || 'Genre match'
                        });
                    }
                });
            });
    }

    // Sort by confidence and limit
    return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxSuggestions);
}

/**
 * Get suggestions for a specific entity
 */
export function getSuggestionsForEntity(
    entityId: string,
    entityType: 'character' | 'world',
    characters: Character[],
    worlds: World[],
    projects: Project[]
): LinkSuggestion[] {
    if (entityType === 'character') {
        const char = characters.find(c => c.id === entityId);
        if (!char) return [];
        return generateLinkSuggestions([char], worlds, projects);
    } else {
        const world = worlds.find(w => w.id === entityId);
        if (!world) return [];
        return generateLinkSuggestions(characters, [world], projects, {
            includeWorldLinks: false
        });
    }
}
