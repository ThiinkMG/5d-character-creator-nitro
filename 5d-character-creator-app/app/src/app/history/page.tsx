'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Search, MessageSquare, Calendar, Clock, ArrowRight, Trash2, X, Check, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmartFilterPanel } from '@/components/ui/smart-filter';
import { NarrativeSessionCard } from '@/components/ui/narrative-session-card';
import { ChatSession } from '@/types/chat';
import { cn } from '@/lib/utils';

// Helper component for dropdowns
function Dropdown({ trigger, children, isOpen, onClose }: { trigger: React.ReactNode; children: React.ReactNode; isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return <>{trigger}</>;
    return (
        <div className="relative">
            {trigger}
            <div className="absolute top-full left-0 mt-2 w-56 rounded-xl glass-card border border-white/10 shadow-2xl z-50 overflow-hidden">
                {children}
            </div>
            <div className="fixed inset-0 z-40" onClick={onClose} />
        </div>
    );
}

export default function HistoryPage() {
    const router = useRouter();
    const { chatSessions, deleteChatSession, characters, worlds } = useStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Selection state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Filter/Sort state
    const [sortOpen, setSortOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'date' | 'a-z' | 'z-a'>('date');
    const [groupBy, setGroupBy] = useState<'date' | 'entity'>('date');
    const [filteredByPanel, setFilteredByPanel] = useState<ChatSession[]>(chatSessions);

    // 1. Search filter (passed to panel)
    const searchedSessions = useMemo(() => {
        if (!searchQuery) return chatSessions;
        const q = searchQuery.toLowerCase();
        return chatSessions.filter(s =>
            s.title.toLowerCase().includes(q) ||
            s.lastMessage.toLowerCase().includes(q)
        );
    }, [chatSessions, searchQuery]);

    // 2. Final Sort (applied to panel results)
    const finalDisplaySessions = useMemo(() => {
        const result = [...filteredByPanel];

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'a-z') return (a.title || '').localeCompare(b.title || '');
            if (sortBy === 'z-a') return (b.title || '').localeCompare(a.title || '');
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return result;
    }, [filteredByPanel, sortBy]);

    // Group sessions
    const groupedSessions = useMemo(() => {
        const groups: Record<string, ChatSession[]> = {};

        if (groupBy === 'date') {
            groups['Today'] = [];
            groups['Yesterday'] = [];
            groups['Last 7 Days'] = [];
            groups['Older'] = [];

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const yesterday = today - 86400000;
            const last7Days = today - 86400000 * 7;

            finalDisplaySessions.forEach(session => {
                const date = new Date(session.updatedAt).getTime();
                if (date >= today) groups['Today'].push(session);
                else if (date >= yesterday) groups['Yesterday'].push(session);
                else if (date >= last7Days) groups['Last 7 Days'].push(session);
                else groups['Older'].push(session);
            });
        } else {
            // Group by Entity
            finalDisplaySessions.forEach(session => {
                let groupName = 'Unlinked Conversations';
                if (session.relatedId) {
                    const char = characters.find(c => c.id === session.relatedId);
                    const world = worlds.find(w => w.id === session.relatedId);
                    if (char) groupName = `Character: ${char.name}`;
                    else if (world) groupName = `World: ${world.name}`;
                }
                if (!groups[groupName]) groups[groupName] = [];
                groups[groupName].push(session);
            });
        }

        return groups;
    }, [finalDisplaySessions, groupBy, characters, worlds]);

    // Clear selection when filter changes
    React.useEffect(() => {
        setSelectedItems(new Set());
    }, [searchQuery, filteredByPanel]);

    // Selection handlers
    const handleSelect = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === finalDisplaySessions.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(finalDisplaySessions.map(s => s.id)));
        }
    };

    const handleBulkDelete = () => {
        selectedItems.forEach(id => deleteChatSession(id));
        setSelectedItems(new Set());
        setDeleteDialogOpen(false);
    };

    const handleSessionClick = (id: string) => {
        router.push(`/chat?sessionId=${id}`);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <div className="flex flex-col h-full bg-[#0a0a0a] text-foreground p-6 overflow-hidden relative">
                {/* Ambient Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] opacity-20" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[128px] opacity-20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            <Clock className="w-8 h-8 text-primary" />
                            Chat History
                        </h1>
                        <p className="text-muted-foreground mt-1 ml-11 text-sm">Resume your previous creative sessions</p>
                    </div>
                </div>

                {/* Selection Toolbar */}
                {selectedItems.size > 0 && (
                    <div className="mb-4 flex items-center gap-4 p-4 rounded-xl glass-card border border-primary/20 bg-primary/5 relative z-10">
                        <span className="text-sm text-white/80">
                            {selectedItems.size} selected
                        </span>
                        <div className="h-4 w-px bg-white/20" />
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                        <div className="flex-1" />
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedItems(new Set())}
                            className="text-white/60 hover:text-white"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm 
                                       focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 
                                       transition-all placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* Default Search is handled by parent, passed as searchedSessions */}

                    {/* Mode Filter (REPLACED with SmartFilterPanel) */}
                    <SmartFilterPanel
                        items={searchedSessions}
                        onFilterChange={setFilteredByPanel}
                        type="history"
                    />

                    {/* Sort */}
                    <Dropdown
                        isOpen={sortOpen}
                        onClose={() => setSortOpen(false)}
                        trigger={
                            <Button variant="outline" className="glass gap-2" onClick={() => setSortOpen(!sortOpen)}>
                                <ArrowUpDown className="h-4 w-4" />
                                Sort
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        }
                    >
                        <div className="p-2">
                            {[
                                { value: 'date', label: 'Last Updated' },
                                { value: 'a-z', label: 'A to Z' },
                                { value: 'z-a', label: 'Z to A' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        // If clicking the same option, reset to default
                                        if (sortBy === opt.value) {
                                            setSortBy('date');
                                        } else {
                                            setSortBy(opt.value as typeof sortBy);
                                        }
                                        setSortOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left",
                                        sortBy === opt.value ? "bg-primary/20 text-primary" : "hover:bg-white/5"
                                    )}
                                >
                                    {sortBy === opt.value && <Check className="w-4 h-4" />}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </Dropdown>

                    {/* Group By Toggle */}
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setGroupBy('date')}
                            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", groupBy === 'date' ? "bg-primary text-white" : "hover:text-white text-muted-foreground")}
                        >
                            Date
                        </button>
                        <button
                            onClick={() => setGroupBy('entity')}
                            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", groupBy === 'entity' ? "bg-primary text-white" : "hover:text-white text-muted-foreground")}
                        >
                            Entity
                        </button>
                    </div>
                </div>

                {/* Select All toggle */}
                {finalDisplaySessions.length > 0 && (
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                        >
                            <div className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                selectedItems.size === finalDisplaySessions.length && finalDisplaySessions.length > 0
                                    ? "bg-primary border-primary"
                                    : "border-white/30 hover:border-primary"
                            )}>
                                {selectedItems.size === finalDisplaySessions.length && finalDisplaySessions.length > 0 && (
                                    <Check className="w-3 h-3 text-white" />
                                )}
                            </div>
                            Select All
                        </button>
                        <span className="text-xs text-white/40">
                            {finalDisplaySessions.length} conversation{finalDisplaySessions.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Chat Sessions */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 pb-10">
                    {Object.entries(groupedSessions).map(([group, sessions]) => (
                        sessions.length > 0 && (
                            <div key={group} className="mb-10">
                                <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-4 pl-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                                    {group}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {sessions.map(session => (
                                        <NarrativeSessionCard
                                            key={session.id}
                                            session={session}
                                            characters={characters}
                                            worlds={worlds}
                                            isSelected={selectedItems.has(session.id)}
                                            onSelect={handleSelect}
                                            onClick={handleSessionClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    ))}

                    {finalDisplaySessions.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No history found</h3>
                            <p className="text-muted-foreground max-w-sm mb-8">
                                Start a new conversation to see it listed here. Your creative journey begins with a single prompt.
                            </p>
                            <Button
                                onClick={() => router.push('/chat')}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-base shadow-lg shadow-primary/20 transition-all hover:scale-105"
                            >
                                Start New Chat
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Delete Dialog */}
            {deleteDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteDialogOpen(false)} />
                    <div className="relative glass-card rounded-2xl p-6 max-w-md mx-4 border border-white/10">
                        <h3 className="text-lg font-semibold mb-2">Delete Conversations?</h3>
                        <p className="text-muted-foreground mb-6">
                            This will permanently delete {selectedItems.size} conversation{selectedItems.size !== 1 ? 's' : ''} and cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-red-600 hover:bg-red-500 text-white" onClick={handleBulkDelete}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
