'use client';

import React from 'react';
import { User, Globe, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { getModesForSwitcher, getModeConfig, type ChatMode, type ModeConfig } from '@/lib/mode-registry';

// Re-export ChatMode for backward compatibility
export type { ChatMode } from '@/lib/mode-registry';

interface ModeSwitcherProps {
    currentMode: ChatMode | null;
    onModeChange?: (mode: ChatMode, targetId?: string) => void;
    characters?: Array<{ id: string; name: string }>;
    worlds?: Array<{ id: string; name: string }>;
    projects?: Array<{ id: string; name: string }>;
}

// Get mode options from the centralized registry
const MODE_OPTIONS = getModesForSwitcher();

export function ModeSwitcher({
    currentMode,
    onModeChange,
    characters = [],
    worlds = [],
    projects = []
}: ModeSwitcherProps) {
    const currentModeOption = MODE_OPTIONS.find(m => m.id === currentMode) || MODE_OPTIONS[MODE_OPTIONS.length - 1];
    const CurrentIcon = currentModeOption.icon;

    const handleModeSelect = (mode: ChatMode, targetId?: string) => {
        if (onModeChange) {
            onModeChange(mode, targetId);
        } else {
            // Default behavior: navigate to chat with mode
            const url = targetId 
                ? `/chat?mode=${mode}&id=${targetId}`
                : `/chat?mode=${mode}`;
            window.location.href = url;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "gap-2 text-xs",
                        currentModeOption.color,
                        "hover:bg-white/5"
                    )}
                >
                    <CurrentIcon className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{currentModeOption.label}</span>
                    <span className="text-[10px] opacity-60 hidden md:inline">({currentMode})</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-black/95 border-white/10 backdrop-blur-xl">
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                    Switch Mode
                </DropdownMenuLabel>
                
                {MODE_OPTIONS.map(mode => {
                    const Icon = mode.icon;
                    const isActive = currentMode === mode.id;
                    
                    return (
                        <React.Fragment key={mode.id}>
                            <DropdownMenuItem
                                onClick={() => handleModeSelect(mode.id)}
                                className={cn(
                                    "text-xs cursor-pointer",
                                    isActive && "bg-primary/10 text-primary"
                                )}
                            >
                                <Icon className={cn("mr-2 h-3.5 w-3.5", mode.color)} />
                                <div className="flex-1">
                                    <div className="font-medium">{mode.label}</div>
                                    <div className="text-[10px] text-muted-foreground">{mode.description}</div>
                                </div>
                                {isActive && <span className="text-[10px]">✓</span>}
                            </DropdownMenuItem>
                            
                            {/* Show existing entities for this mode */}
                            {mode.id === 'character' && characters.length > 0 && (
                                <>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Existing Characters
                                    </DropdownMenuLabel>
                                    {characters.slice(0, 5).map(char => (
                                        <DropdownMenuItem
                                            key={char.id}
                                            onClick={() => handleModeSelect('workshop', char.id)}
                                            className="text-xs cursor-pointer pl-8"
                                        >
                                            <User className="mr-2 h-3 w-3 text-emerald-400" />
                                            <span className="truncate">{char.name}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}
                            
                            {mode.id === 'world' && worlds.length > 0 && (
                                <>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Existing Worlds
                                    </DropdownMenuLabel>
                                    {worlds.slice(0, 5).map(world => (
                                        <DropdownMenuItem
                                            key={world.id}
                                            onClick={() => handleModeSelect('world', world.id)}
                                            className="text-xs cursor-pointer pl-8"
                                        >
                                            <Globe className="mr-2 h-3 w-3 text-blue-400" />
                                            <span className="truncate">{world.name}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}
                            
                            {mode.id === 'project' && projects.length > 0 && (
                                <>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Existing Projects
                                    </DropdownMenuLabel>
                                    {projects.slice(0, 5).map(project => (
                                        <DropdownMenuItem
                                            key={project.id}
                                            onClick={() => handleModeSelect('project', project.id)}
                                            className="text-xs cursor-pointer pl-8"
                                        >
                                            <Folder className="mr-2 h-3 w-3 text-orange-400" />
                                            <span className="truncate">{project.name}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}
                        </React.Fragment>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
