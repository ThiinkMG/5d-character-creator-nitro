'use client';

/**
 * useContextSidecar Hook
 *
 * Phase 1 Week 3: Context Sidecar System
 *
 * Detects entity names in text and manages pinned entities for the context sidecar.
 * - Auto-detects capitalized entity names (not just @ mentions)
 * - Tracks pinned entities (persists in localStorage)
 * - Returns pinned and auto-detected entities for display in sidecar
 * - Supports callback notifications for pin/unpin actions
 * - Includes @ mention detection for priority matching
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import type { Character } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';

export type DetectedEntity = {
    id: string;
    name: string;
    type: 'character' | 'world' | 'project';
    matchedText: string; // The actual text that matched (could be alias)
    occurrences: number; // How many times it appears in text
    isMention: boolean; // Whether it was detected via @ mention
};

export type PinnedEntityData = {
    id: string;
    type: 'character' | 'world' | 'project';
    pinnedAt: Date;
};

export type EntityWithType = (Character | World | Project) & {
    type: 'character' | 'world' | 'project';
};

interface UseContextSidecarOptions {
    /** Text to scan for entity names */
    text: string;
    /** Maximum number of auto-detected entities to return */
    maxAutoDetected?: number;
    /** Minimum word length to consider for entity detection (default: 2) */
    minWordLength?: number;
    /** Callback when an entity is pinned */
    onPin?: (entity: EntityWithType) => void;
    /** Callback when an entity is unpinned */
    onUnpin?: (entity: EntityWithType) => void;
    /** Debounce delay for text detection (ms) */
    debounceMs?: number;
}

/**
 * Hook for managing context sidecar state
 *
 * @param options Configuration options
 * @returns Pinned entities, auto-detected entities, and pin/unpin functions
 */
