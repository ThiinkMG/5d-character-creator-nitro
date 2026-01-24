'use client';

import { Project } from '@/types/project';
import { cn } from '@/lib/utils';
import { Folder, Settings, Tag, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ProjectCardProps {
    project: Project;
    characterCount: number;
    worldCount: number;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
    onSettings?: (id: string) => void;
}

export function ProjectCard({ project, characterCount, worldCount, isSelected, onSelect, onSettings }: ProjectCardProps) {
    const progressPercent = project.progress;
    const encodedId = encodeURIComponent(project.id);
    const [isHovered, setIsHovered] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className={cn(
                "glass-card-interactive group relative rounded-2xl overflow-hidden shine border-cyan-500/10 hover:border-cyan-500/30",
                isSelected && "ring-2 ring-cyan-500/50 border-cyan-500/50"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Main Card Link Overlay */}
            <Link href={`/projects/${encodedId}`} className="absolute inset-0 z-0" aria-label={`View ${project.name}`} />

            {/* Background with Cyan Tint */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#0A0A0F]/90 to-[#0A0A0F] pointer-events-none" />
            <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <div className="w-full h-full bg-[linear-gradient(45deg,rgba(6,182,212,0.1),transparent_70%)]" />
            </div>

            {/* Selection Checkbox (hover or selected) */}
            {onSelect && (isHovered || isSelected) && (
                <div
                    className="absolute top-3 left-3 z-20 pointer-events-auto"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect(project.id);
                    }}
                >
                    <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all",
                        isSelected
                            ? "bg-cyan-500 border-cyan-500"
                            : "bg-white/10 border-white/30 hover:border-cyan-400"
                    )}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                </div>
            )}

            <div className="relative z-10 p-5 flex flex-col h-full pointer-events-none">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                        "px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-medium uppercase tracking-wide",
                        onSelect && (isHovered || isSelected) && "ml-8"
                    )}>
                        {project.genre}
                    </div>
                    {onSettings && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSettings(project.id);
                            }}
                            className="text-muted-foreground hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto p-1.5 rounded-lg hover:bg-white/5"
                            title="Project Settings"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Folder className="h-4 w-4 text-cyan-500" />
                        <h3 className="text-xl font-bold text-foreground group-hover:text-cyan-400 transition-colors">
                            {project.name}
                        </h3>
                    </div>

                    <div className="mb-4">
                        <p className={cn(
                            "text-sm text-muted-foreground leading-relaxed transition-all duration-300",
                            !isExpanded && "line-clamp-2"
                        )}>
                            {project.summary}
                        </p>

                        {project.summary && project.summary.length > 100 && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 mt-1 focus:outline-none pointer-events-auto"
                            >
                                {isExpanded ? '...less' : '...more'}
                            </button>
                        )}
                    </div>

                    {/* Tags Display */}
                    {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {project.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20"
                                >
                                    <Tag className="w-2.5 h-2.5" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Elements Preview */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="text-xs px-2 py-1 rounded-md bg-white/[0.03] text-muted-foreground border border-white/5">
                            {characterCount} Characters
                        </span>
                        <span className="text-xs px-2 py-1 rounded-md bg-white/[0.03] text-muted-foreground border border-white/5">
                            {worldCount} Worlds
                        </span>
                    </div>
                </div>

                {/* Footer / Progress */}
                <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                        <span>Overall Progress</span>
                        <span className="text-cyan-400 font-medium">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-600 to-teal-400 rounded-full transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}


