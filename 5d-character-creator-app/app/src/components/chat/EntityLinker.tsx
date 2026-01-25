'use client';

import React, { useState, useMemo } from 'react';
import { User, Globe, Folder, Search, Check, Link2, Unlink } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fuzzyMatchByName } from '@/lib/fuzzy-match';

interface EntityLinkerProps {
    linkedEntity: { type: 'character' | 'world' | 'project'; id: string; name: string } | null;
    onLink: (entity: { type: 'character' | 'world' | 'project'; id: string; name: string } | null) => void;
    characters: Array<{ id: string; name: string }>;
    worlds: Array<{ id: string; name: string }>;
    projects: Array<{ id: string; name: string }>;
}

export function EntityLinker({
    linkedEntity,
    onLink,
    characters,
    worlds,
    projects
}: EntityLinkerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Fuzzy match results
    const characterResults = useMemo(() => {
        if (!searchQuery.trim()) return characters;
        return fuzzyMatchByName(characters, searchQuery, { maxResults: 10 })
            .map(r => r.item);
    }, [characters, searchQuery]);
    
    const worldResults = useMemo(() => {
        if (!searchQuery.trim()) return worlds;
        return fuzzyMatchByName(worlds, searchQuery, { maxResults: 10 })
            .map(r => r.item);
    }, [worlds, searchQuery]);
    
    const projectResults = useMemo(() => {
        if (!searchQuery.trim()) return projects;
        return fuzzyMatchByName(projects, searchQuery, { maxResults: 10 })
            .map(r => r.item);
    }, [projects, searchQuery]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "gap-2 text-xs",
                        linkedEntity
                            ? "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {linkedEntity ? (
                        <>
                            <Link2 className="h-3.5 w-3.5" />
                            <span className="hidden md:inline max-w-[100px] truncate">{linkedEntity.name}</span>
                            <span className="hidden md:inline text-[10px] opacity-60">
                                ({linkedEntity.type === 'character' ? '👤' : linkedEntity.type === 'world' ? '🌍' : '📁'})
                            </span>
                        </>
                    ) : (
                        <>
                            <Unlink className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Link Entity</span>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-black/90 border-white/10 backdrop-blur-xl max-h-96 overflow-y-auto">
                {linkedEntity && (
                    <>
                        <DropdownMenuItem
                            onClick={() => onLink(null)}
                            className="text-xs cursor-pointer focus:bg-red-500/10 focus:text-red-400 text-red-400"
                        >
                            <Unlink className="mr-2 h-3.5 w-3.5" />
                            Unlink "{linkedEntity.name}"
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                    </>
                )}
                
                {/* Search Input */}
                <div className="px-2 py-1.5 sticky top-0 bg-black/95 z-10">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search entities..."
                            className="w-full pl-7 pr-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 focus:outline-none focus:border-primary/50 text-white placeholder:text-white/30"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
                
                {characterResults.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Characters
                        </DropdownMenuLabel>
                        {characterResults.map(char => (
                            <DropdownMenuItem
                                key={char.id}
                                onClick={() => onLink({ type: 'character', id: char.id, name: char.name })}
                                className={cn(
                                    "text-xs cursor-pointer",
                                    linkedEntity?.id === char.id
                                        ? "bg-violet-500/10 text-violet-400"
                                        : "focus:bg-white/10 focus:text-white"
                                )}
                            >
                                <User className="mr-2 h-3.5 w-3.5 text-emerald-400" />
                                <span className="truncate">{char.name}</span>
                                {linkedEntity?.id === char.id && <Check className="ml-auto h-3.5 w-3.5" />}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
                
                {worldResults.length > 0 && (
                    <>
                        {characterResults.length > 0 && <DropdownMenuSeparator className="bg-white/10" />}
                        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Worlds
                        </DropdownMenuLabel>
                        {worldResults.map(world => (
                            <DropdownMenuItem
                                key={world.id}
                                onClick={() => onLink({ type: 'world', id: world.id, name: world.name })}
                                className={cn(
                                    "text-xs cursor-pointer",
                                    linkedEntity?.id === world.id
                                        ? "bg-violet-500/10 text-violet-400"
                                        : "focus:bg-white/10 focus:text-white"
                                )}
                            >
                                <Globe className="mr-2 h-3.5 w-3.5 text-blue-400" />
                                <span className="truncate">{world.name}</span>
                                {linkedEntity?.id === world.id && <Check className="ml-auto h-3.5 w-3.5" />}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
                
                {projectResults.length > 0 && (
                    <>
                        {(characterResults.length > 0 || worldResults.length > 0) && <DropdownMenuSeparator className="bg-white/10" />}
                        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Projects
                        </DropdownMenuLabel>
                        {projectResults.map(project => (
                            <DropdownMenuItem
                                key={project.id}
                                onClick={() => onLink({ type: 'project', id: project.id, name: project.name })}
                                className={cn(
                                    "text-xs cursor-pointer",
                                    linkedEntity?.id === project.id
                                        ? "bg-cyan-500/10 text-cyan-400"
                                        : "focus:bg-white/10 focus:text-white"
                                )}
                            >
                                <Folder className="mr-2 h-3.5 w-3.5 text-orange-400" />
                                <span className="truncate">{project.name}</span>
                                {linkedEntity?.id === project.id && <Check className="ml-auto h-3.5 w-3.5" />}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
                
                {characterResults.length === 0 && worldResults.length === 0 && projectResults.length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground italic text-center">
                        {searchQuery ? 'No matches found' : 'No entities yet. Create one to link!'}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