export function useContextSidecar({
    text,
    maxAutoDetected = 5,
    minWordLength = 2,
    onPin,
    onUnpin,
    debounceMs = 300
}: UseContextSidecarOptions) {
    const { characters, worlds, projects } = useStore();

    // Debounced text for detection
    const [debouncedText, setDebouncedText] = useState(text);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounce text changes
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedText(text);
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [text, debounceMs]);

    // Load pinned entities from localStorage
    const [pinnedEntityIds, setPinnedEntityIds] = useState<PinnedEntityData[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('contextSidecar.pinnedEntities');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Convert date strings back to Date objects
                const withDates = parsed.map((item: any) => ({
                    ...item,
                    pinnedAt: new Date(item.pinnedAt)
                }));
                setPinnedEntityIds(withDates);
            } catch (error) {
                console.error('Failed to parse pinned entities:', error);
                setPinnedEntityIds([]);
            }
        }
        setIsHydrated(true);
    }, []);

    // Persist pinned entities to localStorage
    const savePinnedEntities = useCallback((entities: PinnedEntityData[]) => {
        localStorage.setItem('contextSidecar.pinnedEntities', JSON.stringify(entities));
        setPinnedEntityIds(entities);
    }, []);

    // Get entity by ID
    const getEntityById = useCallback((id: string, type: 'character' | 'world' | 'project'): EntityWithType | null => {
        if (type === 'character') {
            const char = characters.find(c => c.id === id);
            return char ? { ...char, type: 'character' } : null;
        } else if (type === 'world') {
            const world = worlds.find(w => w.id === id);
            return world ? { ...world, type: 'world' } : null;
        } else {
            const project = projects.find(p => p.id === id);
            return project ? { ...project, type: 'project' } : null;
        }
    }, [characters, worlds, projects]);

    /**
     * Pin an entity to the sidecar
     */
    const pinEntity = useCallback((id: string, type: 'character' | 'world' | 'project') => {
        const newPinned = [
            ...pinnedEntityIds.filter(p => p.id !== id),
            { id, type, pinnedAt: new Date() }
        ];
        savePinnedEntities(newPinned);

        // Call onPin callback if provided
        if (onPin) {
            const entity = getEntityById(id, type);
            if (entity) {
                onPin(entity);
            }
        }
    }, [pinnedEntityIds, savePinnedEntities, onPin, getEntityById]);

    /**
     * Unpin an entity from the sidecar
     */
    const unpinEntity = useCallback((id: string) => {
        const pinned = pinnedEntityIds.find(p => p.id === id);
        const newPinned = pinnedEntityIds.filter(p => p.id !== id);
        savePinnedEntities(newPinned);

        // Call onUnpin callback if provided
        if (onUnpin && pinned) {
            const entity = getEntityById(id, pinned.type);
            if (entity) {
                onUnpin(entity);
            }
        }
    }, [pinnedEntityIds, savePinnedEntities, onUnpin, getEntityById]);

    /**
     * Check if an entity is pinned
     */
    const isPinned = useCallback((id: string) => {
        return pinnedEntityIds.some(p => p.id === id);
    }, [pinnedEntityIds]);

    /**
     * Toggle pin state for an entity
     */
    const togglePin = useCallback((id: string, type: 'character' | 'world' | 'project') => {
        if (isPinned(id)) {
            unpinEntity(id);
        } else {
            pinEntity(id, type);
        }
    }, [isPinned, pinEntity, unpinEntity]);

    /**
     * Clear all pinned entities
     */
    const clearAllPinned = useCallback(() => {
        savePinnedEntities([]);
    }, [savePinnedEntities]);

    /**
     * Get pinned entities with full data
     */
    const pinnedEntities = useMemo(() => {
        return pinnedEntityIds
            .map(pinned => {
                if (pinned.type === 'character') {
                    const char = characters.find(c => c.id === pinned.id);
                    return char ? { ...pinned, entity: char as Character } : null;
                } else if (pinned.type === 'world') {
                    const world = worlds.find(w => w.id === pinned.id);
                    return world ? { ...pinned, entity: world as World } : null;
                } else {
                    const project = projects.find(p => p.id === pinned.id);
                    return project ? { ...pinned, entity: project as Project } : null;
                }
            })
            .filter(Boolean) as Array<PinnedEntityData & { entity: Character | World | Project }>;
    }, [pinnedEntityIds, characters, worlds, projects]);

    /**
     * Auto-detect entity names in text
     * - Matches entity names and aliases
     * - Detects @ mentions with priority
     * - Detects capitalized multi-word names (e.g., "The Northern War")
     * - Excludes pinned entities from detection
     */
    const autoDetectedEntities = useMemo(() => {
        if (!debouncedText.trim()) return [];

        const detected = new Map<string, DetectedEntity>();

        // All entities with their names and aliases
        const allEntities: EntityWithType[] = [
            ...characters.map(c => ({ ...c, type: 'character' as const })),
            ...worlds.map(w => ({ ...w, type: 'world' as const })),
            ...projects.map(p => ({ ...p, type: 'project' as const }))
        ];

        // Regex patterns
        const mentionPattern = /@(\w+(?:\s+\w+)*?)(?=\s|$|[.,!?;:]|@)/g;

        // First pass: detect @ mentions (high priority)
        let mentionMatch;
        const mentionedNames = new Set<string>();
        while ((mentionMatch = mentionPattern.exec(debouncedText)) !== null) {
            mentionedNames.add(mentionMatch[1].toLowerCase());
        }

        // For each entity, check if its name or any alias appears in text
        allEntities.forEach(entity => {
            // Skip pinned entities
            if (isPinned(entity.id)) return;

            const namesToCheck = [entity.name, ...(entity.aliases || [])];

            namesToCheck.forEach(name => {
                if (name.length < minWordLength) return;

                // Check if this is a @ mention (high priority)
                const isMention = mentionedNames.has(name.toLowerCase());

                // Create a regex for word boundary matching (case insensitive)
                const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
                const matches = debouncedText.match(regex);

                if (matches && matches.length > 0) {
                    const existing = detected.get(entity.id);
                    const occurrences = matches.length;

                    // Calculate priority score: mentions have higher base score
                    const priorityScore = isMention ? occurrences + 100 : occurrences;

                    if (existing) {
                        // Update if this match has higher priority
                        const existingScore = existing.isMention ? existing.occurrences + 100 : existing.occurrences;
                        if (priorityScore > existingScore) {
                            detected.set(entity.id, {
                                id: entity.id,
                                name: entity.name,
                                type: entity.type,
                                matchedText: name,
                                occurrences,
                                isMention
                            });
                        }
                    } else {
                        detected.set(entity.id, {
                            id: entity.id,
                            name: entity.name,
                            type: entity.type,
                            matchedText: name,
                            occurrences,
                            isMention
                        });
                    }
                }
            });
        });

        // Convert to array and sort by priority (mentions first, then by occurrence count)
        const detectedArray = Array.from(detected.values())
            .sort((a, b) => {
                // Mentions come first
                if (a.isMention && !b.isMention) return -1;
                if (!a.isMention && b.isMention) return 1;
                // Then by occurrence count
                return b.occurrences - a.occurrences;
            })
            .slice(0, maxAutoDetected);

        return detectedArray;
    }, [debouncedText, characters, worlds, projects, pinnedEntityIds, maxAutoDetected, minWordLength, isPinned]);

    /**
     * Get combined count of pinned and detected entities
     */
    const totalContextEntities = useMemo(() => {
        return pinnedEntities.length + autoDetectedEntities.length;
    }, [pinnedEntities, autoDetectedEntities]);

    /**
     * Check if there are any context entities
     */
    const hasContextEntities = totalContextEntities > 0;

    return {
        // State
        pinnedEntities,
        autoDetectedEntities,
        totalContextEntities,
        hasContextEntities,
        isHydrated,

        // Actions
        pinEntity,
        unpinEntity,
        togglePin,
        clearAllPinned,
        isPinned,

        // Helpers
        getEntityById
    };
}

/**
 * Export types for external use
 */
export type {
    UseContextSidecarOptions
};
