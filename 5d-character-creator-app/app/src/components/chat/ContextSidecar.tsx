'use client';

/**
 * ContextSidecar Component
 *
 * Phase 1 Week 3: Context Sidecar System
 *
 * Sidebar panel displaying pinned and auto-detected entities.
 * - Right side of chat interface (300px width on desktop, full-screen overlay on mobile)
 * - Collapsible with toggle button
 * - Two sections: "Pinned" and "Detected in Text"
 * - Shows EntityContextCard for each entity
 * - Empty states for guidance
 * - Smooth animations (slide in/out)
 * - Glassmorphism aesthetic
 * - Keyboard shortcut: Ctrl+Shift+C
 */

import React, { useCallback } from 'react';
import { PanelRightClose, PanelRightOpen, Pin, Sparkles, X, Trash2, AtSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EntityContextCard } from './EntityContextCard';
import { useContextSidecar, type EntityWithType } from '@/hooks/useContextSidecar';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

interface ContextSidecarProps {
    /** Current chat text content for entity detection */
    text: string;
    /** Whether the sidecar is open */
    isOpen: boolean;
    /** Callback to toggle sidecar */
    onToggle: () => void;
    /** Optional toast callback for notifications */
    onToast?: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export function ContextSidecar({
    text,
    isOpen,
    onToggle,
    onToast
}: ContextSidecarProps) {
    const { characters, worlds, projects } = useStore();

    // Callbacks for pin/unpin notifications
    const handlePin = useCallback((entity: EntityWithType) => {
        if (onToast) {
            onToast(`Pinned "${entity.name}" to context`, 'success');
        }
    }, [onToast]);

    const handleUnpin = useCallback((entity: EntityWithType) => {
        if (onToast) {
            onToast(`Unpinned "${entity.name}" from context`, 'info');
        }
    }, [onToast]);

    const {
        pinnedEntities,
        autoDetectedEntities,
        pinEntity,
        unpinEntity,
        togglePin,
        clearAllPinned,
        isPinned,
        totalContextEntities,
        hasContextEntities,
        isHydrated
    } = useContextSidecar({
        text,
        maxAutoDetected: 5,
        minWordLength: 2,
        onPin: handlePin,
        onUnpin: handleUnpin,
        debounceMs: 300
    });

    // Get full entity data for auto-detected entities
    const autoDetectedWithData = autoDetectedEntities.map(detected => {
        if (detected.type === 'character') {
            const entity = characters.find(c => c.id === detected.id);
            return entity ? { ...detected, entity } : null;
        } else if (detected.type === 'world') {
            const entity = worlds.find(w => w.id === detected.id);
            return entity ? { ...detected, entity } : null;
        } else {
            const entity = projects.find(p => p.id === detected.id);
            return entity ? { ...detected, entity } : null;
        }
    }).filter(Boolean) as Array<typeof autoDetectedEntities[0] & { entity: any }>;

    return (
        <>
            {/* Toggle Button - Only show when sidecar is closed (to open it) */}
            {!isOpen && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onToggle}
                    className={cn(
                        "fixed z-40 h-8 gap-2",
                        "bg-[#0A0A0F]/95 border border-white/10 backdrop-blur-xl",
                        "hover:bg-[#0A0A0F] hover:border-white/20",
                        "text-white/70 hover:text-white",
                        "transition-all duration-300 ease-in-out",
                        // Desktop positioning
                        "md:right-4 md:top-20",
                        // Mobile positioning (bottom right)
                        "right-4 bottom-24 md:bottom-auto md:top-20",
                        // Badge for entity count when closed
                        hasContextEntities && "pr-2"
                    )}
                    title="Open Context Sidecar (Ctrl+Shift+C)"
                >
                    <PanelRightOpen className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">Context</span>
                    {hasContextEntities && (
                        <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full font-medium">
                            {totalContextEntities}
                        </span>
                    )}
                </Button>
            )}

            {/* Sidecar Panel - Desktop: part of flex layout (always in DOM for smooth transitions) */}
            <aside
                className={cn(
                    "hidden md:flex shrink-0",
                    "bg-[#0A0A0F]/95 backdrop-blur-xl",
                    "overflow-hidden flex-col h-full",
                    "transition-all duration-300 ease-in-out",
                    isOpen ? "w-[300px] opacity-100 border-l border-white/10" : "w-0 opacity-0 border-l-0",
                    // Ensure flush to right edge - no margin
                    "mr-0"
                )}
                style={{ 
                    minWidth: isOpen ? '300px' : '0',
                    maxWidth: isOpen ? '300px' : '0',
                    marginRight: 0,
                    pointerEvents: isOpen ? 'auto' : 'none'
                }}
            >
                {isOpen && renderSidecarContent()}
            </aside>

