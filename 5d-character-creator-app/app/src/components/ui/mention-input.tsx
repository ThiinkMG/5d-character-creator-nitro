'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Users, Globe, Folder, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { Character } from '@/types/character';
import { World } from '@/types/world';
import { Project } from '@/types/project';

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    multiline?: boolean;
    disabled?: boolean;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onBlur?: () => void;
    minRows?: number;
}

interface MentionOption {
    id: string;
    name: string;
    type: 'character' | 'world' | 'project';
    icon: React.ReactNode;
}

export function MentionInput({
    value,
    onChange,
    placeholder,
    className,
    multiline = false,
    disabled = false,
    onKeyDown,
    onBlur,
    minRows = 3
}: MentionInputProps) {
    const { characters, worlds, projects } = useStore();
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'character' | 'world' | 'project'>('all');
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mentionsListRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Build mention options
    const allMentions: MentionOption[] = [
        ...characters.map(c => ({
            id: c.id,
            name: c.name,
            type: 'character' as const,
            icon: <Users className="w-4 h-4" />
        })),
        ...worlds.map(w => ({
            id: w.id,
            name: w.name,
            type: 'world' as const,
            icon: <Globe className="w-4 h-4" />
        })),
        ...projects.map(p => ({
            id: p.id,
            name: p.name,
            type: 'project' as const,
            icon: <Folder className="w-4 h-4" />
        }))
    ].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    // Filter mentions based on type filter, search query, and mention query
    const filteredMentions = allMentions.filter(m => {
        // Type filter
        if (typeFilter !== 'all' && m.type !== typeFilter) return false;
        
        // Search query (manual search)
        if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        
        // Mention query (from @ typing)
        if (mentionQuery && !m.name.toLowerCase().includes(mentionQuery.toLowerCase())) return false;
        
        return true;
    });

    // Handle text input and detect "@"
    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const cursorPos = e.target.selectionStart;
        
        // Find "@" before cursor
        const textBeforeCursor = text.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        
        if (lastAtIndex !== -1) {
            // Check if this "@" is inside an existing mention link by looking backwards
            const textAroundAt = text.substring(Math.max(0, lastAtIndex - 50), Math.min(text.length, cursorPos + 10));
            const mentionLinkPattern = /\[@[^\]]+\]\([^)]+\)/;
            const matches = [...textAroundAt.matchAll(new RegExp(mentionLinkPattern.source, 'g'))];
            const offset = Math.max(0, lastAtIndex - 50);
            const isInsideMentionLink = matches.some(match => {
                const matchStart = offset + (match.index || 0);
                const matchEnd = matchStart + match[0].length;
                return lastAtIndex >= matchStart && lastAtIndex < matchEnd;
            });
            
            if (isInsideMentionLink) {
                setShowMentions(false);
                onChange(text);
                return;
            }
            
            // Check if there's a space or newline after @ (meaning mention is complete)
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            const hasSpaceOrNewline = /[\s\n]/.test(textAfterAt);
            
            if (!hasSpaceOrNewline) {
                    // We're in a mention - show dropdown
                    const query = textAfterAt;
                    setMentionQuery(query);
                    setSearchQuery(''); // Reset manual search when typing @
                    
                    // Calculate position for dropdown
                    const textarea = e.target;
                    const rect = textarea.getBoundingClientRect();
                    const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
                    
                    // Count lines before cursor
                    const lines = textBeforeCursor.split('\n');
                    const currentLineIndex = lines.length - 1;
                    const currentLineText = lines[currentLineIndex];
                    
                    // Create a temporary span to measure text width
                    const measureSpan = document.createElement('span');
                    measureSpan.style.position = 'absolute';
                    measureSpan.style.visibility = 'hidden';
                    measureSpan.style.whiteSpace = 'pre';
                    measureSpan.style.font = window.getComputedStyle(textarea).font;
                    measureSpan.textContent = currentLineText;
                    document.body.appendChild(measureSpan);
                    const textWidth = measureSpan.offsetWidth;
                    document.body.removeChild(measureSpan);
                    
                    // Calculate position relative to viewport
                    const top = rect.top + (currentLineIndex * lineHeight) + lineHeight + 4;
                    const left = Math.min(rect.left + textWidth + 4, window.innerWidth - 300); // 300 = dropdown width
                    
                    setMentionPosition({
                        top: Math.max(4, Math.min(top, window.innerHeight - 400)), // Keep within viewport
                        left: Math.max(4, left)
                    });
                    
                    setShowMentions(true);
                    setSelectedIndex(0);
                    
                    // Focus search input after a brief delay
                    setTimeout(() => {
                        searchInputRef.current?.focus();
                    }, 50);
                } else {
                    setShowMentions(false);
                }
            } else {
                setShowMentions(false);
            }
        
        onChange(text);
    }, [onChange]);

    // Insert mention into text
    const insertMention = useCallback((mention: MentionOption) => {
        if (!textareaRef.current) return;
        
        const textarea = textareaRef.current;
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        
        // Find "@" position
        const textBeforeCursor = text.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        
        if (lastAtIndex !== -1) {
            // Replace "@query" with mention link format
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            const beforeAt = text.substring(0, lastAtIndex);
            const afterCursor = text.substring(cursorPos);
            
            // Format: [@Name](type:id)
            const mentionLink = `[@${mention.name}](${mention.type}:${mention.id})`;
            const newText = beforeAt + mentionLink + ' ' + afterCursor; // Add space after mention
            
            onChange(newText);
            
            // Set cursor position after mention (after the space)
            setTimeout(() => {
                if (textareaRef.current) {
                    const newCursorPos = beforeAt.length + mentionLink.length + 1;
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                    textareaRef.current.focus();
                }
            }, 0);
        }
        
        setShowMentions(false);
        setMentionQuery('');
        setSearchQuery('');
        setTypeFilter('all');
    }, [onChange]);

    // Handle keyboard navigation in mentions dropdown
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showMentions && filteredMentions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < filteredMentions.length - 1 ? prev + 1 : prev
                );
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (filteredMentions[selectedIndex]) {
                    insertMention(filteredMentions[selectedIndex]);
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowMentions(false);
                setSearchQuery('');
                setMentionQuery('');
                return;
            }
        }
        
        onKeyDown?.(e);
    }, [showMentions, filteredMentions, selectedIndex, insertMention, onKeyDown]);

    // Close mentions on blur (with delay to allow clicks)
    const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
        setTimeout(() => {
            if (!mentionsListRef.current?.contains(document.activeElement) && 
                document.activeElement !== textareaRef.current) {
                setShowMentions(false);
                setSearchQuery('');
                setMentionQuery('');
                onBlur?.();
            }
        }, 200);
    }, [onBlur]);

    // Handle click outside to close mentions
    useEffect(() => {
        if (!showMentions) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                mentionsListRef.current &&
                !mentionsListRef.current.contains(event.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(event.target as Node)
            ) {
                setShowMentions(false);
                setSearchQuery('');
                setMentionQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMentions]);

    // Scroll selected item into view
    useEffect(() => {
        if (showMentions && mentionsListRef.current) {
            const selectedItem = mentionsListRef.current.children[selectedIndex] as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, showMentions]);

    const sharedProps = {
        ref: textareaRef,
        value,
        onChange: handleInput,
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        placeholder,
        disabled,
        className: cn(
            "w-full bg-transparent border-none outline-none resize-none",
            "focus:ring-1 focus:ring-primary/30 rounded-md px-2 py-1 -mx-2 -my-1",
            "text-inherit font-inherit leading-inherit",
            className
        )
    };

    return (
        <div className="relative">
            {multiline ? (
                <textarea
                    {...sharedProps}
                    rows={Math.max(minRows, value.split('\n').length)}
                    style={{ minHeight: `${minRows * 1.5}em` }}
                />
            ) : (
                <input type="text" {...sharedProps} />
            )}

            {/* Mentions Dropdown */}
            {showMentions && (
                <div
                    ref={mentionsListRef}
                    className="fixed z-50 w-80 rounded-lg bg-[#0A0A0F] border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden"
                    style={{
                        top: `${mentionPosition.top}px`,
                        left: `${mentionPosition.left}px`
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking inside
                >
                    {/* Search Input */}
                    <div className="p-2 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setShowMentions(false);
                                        textareaRef.current?.focus();
                                    }
                                }}
                                placeholder="Search..."
                                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10"
                                >
                                    <X className="w-3 h-3 text-white/40" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Type Filters */}
                    <div className="p-2 border-b border-white/10 flex gap-1">
                        <button
                            onClick={() => {
                                setTypeFilter('all');
                                setSelectedIndex(0);
                            }}
                            className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                typeFilter === 'all'
                                    ? "bg-primary/20 text-primary"
                                    : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => {
                                setTypeFilter('character');
                                setSelectedIndex(0);
                            }}
                            className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                typeFilter === 'character'
                                    ? "bg-cyan-500/20 text-cyan-400"
                                    : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Users className="w-3 h-3 inline mr-1" />
                            Characters
                        </button>
                        <button
                            onClick={() => {
                                setTypeFilter('world');
                                setSelectedIndex(0);
                            }}
                            className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                typeFilter === 'world'
                                    ? "bg-fuchsia-500/20 text-fuchsia-400"
                                    : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Globe className="w-3 h-3 inline mr-1" />
                            Worlds
                        </button>
                        <button
                            onClick={() => {
                                setTypeFilter('project');
                                setSelectedIndex(0);
                            }}
                            className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                typeFilter === 'project'
                                    ? "bg-violet-500/20 text-violet-400"
                                    : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Folder className="w-3 h-3 inline mr-1" />
                            Projects
                        </button>
                    </div>

                    {/* Results List */}
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                        {filteredMentions.length > 0 ? (
                            filteredMentions.map((mention, idx) => (
                                <button
                                    key={`${mention.type}-${mention.id}`}
                                    onClick={() => insertMention(mention)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all",
                                        idx === selectedIndex
                                            ? "bg-primary/20 text-primary border border-primary/30"
                                            : "text-white/70 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <span className={cn(
                                        "flex items-center justify-center w-5 h-5 rounded shrink-0",
                                        mention.type === 'character' && "text-cyan-400",
                                        mention.type === 'world' && "text-fuchsia-400",
                                        mention.type === 'project' && "text-violet-400"
                                    )}>
                                        {mention.icon}
                                    </span>
                                    <span className="flex-1 truncate font-medium">{mention.name}</span>
                                    <span className="text-xs text-white/40 uppercase shrink-0">
                                        {mention.type}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-white/40 text-sm">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
