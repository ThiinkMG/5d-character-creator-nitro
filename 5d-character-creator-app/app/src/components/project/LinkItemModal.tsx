'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Character } from '@/types/character';
import { World } from '@/types/world';

interface LinkItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLink: (itemIds: string[]) => void;
    items: (Character | World)[]; // Candidates
    type: 'character' | 'world';
}

export function LinkItemModal({ isOpen, onClose, onLink, items, type }: LinkItemModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSelectedIds(new Set());
        }
    }, [isOpen]);

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item as any).genre?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [items, searchQuery]);

    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleLinkConfirm = () => {
        onLink(Array.from(selectedIds));
        onClose();
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
                            <LinkIcon className="w-5 h-5 text-cyan-400" />
                            Link Existing {type === 'character' ? 'Characters' : 'Worlds'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select items to add to this project.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-[#0A0A0F]/50">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${type}s...`}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-sm transition-all"
                            autoFocus
                        />
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                        {filteredItems.length > 0 ? (
                            filteredItems.map(item => {
                                const isSelected = selectedIds.has(item.id);
                                // Check if item is already assigned to a DIFFERENT project (optional context)
                                const assignedProjectId = (item as any).projectId;
                                const isAssigned = !!assignedProjectId;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleToggleSelect(item.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all border",
                                            isSelected
                                                ? "bg-cyan-500/10 border-cyan-500/30"
                                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]",
                                        )}
                                    >
                                        {/* Checkbox */}
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                            isSelected
                                                ? "bg-cyan-500 border-cyan-500"
                                                : "border-white/20 group-hover:border-cyan-500/50"
                                        )}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
                                                {isAssigned && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20" title="Already in a project">
                                                        Assigned
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{(item as any).genre}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No {type}s found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-[#0A0A0F]/95 backdrop-blur-sm flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="glass h-9">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLinkConfirm}
                            disabled={selectedIds.size === 0}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white h-9"
                        >
                            Link Selected
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
