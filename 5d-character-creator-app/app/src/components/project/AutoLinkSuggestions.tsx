'use client';

import React, { useMemo, useState } from 'react';
import { Link2, Check, X, Sparkles, ChevronDown, ChevronUp, Globe, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { generateLinkSuggestions, getSuggestionsForEntity, LinkSuggestion } from '@/lib/auto-link-suggestions';
import { cn } from '@/lib/utils';

interface AutoLinkSuggestionsProps {
    /** Focus on suggestions for a specific entity */
    entityId?: string;
    entityType?: 'character' | 'world';
    /** Maximum suggestions to show */
    maxSuggestions?: number;
    /** Compact mode for sidebars */
    compact?: boolean;
    /** Called when a suggestion is accepted */
    onAccept?: (suggestion: LinkSuggestion) => void;
    className?: string;
}

export function AutoLinkSuggestions({
    entityId,
    entityType,
    maxSuggestions = 5,
    compact = false,
    onAccept,
    className
}: AutoLinkSuggestionsProps) {
    const {
        characters,
        worlds,
        projects,
        linkCharacterToWorld,
        addCharacterToProject,
        addWorldToProject
    } = useStore();

    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState(!compact);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Generate suggestions
    const allSuggestions = useMemo(() => {
        if (entityId && entityType) {
            return getSuggestionsForEntity(entityId, entityType, characters, worlds, projects);
        }
        return generateLinkSuggestions(characters, worlds, projects, {
            maxSuggestions: maxSuggestions * 2, // Get extra in case some are dismissed
            minConfidence: 0.25
        });
    }, [characters, worlds, projects, entityId, entityType, maxSuggestions]);

    // Filter out dismissed suggestions
    const suggestions = useMemo(() => {
        return allSuggestions
            .filter(s => !dismissedIds.has(s.id))
            .slice(0, maxSuggestions);
    }, [allSuggestions, dismissedIds, maxSuggestions]);

    const handleAccept = async (suggestion: LinkSuggestion) => {
        setProcessingId(suggestion.id);

        try {
            // Apply the link based on type
            if (suggestion.sourceType === 'character') {
                if (suggestion.targetType === 'world') {
                    linkCharacterToWorld(suggestion.sourceId, suggestion.targetId);
                } else if (suggestion.targetType === 'project') {
                    addCharacterToProject(suggestion.sourceId, suggestion.targetId);
                }
            } else if (suggestion.sourceType === 'world' && suggestion.targetType === 'project') {
                addWorldToProject(suggestion.sourceId, suggestion.targetId);
            }

            // Call the callback if provided
            onAccept?.(suggestion);

            // Remove from list
            setDismissedIds(prev => new Set([...prev, suggestion.id]));
        } finally {
            setProcessingId(null);
        }
    };

    const handleDismiss = (suggestionId: string) => {
        setDismissedIds(prev => new Set([...prev, suggestionId]));
    };

    const getTargetIcon = (type: 'world' | 'project') => {
        return type === 'world'
            ? <Globe className="w-3.5 h-3.5 text-blue-400" />
            : <BookOpen className="w-3.5 h-3.5 text-orange-400" />;
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.7) return 'text-emerald-400';
        if (confidence >= 0.5) return 'text-amber-400';
        return 'text-muted-foreground';
    };

    if (suggestions.length === 0) {
        return null;
    }

    if (compact) {
        return (
            <div className={cn("rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden", className)}>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                >
                    <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="font-medium text-white">Link Suggestions</span>
                        <span className="text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">
                            {suggestions.length}
                        </span>
                    </div>
                    {expanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                </button>

                {expanded && (
                    <div className="border-t border-white/10">
                        {suggestions.map(suggestion => (
                            <div
                                key={suggestion.id}
                                className="flex items-center gap-2 p-2 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <span className="text-emerald-400 truncate">{suggestion.sourceName}</span>
                                        <Link2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                        {getTargetIcon(suggestion.targetType)}
                                        <span className="truncate">{suggestion.targetName}</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                        {suggestion.reason}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className={cn("text-[10px]", getConfidenceColor(suggestion.confidence))}>
                                        {Math.round(suggestion.confidence * 100)}%
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleAccept(suggestion)}
                                        disabled={processingId === suggestion.id}
                                        className="h-6 w-6 hover:bg-emerald-500/20"
                                    >
                                        <Check className="w-3 h-3 text-emerald-400" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDismiss(suggestion.id)}
                                        className="h-6 w-6 hover:bg-red-500/20"
                                    >
                                        <X className="w-3 h-3 text-red-400" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Full version
    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h4 className="text-sm font-medium text-white">Suggested Links</h4>
                <span className="text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">
                    {suggestions.length} found
                </span>
            </div>

            <div className="space-y-2">
                {suggestions.map(suggestion => (
                    <div
                        key={suggestion.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-emerald-400 font-medium">
                                    {suggestion.sourceName}
                                </span>
                                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                                {getTargetIcon(suggestion.targetType)}
                                <span className="text-white">
                                    {suggestion.targetName}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                    {suggestion.reason}
                                </span>
                                <span className={cn(
                                    "text-xs font-medium",
                                    getConfidenceColor(suggestion.confidence)
                                )}>
                                    {Math.round(suggestion.confidence * 100)}% match
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAccept(suggestion)}
                                disabled={processingId === suggestion.id}
                                className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                            >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Accept
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(suggestion.id)}
                                className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Dismiss
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {allSuggestions.length > maxSuggestions && (
                <p className="text-xs text-muted-foreground text-center">
                    Showing top {maxSuggestions} of {allSuggestions.length} suggestions
                </p>
            )}
        </div>
    );
}
