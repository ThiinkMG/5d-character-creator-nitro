'use client';

/**
 * MentionPopup Component
 *
 * Phase 1: @ Mention System
 *
 * Displays a popup near cursor position when user types @ mentions.
 * Shows fuzzy-matched existing entities and "Create new" options for stubs.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Users, Globe, Folder, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { fuzzySearchEntities, type FuzzyMatch } from '@/lib/fuzzySearch';
import { useMentionDetection, type EntityMention } from '@/hooks/useMentionDetection';

interface MentionPopupProps {
    /** The text being typed in the input */
    text: string;
    /** Current cursor position */
    cursorPosition: number;
    /** Position for the popup (relative to viewport) */
    position: { top: number; left: number };
    /** Callback when a mention is selected */
    onSelectMention: (mention: EntityMention) => void;
    /** Callback when "Create new" is clicked */
    onCreateEntity: (name: string, type: 'character' | 'world' | 'project') => void;
    /** Callback to close the popup */
    onClose: () => void;
}

export function MentionPopup({
    text,
    cursorPosition,
    position,
    onSelectMention,
    onCreateEntity,
    onClose
}: MentionPopupProps) {
    const {
        mentions,
        allEntities,
        getMentionAtPosition,
        getEntityType
    } = useMentionDetection(text);

    const [selectedIndex, setSelectedIndex] = useState(0);
    const popupRef = useRef<HTMLDivElement>(null);

    // Get the mention at current cursor position
    const activeMention = getMentionAtPosition(cursorPosition);

    // Build options list: existing entities + create new options
    const options: Array<{
        type: 'existing' | 'create';
        entityType: 'character' | 'world' | 'project';
        entity?: FuzzyMatch['entity'];
        score?: number;
        matchedValue?: string;
        name?: string;
    }> = [];

    if (activeMention) {
        // Add existing entity matches (fuzzy search results)
        if (activeMention.suggestions && activeMention.suggestions.length > 0) {
            activeMention.suggestions.forEach(suggestion => {
                options.push({
                    type: 'existing',
                    entityType: getEntityType(suggestion.entity),
                    entity: suggestion.entity,
                    score: suggestion.score,
                    matchedValue: suggestion.matchedValue
                });
            });
        }

        // Add "Create new" options if no exact match
        if (!activeMention.exists) {
            options.push(
                {
                    type: 'create',
                    entityType: 'character',
                    name: activeMention.name
                },
                {
                    type: 'create',
                    entityType: 'world',
                    name: activeMention.name
                },
                {
                    type: 'create',
                    entityType: 'project',
                    name: activeMention.name
                }
            );
        }
    }

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (options.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < options.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const selected = options[selectedIndex];
                if (selected) {
                    if (selected.type === 'existing' && selected.entity && activeMention) {
                        onSelectMention({
                            ...activeMention,
                            entity: selected.entity,
                            exists: true
                        });
                    } else if (selected.type === 'create' && selected.name) {
                        onCreateEntity(selected.name, selected.entityType);
                    }
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [options, selectedIndex, activeMention, onSelectMention, onCreateEntity, onClose]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (popupRef.current) {
            const selectedItem = popupRef.current.children[0]?.children[selectedIndex] as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    // Don't render if no active mention or no options
    if (!activeMention || options.length === 0) {
        return null;
    }

    return (
        <div
            ref={popupRef}
            className="fixed z-50 w-80 rounded-lg bg-[#0A0A0F]/95 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`
            }}
        >
            {/* Header */}
            <div className="px-3 py-2 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2 text-xs text-white/60">
                    <Sparkles className="w-3 h-3" />
                    <span>Mention: <span className="text-primary font-medium">@{activeMention.name}</span></span>
                </div>
            </div>

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {options.map((option, idx) => {
                    const isSelected = idx === selectedIndex;

                    if (option.type === 'existing' && option.entity) {
                        const typeColor = {
                            character: 'text-cyan-400',
                            world: 'text-fuchsia-400',
                            project: 'text-violet-400'
                        }[option.entityType];

                        const TypeIcon = {
                            character: Users,
                            world: Globe,
                            project: Folder
                        }[option.entityType];

                        return (
                            <button
                                key={`existing-${option.entity.id}`}
                                onClick={() => {
                                    if (activeMention) {
                                        onSelectMention({
                                            ...activeMention,
                                            entity: option.entity,
                                            exists: true
                                        });
                                    }
                                }}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                                    isSelected
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "text-white/70 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <span className={cn("flex items-center justify-center w-5 h-5 rounded shrink-0", typeColor)}>
                                    <TypeIcon className="w-4 h-4" />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{option.entity.name}</div>
                                    {option.matchedValue !== option.entity.name && (
                                        <div className="text-xs text-white/40 truncate">
                                            via alias: {option.matchedValue}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-white/40 uppercase shrink-0">
                                    {option.entityType}
                                </span>
                            </button>
                        );
                    } else if (option.type === 'create' && option.name) {
                        const typeColor = {
                            character: 'text-cyan-400',
                            world: 'text-fuchsia-400',
                            project: 'text-violet-400'
                        }[option.entityType];

                        const typeBg = {
                            character: 'bg-cyan-500/10',
                            world: 'bg-fuchsia-500/10',
                            project: 'bg-violet-500/10'
                        }[option.entityType];

                        const TypeIcon = {
                            character: Users,
                            world: Globe,
                            project: Folder
                        }[option.entityType];

                        return (
                            <button
                                key={`create-${option.entityType}`}
                                onClick={() => onCreateEntity(option.name!, option.entityType)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                                    isSelected
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "text-white/70 hover:bg-white/5 hover:text-white",
                                    typeBg
                                )}
                            >
                                <span className={cn("flex items-center justify-center w-5 h-5 rounded shrink-0", typeColor)}>
                                    <Plus className="w-4 h-4" />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">Create new {option.entityType}</div>
                                    <div className="text-xs text-white/40 truncate">
                                        "{option.name}"
                                    </div>
                                </div>
                                <TypeIcon className={cn("w-4 h-4 shrink-0", typeColor)} />
                            </button>
                        );
                    }

                    return null;
                })}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-white/10 bg-white/5 text-xs text-white/40 flex items-center justify-between">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
            </div>
        </div>
    );
}
