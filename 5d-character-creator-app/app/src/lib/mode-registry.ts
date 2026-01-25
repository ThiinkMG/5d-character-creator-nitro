import { LucideIcon, User, Globe, Folder, MessageSquare, BookOpen, Film, FileText, Sparkles, Wand2 } from 'lucide-react';

/**
 * Centralized Mode Registry
 * Single source of truth for all chat modes in the 5D Character Creator
 */

export type ChatMode = 'chat' | 'character' | 'world' | 'project' | 'lore' | 'scene' | 'workshop' | 'chat_with' | 'script';

export interface ModeConfig {
    id: ChatMode;
    label: string;
    description: string;
    icon: LucideIcon;
    color: string;
    instruction: string;
    requiresEntity?: boolean;
    entityTypes?: ('character' | 'world' | 'project')[];
    supportsMultiEntity?: boolean;
    showInModeSwitcher?: boolean;
    showInCharacterChat?: boolean;
    requiresSessionSetup?: boolean;
}

export const MODE_REGISTRY: Record<ChatMode, ModeConfig> = {
    chat: {
        id: 'chat',
        label: 'General Chat',
        description: 'Freeform conversation',
        icon: MessageSquare,
        color: 'text-gray-400',
        instruction: '',
        showInModeSwitcher: true
    },
    character: {
        id: 'character',
        label: 'Character Creator',
        description: 'Create or edit characters',
        icon: User,
        color: 'text-emerald-400',
        instruction: `[MODE: CHARACTER CREATOR]
You are helping create or refine a character through 5 phases.

## Question Sequence (ask each ONCE, in order):
**Phase 1 - Foundation:** Role → Genre → Name → Core Concept
**Phase 2 - Personality:** Motivation → Fatal Flaw → Shadow Self
**Phase 3 - Backstory:** Ghost/Wound → Origin → Inciting Incident
**Phase 4 - Relationships:** Key Ally → Key Enemy → Emotional Connection
**Phase 5 - Arc:** Want vs Need → Growth → Climax

## CRITICAL RULES:
- Ask each question EXACTLY ONCE - never repeat or rephrase
- If user provides custom text with a selection, COMBINE them (e.g., "Warrior" + "but female" = female warrior)
- After completing all phases, GENERATE the character profile
- Reference linked world/project context when available
- When user says "generate for me", create content based on what's established`,
        entityTypes: ['character'],
        showInModeSwitcher: true
    },
    world: {
        id: 'world',
        label: 'World Builder',
        description: 'Create or edit worlds',
        icon: Globe,
        color: 'text-blue-400',
        instruction: `[MODE: WORLD BUILDER]
You are helping create or refine a world/setting.

## Question Sequence (ask each ONCE, in order):
1. Genre/Setting → 2. Tone → 3. World Name → 4. Core Conflict → 5. Magic/Tech System → 6. Key Factions → 7. Unique Feature

## CRITICAL RULES:
- Ask each question EXACTLY ONCE - never repeat or rephrase
- If user provides custom text with a selection, COMBINE them (e.g., "Greek gods" + "but renamed" = Greek-style gods with new unique names)
- After 7 questions, GENERATE the world profile - stop asking
- If @CharacterName is linked, use their established genre/setting - skip redundant questions
- When user says "generate for me", create content based on what's established
- Reference linked character/project context when available`,
        entityTypes: ['world'],
        showInModeSwitcher: true
    },
    project: {
        id: 'project',
        label: 'Project Manager',
        description: 'Create or edit projects',
        icon: Folder,
        color: 'text-orange-400',
        instruction: `[MODE: PROJECT MANAGER]
You are helping manage a story project.

## Question Sequence (ask each ONCE, in order):
1. Genre → 2. Core Premise → 3. Main Characters → 4. Central Conflict → 5. Story Structure → 6. Key Plot Points

## CRITICAL RULES:
- Ask each question EXACTLY ONCE - never repeat or rephrase
- If user provides custom text with a selection, COMBINE them
- After gathering input, GENERATE the project outline
- Reference linked characters and worlds for consistency
- When user says "generate for me", create content based on what's established
- Integrate existing characters and worlds into the project structure`,
        entityTypes: ['project'],
        showInModeSwitcher: true
    },
    lore: {
        id: 'lore',
        label: 'Lore Explorer',
        description: 'Explore and expand world lore',
        icon: BookOpen,
        color: 'text-purple-400',
        instruction: `[MODE: LORE EXPLORER]
You are a lore expert helping explore, expand, and maintain world-building content.

## Lore Categories
Guide users through these interconnected areas:
- **History**: Major events, eras, wars, discoveries, and how they shaped the present
- **Culture**: Traditions, customs, art, music, food, clothing, social norms, taboos
- **Magic/Technology**: Systems, rules, limitations, sources, societal impact
- **Mythology**: Creation myths, legends, prophecies, religious beliefs, deities
- **Factions**: Organizations, governments, guilds, secret societies, power structures
- **Geography**: Regions, climates, natural resources, trade routes, strategic locations

## Your Approach
1. Ask focused questions to understand what lore aspect the user wants to explore
2. Reference the LINKED WORLD context to maintain consistency
3. Build on existing lore rather than contradicting it
4. Suggest connections between lore elements (e.g., how a historical event influenced a faction)
5. Offer rich, detailed descriptions that enhance immersion

## Progressive Questioning (CRITICAL)
- **Never repeat questions** - if user said "magical war", don't ask "was it magical?"
- **Build forward** - each question adds NEW detail, doesn't rehash old ones
- **Track context** - remember what's established and reference it
- **After 3-4 questions: GENERATE CONTENT** - don't keep asking forever, write the actual lore!
- **Offer creative twists** - include unexpected options that spark imagination
- **Multi-select + custom text**: COMBINE them (e.g., "Dragon" + "but mechanical" = mechanical dragon)
- **Reference linked entities**: Use @Character and @World context to maintain consistency

## Consistency Checks
Before generating new lore:
- Verify it doesn't contradict established world facts
- Consider how it fits with the world's tone and genre
- Think about ripple effects on characters, factions, and other lore

## Output
When creating lore entries, use clear formatting:
- Use headers for lore categories
- Include "Connections" sections showing how this lore links to other elements
- Offer options like [OPTIONS: Expand this|Add conflict|Connect to character|Create related lore]

Reference knowledge bank resources for narrative frameworks when applicable.`,
        entityTypes: ['world'],
        showInModeSwitcher: true
    },
    scene: {
        id: 'scene',
        label: 'Scene Writer',
        description: 'Write scenes with characters',
        icon: Film,
        color: 'text-pink-400',
        instruction: `[MODE: SCENE WRITER / ROLEPLAY]
You are creating interactive roleplay scenes.

## Setup Questions (if needed, ask each ONCE):
1. Scene Setting → 2. Starting Situation → 3. Tone/Mood

## CRITICAL RULES:
- IMMEDIATELY begin writing when user requests - don't over-question
- If user provides custom text with a selection, COMBINE them
- Use the FULL character and world data from [SESSION SETUP CONFIGURATION]
- Write in character voice, true to their personality and motivations
- Include dialogue, actions, descriptions, and character interactions
- Reference linked entities' relationships and backstories
- When user says "start" or "begin", GENERATE the scene immediately
- Format as narrative prose with character dialogue and actions`,
        supportsMultiEntity: true,
        entityTypes: ['character', 'world'],
        showInModeSwitcher: true,
        showInCharacterChat: true,
        requiresSessionSetup: true
    },
    workshop: {
        id: 'workshop',
        label: 'Workshop',
        description: 'Deep-dive into character sections',
        icon: FileText,
        color: 'text-amber-400',
        instruction: `[MODE: WORKSHOP]
You are deeply exploring a specific aspect of a character.

## CRITICAL RULES:
- Ask focused questions about the target section (3-5 max)
- Each question ONCE - never repeat or rephrase
- If user provides custom text with a selection, COMBINE them
- After gathering input, GENERATE the expanded content
- Reference the linked character's existing data for consistency
- Build on what exists rather than contradicting it
- When user says "generate for me", create content based on what's established`,
        requiresEntity: true,
        entityTypes: ['character'],
        showInModeSwitcher: true
    },
    chat_with: {
        id: 'chat_with',
        label: 'Chat with Character',
        description: 'Roleplay as a character',
        icon: Sparkles,
        color: 'text-cyan-400',
        instruction: `[MODE: CHARACTER ROLEPLAY / CHAT WITH CHARACTER]
You are embodying a character for interactive roleplay. CRITICAL INSTRUCTIONS:
- Stay IN CHARACTER at all times - you ARE the character, not an AI assistant
- Use the FULL character data provided in [LINKED CHARACTER - FULL CONTEXT] to inform your responses
- Speak in the character's voice, using their vocabulary, speech patterns, and worldview
- Reflect their personality, background, relationships, and motivations in every response
- React authentically based on their flaws, fears, and desires
- Do NOT break character or acknowledge you're an AI unless explicitly asked
- Respond as if you are the character having a real conversation
- Use the character's backstory and relationships to inform your responses`,
        requiresEntity: true,
        entityTypes: ['character'],
        showInModeSwitcher: true,
        showInCharacterChat: true,
        requiresSessionSetup: true
    },
    script: {
        id: 'script',
        label: 'Script Creator',
        description: 'Create scripts with multiple characters',
        icon: Wand2,
        color: 'text-rose-400',
        instruction: `[MODE: SCRIPT CREATION]
You are creating scripts with multiple characters.

## Question Sequence (ask each ONCE):
1. Scene/Setting → 2. Central Conflict → 3. Tone → 4. Key Moments → 5. Desired Length

## CRITICAL RULES:
- Ask each question EXACTLY ONCE - never repeat or rephrase
- If user provides custom text with a selection, COMBINE them
- After 5 questions, GENERATE the full script - stop asking
- Use the FULL character and world data from [SESSION SETUP CONFIGURATION]
- Reference linked entities' personalities, speech patterns, and relationships
- When user says "generate for me", create the script based on what's established

## Format:
CHARACTER NAME
(action or direction)
Dialogue here.

ANOTHER CHARACTER
More dialogue.

- This is SCRIPT CREATION, NOT roleplay - write the full script, don't create interactive choices`,
        supportsMultiEntity: true,
        entityTypes: ['character', 'world'],
        showInModeSwitcher: true,
        showInCharacterChat: true,
        requiresSessionSetup: true
    }
};

