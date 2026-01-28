'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, X, Check, Tag as TagIcon, ChevronDown, Save, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Character } from '@/types/character';
import { World } from '@/types/world';
import { Project } from '@/types/project';
import { ChatSession } from '@/types/chat';

type FilterItem = Character | World | Project | ChatSession;

interface SmartFilterPanelProps {
    items: FilterItem[];
    onFilterChange: (filteredItems: any[]) => void;
    type: 'project' | 'character' | 'world' | 'history';
    className?: string;
}

interface FilterState {
    search: string;
    selectedGenres: string[];
    selectedTags: string[];
    selectedRoles: string[];
    selectedTones: string[];
    logic: 'AND' | 'OR';
}

export function SmartFilterPanel({ items, onFilterChange, type, className }: SmartFilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Initial state
    const [filterState, setFilterState] = useState<FilterState>({
        search: '',
        selectedGenres: [],
        selectedTags: [],
        selectedRoles: [],
        selectedTones: [],
        logic: 'OR'
    });

    // Extract unique Genres, Tags, Roles, and Tones from items dynamically
    const { uniqueGenres, uniqueTags, uniqueRoles, uniqueTones } = useMemo(() => {
        const genres = new Set<string>();
        const tags = new Set<string>();
        const roles = new Set<string>();
        const tones = new Set<string>();

        items.forEach((item: any) => {
            if (item.genre) genres.add(item.genre);
            // Handle both string[] tags (Projects) and potentially different structures
            if (Array.isArray(item.tags)) {
                item.tags.forEach((t: string) => tags.add(t));
            }
            // Add specific logic for History mode if needed (mapped to genres for UI consistency)
            if (type === 'history' && item.mode) {
                genres.add(item.mode);
            }
            // Roles for Characters
            if (type === 'character' && item.role) {
                roles.add(item.role);
            }
            // Tones for Worlds
            if (type === 'world' && item.tone) {
                tones.add(item.tone);
            }
        });

        return {
            uniqueGenres: Array.from(genres).sort(),
            uniqueTags: Array.from(tags).sort(),
            uniqueRoles: Array.from(roles).sort(),
            uniqueTones: Array.from(tones).sort()
        };
    }, [items, type]);

    // Apply Filters
    useEffect(() => {
        let result = items;

        // 1. Search (Title/Name/Desc)
        if (filterState.search) {
            const q = filterState.search.toLowerCase();
            result = result.filter((item: any) => {
                const nameMatch = (item.name || item.title || '').toLowerCase().includes(q);
                const descMatch = (item.description || item.summary || item.coreConcept || item.lastMessage || '').toLowerCase().includes(q);
                const genreMatch = (item.genre || item.mode || '').toLowerCase().includes(q);
                return nameMatch || descMatch || genreMatch;
            });
        }

        // 2. Genre Filter
        if (filterState.selectedGenres.length > 0) {
            result = result.filter((item: any) => {
                const itemGenre = item.genre || item.mode;
                return filterState.selectedGenres.includes(itemGenre);
            });
        }

        // 3. Tag Filter
        if (filterState.selectedTags.length > 0) {
            result = result.filter((item: any) => {
                const itemTags = item.tags || [];
                if (filterState.logic === 'AND') {
                    return filterState.selectedTags.every(tag => itemTags.includes(tag));
                } else {
                    return filterState.selectedTags.some(tag => itemTags.includes(tag));
                }
            });
        }

        // 4. Role Filter (Characters)
        if (filterState.selectedRoles.length > 0) {
            result = result.filter((item: any) => filterState.selectedRoles.includes(item.role));
        }

        // 5. Tone Filter (Worlds)
        if (filterState.selectedTones.length > 0) {
            result = result.filter((item: any) => filterState.selectedTones.includes(item.tone));
        }

        onFilterChange(result);
    }, [filterState, items, onFilterChange]);

    // Handlers
    const toggleGenre = (genre: string) => {
        setFilterState(prev => ({
            ...prev,
            selectedGenres: prev.selectedGenres.includes(genre)
                ? prev.selectedGenres.filter(g => g !== genre)
                : [...prev.selectedGenres, genre]
        }));
    };

    const toggleTag = (tag: string) => {
        setFilterState(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.includes(tag)
                ? prev.selectedTags.filter(t => t !== tag)
                : [...prev.selectedTags, tag]
        }));
    };

    const clearFilters = () => {
        setFilterState({
            search: '',
            selectedGenres: [],
            selectedTags: [],
            selectedRoles: [],
            selectedTones: [],
            logic: 'OR'
        });
    };

    const activeFilterCount =
        filterState.selectedGenres.length +
        filterState.selectedTags.length +
        filterState.selectedRoles.length +
        filterState.selectedTones.length;

    return (
        <div className={cn("relative z-20", className)}>
            {/* Main Trigger */}
            <Button
                variant="outline"
                className={cn(
                    "glass gap-2 relative",
                    activeFilterCount > 0 && "border-cyan-500/50 text-cyan-400 bg-cyan-500/10",
                    // Specific fix for History page click issue requested by user
                    type === 'history' && "min-w-[120px] h-10 shadow-lg z-30"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 ? `${activeFilterCount} Active` : 'Filter'}
                <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
            </Button>

            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}

            {/* Panel */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 md:w-96 p-4 rounded-xl glass-card border border-white/10 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm text-white">Smart Filters</h3>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1 transition-colors"
                            >
                                <Eraser className="w-3 h-3" />
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={filterState.search}
                            onChange={(e) => setFilterState(prev => ({ ...prev, search: e.target.value }))}
                            placeholder={`Search ${type}s...`}
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs focus:border-cyan-500/50 transition-colors"
                        />
                    </div>

                    {/* Genres Section */}
                    {uniqueGenres.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                {type === 'history' ? 'Modes' : 'Genres'}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {uniqueGenres.map(genre => {
                                    const isSelected = filterState.selectedGenres.includes(genre);
                                    return (
                                        <button
                                            key={genre}
                                            onClick={() => toggleGenre(genre)}
                                            className={cn(
                                                "px-2.5 py-1 rounded-md text-xs transition-all border",
                                                isSelected
                                                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                                                    : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            {genre}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Roles Section (Characters Only) */}
                    {uniqueRoles.length > 0 && type === 'character' && (
                        <div className="mb-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Roles
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {uniqueRoles.map(role => {
                                    const isSelected = filterState.selectedRoles.includes(role);
                                    return (
                                        <button
                                            key={role}
                                            onClick={() => setFilterState(prev => ({
                                                ...prev,
                                                selectedRoles: prev.selectedRoles.includes(role)
                                                    ? prev.selectedRoles.filter(r => r !== role)
                                                    : [...prev.selectedRoles, role]
                                            }))}
                                            className={cn(
                                                "px-2.5 py-1 rounded-md text-xs transition-all border",
                                                isSelected
                                                    ? "bg-violet-500/20 text-violet-300 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                                                    : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            {role}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tones Section (Worlds Only) */}
                    {uniqueTones.length > 0 && type === 'world' && (
                        <div className="mb-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Tones
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {uniqueTones.map(tone => {
                                    const isSelected = filterState.selectedTones.includes(tone);
                                    return (
                                        <button
                                            key={tone}
                                            onClick={() => setFilterState(prev => ({
                                                ...prev,
                                                selectedTones: prev.selectedTones.includes(tone)
                                                    ? prev.selectedTones.filter(t => t !== tone)
                                                    : [...prev.selectedTones, tone]
                                            }))}
                                            className={cn(
                                                "px-2.5 py-1 rounded-md text-xs transition-all border",
                                                isSelected
                                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                                    : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            {tone}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tags Section */}
                    {uniqueTags.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Tags
                                </h4>
                                {/* Logic Toggle */}
                                <div className="flex items-center bg-white/5 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setFilterState(prev => ({ ...prev, logic: 'OR' }))}
                                        className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                                            filterState.logic === 'OR'
                                                ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                                                : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        ANY
                                    </button>
                                    <button
                                        onClick={() => setFilterState(prev => ({ ...prev, logic: 'AND' }))}
                                        className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                                            filterState.logic === 'AND'
                                                ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                                                : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        ALL
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                {uniqueTags.map(tag => {
                                    const isSelected = filterState.selectedTags.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={cn(
                                                "px-2.5 py-1 rounded-full text-xs transition-all border flex items-center gap-1",
                                                isSelected
                                                    ? "bg-teal-500/20 text-teal-300 border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.1)]"
                                                    : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            <TagIcon className="w-2.5 h-2.5" />
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty State Help */}
                    {uniqueGenres.length === 0 && uniqueTags.length === 0 && uniqueRoles.length === 0 && uniqueTones.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                            No filters available. Add tags or genres to your items to see them here.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
