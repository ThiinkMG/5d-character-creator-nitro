'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
    Folder,
    Users,
    Globe,
    ChevronDown,
    Plus,
    Link as LinkIcon,
    ArrowRight,
    Eye,
    EyeOff
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { LinkProjectModal } from '@/components/project/LinkProjectModal';

interface EntityContextNavProps {
    entityId: string;
    type: 'character' | 'world' | 'project';
}

export function EntityContextNav({ entityId, type }: EntityContextNavProps) {
    const router = useRouter();
    const {
        projects,
        characters,
        worlds,
        getProjectForCharacter,
        getProjectForWorld,
        addCharacterToProject,
        addWorldToProject
    } = useStore();

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    // Initial check for visibility preference
    useEffect(() => {
        const saved = localStorage.getItem('entity-context-nav-visible');
        if (saved === 'false') setIsVisible(false);
    }, []);

    const toggleVisibility = () => {
        const newState = !isVisible;
        setIsVisible(newState);
        localStorage.setItem('entity-context-nav-visible', String(newState));
    };

    // Derived Context Data
    const currentProject = React.useMemo(() => {
        if (type === 'project') return projects.find(p => p.id === entityId);
        if (type === 'character') return getProjectForCharacter(entityId);
        if (type === 'world') return getProjectForWorld(entityId);
        return undefined;
    }, [entityId, type, projects, characters, worlds]);

    // Linked Items (only useful if we have a project context)
    const linkedCharacters = React.useMemo(() => {
        if (!currentProject) return [];
        return characters.filter(c => c.projectId === currentProject.id);
    }, [currentProject, characters]);

    const linkedWorlds = React.useMemo(() => {
        if (!currentProject) return [];
        return worlds.filter(w => w.projectId === currentProject.id);
    }, [currentProject, worlds]);

    const handleAttachProject = (projectId: string) => {
        if (type === 'character') {
            addCharacterToProject(entityId, projectId);
        } else if (type === 'world') {
            addWorldToProject(entityId, projectId);
        }
    };

    const navigateTo = (path: string) => {
        router.push(path);
    };

    if (!isVisible) {
        return (
            <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-300">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVisibility}
                    className="bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-full h-8 w-8 text-muted-foreground"
                    title="Show Context Menu"
                >
                    <Eye className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-500">
                <div className="glass-card pl-2 pr-2 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-2xl bg-[#08080c]/80 backdrop-blur-xl">

                    {/* HIDE BUTTON */}
                    <div className="pr-2 border-r border-white/10 mr-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleVisibility}
                            className="h-6 w-6 text-white/30 hover:text-white rounded-full"
                            title="Hide Context Menu"
                        >
                            <EyeOff className="w-3.5 h-3.5" />
                        </Button>
                    </div>

                    {/* PROJECT NODE */}
                    {currentProject ? (
                        <div className="flex items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-medium border",
                                            type === 'project'
                                                ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                                                : "hover:bg-white/5 text-white/70 border-transparent hover:border-white/10"
                                        )}
                                        onClick={(e) => {
                                            if (type !== 'project') {
                                                e.preventDefault(); // If strictly just navigation
                                                // Wait, we want click to navigate, but right click or hover for menu? 
                                                // Actually dropdown allows click.
                                                // Let's make the LABEL clickable for nav, and Chevron for menu?
                                                // Simpler: Just make it a dropdown. Clicking item navigates.
                                            }
                                        }}
                                    >
                                        <Folder className="w-3.5 h-3.5" />
                                        <span className="max-w-[120px] truncate">{currentProject.name}</span>
                                        {type !== 'project' && <ChevronDown className="w-3 h-3 opacity-50" />}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-[#0A0A0F]/95 border-white/10 text-white backdrop-blur-xl">
                                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Project Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => navigateTo(`/projects/${currentProject.id}`)}>
                                        <ArrowRight className="w-3.5 h-3.5 mr-2" />
                                        Go to Project
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem disabled>
                                        <span className="text-xs opacity-50">Timeline (Coming Soon)</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="h-4 w-[1px] bg-white/10 mx-1" />
                        </div>
                    ) : type !== 'project' ? (
                        <div className="flex items-center pr-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsLinkModalOpen(true)}
                                className="h-7 px-3 text-xs text-muted-foreground hover:text-cyan-400 gap-1.5"
                            >
                                <LinkIcon className="w-3.5 h-3.5" />
                                Attach Project
                            </Button>
                            <div className="h-4 w-[1px] bg-white/10 mx-1" />
                        </div>
                    ) : null}


                    {/* LINKED CHARACTERS NODE */}
                    {currentProject && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium hover:bg-white/5",
                                    type === 'character' && "bg-cyan-500/10 text-cyan-400"
                                )}>
                                    <Users className="w-3.5 h-3.5 opacity-70" />
                                    <span>{linkedCharacters.length}</span>
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[#0A0A0F]/95 border-white/10 text-white max-h-[300px] overflow-y-auto backdrop-blur-xl">
                                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Linked Characters</DropdownMenuLabel>
                                {linkedCharacters.length > 0 ? linkedCharacters.map(char => (
                                    <DropdownMenuItem
                                        key={char.id}
                                        onClick={() => navigateTo(`/characters/${char.id}`)}
                                        className={char.id === entityId ? "bg-cyan-500/10 text-cyan-400" : ""}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            {char.id === entityId && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                                            <span className="truncate">{char.name}</span>
                                        </div>
                                    </DropdownMenuItem>
                                )) : (
                                    <div className="px-2 py-2 text-xs text-muted-foreground text-center">None attached</div>
                                )}
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem onClick={() => navigateTo('/chat?mode=character')} className="text-cyan-400">
                                    <Plus className="w-3.5 h-3.5 mr-2" />
                                    Create New
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* LINKED WORLDS NODE */}
                    {currentProject && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium hover:bg-white/5",
                                    type === 'world' && "bg-fuchsia-500/10 text-fuchsia-400"
                                )}>
                                    <Globe className="w-3.5 h-3.5 opacity-70" />
                                    <span>{linkedWorlds.length}</span>
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[#0A0A0F]/95 border-white/10 text-white max-h-[300px] overflow-y-auto backdrop-blur-xl">
                                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Linked Worlds</DropdownMenuLabel>
                                {linkedWorlds.length > 0 ? linkedWorlds.map(w => (
                                    <DropdownMenuItem
                                        key={w.id}
                                        onClick={() => navigateTo(`/worlds/${w.id}`)}
                                        className={w.id === entityId ? "bg-fuchsia-500/10 text-fuchsia-400" : ""}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            {w.id === entityId && <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />}
                                            <span className="truncate">{w.name}</span>
                                        </div>
                                    </DropdownMenuItem>
                                )) : (
                                    <div className="px-2 py-2 text-xs text-muted-foreground text-center">None attached</div>
                                )}
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem onClick={() => navigateTo('/chat?mode=world')} className="text-fuchsia-400">
                                    <Plus className="w-3.5 h-3.5 mr-2" />
                                    Create New
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                </div>
            </div>

            {/* Attach Project Modal */}
            <LinkProjectModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onLink={handleAttachProject}
                projects={projects}
                currentProjectId={currentProject?.id}
                onCreateProject={() => navigateTo('/projects')}
            />
        </>
    );
}