            {/* Mobile: Fixed bottom sheet overlay */}
            {isOpen && (
                <aside
                    className={cn(
                        "md:hidden fixed z-30 right-0",
                        "bg-[#0A0A0F]/95 border-l border-white/10 backdrop-blur-xl",
                        "transition-transform duration-300 ease-in-out",
                        "overflow-hidden flex flex-col",
                        "inset-x-0 bottom-0 top-auto",
                        "rounded-t-2xl",
                        "max-h-[70vh]",
                        isOpen ? "translate-y-0" : "translate-y-full"
                    )}
                >
                    {renderSidecarContent()}
                </aside>
            )}

            {/* Backdrop (mobile only) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={onToggle}
                />
            )}
        </>
    );

    function renderSidecarContent() {
        return (
            <>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-white">Context</h3>
                        {hasContextEntities && (
                            <span className="px-1.5 py-0.5 bg-white/5 text-white/60 text-[10px] rounded">
                                {totalContextEntities} {totalContextEntities === 1 ? 'entity' : 'entities'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {pinnedEntities.length > 0 && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={clearAllPinned}
                                className="h-6 px-2 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                                title="Clear all pinned"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onToggle}
                            className="h-6 gap-1.5 px-2 text-white/50 hover:text-white hover:bg-white/10"
                            title="Close Context Sidecar (Ctrl+Shift+C)"
                        >
                            <PanelRightClose className="w-4 h-4" />
                            <span className="text-xs hidden sm:inline">Close</span>
                        </Button>
                    </div>
                </div>

                {/* Drag handle for mobile */}
                <div className="md:hidden flex justify-center py-2 shrink-0">
                    <div className="w-12 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Pinned Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Pin className="w-3.5 h-3.5 text-amber-400" />
                            <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                                Pinned ({pinnedEntities.length})
                            </h4>
                        </div>

                        {pinnedEntities.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-center">
                                <Pin className="w-6 h-6 text-white/20 mx-auto mb-2" />
                                <p className="text-xs text-white/40">
                                    Pin entities to keep them visible
                                </p>
                                <p className="text-[10px] text-white/30 mt-1">
                                    Click the pin icon on any entity card
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pinnedEntities.map(({ entity, type }) => (
                                    <EntityContextCard
                                        key={entity.id}
                                        entity={entity}
                                        type={type}
                                        isPinned={true}
                                        onPin={() => pinEntity(entity.id, type)}
                                        onUnpin={() => unpinEntity(entity.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Detected in Text Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <AtSign className="w-3.5 h-3.5 text-primary" />
                            <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                                Detected in Text ({autoDetectedWithData.length})
                            </h4>
                        </div>

                        {autoDetectedWithData.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-center">
                                <Sparkles className="w-6 h-6 text-white/20 mx-auto mb-2" />
                                <p className="text-xs text-white/40">
                                    No entities detected in text
                                </p>
                                <p className="text-[10px] text-white/30 mt-1">
                                    Type entity names or use @ mentions
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {autoDetectedWithData.map(({ entity, type, matchedText, isMention }) => (
                                    <div key={entity.id} className="relative">
                                        {isMention && (
                                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-full" />
                                        )}
                                        <EntityContextCard
                                            entity={entity}
                                            type={type}
                                            isPinned={isPinned(entity.id)}
                                            onPin={() => pinEntity(entity.id, type)}
                                            onUnpin={() => unpinEntity(entity.id)}
                                            matchedText={matchedText}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Help Text */}
                    <div className="pt-2 border-t border-white/5">
                        <div className="text-[10px] text-white/30 space-y-1">
                            <p className="flex items-center gap-1.5">
                                <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">Ctrl+Shift+C</span>
                                <span>Toggle sidecar</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                                <AtSign className="w-3 h-3" />
                                <span>@ mention for priority detection</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                                <Pin className="w-3 h-3" />
                                <span>Pin to keep entity visible</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="px-4 py-2 border-t border-white/10 bg-white/5 shrink-0">
                    <div className="flex items-center justify-between text-[10px] text-white/40">
                        <span>{pinnedEntities.length} pinned</span>
                        <span>{autoDetectedWithData.length} detected</span>
                        <span>{pinnedEntities.length + autoDetectedWithData.length} total</span>
                    </div>
                </div>
            </>
        );
    }
}
