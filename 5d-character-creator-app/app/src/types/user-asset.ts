/**
 * User Asset Types
 * 
 * Represents files uploaded by users for use as references in AI chats
 */

export type UserAssetType = 'image' | 'document' | 'video';

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
    
    // Usage tracking
    usedInChats?: string[]; // Chat session IDs where this asset was used
    lastUsedAt?: Date;
}

export interface ChatAttachment {
    assetId: string;
    attachedAt: Date;
}
