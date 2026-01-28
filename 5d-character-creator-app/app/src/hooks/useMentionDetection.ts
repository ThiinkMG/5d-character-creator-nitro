/**
 * useMentionDetection Hook
 *
 * Detects @ mentions in text and provides entity suggestions.
 * Used for progressive formalization - write first, organize later.
 */

import { useMemo, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { fuzzySearchEntities, findEntityByName, type Entity, type FuzzyMatch } from '@/lib/fuzzySearch';

export interface EntityMention {
  name: string;
  position: { start: number; end: number };
  exists: boolean;
  entity?: Entity;
  suggestions?: FuzzyMatch[];
}

/**
 * Regular expression for @ mention detection
 * Matches: @word or @multi word phrase (until punctuation/line end)
 *
 * Examples:
 * - @Kira
 * - @Kira Shadowbane
 * - @TheNorthernWar
 */
const MENTION_REGEX = /@(\w+(?:\s+\w+)*?)(?=\s|$|[.,!?;:]|@)/g;

/**
 * Hook for detecting @ mentions in text
 *
 * @param text - Text to scan for mentions
 * @param maxSuggestions - Maximum fuzzy suggestions per mention (default: 5)
 * @returns Object with mentions array and utility functions
 */
export function useMentionDetection(text: string, maxSuggestions: number = 5) {
  const characters = useStore((state) => state.characters);
  const worlds = useStore((state) => state.worlds);
  const projects = useStore((state) => state.projects);

  // Combine all entities
  const allEntities = useMemo<Entity[]>(() => {
    return [...characters, ...worlds, ...projects];
  }, [characters, worlds, projects]);

  /**
   * Detect all @ mentions in text
   */
  const mentions = useMemo<EntityMention[]>(() => {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const detected: EntityMention[] = [];
    let match;

    // Reset regex index
    MENTION_REGEX.lastIndex = 0;

    while ((match = MENTION_REGEX.exec(text)) !== null) {
      const name = match[1].trim();

      if (name.length === 0) {
        continue;
      }

      // Check for exact match
      const exactMatch = findEntityByName(name, allEntities);

      // Get fuzzy suggestions if no exact match
      const suggestions = exactMatch
        ? []
        : fuzzySearchEntities(name, allEntities, maxSuggestions);

      detected.push({
        name,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        exists: !!exactMatch,
        entity: exactMatch || undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      });
    }

    return detected;
  }, [text, allEntities, maxSuggestions]);

  /**
   * Get mention at specific text position
   */
  const getMentionAtPosition = useCallback(
    (position: number): EntityMention | null => {
      return mentions.find(
        (m) => position >= m.position.start && position <= m.position.end
      ) || null;
    },
    [mentions]
  );

  /**
   * Get all mentions that don't have existing entities
   */
  const getUnresolvedMentions = useCallback((): EntityMention[] => {
    return mentions.filter((m) => !m.exists);
  }, [mentions]);

  /**
   * Get all mentions that have existing entities
   */
  const getResolvedMentions = useCallback((): EntityMention[] => {
    return mentions.filter((m) => m.exists);
  }, [mentions]);

  /**
   * Check if text contains any mentions
   */
  const hasMentions = useMemo(() => mentions.length > 0, [mentions]);

  /**
   * Check if text contains unresolved mentions
   */
  const hasUnresolvedMentions = useMemo(
    () => mentions.some((m) => !m.exists),
    [mentions]
  );

  /**
   * Get entity type from entity
   */
  const getEntityType = useCallback((entity: Entity): 'character' | 'world' | 'project' => {
    // Check ID prefix to determine type
    if (entity.id.startsWith('#')) {
      return 'character';
    } else if (entity.id.startsWith('@')) {
      return 'world';
    } else if (entity.id.startsWith('$')) {
      return 'project';
    }

    // Fallback: check if entity has character-specific fields
    if ('phase' in entity) {
      return 'character';
    } else if ('characterIds' in entity && Array.isArray((entity as any).characterIds)) {
      return 'world';
    } else {
      return 'project';
    }
  }, []);

  /**
   * Extract mention from cursor position
   * Useful for showing popup at cursor
   */
  const extractMentionAtCursor = useCallback(
    (cursorPosition: number): { mention: EntityMention; beforeCursor: string } | null => {
      // Find mention that contains cursor
      const mention = getMentionAtPosition(cursorPosition);

      if (!mention) {
        return null;
      }

      // Extract text before cursor within mention
      const mentionText = text.substring(mention.position.start, mention.position.end);
      const relativePosition = cursorPosition - mention.position.start;
      const beforeCursor = mentionText.substring(0, relativePosition);

      return {
        mention,
        beforeCursor
      };
    },
    [text, getMentionAtPosition]
  );

  return {
    // Data
    mentions,
    allEntities,

    // Utility functions
    getMentionAtPosition,
    getUnresolvedMentions,
    getResolvedMentions,
    getEntityType,
    extractMentionAtCursor,

    // Computed flags
    hasMentions,
    hasUnresolvedMentions
  };
}

/**
 * Hook for real-time mention detection as user types
 * Debounced for performance
 */
export function useLiveMentionDetection(
  text: string,
  cursorPosition: number,
  debounceMs: number = 300
) {
  const { mentions, getMentionAtPosition } = useMentionDetection(text);

  // Get active mention at cursor
  const activeMention = useMemo(() => {
    return getMentionAtPosition(cursorPosition);
  }, [getMentionAtPosition, cursorPosition]);

  return {
    mentions,
    activeMention,
    isTypingMention: !!activeMention
  };
}
