export interface CharacterDocument {
    id: string;
    characterId: string;
    type: 'script' | 'roleplay';
    title: string;
    content: string; // Markdown or formatted content
    thumbnail?: string; // Image URL for thumbnail
    image?: string; // Main document image
    imageSource?: 'ai-generated' | 'uploaded' | 'preset';
    createdAt: Date;
    updatedAt: Date;
    metadata?: {
        sceneType?: string;
        tone?: string;
        length?: string;
        characters?: string[]; // Character IDs involved
        worlds?: string[]; // World IDs involved
        sessionId?: string; // Related chat session ID
    };
}
