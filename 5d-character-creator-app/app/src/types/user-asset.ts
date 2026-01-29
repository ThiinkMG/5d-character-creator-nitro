/**
 * User Asset Types
 * 
 * Represents files uploaded by users for use as references in AI chats
 */

export type UserAssetType = 'image' | 'document' | 'video';

/**
 * Vision analysis result from AI vision APIs
 */
export interface VisionAnalysis {
    description: string; // Detailed description of image content
    detectedObjects?: string[]; // Objects, characters, items detected
    sceneDescription?: string; // Overall scene context
    characterDetails?: { // If character image
        appearance: string;
        clothing: string;
        pose: string;
        expression: string;
    };
    style?: string; // Art style, medium
    colors?: string[]; // Dominant colors
    analyzedAt: Date;
    provider: 'claude' | 'openai';
    model: string; // Model used
}

export interface UserAsset {
    id: string;
    name: string;
    type: UserAssetType;
    mimeType: string;
    size: number; // in bytes
    dataUrl: string; // Base64 data URL for storage
    thumbnailUrl?: string; // For images/videos
    uploadedAt: Date;
    updatedAt: Date;
    
    // Metadata
    description?: string;
    tags?: string[];
    
    // For documents: extracted text content
    extractedText?: string;
    
    // For images: alt text, dimensions
    imageWidth?: number;
    imageHeight?: number;
    altText?: string;
    
    // Vision analysis (for images)
    visionAnalysis?: VisionAnalysis;
    visionAnalysisProvider?: 'claude' | 'openai';
    visionAnalyzedAt?: Date;
    
    // Usage tracking
    usedInChats?: string[]; // Chat session IDs where this asset was used
    lastUsedAt?: Date;
}

export interface ChatAttachment {
    assetId: string;
    attachedAt: Date;
}