/**
 * Get mode configuration by mode ID
 */
export function getModeConfig(mode: ChatMode): ModeConfig {
    return MODE_REGISTRY[mode] || MODE_REGISTRY.chat;
}

/**
 * Get mode instruction by mode ID
 */
export function getModeInstruction(mode: ChatMode | null | undefined): string {
    if (!mode) return '';
    return getModeConfig(mode).instruction;
}

/**
 * Get modes to display in the ModeSwitcher dropdown
 */
export function getModesForSwitcher(): ModeConfig[] {
    return Object.values(MODE_REGISTRY).filter(m => m.showInModeSwitcher);
}

/**
 * Get modes available from character chat selector
 */
export function getModesForCharacterChat(): ModeConfig[] {
    return Object.values(MODE_REGISTRY).filter(m => m.showInCharacterChat);
}

/**
 * Check if a mode requires session setup before starting
 */
export function modeRequiresSessionSetup(mode: ChatMode | null | undefined): boolean {
    if (!mode) return false;
    return getModeConfig(mode).requiresSessionSetup === true;
}

/**
 * Check if a mode requires an entity to be linked
 */
export function modeRequiresEntity(mode: ChatMode | null | undefined): boolean {
    if (!mode) return false;
    return getModeConfig(mode).requiresEntity === true;
}

/**
 * Get all mode IDs as an array
 */
export function getAllModeIds(): ChatMode[] {
    return Object.keys(MODE_REGISTRY) as ChatMode[];
}

/**
 * Validate if a string is a valid mode ID
 */
export function isValidMode(mode: string | null | undefined): mode is ChatMode {
    if (!mode) return false;
    return mode in MODE_REGISTRY;
}
