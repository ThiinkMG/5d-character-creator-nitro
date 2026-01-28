'use client';

import { World } from '@/types/world';
import { cn } from '@/lib/utils';
import { Globe, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WorldCardProps {
    world: World;
    onDelete?: (id: string) => void;
}

export function WorldCard({ world, onDelete }: WorldCardProps) {
    const router = useRouter();
    const progressPercent = world.progress;
    const encodedId = encodeURIComponent(world.id);

    return (
        <div
            onClick={() => router.push(`/worlds/${encodedId}`)}
            className="glass-card-interactive group relative rounded-2xl overflow-hidden shine border-violet-500/10 hover:border-violet-500/30 cursor-pointer"
            role="button"
            tabIndex={0}
        >
            {/* Background with Violet Tint */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#0A0A0F]/90 to-[#0A0A0F] pointer-events-none" />
            <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(139,92,246,0.15),transparent_70%)]" />
            </div>

            {/* Main Card Link Overlay - Removed in favor of onClick */}

            <div className="relative z-10 p-5 flex flex-col h-full pointer-events-none">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] font-medium uppercase tracking-wide">
                        {world.genre}
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
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4 text-violet-500" />
                        <h3 className="text-xl font-bold text-foreground group-hover:text-violet-400 transition-colors">
                            {world.name}
                        </h3>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                        {world.description}
                    </p>

                    {/* Elements Preview */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {world.tone && (
                            <span className="text-xs px-2 py-1 rounded-md bg-white/[0.03] text-muted-foreground border border-white/5">
                                {world.tone}
                            </span>
                        )}
                        <span className="text-xs px-2 py-1 rounded-md bg-white/[0.03] text-muted-foreground border border-white/5">
                            {world.societies?.length || 0} Factions
                        </span>
                    </div>
                </div>

                {/* Footer / Progress */}
                <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                        <span>Worldbuilding</span>
                        <span className="text-violet-400 font-medium">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-400 rounded-full transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* Actions Hover */}
                    <div className="absolute bottom-5 right-5 flex gap-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto z-20">
                        <Link href={`/worlds/${encodedId}`} onClick={(e) => e.stopPropagation()}>
                            <button className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20">
                                <Edit className="h-4 w-4" />
                            </button>
                        </Link>
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete(world.id);
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
