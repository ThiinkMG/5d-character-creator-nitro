export interface Character {
    id: string; // CID like #ELARA_902
    name: string;
    role: string; // Protagonist, Antagonist, etc.
    genre: string;
    projectId?: string; // Link to Project
    progress: number; // 0-100
    phase: 'Foundation' | 'Personality' | 'Backstory' | 'Relationships' | 'Arc';
    // Phase 1: Foundation
    coreConcept?: string;
    archetype?: string;
    // Phase 2: Personality
    motivations?: string[];
    flaws?: string[];
    // Phase 3: Backstory
    origin?: string;
    ghost?: string; // Past trauma
    // Phase 4: Relationships
    allies?: string[];
    enemies?: string[];
    // Phase 5: Arc
    arcType?: string;
    climax?: string;

    // NEW: Prose-based narrative fields (narrative-first design)
    personalityProse?: string; // Combined motivations, flaws, fears as readable prose
    backstoryProse?: string;   // Combined origin, ghost, timeline as narrative
    relationshipsProse?: string; // Contextual relationship descriptions
    arcProse?: string;         // Character arc as narrative prose

    // NEW: Image handling
    imageUrl?: string; // Generated avatar
    imageSource?: 'preset' | 'uploaded' | 'generated';
    imageCaption?: string;

    // NEW: Gallery display
    cardSize?: 'small' | 'medium' | 'large' | 'wide' | 'tall';

    // NEW: Extended content for wiki view
    tagline?: string;
    fears?: string[];
    timeline?: { year: string; event: string }[];

    // NEW: Related items linking
    worldId?: string;  // Link to associated world

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

export type OperationalMode = 'Basic' | 'Advanced' | 'Simulation' | 'Analysis' | 'Worldbuilding' | 'Export';
