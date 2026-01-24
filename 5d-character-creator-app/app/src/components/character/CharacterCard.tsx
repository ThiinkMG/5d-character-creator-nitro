'use client';

import { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CharacterCardProps {
    character: Character;
    onDelete?: (id: string) => void;
}

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
    const router = useRouter();
    // Calculate progress percentage for visual bar
    const progressPercent = character.progress;

    // Determine status color based on phase
    const getPhaseColor = (phase: string) => {
        switch (phase) {
            case 'Foundation': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Personality': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Backstory': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
            case 'Relationships': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
            case 'Arc': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            default: return 'bg-primary/20 text-primary border-primary/30';
        }
    };

    const encodedId = encodeURIComponent(character.id);

    return (
        <div
            onClick={() => router.push(`/characters/${encodedId}`)}
            className="glass-card-interactive group relative rounded-2xl overflow-hidden shine cursor-pointer"
            role="button"
            tabIndex={0}
        >
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#0A0A0F]/80 to-[#0A0A0F] pointer-events-none" />
            <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                {/* Placeholder pattern if no image */}
                <div className="w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_70%)]" />
            </div>

            {/* Main Card Link Overlay - Removed in favor of onClick */}

            <div className="relative z-10 p-5 flex flex-col h-full pointer-events-none">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide",
                        getPhaseColor(character.phase)
                    )}>
                        {character.phase}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-gradient-ember transition-all">
                        {character.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {character.role} • {character.genre}
                    </p>

                    {/* Attributes Preview */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {character.archetype && (
                            <span className="text-xs px-2 py-1 rounded-md bg-white/[0.03] text-muted-foreground border border-white/5">
                                {character.archetype}
                            </span>
                        )}
                        {character.coreConcept && (
                            <span className="text-xs px-2 py-1 rounded-md bg-white/[0.03] text-muted-foreground border border-white/5 line-clamp-1 max-w-[150px]">
                                {character.coreConcept}
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer / Progress */}
                <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                        <span>Development Data</span>
                        <span className="text-primary font-medium">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* Actions Hover */}
                    <div className="absolute bottom-5 right-5 flex gap-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto z-20">
                        <Link href={`/characters/${encodedId}`} onClick={(e) => e.stopPropagation()}>
                            <button className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
                                <Edit className="h-4 w-4" />
                            </button>
                        </Link>
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete(character.id);
                                }}
                                className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
