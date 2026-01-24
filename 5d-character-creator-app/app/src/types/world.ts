export interface World {
    id: string; // WID like @VIRELITH_501
    name: string;
    genre: string;
    description: string;
    projectId?: string; // Link to Project
    progress: number; // 0-100

    // Core Elements
    tone?: string;
    rules?: string[]; // Magic/Tech rules

    // Lore Sections
    history?: string;
    geography?: string;
    societies?: string[];

    // NEW: Prose-based narrative fields (narrative-first design)
    overviewProse?: string;   // Combined world description as readable prose
    historyProse?: string;    // Narrative history instead of timeline
    factionsProse?: string;   // Faction descriptions as prose paragraphs
    geographyProse?: string;  // Locations and geography as narrative

    // Visuals
    imageUrl?: string;
    imageSource?: 'preset' | 'uploaded' | 'generated';
    imageCaption?: string;

    // NEW: Gallery display
    cardSize?: 'small' | 'medium' | 'large' | 'wide' | 'tall';

    // NEW: Extended content for wiki view
    tagline?: string;
    factions?: { name: string; description: string; alignment?: string }[];
    locations?: { name: string; description: string }[];
    magicSystem?: string;
    technology?: string;

    // NEW: Linked characters
    characterIds?: string[];

    // NEW: Custom user-created sections
    customSections?: {
        id: string;
        title: string;
        content: string;
        order: number;
    }[];

    // NEW: Trashed sections (30-day recycle bin)
    trashedSections?: {
        id: string;
        title: string;
        content: string;
        deletedAt: Date;
        sourceEntityId: string;
    }[];

    createdAt: Date;
    updatedAt: Date;
}
