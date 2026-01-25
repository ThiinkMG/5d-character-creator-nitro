'use client';

import React, { useState } from 'react';
import { X, User, Globe, Sparkles, Shuffle, Plus, Trash2, ChevronDown, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SessionSetupConfig {
    selectedCharacters: string[];
    selectedWorlds: string[];
    generateRandomCharacters: boolean;
    generateRandomWorlds: boolean;
    sceneType?: string;
    tone?: string;
    length?: string;
    additionalParams?: Record<string, string>;
}

interface SessionSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (config: SessionSetupConfig) => void;
    mode: 'script' | 'scene' | 'chat_with';
    characters: Array<{ id: string; name: string }>;
    worlds: Array<{ id: string; name: string }>;
    initialCharacterId?: string;
    initialWorldId?: string;
}

export function SessionSetupModal({
    isOpen,
    onClose,
    onStart,
    mode,
    characters,
    worlds,
    initialCharacterId,
    initialWorldId
}: SessionSetupModalProps) {
    const [selectedCharacters, setSelectedCharacters] = useState<string[]>(
        initialCharacterId ? [initialCharacterId] : []
    );
    const [selectedWorlds, setSelectedWorlds] = useState<string[]>(
        initialWorldId ? [initialWorldId] : []
    );
    const [generateRandomCharacters, setGenerateRandomCharacters] = useState(false);
    const [generateRandomWorlds, setGenerateRandomWorlds] = useState(false);
    const [sceneType, setSceneType] = useState('');
    const [tone, setTone] = useState('');
    const [length, setLength] = useState('');
    const [showCharacterSelect, setShowCharacterSelect] = useState(mode === 'chat_with'); // Auto-show for chat_with
    const [showWorldSelect, setShowWorldSelect] = useState(false);

    const handleCharacterToggle = (characterId: string) => {
        if (mode === 'chat_with') {
            // For chat_with mode, only allow one character (radio button behavior)
            setSelectedCharacters([characterId]);
        } else {
            // For other modes, allow multiple selection (checkbox behavior)
            setSelectedCharacters(prev =>
                prev.includes(characterId)
                    ? prev.filter(id => id !== characterId)
                    : [...prev, characterId]
            );
        }
    };

    const handleWorldToggle = (worldId: string) => {
        setSelectedWorlds(prev =>
            prev.includes(worldId)
                ? prev.filter(id => id !== worldId)
                : [...prev, worldId]
        );
    };

    const handleStart = () => {
        onStart({
            selectedCharacters,
            selectedWorlds,
            generateRandomCharacters,
            generateRandomWorlds,
            sceneType: sceneType || undefined,
            tone: tone || undefined,
            length: length || undefined,
        });
    };

    // For chat_with mode, require exactly one character (no random generation)
    const canStart = mode === 'chat_with' 
        ? selectedCharacters.length === 1 && !generateRandomCharacters
        : selectedCharacters.length > 0 || generateRandomCharacters;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-[#0c0c14] border-white/10 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
                        {mode === 'script' ? (
                            <>
                                <Sparkles className="w-5 h-5 text-primary" />
                                Script Creation Setup
                            </>
                        ) : mode === 'chat_with' ? (
                            <>
                                <User className="w-5 h-5 text-primary" />
                                Chat with Character Setup
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 text-primary" />
                                Roleplay Setup
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {mode === 'chat_with' 
                            ? 'Configure your chat session. The AI will fully embody the character\'s persona and context.'
                            : `Configure your ${mode === 'script' ? 'script' : 'roleplay'} session. Select characters, worlds, and set parameters.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Characters Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Characters
                            </label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCharacterSelect(!showCharacterSelect)}
                                    className="text-xs h-7"
                                >
                                    {showCharacterSelect ? 'Hide' : 'Select'}
                                </Button>
                                {mode !== 'chat_with' && (
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={generateRandomCharacters}
                                            onChange={(e) => {
                                                setGenerateRandomCharacters(e.target.checked);
                                                if (e.target.checked) {
                                                    setSelectedCharacters([]);
                                                }
                                            }}
                                            className="w-3.5 h-3.5 rounded border-white/20 bg-transparent"
                                        />
                                        <Shuffle className="w-3.5 h-3.5" />
                                        Generate Random
                                    </label>
                                )}
                            </div>
                        </div>

                        {showCharacterSelect && !generateRandomCharacters && (
                            <div className="max-h-40 overflow-y-auto space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
                                {characters.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                        No characters available
                                    </p>
                                ) : (
                                    characters.map(char => (
                                        <label
                                            key={char.id}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                                                selectedCharacters.includes(char.id)
                                                    ? "bg-primary/20 border border-primary/30"
                                                    : "hover:bg-white/5 border border-transparent"
                                            )}
                                        >
                                            <input
                                                type={mode === 'chat_with' ? 'radio' : 'checkbox'}
                                                checked={selectedCharacters.includes(char.id)}
                                                onChange={() => handleCharacterToggle(char.id)}
                                                className={mode === 'chat_with' ? 'w-4 h-4 border-white/20 bg-transparent' : 'w-4 h-4 rounded border-white/20 bg-transparent'}
                                            />
                                            <span className="text-sm text-white flex-1">{char.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}

                        {selectedCharacters.length > 0 && !generateRandomCharacters && (
                            <div className="flex flex-wrap gap-2">
                                {selectedCharacters.map(charId => {
                                    const char = characters.find(c => c.id === charId);
                                    return char ? (
                                        <div
                                            key={charId}
                                            className="flex items-center gap-2 px-2 py-1 rounded bg-primary/20 border border-primary/30 text-xs text-white"
                                        >
                                            {char.name}
                                            <button
                                                onClick={() => handleCharacterToggle(charId)}
                                                className="hover:text-red-400"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>

                    {/* Worlds Section - Hide for chat_with mode */}
                    {mode !== 'chat_with' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" />
                                Worlds (Optional)
                            </label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowWorldSelect(!showWorldSelect)}
                                    className="text-xs h-7"
                                >
                                    {showWorldSelect ? 'Hide' : 'Select'}
                                </Button>
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={generateRandomWorlds}
                                        onChange={(e) => {
                                            setGenerateRandomWorlds(e.target.checked);
                                            if (e.target.checked) {
                                                setSelectedWorlds([]);
                                            }
                                        }}
                                        className="w-3.5 h-3.5 rounded border-white/20 bg-transparent"
                                    />
                                    <Shuffle className="w-3.5 h-3.5" />
                                    Generate Random
                                </label>
                            </div>
                        </div>

                        {showWorldSelect && !generateRandomWorlds && (
                            <div className="max-h-40 overflow-y-auto space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
                                {worlds.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                        No worlds available
                                    </p>
                                ) : (
                                    worlds.map(world => (
                                        <label
                                            key={world.id}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                                                selectedWorlds.includes(world.id)
                                                    ? "bg-primary/20 border border-primary/30"
                                                    : "hover:bg-white/5 border border-transparent"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedWorlds.includes(world.id)}
                                                onChange={() => handleWorldToggle(world.id)}
                                                className="w-4 h-4 rounded border-white/20 bg-transparent"
                                            />
                                            <span className="text-sm text-white flex-1">{world.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}

                        {selectedWorlds.length > 0 && !generateRandomWorlds && (
                            <div className="flex flex-wrap gap-2">
                                {selectedWorlds.map(worldId => {
                                    const world = worlds.find(w => w.id === worldId);
                                    return world ? (
                                        <div
                                            key={worldId}
                                            className="flex items-center gap-2 px-2 py-1 rounded bg-primary/20 border border-primary/30 text-xs text-white"
                                        >
                                            {world.name}
                                            <button
                                                onClick={() => handleWorldToggle(worldId)}
                                                className="hover:text-red-400"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>
                    )}

                    {/* Additional Parameters - Hide for chat_with mode */}
                    {mode !== 'chat_with' && (
                    <div className="space-y-3 border-t border-white/10 pt-4">
                        <h3 className="text-sm font-medium text-white">Additional Parameters</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                    Scene Type
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            <span className={cn(!sceneType && "text-muted-foreground")}>
                                                {sceneType ? sceneType.charAt(0).toUpperCase() + sceneType.slice(1) : 'Any'}
                                            </span>
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[200px] bg-[#0A0A0F] border-white/20">
                                        <DropdownMenuItem
                                            onClick={() => setSceneType('')}
                                            className={cn(
                                                "text-white cursor-pointer",
                                                !sceneType && "bg-primary/20 text-primary"
                                            )}
                                        >
                                            <span className="flex-1">Any</span>
                                            {!sceneType && <Check className="w-4 h-4" />}
                                        </DropdownMenuItem>
                                        {['dialogue', 'action', 'drama', 'comedy', 'romance', 'conflict'].map((type) => (
                                            <DropdownMenuItem
                                                key={type}
                                                onClick={() => setSceneType(type)}
                                                className={cn(
                                                    "text-white cursor-pointer",
                                                    sceneType === type && "bg-primary/20 text-primary"
                                                )}
                                            >
                                                <span className="flex-1 capitalize">{type}</span>
                                                {sceneType === type && <Check className="w-4 h-4" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                    Tone
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            <span className={cn(!tone && "text-muted-foreground")}>
                                                {tone ? tone.charAt(0).toUpperCase() + tone.slice(1) : 'Any'}
                                            </span>
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[200px] bg-[#0A0A0F] border-white/20">
                                        <DropdownMenuItem
                                            onClick={() => setTone('')}
                                            className={cn(
                                                "text-white cursor-pointer",
                                                !tone && "bg-primary/20 text-primary"
                                            )}
                                        >
                                            <span className="flex-1">Any</span>
                                            {!tone && <Check className="w-4 h-4" />}
                                        </DropdownMenuItem>
                                        {['light', 'serious', 'dark', 'whimsical', 'mysterious'].map((t) => (
                                            <DropdownMenuItem
                                                key={t}
                                                onClick={() => setTone(t)}
                                                className={cn(
                                                    "text-white cursor-pointer",
                                                    tone === t && "bg-primary/20 text-primary"
                                                )}
                                            >
                                                <span className="flex-1 capitalize">{t}</span>
                                                {tone === t && <Check className="w-4 h-4" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                    Length
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            <span className={cn(!length && "text-muted-foreground")}>
                                                {length ? length.charAt(0).toUpperCase() + length.slice(1) : 'Any'}
                                            </span>
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[200px] bg-[#0A0A0F] border-white/20">
                                        <DropdownMenuItem
                                            onClick={() => setLength('')}
                                            className={cn(
                                                "text-white cursor-pointer",
                                                !length && "bg-primary/20 text-primary"
                                            )}
                                        >
                                            <span className="flex-1">Any</span>
                                            {!length && <Check className="w-4 h-4" />}
                                        </DropdownMenuItem>
                                        {['short', 'medium', 'long'].map((l) => (
                                            <DropdownMenuItem
                                                key={l}
                                                onClick={() => setLength(l)}
                                                className={cn(
                                                    "text-white cursor-pointer",
                                                    length === l && "bg-primary/20 text-primary"
                                                )}
                                            >
                                                <span className="flex-1 capitalize">{l}</span>
                                                {length === l && <Check className="w-4 h-4" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 glass"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStart}
                        disabled={!canStart}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white"
                    >
                        Start {mode === 'script' ? 'Script' : 'Roleplay'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
