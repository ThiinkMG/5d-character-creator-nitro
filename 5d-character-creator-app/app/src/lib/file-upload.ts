/**
 * File Upload Utilities
 * Handles file processing, conversion to UserAsset format, and text extraction
 */

import { UserAsset, UserAssetType } from '@/types/user-asset';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export function getFileType(mimeType: string): UserAssetType | null {
    if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) return 'image';
    if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
    if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) return 'video';
    return null;
}

export function isFileSupported(file: File): boolean {
    const type = getFileType(file.type);
    return type !== null && file.size <= MAX_FILE_SIZE;
}

/**
 * Convert File to base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Extract text from document files
 */
export async function extractTextFromFile(file: File): Promise<string | undefined> {
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
        return file.text();
    }
    
    if (file.type === 'application/pdf') {
        // PDF text extraction would require a library like pdf.js
        // For now, return undefined - can be enhanced later
        return undefined;
    }
    
    if (file.type.includes('word') || file.type.includes('document')) {
        // Word document extraction would require a library
        // For now, return undefined - can be enhanced later
        return undefined;
    }
    
    return undefined;
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}

/**
 * Create thumbnail for image (resize to max 200x200)
 */
export function createThumbnail(file: File, maxSize: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }
            
            // Calculate dimensions maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxSize) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for thumbnail'));
        };
        
        img.src = url;
    });
}

/**
 * Process uploaded file and create UserAsset
 */
export async function processUploadedFile(file: File): Promise<Omit<UserAsset, 'id' | 'uploadedAt' | 'updatedAt'>> {
    if (!isFileSupported(file)) {
        throw new Error(`File type ${file.type} not supported or file too large`);
    }
    
    const type = getFileType(file.type);
    if (!type) {
        throw new Error('Unsupported file type');
    }
    
    const dataUrl = await fileToDataUrl(file);
    const now = new Date();
    
    const baseAsset: Omit<UserAsset, 'id' | 'uploadedAt' | 'updatedAt'> = {
        name: file.name,
        type,
        mimeType: file.type,
        size: file.size,
        dataUrl,
        uploadedAt: now,
        updatedAt: now,
    };
    
    // Process based on type
    if (type === 'image') {
        try {
            const dimensions = await getImageDimensions(file);
            const thumbnail = await createThumbnail(file);
            return {
                ...baseAsset,
                imageWidth: dimensions.width,
                imageHeight: dimensions.height,
                thumbnailUrl: thumbnail,
            };
        } catch (error) {
            console.warn('Failed to process image dimensions/thumbnail:', error);
            return baseAsset;
        }
    }
    
    if (type === 'document') {
        try {
            const extractedText = await extractTextFromFile(file);
            return {
                ...baseAsset,
                extractedText,
            };
        } catch (error) {
            console.warn('Failed to extract text from document:', error);
            return baseAsset;
        }
    }
    
    return baseAsset;
}
