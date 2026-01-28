'use client';

import React, { useState } from 'react';
import { ChatSession } from '@/types/chat';
import { Character } from '@/types/character';
import { World } from '@/types/world';
import { cn } from '@/lib/utils';
import {
    Clock,
    ArrowRight,
    Check,
    GitBranch,
    User,
    Globe,
    Sparkles,
    ChevronDown,
    ExternalLink,
    FileText,
    Copy
} from 'lucide-react';

interface NarrativeSessionCardProps {
    session: ChatSession;
    characters: Character[];
    worlds: World[];
    isSelected: boolean;
    onSelect: (id: string) => void;
    onClick: (id: string) => void;
}

/**
 * NarrativeSessionCard: A creative-journal style session card
 * Features: AI summary prose, entity thumbnails, color-coded borders, hover expansion
 */
export function NarrativeSessionCard({
    session,
    characters,
    worlds,
    isSelected,
    onSelect,
    onClick
}: NarrativeSessionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Resolve linked entity
    const linkedEntity = session.relatedId ? (
        characters.find(c => c.id === session.relatedId) ||
        worlds.find(w => w.id === session.relatedId)
    ) : null;

    const entityType = linkedEntity
        ? (characters.find(c => c.id === session.relatedId) ? 'character' : 'world')
        : null;

    // Color coding based on session mode
    const accentColors: Record<string, string> = {
        character: 'border-l-violet-500',
        world: 'border-l-blue-500',
        chat: 'border-l-emerald-500',
        project: 'border-l-amber-500',
        lore: 'border-l-rose-500',
        scene: 'border-l-cyan-500',
        script: 'border-l-purple-500',
        workshop: 'border-l-orange-500',
        chat_with: 'border-l-emerald-500',
    };

    // Contextual timestamp
    const formatContextualTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        let timeStr = '';
        if (hours < 1) timeStr = 'Just now';
        else if (hours < 24) timeStr = `${hours}h ago`;
        else if (days === 1) timeStr = 'Yesterday';
        else if (days < 7) timeStr = `${days} days ago`;
        else timeStr = new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        // Add context if available
        if (session.lastModifiedSection) {
            return `${timeStr} — Last edited ${session.lastModifiedSection}`;
        }
        return timeStr;
    };

    // Generate contextual CTA
    const getContextualCTA = () => {
        if (linkedEntity && 'name' in linkedEntity) {
            if (entityType === 'character') {
                return `Continue developing ${linkedEntity.name}`;
            } else {
                return `Expand ${linkedEntity.name} lore`;
            }
        }
        return 'Continue session';
    };

    return (
        <div
            className={cn(
                "group relative rounded-2xl transition-all duration-300 overflow-hidden",
                "bg-zinc-900/40 hover:bg-zinc-900/60 backdrop-blur-sm",
                "border-l-4",
                accentColors[session.mode] || 'border-l-zinc-600',
                "border border-white/5 hover:border-white/10",
                isSelected && "ring-1 ring-primary/30",
                isExpanded ? "h-auto" : "h-[220px]"
            )}
        >
            {/* Selection Checkbox */}
            <div
                onClick={(e) => { e.stopPropagation(); onSelect(session.id); }}
                className={cn(
                    "absolute top-3 right-3 z-20 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                    isSelected
                        ? "bg-primary border-primary"
                        : "border-white/30 opacity-0 group-hover:opacity-100 hover:border-primary"
                )}
            >
                {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>

            <div className="p-5 flex flex-col h-full">
                {/* Header with Entity Thumbnail */}
                <div className="flex items-start gap-3 mb-3">
                    {/* Entity Thumbnail */}
                    {linkedEntity && 'imageUrl' in linkedEntity && linkedEntity.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                            <img
                                src={linkedEntity.imageUrl}
                                alt={'name' in linkedEntity ? linkedEntity.name : ''}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-1 right-1">
                                {entityType === 'character' ? (
                                    <User className="w-3 h-3 text-violet-400" />
                                ) : (
                                    <Globe className="w-3 h-3 text-blue-400" />
                                )}
                            </div>
                        </div>
                    ) : linkedEntity ? (
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                            entityType === 'character'
                                ? "bg-violet-500/20 text-violet-400"
                                : "bg-blue-500/20 text-blue-400"
                        )}>
                            {entityType === 'character' ? <User className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                        </div>
                    ) : null}

                    <div className="flex-1 min-w-0">
                        {/* Branch indicator */}
                        {session.branchParentId && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-400/80 mb-1">
                                <GitBranch className="w-3 h-3" />
                                <span>Branched session</span>
                            </div>
                        )}

                        {/* Title */}
                        <h3
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClick(session.id);
                            }}
                            className="font-semibold text-base text-white/90 line-clamp-1 hover:text-primary transition-colors cursor-pointer"
                        >
                            {session.title || 'Untitled Session'}
                        </h3>

                        {/* Linked Entity Name */}
                        {linkedEntity && 'name' in linkedEntity && (
                            <p className="text-xs text-white/40 truncate">
                                Working on: <span className="text-white/60">{linkedEntity.name}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* AI Summary or Last Message */}
                <div className="flex-1 min-h-0 mb-3 overflow-hidden">
                    <p className={cn(
                        "text-sm leading-relaxed",
                        session.aiSummary ? "text-white/60 italic" : "text-muted-foreground",
                        isExpanded ? "" : "line-clamp-3"
                    )}>
                        {session.aiSummary || session.lastMessage}
                    </p>
                </div>

                {/* AI Tags */}
                {(session.aiTags || session.tags) && (session.aiTags?.length || session.tags?.length) ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {(session.aiTags || session.tags || []).slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className="text-[10px] text-white/40 hover:text-primary/80 cursor-pointer transition-colors"
                            >
                                #{tag.replace(/\s+/g, '-').toLowerCase()}
                            </span>
                        ))}
                    </div>
                ) : null}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5 group-hover:border-white/10 transition-colors">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatContextualTime(session.updatedAt)}
                    </span>

                    <button
                        onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            onClick(session.id); 
                        }}
                        className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10 relative"
                        type="button"
                    >
                        {getContextualCTA()}
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Expand Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className={cn(
                        "absolute bottom-0 left-0 right-0 h-8 flex items-center justify-center",
                        "bg-gradient-to-t from-zinc-900/80 to-transparent",
                        "opacity-0 group-hover:opacity-100 transition-opacity"
                    )}
                >
                    <ChevronDown className={cn(
                        "w-4 h-4 text-white/40 transition-transform",
                        isExpanded && "rotate-180"
                    )} />
                </button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2">
                    {/* Full Summary */}
                    {session.aiSummary && (
                        <div>
                            <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">Session Summary</h4>
                            <p className="text-sm text-white/70 leading-relaxed">{session.aiSummary}</p>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                onClick(session.id); 
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors cursor-pointer z-10 relative"
                            type="button"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Continue from here
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-colors">
                            <GitBranch className="w-3.5 h-3.5" />
                            Create branch
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-colors">
                            <FileText className="w-3.5 h-3.5" />
                            Export notes
                        </button>
                    </div>
                </div>
            )}

            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
}

export default NarrativeSessionCard;
