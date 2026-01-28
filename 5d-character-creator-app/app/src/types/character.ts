// NEW: Voice Profile interface for voice consistency
export interface VoiceProfile {
    sampleDialogue: string[];        // 3-5 representative lines
    speechPatterns: string[];        // e.g., "uses rhetorical questions", "speaks in fragments"
    vocabularyLevel: 'simple' | 'moderate' | 'complex' | 'archaic';
    tone: string;                    // e.g., "sardonic", "earnest", "formal"
    dialect?: string;                // Optional regional/cultural dialect
    catchphrases?: string[];         // Signature phrases
    avoids?: string[];               // Words/phrases they'd never say
}

// NEW: Canonical Fact interface for continuity checking
export interface CanonicalFact {
    id: string;
    category: 'physical' | 'personality' | 'history' | 'relationship' | 'ability' | 'possession' | 'other';
    fact: string;
    establishedIn: string;           // Scene/chapter/session reference
    establishedAt: Date;
    confidence: 'definite' | 'implied' | 'tentative';
}

export interface Character {
    id: string; // CID like #ELARA_902
    name: string;
    aliases?: string[];              // NEW: Alternate names for fuzzy matching in @ mentions
    tags?: string[];                 // NEW: Entity tags for categorization (e.g., 'stub', 'needs-development')
    role: string; // Protagonist, Antagonist, etc.
    genre: string;
    projectId?: string; // Link to Project
    progress: number; // 0-100
    phase: 'Foundation' | 'Personality' | 'Backstory' | 'Relationships' | 'Arc';
    // Phase 1: Foundation
    coreConcept?: string;
    motivation?: string;         // Single motivation string (used for stubs)
    archetype?: string;
    // Phase 2: Personality
    motivations?: string[];
    flaws?: string[];
    internalConflict?: string;   // Internal character conflict
    externalConflict?: string;   // External character conflict
    characterArc?: string;       // Character arc summary
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
    
    // NEW: Attached images for prose sections
    proseImages?: {
        foundation?: { url: string; aspectRatio: string; position: { x: number; y: number; scale: number }; size?: 'small' | 'medium' | 'large'; name?: string; altText?: string; caption?: string };
        personality?: { url: string; aspectRatio: string; position: { x: number; y: number; scale: number }; size?: 'small' | 'medium' | 'large'; name?: string; altText?: string; caption?: string };
        backstory?: { url: string; aspectRatio: string; position: { x: number; y: number; scale: number }; size?: 'small' | 'medium' | 'large'; name?: string; altText?: string; caption?: string };
        relationships?: { url: string; aspectRatio: string; position: { x: number; y: number; scale: number }; size?: 'small' | 'medium' | 'large'; name?: string; altText?: string; caption?: string };
        arc?: { url: string; aspectRatio: string; position: { x: number; y: number; scale: number }; size?: 'small' | 'medium' | 'large'; name?: string; altText?: string; caption?: string };
    };

    // NEW: Image handling
    imageUrl?: string; // Generated avatar (hero image)
    infoboxImageUrl?: string; // Separate image for infobox sidebar (if not set, uses imageUrl)
    imageSource?: 'preset' | 'uploaded' | 'generated';
    imageCaption?: string;
    headerImagePosition?: { x: number; y: number }; // Focal point percentages (0-100) for header image, default 50/50 centered

    // NEW: Gallery display
    cardSize?: 'small' | 'medium' | 'large' | 'wide' | 'tall';

    // NEW: Extended content for wiki view
    tagline?: string;
    fears?: string[];
    timeline?: { year: string; event: string }[];

    // NEW: Voice Profile for voice consistency (Phase 1)
    voiceProfile?: VoiceProfile;

    // NEW: Canonical Facts for continuity checking (Phase 1)
    canonicalFacts?: CanonicalFact[];

    // NEW: Related items linking
    worldId?: string;  // Link to associated world

    // NEW: Custom user-created sections
    customSections?: {
        id: string;
        title: string;
        content: string;
        order: number;
        type?: 'text' | 'gallery'; // Section type: text content or image gallery
        galleryImages?: string[]; // Array of image URLs for gallery sections
        galleryVideos?: string[]; // Array of video URLs for gallery sections
        galleryItems?: Array<{
            id: string;
            url: string;
            type: 'image' | 'video';
            altText?: string;
            caption?: string;
            order: number;
        }>; // Detailed gallery items with metadata
        galleryDisplayType?: 'grid' | 'masonry' | 'slideshow' | 'card' | 'carousel'; // Display layout for gallery
        insertAfter?: string; // ID of the section (prose or custom) to insert after
        // Image attachment for text sections
        attachedImage?: {
            url: string;
            aspectRatio: string; // e.g., "1:1", "16:9", "9:16", "3:4", "4:3"
            position: { x: number; y: number; scale: number };
            size?: 'small' | 'medium' | 'large';
            name?: string;
            altText?: string;
            caption?: string;
        };
    }[];

    // NEW: Trashed sections (30-day recycle bin)
    trashedSections?: {
        id: string;
        title: string;
        content: string;
        deletedAt: Date;
        sourceEntityId: string;
    }[];

    // NEW: Customizable quick navigation sections (bottom nav bar)
    quickNavSections?: string[]; // Array of section IDs to show in bottom nav

    createdAt: Date;
    updatedAt: Date;
}

export type OperationalMode = 'Basic' | 'Advanced' | 'Simulation' | 'Analysis' | 'Worldbuilding' | 'Export';
