'use client';

import React, { useState } from 'react';
import { Save, Folder, Trash2, Edit2, Check, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { useStore } from '@/lib/store';
import { ModePreset, createModePreset } from '@/types/mode-preset';
import { ChatMode, getModeConfig } from '@/lib/mode-registry';
import { cn } from '@/lib/utils';

interface SessionSetupConfig {
    selectedCharacters: string[];
    selectedWorlds: string[];
    generateRandomCharacters?: boolean;
    generateRandomWorlds?: boolean;
    sceneType?: string;
    tone?: string;
    length?: string;
    additionalParams?: Record<string, string>;
}

interface ModePresetManagerProps {
    currentMode: ChatMode;
    currentConfig?: SessionSetupConfig | null;
    onLoadPreset: (preset: ModePreset) => void;
    compact?: boolean;
}

export function ModePresetManager({
    currentMode,
    currentConfig,
    onLoadPreset,
    compact = false
}: ModePresetManagerProps) {
    const { modePresets, addModePreset, deleteModePreset, getModePresets } = useStore();
    const [isNaming, setIsNaming] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const relevantPresets = getModePresets(currentMode);
    const modeConfig = getModeConfig(currentMode);

    const handleSavePreset = () => {
        if (!presetName.trim()) return;

        const preset = createModePreset(
            presetName.trim(),
            currentMode,
            currentConfig || undefined
        );

        addModePreset(preset);
        setPresetName('');
        setIsNaming(false);
    };

    const handleLoadPreset = (preset: ModePreset) => {
        onLoadPreset(preset);
    };

    const handleDeletePreset = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteModePreset(id);
    };

    if (compact) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-white"
                    >
                        <Folder className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Presets</span>
                        {relevantPresets.length > 0 && (
                            <span className="text-[10px] bg-white/10 rounded px-1">
                                {relevantPresets.length}
                            </span>
                        )}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-[#0A0A0F]/95 border-white/10 backdrop-blur-xl">
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <modeConfig.icon className={cn("w-3.5 h-3.5", modeConfig.color)} />
                        {modeConfig.label} Presets
                    </DropdownMenuLabel>

                    {relevantPresets.length > 0 ? (
                        <>
                            {relevantPresets.map(preset => (
                                <DropdownMenuItem
                                    key={preset.id}
                                    onClick={() => handleLoadPreset(preset)}
                                    className="text-xs cursor-pointer group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{preset.name}</div>
                                        {preset.description && (
                                            <div className="text-[10px] text-muted-foreground truncate">
                                                {preset.description}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleDeletePreset(preset.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                    >
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                    </button>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="bg-white/10" />
                        </>
                    ) : (
                        <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                            No saved presets for this mode
                        </div>
                    )}

                    {isNaming ? (
                        <div className="p-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    placeholder="Preset name..."
                                    className="flex-1 px-2 py-1 text-xs rounded bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSavePreset();
                                        if (e.key === 'Escape') setIsNaming(false);
                                    }}
                                />
                                <Button
                                    size="sm"
                                    onClick={handleSavePreset}
                                    disabled={!presetName.trim()}
                                    className="h-6 px-2 bg-violet-600 hover:bg-violet-500"
                                >
                                    <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsNaming(false)}
                                    className="h-6 px-2"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                setIsNaming(true);
                            }}
                            className="text-xs cursor-pointer text-violet-400"
                            disabled={!currentConfig}
                        >
                            <Save className="w-3.5 h-3.5 mr-2" />
                            Save Current as Preset
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // Full version (not compact)
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Folder className="w-4 h-4 text-violet-400" />
                    {modeConfig.label} Presets
                </h4>
                {currentConfig && !isNaming && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsNaming(true)}
                        className="h-7 text-xs text-violet-400 hover:text-violet-300"
                    >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Save Preset
                    </Button>
                )}
            </div>

            {isNaming && (
                <div className="flex gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                    <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Enter preset name..."
                        className="flex-1 px-3 py-1.5 text-sm rounded bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePreset();
                            if (e.key === 'Escape') setIsNaming(false);
                        }}
                    />
                    <Button
                        size="sm"
                        onClick={handleSavePreset}
                        disabled={!presetName.trim()}
                        className="bg-violet-600 hover:bg-violet-500"
                    >
                        <Check className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsNaming(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {relevantPresets.length > 0 ? (
                <div className="space-y-2">
                    {relevantPresets.map(preset => (
                        <div
                            key={preset.id}
                            onClick={() => handleLoadPreset(preset)}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 cursor-pointer transition-all group"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                    {preset.name}
                                </div>
                                {preset.sessionConfig?.selectedCharacters?.length && (
                                    <div className="text-[10px] text-muted-foreground">
                                        {preset.sessionConfig.selectedCharacters.length} character(s)
                                        {preset.sessionConfig.selectedWorlds?.length &&
                                            `, ${preset.sessionConfig.selectedWorlds.length} world(s)`}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={(e) => handleDeletePreset(preset.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded transition-all"
                            >
                                <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                    <Folder className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No presets saved for {modeConfig.label} mode</p>
                    {currentConfig && (
                        <p className="text-xs mt-1">Configure a session and save it as a preset</p>
                    )}
                </div>
            )}
        </div>
    );
}
