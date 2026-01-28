
export interface Choice {
    id: string;
    label: string;
    description?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    choices?: Choice[];
    pendingUpdate?: {
        type: 'character' | 'world' | 'project';
        data: any;
        targetId?: string;
        targetName?: string;
    };
}

export interface LinkedEntities {
    characters: Array<{ id: string; name: string }>;
    worlds: Array<{ id: string; name: string }>;
    projects: Array<{ id: string; name: string }>;
}

export interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    updatedAt: Date;
    createdAt: Date;
    messages: Message[];
    mode: 'chat' | 'character' | 'world' | 'project' | 'lore' | 'scene' | 'workshop' | 'chat_with' | 'script';
    relatedId?: string; // ID of the character/world/project if applicable

    // Multi-entity linking for sessions involving multiple characters, worlds, or projects
    linkedEntities?: LinkedEntities;

    // NEW: Track which message updates have been applied (persisted)
    appliedMessageIds?: string[];

    // Narrative History Features
    aiSummary?: string; // AI-generated session summary prose
    aiTags?: string[]; // Auto-generated tags like #backstory-deep-dive
    lastModifiedSection?: string; // e.g., "Personality" for contextual timestamps

    // New Feature: Context & Memory
    summary?: string; // AI generated summary
    tags?: string[]; // "Backstory", "Brainstorming", etc.

    // New Feature: Branching
    branchParentId?: string; // ID of the session this was forked FROM
    branchPointMessageId?: string; // ID of the last message included from parent

    // New Feature: Context Rehydration
    linkedEntitySnapshots?: {
        character?: any;
        world?: any;
    }; // Snapshot of entity state at session start/resume

    // New Feature: Analytics
    insights?: {
        modifiedFields?: string[];
        completedDimensions?: string[]; // "Personality", "Backstory"
    };

    aiGeneratedTitle?: boolean;

    // Update History
    updateHistory?: AppliedUpdate[];
}

export interface AppliedUpdate {
    id: string;
    messageId: string;
    timestamp: Date;
    type: 'character' | 'world' | 'project';
    targetId: string;
    targetName: string;
    changes: Record<string, { old: any; new: any }>;
}
