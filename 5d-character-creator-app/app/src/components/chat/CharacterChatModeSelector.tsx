'use client';

import React from 'react';
import { User, MessageSquare, FileText, Users, Sparkles, Wand2 } from 'lucide-react';
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
import Link from 'next/link';

export type CharacterChatMode = 'edit' | 'roleplay' | 'realtime' | 'script' | 'scene' | 'adventure';

export interface CharacterChatModeOption {
    id: CharacterChatMode;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    url: string;
}

interface CharacterChatModeSelectorProps {
    characterId: string;
    characterName: string;
}

export function CharacterChatModeSelector({ characterId, characterName }: CharacterChatModeSelectorProps) {
    const modes: CharacterChatModeOption[] = [
        {
            id: 'edit',
            label: 'Edit Profile',
            description: 'Add or change character details',
            icon: User,
            url: `/chat?mode=character&id=${characterId}`
        },
        {
            id: 'roleplay',
            label: 'Chat with Character',
            description: 'Roleplay setup and realtime chat',
            icon: MessageSquare,
            url: `/chat?mode=chat_with&id=${characterId}`
        },
        {
            id: 'script',
            label: 'Script Creation',
            description: 'Add multiple characters or quick scene',
            icon: FileText,
            url: `/chat?mode=script&characterId=${characterId}`
        },
        {
            id: 'scene',
            label: 'Scene with Character',
            description: 'Roleplay, choose your adventure style',
            icon: Sparkles,
            url: `/chat?mode=scene&id=${characterId}`
        }
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 rounded-lg px-3 sm:px-4 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 gap-2"
                    aria-label="Chat with character"
                >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Chat</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-black/95 border-white/10 backdrop-blur-xl">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Chat with {characterName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {modes.map((mode) => {
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
                                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 mt-0.5">
                                    <Icon className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-white">{mode.label}</div>
                                    <div className="text-xs text-white/60 mt-0.5">{mode.description}</div>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
