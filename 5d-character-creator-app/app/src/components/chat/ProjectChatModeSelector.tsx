'use client';

import React from 'react';
import {
    Folder,
    MessageSquare,
    FileText,
    Presentation,
    BookOpen,
    Film,
    Tv,
    Book,
    Sparkles,
    ScrollText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';

export type ProjectChatMode = 'edit' | 'pitch_movie' | 'pitch_tv' | 'pitch_book' | 'treatment' | 'synopsis' | 'story_bible';

export interface ProjectChatModeOption {
    id: ProjectChatMode;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    url: string;
    group?: 'edit' | 'pitch' | 'documents';
}

interface ProjectChatModeSelectorProps {
    projectId: string;
    projectName: string;
}

export function ProjectChatModeSelector({ projectId, projectName }: ProjectChatModeSelectorProps) {
    const modes: ProjectChatModeOption[] = [
        // Edit Group
        {
            id: 'edit',
            label: 'Edit Project',
            description: 'Continue developing your project',
            icon: Folder,
            url: `/chat?mode=project&id=${projectId}`,
            group: 'edit'
        },
        // Pitch Group
        {
            id: 'pitch_movie',
            label: 'Movie Pitch',
            description: 'Generate a film pitch deck',
            icon: Film,
            url: `/chat?mode=project&id=${projectId}&output=pitch_movie`,
            group: 'pitch'
        },
        {
            id: 'pitch_tv',
            label: 'TV Series Pitch',
            description: 'Generate a TV show pitch bible',
            icon: Tv,
            url: `/chat?mode=project&id=${projectId}&output=pitch_tv`,
            group: 'pitch'
        },
        {
            id: 'pitch_book',
            label: 'Book Pitch',
            description: 'Generate a book proposal',
            icon: Book,
            url: `/chat?mode=project&id=${projectId}&output=pitch_book`,
            group: 'pitch'
        },
        // Documents Group
        {
            id: 'treatment',
            label: 'Treatment',
            description: 'Detailed narrative summary',
            icon: ScrollText,
            url: `/chat?mode=project&id=${projectId}&output=treatment`,
            group: 'documents'
        },
        {
            id: 'synopsis',
            label: 'Synopsis',
            description: 'Quick 1-2 page summary',
            icon: FileText,
            url: `/chat?mode=project&id=${projectId}&output=synopsis`,
            group: 'documents'
        },
        {
            id: 'story_bible',
            label: 'Story Bible',
            description: 'Comprehensive reference document',
            icon: BookOpen,
            url: `/chat?mode=project&id=${projectId}&output=story_bible`,
            group: 'documents'
        }
    ];

    const editModes = modes.filter(m => m.group === 'edit');
    const pitchModes = modes.filter(m => m.group === 'pitch');
    const documentModes = modes.filter(m => m.group === 'documents');

    const renderModeItem = (mode: ProjectChatModeOption) => {
        const Icon = mode.icon;
        return (
            <DropdownMenuItem
                key={mode.id}
                asChild
                className="focus:bg-zinc-800/50 focus:text-white data-[highlighted]:bg-zinc-800/50 data-[highlighted]:text-white rounded-sm"
            >
                <Link
                    href={mode.url}
                    className="flex items-start gap-3 cursor-pointer py-2.5 w-full"
                >
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-white">{mode.label}</div>
                        <div className="text-xs text-white/60 mt-0.5">{mode.description}</div>
                    </div>
                </Link>
            </DropdownMenuItem>
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 rounded-lg px-3 sm:px-4 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/20 gap-2"
                    aria-label="Project options"
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Create</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-black/95 border-white/10 backdrop-blur-xl">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {projectName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />

                {/* Edit */}
                <DropdownMenuGroup>
                    {editModes.map(renderModeItem)}
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-white/10" />

                {/* Pitches */}
                <DropdownMenuLabel className="text-[10px] text-muted-foreground/70 uppercase tracking-wider px-2">
                    Pitch Decks
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    {pitchModes.map(renderModeItem)}
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-white/10" />

                {/* Documents */}
                <DropdownMenuLabel className="text-[10px] text-muted-foreground/70 uppercase tracking-wider px-2">
                    Documents
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    {documentModes.map(renderModeItem)}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
