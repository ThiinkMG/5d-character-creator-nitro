export type DocumentType = 'script' | 'roleplay' | 'notes' | 'backstory' | 'reference' | 'outline' | 'uploaded';

export type ProjectDocumentType =
    | 'movie-pitch'
    | 'tv-series-pitch'
    | 'book-pitch'
    | 'treatment'
    | 'synopsis'
    | 'story-bible'
    | 'imported';

export interface CharacterDocument {
    id: string;
    characterId: string;
    type: DocumentType;
    title: string;
    content: string; // Markdown or formatted content
    thumbnail?: string; // Image URL for thumbnail
    image?: string; // Main document image
    imageSource?: 'ai-generated' | 'uploaded' | 'preset';
    createdAt: Date;
    updatedAt: Date;
    /** Original file info for uploaded documents */
    sourceFile?: {
        name: string;
        type: string; // MIME type
        size: number; // bytes
    };
    metadata?: {
        sceneType?: string;
        tone?: string;
        length?: string;
        characters?: string[]; // Character IDs involved
        worlds?: string[]; // World IDs involved
        sessionId?: string; // Related chat session ID
    };
}

export interface ProjectDocument {
    id: string;
    projectId: string;
    type: ProjectDocumentType;
    title: string;
    content: string; // Markdown or formatted content
    thumbnail?: string; // Image URL for thumbnail
    image?: string; // Main document image
    imageSource?: 'ai-generated' | 'uploaded' | 'preset';
    createdAt: Date;
    updatedAt: Date;
    /** Original file info for uploaded documents */
    sourceFile?: {
        name: string;
        type: string; // MIME type
        size: number; // bytes
    };
    metadata?: {
        sessionId?: string; // Related chat session ID
        characters?: string[]; // Character IDs involved
        worlds?: string[]; // World IDs involved
        sourceItemId?: string; // Original source item ID for imported documents (for duplicate detection)
    };
}

/** Supported file types for upload */
export const SUPPORTED_DOCUMENT_TYPES = {
    'text/markdown': { extension: '.md', label: 'Markdown' },
    'text/plain': { extension: '.txt', label: 'Text' },
    'text/x-markdown': { extension: '.md', label: 'Markdown' },
    'application/json': { extension: '.json', label: 'JSON' },
    'application/pdf': { extension: '.pdf', label: 'PDF' },
} as const;

export const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.json', '.markdown', '.pdf'];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    script: 'Script',
    roleplay: 'Roleplay',
    notes: 'Notes',
    backstory: 'Backstory',
    reference: 'Reference',
    outline: 'Outline',
    uploaded: 'Uploaded',
};

export const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
    script: 'bg-blue-500/20 text-blue-400',
    roleplay: 'bg-purple-500/20 text-purple-400',
    notes: 'bg-amber-500/20 text-amber-400',
    backstory: 'bg-emerald-500/20 text-emerald-400',
    reference: 'bg-cyan-500/20 text-cyan-400',
    outline: 'bg-rose-500/20 text-rose-400',
    uploaded: 'bg-gray-500/20 text-gray-400',
};

export const PROJECT_DOCUMENT_TYPE_LABELS: Record<ProjectDocumentType, string> = {
    'movie-pitch': 'Movie Pitch',
    'tv-series-pitch': 'TV Series Pitch',
    'book-pitch': 'Book Pitch',
    'treatment': 'Treatment',
    'synopsis': 'Synopsis',
    'story-bible': 'Story Bible',
    'imported': 'Imported',
};

export const PROJECT_DOCUMENT_TYPE_COLORS: Record<ProjectDocumentType, string> = {
    'movie-pitch': 'bg-orange-500/20 text-orange-400',
    'tv-series-pitch': 'bg-pink-500/20 text-pink-400',
    'book-pitch': 'bg-indigo-500/20 text-indigo-400',
    'treatment': 'bg-teal-500/20 text-teal-400',
    'synopsis': 'bg-cyan-500/20 text-cyan-400',
    'story-bible': 'bg-violet-500/20 text-violet-400',
    'imported': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export const PROJECT_DOCUMENT_TYPE_DESCRIPTIONS: Record<ProjectDocumentType, string> = {
    'movie-pitch': 'Generate a film pitch deck',
    'tv-series-pitch': 'Generate a TV show pitch bible',
    'book-pitch': 'Generate a book proposal',
    'treatment': 'Detailed narrative summary',
    'synopsis': 'Quick 1-2 page summary',
    'story-bible': 'Comprehensive reference document',
    'imported': 'Imported from linked character or world',
};
