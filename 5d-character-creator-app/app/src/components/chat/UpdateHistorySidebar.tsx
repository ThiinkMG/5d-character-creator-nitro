'use client';

import React from 'react';
import { X, Clock, User, Globe, Folder, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AppliedUpdate } from '@/types/chat';

interface UpdateHistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    history: AppliedUpdate[];
}

export function UpdateHistorySidebar({ isOpen, onClose, history }: UpdateHistorySidebarProps) {
    // Sort history by newest first
    const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className={cn(
            "fixed inset-y-0 right-0 z-50 w-80 bg-black/95 border-l border-white/10 backdrop-blur-xl transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-white">Update History</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-white/10">
                    <X className="w-4 h-4 text-muted-foreground" />
                </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
                {sortedHistory.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                        <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>No updates applied in this session yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedHistory.map((update) => (
                            <div key={update.id} className="relative pl-4 border-l border-white/10 pb-2 last:pb-0">
                                {/* Timeline Dot */}
                                <div className={cn(
                                    "absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-black",
                                    update.type === 'character' ? "bg-violet-400" :
                                        update.type === 'world' ? "bg-blue-400" : "bg-orange-400"
                                )} />

                                {/* Header */}
                                <div className="flex items-start justify-between mb-1">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-0.5">
                                            <span>
                                                {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span>•</span>
                                            <span className="capitalize">{update.type}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-white">{update.targetName}</h4>
                                    </div>
                                    {update.type === 'character' && <User className="w-3.5 h-3.5 text-violet-400/50" />}
                                    {update.type === 'world' && <Globe className="w-3.5 h-3.5 text-blue-400/50" />}
                                    {update.type === 'project' && <Folder className="w-3.5 h-3.5 text-orange-400/50" />}
                                </div>

                                {/* Changes */}
                                <div className="mt-2 space-y-1.5">
                                    {Object.entries(update.changes).map(([field, diff], idx) => (
                                        <div key={idx} className="bg-white/5 rounded-md p-2 text-xs">
                                            <div className="text-white/60 mb-1 capitalize font-medium">{field.replace(/([A-Z])/g, ' $1').trim()}</div>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="truncate text-red-300/50 line-through max-w-[40%]">
                                                    {formatValue(diff.old)}
                                                </div>
                                                <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
                                                <div className="truncate text-emerald-300 max-w-[40%]">
                                                    {formatValue(diff.new)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(update.changes).length === 0 && (
                                        <div className="text-xs text-white/30 italic">
                                            Updated without specific field changes
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

function formatValue(val: any): string {
    if (val === undefined || val === null) return 'none';
    if (typeof val === 'object') {
        if (Array.isArray(val)) return `Array(${val.length})`;
        return 'Object';
    }
    return String(val);
}
