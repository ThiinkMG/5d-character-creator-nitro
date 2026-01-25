'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Globe, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { World } from '@/types/world';

interface LinkWorldModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLink: (worldId: string) => void;
    worlds: World[];
    currentWorldId?: string;
    onCreateWorld?: () => void;
}

export function LinkWorldModal({
    isOpen,
    onClose,
    onLink,
    worlds,
    currentWorldId,
    onCreateWorld
}: LinkWorldModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(currentWorldId || null);

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSelectedId(currentWorldId || null);
        }
    }, [isOpen, currentWorldId]);

    const filteredWorlds = useMemo(() => {
        return worlds.filter(w =>
            w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.tone?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [worlds, searchQuery]);

    const handleLinkConfirm = () => {
        if (selectedId) {
            onLink(selectedId);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden glass-card border border-white/10 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0A0A0F]/95 backdrop-blur-sm z-10">
                    <div>
                        <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-400" />
                            Link to World
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select a world this character inhabits or originates from.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-[#0A0A0F]/50">
                    {/* Search */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search worlds..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500/50 outline-none text-sm transition-all"
                                autoFocus
                            />
                        </div>
                        {onCreateWorld && (
                            <Button onClick={onCreateWorld} variant="outline" className="glass h-10 px-3">
                                <Plus className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                        {filteredWorlds.length > 0 ? (
                            filteredWorlds.map(world => {
                                const isSelected = selectedId === world.id;
                                const isCurrent = world.id === currentWorldId;

                                return (
                                    <div
                                        key={world.id}
                                        onClick={() => setSelectedId(world.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all border",
                                            isSelected
                                                ? "bg-blue-500/10 border-blue-500/30"
                                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]",
                                        )}
                                    >
                                        {/* Radio / Check */}
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0",
                                            isSelected
                                                ? "bg-blue-500 border-blue-500"
                                                : "border-white/20 group-hover:border-blue-500/50"
                                        )}>
                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                <h4 className="text-sm font-medium text-white truncate">{world.name}</h4>
                                                {isCurrent && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {world.genre}{world.tone ? ` • ${world.tone}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No worlds found.</p>
                                {onCreateWorld && (
                                    <Button
                                        variant="ghost"
                                        className="mt-2 text-blue-400 hover:text-blue-300"
                                        onClick={onCreateWorld}
                                    >
                                        <Plus className="w-4 h-4 mr-1" /> Create a new world
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-[#0A0A0F]/95 backdrop-blur-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {currentWorldId && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onLink('');
                                    onClose();
                                }}
                                className="glass h-9 text-red-400 border-red-500/20 hover:bg-red-500/10"
                            >
                                Unlink
                            </Button>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {selectedId ? '1 world selected' : 'No world selected'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="glass h-9">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLinkConfirm}
                            disabled={!selectedId || selectedId === currentWorldId}
                            className="bg-blue-600 hover:bg-blue-500 text-white h-9"
                        >
                            {selectedId === currentWorldId ? 'Already Linked' : selectedId ? 'Change World' : 'Link World'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
