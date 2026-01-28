export interface Project {
    id: string; // SID like #STORY_101
    name: string;
    aliases?: string[];              // NEW: Alternate names for fuzzy matching in @ mentions
    genre: string;
    summary: string;
    description?: string;
    tags?: string[];

    // Relations (optional, could be computed)
    characterIds?: string[];
    worldIds?: string[];

    progress: number;
    timeline?: TimelineEvent[];
    createdAt: Date;
    updatedAt: Date;
}

export interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    chapter?: string;
    order: number;
}

