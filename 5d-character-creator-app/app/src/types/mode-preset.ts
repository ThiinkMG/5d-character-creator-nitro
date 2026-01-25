import { ChatMode } from '@/lib/mode-registry';

/**
 * Mode Preset - Saved session configurations for quick reuse
 */
export interface ModePreset {
    id: string;
    name: string;
    description?: string;
    mode: ChatMode;
    sessionConfig?: {
        selectedCharacters: string[];
        selectedWorlds: string[];
        generateRandomCharacters?: boolean;
        generateRandomWorlds?: boolean;
        sceneType?: string;
        tone?: string;
        length?: string;
        additionalParams?: Record<string, string>;
    };
    customInstruction?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Helper to create a new preset with defaults
 */
export function createModePreset(
    name: string,
    mode: ChatMode,
    sessionConfig?: ModePreset['sessionConfig'],
    customInstruction?: string
): ModePreset {
    const now = new Date();
    return {
        id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        mode,
        sessionConfig,
        customInstruction,
        createdAt: now,
        updatedAt: now
    };
}
