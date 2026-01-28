/**
 * Fuzzy Search Utility
 *
 * Provides fuzzy matching for entity names and aliases using Levenshtein distance.
 * Used by @ mention system to suggest entities when user types partial or misspelled names.
 */

import type { Character } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';

export type Entity = Character | World | Project;

export interface FuzzyMatch {
  entity: Entity;
  score: number;        // Lower is better (Levenshtein distance)
  matchedField: 'name' | 'alias';
  matchedValue: string;
}

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits to transform one string into another)
 *
 * @param a - First string
 * @param b - Second string
 * @returns Distance (0 = identical, higher = more different)
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 0;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bLower.length][aLower.length];
}

/**
 * Check if query is a substring of target (case-insensitive)
 */
function isSubstring(query: string, target: string): boolean {
  return target.toLowerCase().includes(query.toLowerCase());
}

/**
 * Check if target starts with query (case-insensitive)
 */
function startsWith(query: string, target: string): boolean {
  return target.toLowerCase().startsWith(query.toLowerCase());
}

/**
 * Calculate fuzzy match score for entity
 * Lower score is better
 */
function calculateMatchScore(query: string, entity: Entity): FuzzyMatch | null {
  const queryLower = query.toLowerCase();
  const entityName = entity.name.toLowerCase();

  // Exact match (case-insensitive)
  if (queryLower === entityName) {
    return {
      entity,
      score: 0,
      matchedField: 'name',
      matchedValue: entity.name
    };
  }

  // Starts with query (high priority)
  if (startsWith(query, entity.name)) {
    return {
      entity,
      score: 0.5,
      matchedField: 'name',
      matchedValue: entity.name
    };
  }

  // Substring match
  if (isSubstring(query, entity.name)) {
    return {
      entity,
      score: 1,
      matchedField: 'name',
      matchedValue: entity.name
    };
  }

  // Levenshtein distance for name
  const nameDistance = levenshteinDistance(query, entity.name);
  if (nameDistance <= 2) {
    return {
      entity,
      score: 2 + nameDistance,
      matchedField: 'name',
      matchedValue: entity.name
    };
  }

  // Check aliases
  if (entity.aliases && entity.aliases.length > 0) {
    let bestAliasMatch: FuzzyMatch | null = null;
    let bestAliasScore = Infinity;

    for (const alias of entity.aliases) {
      const aliasLower = alias.toLowerCase();

      // Exact match
      if (queryLower === aliasLower) {
        return {
          entity,
          score: 0,
          matchedField: 'alias',
          matchedValue: alias
        };
      }

      // Starts with
      if (startsWith(query, alias)) {
        const score = 0.5;
        if (score < bestAliasScore) {
          bestAliasScore = score;
          bestAliasMatch = {
            entity,
            score,
            matchedField: 'alias',
            matchedValue: alias
          };
        }
      }

      // Substring
      if (isSubstring(query, alias)) {
        const score = 1;
        if (score < bestAliasScore) {
          bestAliasScore = score;
          bestAliasMatch = {
            entity,
            score,
            matchedField: 'alias',
            matchedValue: alias
          };
        }
      }

      // Levenshtein distance
      const aliasDistance = levenshteinDistance(query, alias);
      if (aliasDistance <= 2) {
        const score = 2 + aliasDistance;
        if (score < bestAliasScore) {
          bestAliasScore = score;
          bestAliasMatch = {
            entity,
            score,
            matchedField: 'alias',
            matchedValue: alias
          };
        }
      }
    }

    if (bestAliasMatch) {
      return bestAliasMatch;
    }
  }

  // No match
  return null;
}

/**
 * Find entities matching query using fuzzy search
 *
 * @param query - Search query (partial entity name)
 * @param entities - List of entities to search
 * @param maxResults - Maximum number of results to return (default: 5)
 * @returns Sorted array of fuzzy matches (best matches first)
 */
export function fuzzySearchEntities(
  query: string,
  entities: Entity[],
  maxResults: number = 5
): FuzzyMatch[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const matches: FuzzyMatch[] = [];

  for (const entity of entities) {
    const match = calculateMatchScore(query, entity);
    if (match) {
      matches.push(match);
    }
  }

  // Sort by score (lower is better)
  matches.sort((a, b) => a.score - b.score);

  // Return top N results
  return matches.slice(0, maxResults);
}

/**
 * Find exact entity match by name or alias
 *
 * @param name - Entity name to search for
 * @param entities - List of entities to search
 * @returns Matching entity or null
 */
export function findEntityByName(
  name: string,
  entities: Entity[]
): Entity | null {
  const nameLower = name.toLowerCase();

  for (const entity of entities) {
    // Check name
    if (entity.name.toLowerCase() === nameLower) {
      return entity;
    }

    // Check aliases
    if (entity.aliases) {
      for (const alias of entity.aliases) {
        if (alias.toLowerCase() === nameLower) {
          return entity;
        }
      }
    }
  }

  return null;
}

/**
 * Extract words that could be entity names from text
 * Useful for Context Sidecar auto-detection
 *
 * @param text - Text to analyze
 * @returns Array of potential entity names (capitalized words)
 */
export function extractPotentialEntityNames(text: string): string[] {
  // Match capitalized words (2+ characters)
  const capitalizedWords = text.match(/\b[A-Z][a-z]{1,}\b/g) || [];

  // Match multi-word capitalized phrases (e.g., "The Northern War")
  const capitalizedPhrases = text.match(/\b(?:[A-Z][a-z]+\s?){2,}\b/g) || [];

  // Combine and deduplicate
  const potential = [...new Set([...capitalizedWords, ...capitalizedPhrases])];

  return potential;
}

/**
 * Highlight matched portion of text
 * Useful for displaying search results
 *
 * @param text - Full text
 * @param query - Query that matched
 * @returns Object with before, match, and after portions
 */
export function highlightMatch(
  text: string,
  query: string
): { before: string; match: string; after: string } | null {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  const index = textLower.indexOf(queryLower);

  if (index === -1) {
    return null;
  }

  return {
    before: text.substring(0, index),
    match: text.substring(index, index + query.length),
    after: text.substring(index + query.length)
  };
}
