// Import CanonicalFact from character types
import type { CanonicalFact } from './character';

export interface World {
    id: string; // WID like @VIRELITH_501
    name: string;
    aliases?: string[];              // NEW: Alternate names for fuzzy matching in @ mentions
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
    
    // NEW: Attached images for prose sections
    proseImages?: {
        overview?: { url: string; aspectRatio: string; position: { x: number; y: number; scale: number }; size?: 'small' | 'medium' | 'large'; name?: string; altText?: string; caption?: string };
        history?: { url: string; aspectRatio: string; position: { x: number; y: number; scale: number }; size?: 'small' | 'medium' | 'large'; name?: string; altText?: string; caption?: string };
        factions?: { url: string; aspectRatio: string; position: { x: number; y: number; scale: number }; size?: 'small' | 'medium' | 'large'; name?: string; altText?: string; caption?: string };
        geography?: { url: string; aspectRatio: string; position: { x: number; y: number; scale: number }; size?: 'small' | 'medium' | 'large'; name?: string; altText?: string; caption?: string };
    };

    // Visuals
    imageUrl?: string;
    infoboxImageUrl?: string; // Separate image for infobox sidebar (if not set, uses imageUrl)
    imageSource?: 'preset' | 'uploaded' | 'generated';
    imageCaption?: string;
    headerImagePosition?: { x: number; y: number }; // Position offset for header image (for drag-to-reposition)

    // NEW: Gallery display
    cardSize?: 'small' | 'medium' | 'large' | 'wide' | 'tall';

    // NEW: Extended content for wiki view
    tagline?: string;
    factions?: { name: string; description: string; alignment?: string }[];
    locations?: { name: string; description: string }[];
    magicSystem?: string;
    technology?: string;

    // NEW: Canonical Facts for continuity checking (Phase 1)
    canonicalFacts?: CanonicalFact[];

    // NEW: Linked characters
    characterIds?: string[];

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
    
    // NEW: Customizable quick navigation sections (bottom nav bar)
    quickNavSections?: string[]; // Array of section IDs to show in bottom nav

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
