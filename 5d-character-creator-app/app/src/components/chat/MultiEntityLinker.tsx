'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { User, Globe, Folder, Search, Check, X, Link2, Plus, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fuzzyMatchByName } from '@/lib/fuzzy-match';
import { LinkedEntities } from '@/types/chat';

interface EntityItem {
    id: string;
    name: string;
}

interface MultiEntityLinkerProps {
    linkedEntities: LinkedEntities;
    onChange: (entities: LinkedEntities) => void;
    characters: EntityItem[];
    worlds: EntityItem[];
    projects: EntityItem[];
    /** Only allow one type of entity */
    restrictToType?: 'character' | 'world' | 'project';
    /** Compact display mode */
    compact?: boolean;
    className?: string;
}

const ENTITY_ICONS = {
    character: User,
    world: Globe,
    project: Folder
};

const ENTITY_COLORS = {
    character: 'text-emerald-400',
    world: 'text-blue-400',
    project: 'text-orange-400'
};

const ENTITY_BG = {
    character: 'bg-emerald-500/10 border-emerald-500/20',
    world: 'bg-blue-500/10 border-blue-500/20',
    project: 'bg-orange-500/10 border-orange-500/20'
};

export function MultiEntityLinker({
    linkedEntities,
    onChange,
    characters,
    worlds,
    projects,
    restrictToType,
    compact = false,
    className
}: MultiEntityLinkerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Total count of linked entities
    const totalLinked = useMemo(() => {
        return linkedEntities.characters.length +
            linkedEntities.worlds.length +
            linkedEntities.projects.length;
    }, [linkedEntities]);

    // Check if an entity is selected
    const isSelected = useCallback((type: 'character' | 'world' | 'project', id: string) => {
        return linkedEntities[`${type}s` as keyof LinkedEntities].some(e => e.id === id);
    }, [linkedEntities]);

    // Toggle entity selection
    const toggleEntity = useCallback((type: 'character' | 'world' | 'project', item: EntityItem) => {
        const key = `${type}s` as keyof LinkedEntities;
        const current = linkedEntities[key];
        const exists = current.some(e => e.id === item.id);

        onChange({
            ...linkedEntities,
            [key]: exists
                ? current.filter(e => e.id !== item.id)
                : [...current, { id: item.id, name: item.name }]
        });
    }, [linkedEntities, onChange]);

    // Remove a specific entity
    const removeEntity = useCallback((type: 'character' | 'world' | 'project', id: string) => {
        const key = `${type}s` as keyof LinkedEntities;
        onChange({
            ...linkedEntities,
            [key]: linkedEntities[key].filter(e => e.id !== id)
        });
    }, [linkedEntities, onChange]);

    // Clear all entities
    const clearAll = useCallback(() => {
        onChange({
            characters: [],
            worlds: [],
            projects: []
        });
    }, [onChange]);

    // Fuzzy match results
    const characterResults = useMemo(() => {
        if (restrictToType && restrictToType !== 'character') return [];
        if (!searchQuery.trim()) return characters.slice(0, 10);
        return fuzzyMatchByName(characters, searchQuery, { maxResults: 10 })
            .map(r => r.item);
    }, [characters, searchQuery, restrictToType]);

    const worldResults = useMemo(() => {
        if (restrictToType && restrictToType !== 'world') return [];
        if (!searchQuery.trim()) return worlds.slice(0, 10);
        return fuzzyMatchByName(worlds, searchQuery, { maxResults: 10 })
            .map(r => r.item);
    }, [worlds, searchQuery, restrictToType]);

    const projectResults = useMemo(() => {
        if (restrictToType && restrictToType !== 'project') return [];
        if (!searchQuery.trim()) return projects.slice(0, 10);
        return fuzzyMatchByName(projects, searchQuery, { maxResults: 10 })
            .map(r => r.item);
    }, [projects, searchQuery, restrictToType]);

    // Render linked entity chips
    const renderChips = () => {
        const allLinked: Array<{ type: 'character' | 'world' | 'project'; id: string; name: string }> = [
            ...linkedEntities.characters.map(e => ({ type: 'character' as const, ...e })),
            ...linkedEntities.worlds.map(e => ({ type: 'world' as const, ...e })),
            ...linkedEntities.projects.map(e => ({ type: 'project' as const, ...e }))
        ];

        if (allLinked.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1.5">
                {allLinked.map(entity => {
                    const Icon = ENTITY_ICONS[entity.type];
                    return (
                        <div
                            key={`${entity.type}-${entity.id}`}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border",
                                ENTITY_BG[entity.type]
                            )}
                        >
                            <Icon className={cn("w-3 h-3", ENTITY_COLORS[entity.type])} />
                            <span className="text-white max-w-[100px] truncate">{entity.name}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeEntity(entity.type, entity.id);
                                }}
                                className="ml-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-3 h-3 text-muted-foreground hover:text-white" />
                            </button>
                        </div>
                    );
                })}
                {allLinked.length > 1 && (
                    <button
                        onClick={clearAll}
                        className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1"
                    >
                        Clear all
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className={cn("space-y-2", className)}>
            {/* Entity chips */}
            {!compact && renderChips()}

            {/* Dropdown for adding entities */}
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "gap-2 text-xs",
                            totalLinked > 0
                                ? "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {compact ? (
                            <>
                                <Link2 className="h-3.5 w-3.5" />
                                {totalLinked > 0 && (
                                    <span className="bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded text-[10px]">
                                        {totalLinked}
                                    </span>
                                )}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </>
                        ) : (
                            <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Entity</span>
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="w-72 bg-black/95 border-white/10 backdrop-blur-xl max-h-[400px] overflow-y-auto"
                >
                    {/* Compact mode: show chips inside dropdown */}
                    {compact && totalLinked > 0 && (
                        <>
                            <div className="p-2">
                                {renderChips()}
                            </div>
                            <DropdownMenuSeparator className="bg-white/10" />
                        </>
                    )}

                    {/* Search Input */}
                    <div className="px-2 py-1.5 sticky top-0 bg-black/95 z-10">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search entities..."
                                className="w-full pl-7 pr-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 focus:outline-none focus:border-primary/50 text-white placeholder:text-white/30"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Characters */}
                    {characterResults.length > 0 && (
                        <>
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-2">
                                <User className="w-3 h-3 text-emerald-400" />
                                Characters
                                {linkedEntities.characters.length > 0 && (
                                    <span className="text-emerald-400">({linkedEntities.characters.length})</span>
                                )}
                            </DropdownMenuLabel>
                            {characterResults.map(char => {
                                const selected = isSelected('character', char.id);
                                return (
                                    <DropdownMenuItem
                                        key={char.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleEntity('character', char);
                                        }}
                                        className={cn(
                                            "text-xs cursor-pointer",
                                            selected
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "focus:bg-white/10 focus:text-white"
                                        )}
                                    >
                                        <User className="mr-2 h-3.5 w-3.5 text-emerald-400" />
                                        <span className="truncate flex-1">{char.name}</span>
                                        {selected && <Check className="ml-auto h-3.5 w-3.5" />}
                                    </DropdownMenuItem>
                                );
                            })}
                        </>
                    )}

                    {/* Worlds */}
                    {worldResults.length > 0 && (
                        <>
                            {characterResults.length > 0 && <DropdownMenuSeparator className="bg-white/10" />}
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Globe className="w-3 h-3 text-blue-400" />
                                Worlds
                                {linkedEntities.worlds.length > 0 && (
                                    <span className="text-blue-400">({linkedEntities.worlds.length})</span>
                                )}
                            </DropdownMenuLabel>
                            {worldResults.map(world => {
                                const selected = isSelected('world', world.id);
                                return (
                                    <DropdownMenuItem
                                        key={world.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleEntity('world', world);
                                        }}
                                        className={cn(
                                            "text-xs cursor-pointer",
                                            selected
                                                ? "bg-blue-500/10 text-blue-400"
                                                : "focus:bg-white/10 focus:text-white"
                                        )}
                                    >
                                        <Globe className="mr-2 h-3.5 w-3.5 text-blue-400" />
                                        <span className="truncate flex-1">{world.name}</span>
                                        {selected && <Check className="ml-auto h-3.5 w-3.5" />}
                                    </DropdownMenuItem>
                                );
                            })}
                        </>
                    )}

                    {/* Projects */}
                    {projectResults.length > 0 && (
                        <>
                            {(characterResults.length > 0 || worldResults.length > 0) && (
                                <DropdownMenuSeparator className="bg-white/10" />
                            )}
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Folder className="w-3 h-3 text-orange-400" />
                                Projects
                                {linkedEntities.projects.length > 0 && (
                                    <span className="text-orange-400">({linkedEntities.projects.length})</span>
                                )}
                            </DropdownMenuLabel>
                            {projectResults.map(project => {
                                const selected = isSelected('project', project.id);
                                return (
                                    <DropdownMenuItem
                                        key={project.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleEntity('project', project);
                                        }}
                                        className={cn(
                                            "text-xs cursor-pointer",
                                            selected
                                                ? "bg-orange-500/10 text-orange-400"
                                                : "focus:bg-white/10 focus:text-white"
                                        )}
                                    >
                                        <Folder className="mr-2 h-3.5 w-3.5 text-orange-400" />
                                        <span className="truncate flex-1">{project.name}</span>
                                        {selected && <Check className="ml-auto h-3.5 w-3.5" />}
                                    </DropdownMenuItem>
                                );
                            })}
                        </>
                    )}

                    {/* Empty state */}
                    {characterResults.length === 0 && worldResults.length === 0 && projectResults.length === 0 && (
                        <div className="px-2 py-3 text-xs text-muted-foreground italic text-center">
                            {searchQuery ? 'No matches found' : 'No entities available'}
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/**
 * Helper to create empty linked entities
 */
export function createEmptyLinkedEntities(): LinkedEntities {
    return {
        characters: [],
        worlds: [],
        projects: []
    };
}

/**
 * Helper to check if linked entities has any items
 */
export function hasLinkedEntities(entities: LinkedEntities | undefined): boolean {
    if (!entities) return false;
    return entities.characters.length > 0 ||
        entities.worlds.length > 0 ||
        entities.projects.length > 0;
}

/**
 * Helper to get total count of linked entities
 */
export function getLinkedEntitiesCount(entities: LinkedEntities | undefined): number {
    if (!entities) return 0;
    return entities.characters.length +
        entities.worlds.length +
        entities.projects.length;
}
