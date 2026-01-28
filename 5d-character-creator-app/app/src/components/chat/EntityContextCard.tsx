'use client';

/**
 * EntityContextCard Component
 *
 * Phase 1 Week 3: Context Sidecar System
 *
 * Compact card displaying entity key information in the context sidecar.
 * - Character: name, role, phase, core concept, progress, quick facts
 * - World: name, genre, key locations (first 3), factions
 * - Project: name, genre, linked characters count, summary
 * - Pin/unpin button with visual feedback
 * - Expandable details section
 * - Click to navigate to full detail page
 * - Glassmorphism aesthetic matching existing app style
 */

import React, { useState } from 'react';
import { Users, Globe, Folder, Pin, ChevronRight, ChevronDown, Sparkles, BookOpen, Target, Heart, Swords, MapPin, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import type { Character } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface EntityContextCardProps {
    entity: Character | World | Project;
    type: 'character' | 'world' | 'project';
    isPinned: boolean;
    onPin: () => void;
    onUnpin: () => void;
    matchedText?: string; // The text that matched (for auto-detected entities)
    compact?: boolean; // Compact mode for smaller display
}

export function EntityContextCard({
    entity,
    type,
    isPinned,
    onPin,
    onUnpin,
    matchedText,
    compact = false
}: EntityContextCardProps) {
    const router = useRouter();
    const { characters, worlds } = useStore();
    const [isExpanded, setIsExpanded] = useState(false);

    // Type-specific styling
    const typeConfig = {
        character: {
            icon: Users,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/20',
            hoverBg: 'hover:bg-cyan-500/20',
            gradientFrom: 'from-cyan-500/20',
            gradientTo: 'to-cyan-500/5'
        },
        world: {
            icon: Globe,
            color: 'text-fuchsia-400',
            bgColor: 'bg-fuchsia-500/10',
            borderColor: 'border-fuchsia-500/20',
            hoverBg: 'hover:bg-fuchsia-500/20',
            gradientFrom: 'from-fuchsia-500/20',
            gradientTo: 'to-fuchsia-500/5'
        },
        project: {
            icon: Folder,
            color: 'text-violet-400',
            bgColor: 'bg-violet-500/10',
            borderColor: 'border-violet-500/20',
            hoverBg: 'hover:bg-violet-500/20',
            gradientFrom: 'from-violet-500/20',
            gradientTo: 'to-violet-500/5'
        }
    }[type];

    const TypeIcon = typeConfig.icon;

    // Extract entity-specific info
    const entityInfo = React.useMemo(() => {
        if (type === 'character') {
            const char = entity as Character;
            return {
                primary: char.role || 'No role set',
                secondary: `${char.phase} Phase`,
                detail: char.coreConcept || 'No core concept yet',
                progress: char.progress || 0,
                expandedInfo: {
                    motivations: char.motivations?.slice(0, 2) || [],
                    flaws: char.flaws?.slice(0, 2) || [],
                    archetype: char.archetype,
                    allies: char.allies?.slice(0, 2) || [],
                    enemies: char.enemies?.slice(0, 2) || [],
                    arcType: char.arcType
                }
            };
        } else if (type === 'world') {
            const world = entity as World;
            const locations = world.locations?.slice(0, 3) || [];
            const factions = world.factions?.slice(0, 2) || [];
            return {
                primary: world.genre || 'No genre set',
                secondary: world.tone || 'No tone set',
                detail: world.description || 'No description yet',
                progress: world.progress || 0,
                expandedInfo: {
                    locations: locations.map(l => l.name),
                    factions: factions.map(f => f.name),
                    rules: world.rules?.slice(0, 2) || [],
                    magicSystem: world.magicSystem,
                    societies: world.societies?.slice(0, 2) || []
                }
            };
        } else {
            const project = entity as Project;
            const linkedChars = characters.filter(c => c.projectId === project.id);
            const linkedWorlds = worlds.filter(w => w.projectId === project.id);
            return {
                primary: project.genre || 'No genre set',
                secondary: `${linkedChars.length} characters, ${linkedWorlds.length} worlds`,
                detail: project.summary || 'No summary yet',
                progress: project.progress || 0,
                expandedInfo: {
                    characterNames: linkedChars.slice(0, 3).map(c => c.name),
                    worldNames: linkedWorlds.slice(0, 2).map(w => w.name),
                    tags: project.tags?.slice(0, 4) || [],
                    timeline: project.timeline?.slice(0, 2) || []
                }
            };
        }
    }, [entity, type, characters, worlds]);

    // Navigate to entity detail page
    const handleCardClick = () => {
        if (type === 'character') {
            router.push(`/characters/${entity.id}`);
        } else if (type === 'world') {
            router.push(`/worlds/${entity.id}`);
        } else {
            router.push(`/projects/${entity.id}`);
        }
    };

    // Handle pin action with visual feedback
    const handlePinClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        isPinned ? onUnpin() : onPin();
    };

    // Render expanded content based on entity type
    const renderExpandedContent = () => {
        if (type === 'character') {
            const info = entityInfo.expandedInfo as {
                motivations: string[];
                flaws: string[];
                archetype?: string;
                allies: string[];
                enemies: string[];
                arcType?: string;
            };
            return (
                <div className="space-y-2 text-xs">
                    {info.archetype && (
                        <div className="flex items-start gap-2">
                            <BookOpen className="w-3 h-3 text-cyan-400/60 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-white/50">Archetype:</span>
                                <span className="text-white/70 ml-1">{info.archetype}</span>
                            </div>
                        </div>
                    )}
                    {info.motivations.length > 0 && (
                        <div className="flex items-start gap-2">
                            <Target className="w-3 h-3 text-green-400/60 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-white/50">Wants:</span>
                                <span className="text-white/70 ml-1">{info.motivations.join(', ')}</span>
                            </div>
                        </div>
                    )}
                    {info.flaws.length > 0 && (
                        <div className="flex items-start gap-2">
                            <Heart className="w-3 h-3 text-red-400/60 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-white/50">Flaws:</span>
                                <span className="text-white/70 ml-1">{info.flaws.join(', ')}</span>
                            </div>
                        </div>
                    )}
                    {(info.allies.length > 0 || info.enemies.length > 0) && (
                        <div className="flex items-start gap-2">
                            <Swords className="w-3 h-3 text-amber-400/60 mt-0.5 shrink-0" />
                            <div className="flex flex-wrap gap-1">
                                {info.allies.map((ally, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-green-500/10 text-green-400/80 rounded text-[10px]">
                                        {ally}
                                    </span>
                                ))}
                                {info.enemies.map((enemy, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-red-500/10 text-red-400/80 rounded text-[10px]">
                                        {enemy}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        } else if (type === 'world') {
            const info = entityInfo.expandedInfo as {
                locations: string[];
                factions: string[];
                rules: string[];
                magicSystem?: string;
                societies: string[];
            };
            return (
                <div className="space-y-2 text-xs">
                    {info.locations.length > 0 && (
                        <div className="flex items-start gap-2">
                            <MapPin className="w-3 h-3 text-fuchsia-400/60 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-white/50">Locations:</span>
                                <span className="text-white/70 ml-1">{info.locations.join(', ')}</span>
                            </div>
                        </div>
                    )}
                    {info.factions.length > 0 && (
                        <div className="flex items-start gap-2">
                            <Building2 className="w-3 h-3 text-amber-400/60 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-white/50">Factions:</span>
                                <span className="text-white/70 ml-1">{info.factions.join(', ')}</span>
                            </div>
                        </div>
                    )}
                    {info.magicSystem && (
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-3 h-3 text-violet-400/60 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-white/50">Magic:</span>
                                <span className="text-white/70 ml-1 line-clamp-1">{info.magicSystem}</span>
                            </div>
                        </div>
                    )}
                    {info.rules.length > 0 && (
                        <div className="flex items-start gap-2">
                            <BookOpen className="w-3 h-3 text-cyan-400/60 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-white/50">Rules:</span>
                                <span className="text-white/70 ml-1">{info.rules.join(', ')}</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        } else {
            const info = entityInfo.expandedInfo as {
                characterNames: string[];
                worldNames: string[];
                tags: string[];
                timeline: { title: string }[];
            };
            return (
                <div className="space-y-2 text-xs">
                    {info.characterNames.length > 0 && (
                        <div className="flex items-start gap-2">
                            <Users className="w-3 h-3 text-cyan-400/60 mt-0.5 shrink-0" />
                            <div className="flex flex-wrap gap-1">
                                {info.characterNames.map((name, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400/80 rounded text-[10px]">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {info.worldNames.length > 0 && (
                        <div className="flex items-start gap-2">
                            <Globe className="w-3 h-3 text-fuchsia-400/60 mt-0.5 shrink-0" />
                            <div className="flex flex-wrap gap-1">
                                {info.worldNames.map((name, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400/80 rounded text-[10px]">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {info.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {info.tags.map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-white/5 text-white/50 rounded text-[10px]">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
    };

    // Check if there's content to expand
    const hasExpandedContent = React.useMemo(() => {
        if (type === 'character') {
            const info = entityInfo.expandedInfo as any;
            return info.archetype || info.motivations.length > 0 || info.flaws.length > 0 ||
                   info.allies.length > 0 || info.enemies.length > 0;
        } else if (type === 'world') {
            const info = entityInfo.expandedInfo as any;
            return info.locations.length > 0 || info.factions.length > 0 ||
                   info.magicSystem || info.rules.length > 0;
        } else {
            const info = entityInfo.expandedInfo as any;
            return info.characterNames.length > 0 || info.worldNames.length > 0 || info.tags.length > 0;
        }
    }, [entityInfo, type]);

    return (
        <div
            className={cn(
                "group relative rounded-lg border backdrop-blur-xl transition-all duration-200",
                "bg-[#0A0A0F]/95 border-white/10",
                "hover:border-white/20 hover:shadow-lg",
                isPinned && `border-l-2 ${type === 'character' ? 'border-l-cyan-400' : type === 'world' ? 'border-l-fuchsia-400' : 'border-l-violet-400'}`
            )}
        >
            {/* Subtle gradient overlay for pinned items */}
            {isPinned && (
                <div className={cn(
                    "absolute inset-0 rounded-lg opacity-30 pointer-events-none",
                    `bg-gradient-to-r ${typeConfig.gradientFrom} ${typeConfig.gradientTo}`
                )} />
            )}

            {/* Header */}
            <div className="relative flex items-start gap-2 p-3 pb-2">
                {/* Icon with avatar fallback */}
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded shrink-0 overflow-hidden",
                    typeConfig.bgColor
                )}>
                    {(entity as any).imageUrl ? (
                        <img
                            src={(entity as any).imageUrl}
                            alt={entity.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <TypeIcon className={cn("w-4 h-4", typeConfig.color)} />
                    )}
                </div>

                {/* Name & Type */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">
                            {entity.name}
                        </h4>
                        {matchedText && matchedText.toLowerCase() !== entity.name.toLowerCase() && (
                            <span className="text-[10px] text-white/40 italic shrink-0">
                                via "{matchedText}"
                            </span>
                        )}
                    </div>
                    <p className={cn("text-[10px] uppercase tracking-wider font-medium", typeConfig.color)}>
                        {type}
                    </p>
                </div>

                {/* Pin/Unpin Button */}
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePinClick}
                    className={cn(
                        "h-6 w-6 p-0 shrink-0 transition-all duration-200",
                        isPinned
                            ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 scale-110"
                            : "text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100"
                    )}
                    title={isPinned ? "Unpin from context" : "Pin to context"}
                >
                    <Pin className={cn("w-3.5 h-3.5 transition-transform", isPinned && "fill-current rotate-45")} />
                </Button>
            </div>

            {/* Content */}
            <div className="relative px-3 pb-2 space-y-1.5">
                {/* Primary Info */}
                <div className="flex items-center gap-2 text-xs text-white/70">
                    <Sparkles className="w-3 h-3 text-white/40 shrink-0" />
                    <span className="truncate">{entityInfo.primary}</span>
                </div>

                {/* Secondary Info */}
                <div className="text-xs text-white/50">
                    {entityInfo.secondary}
                </div>

                {/* Progress Bar */}
                {entityInfo.progress > 0 && (
                    <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-white/40">Progress</span>
                            <span className="text-[10px] text-white/60">{entityInfo.progress}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-500 rounded-full",
                                    type === 'character' ? 'bg-gradient-to-r from-cyan-400 to-cyan-500' :
                                    type === 'world' ? 'bg-gradient-to-r from-fuchsia-400 to-fuchsia-500' :
                                    'bg-gradient-to-r from-violet-400 to-violet-500'
                                )}
                                style={{ width: `${entityInfo.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Detail Text (truncated) */}
                {!compact && (
                    <p className="text-xs text-white/40 line-clamp-2 mt-1">
                        {entityInfo.detail}
                    </p>
                )}

                {/* Expandable Content */}
                {hasExpandedContent && !compact && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                        >
                            <span>{isExpanded ? 'Less details' : 'More details'}</span>
                            {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                                {renderExpandedContent()}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* View Details footer */}
            <button
                onClick={handleCardClick}
                className={cn(
                    "relative w-full flex items-center justify-center gap-1 px-3 py-2 border-t border-white/5",
                    "text-xs text-white/50 hover:text-white transition-all",
                    `hover:${typeConfig.bgColor}`
                )}
            >
                <span>View Full Profile</span>
                <ChevronRight className="w-3 h-3" />
            </button>
        </div>
    );
}
