/**
 * Vision Analysis Service
 * 
 * Provides image analysis using Claude Vision and GPT-4 Vision APIs
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { VisionAnalysis } from '@/types/user-asset';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB max for Claude Vision

/**
 * Get the appropriate vision model based on provider
 */
function getVisionModel(provider: 'claude' | 'openai', apiKey: string) {
    if (provider === 'openai') {
        const openai = createOpenAI({ apiKey });
        return openai('gpt-4o'); // GPT-4o supports vision
    } else {
        const anthropic = createAnthropic({ apiKey });
        return anthropic('claude-3-5-sonnet-20241022'); // Claude 3.5 Sonnet supports vision
    }
}

/**
 * Extract base64 data from data URL
 */
function extractBase64FromDataUrl(dataUrl: string): string {
    // Remove data:image/...;base64, prefix
    const base64Match = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (base64Match) {
        return base64Match[1];
    }
    // If already base64, return as-is
    return dataUrl;
}

/**
 * Analyze image with Claude Vision API
 */
async function analyzeWithClaude(
    imageDataUrl: string,
    apiKey: string,
    prompt?: string
): Promise<VisionAnalysis> {
    const model = getVisionModel('claude', apiKey);
    const base64Image = extractBase64FromDataUrl(imageDataUrl);
    
    const analysisPrompt = prompt || `Analyze this image in detail. Provide:
1. A comprehensive description of what you see
2. Any objects, characters, or items detected
3. The overall scene context
4. If this appears to be a character, describe their appearance, clothing, pose, and expression
5. The art style or medium (if applicable)
6. Dominant colors

Format your response as structured information that can be used for character creation and worldbuilding.`;

    try {
        const result = await generateText({
            model,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            image: base64Image,
                        },
                        {
                            type: 'text',
                            text: analysisPrompt,
                        },
                    ],
                },
            ],
        });

        const description = result.text;
        
        // Extract structured information from the response
        const detectedObjects: string[] = [];
        let sceneDescription: string | undefined;
        let characterDetails: VisionAnalysis['characterDetails'];
        let style: string | undefined;
        const colors: string[] = [];

        // Try to parse structured information from the response
        // This is a simple parser - could be enhanced with structured output in the future
        const lines = description.split('\n');
        let currentSection: string | null = null;
        
        for (const line of lines) {
            const lowerLine = line.toLowerCase().trim();
            
            if (lowerLine.includes('scene') || lowerLine.includes('setting') || lowerLine.includes('context')) {
                sceneDescription = line.replace(/^[-*•]\s*/, '').trim();
            }
            
            if (lowerLine.includes('style') || lowerLine.includes('medium') || lowerLine.includes('art')) {
                style = line.replace(/^[-*•]\s*/, '').trim();
            }
            
            if (lowerLine.includes('color')) {
                const colorMatch = line.match(/(?:colors?|palette):\s*(.+)/i);
                if (colorMatch) {
                    colors.push(...colorMatch[1].split(',').map(c => c.trim()));
                }
            }
            
            // Detect character details
            if (lowerLine.includes('appearance') || lowerLine.includes('character')) {
                currentSection = 'character';
            }
        }

        return {
            description,
            detectedObjects: detectedObjects.length > 0 ? detectedObjects : undefined,
            sceneDescription,
            characterDetails,
            style,
            colors: colors.length > 0 ? colors : undefined,
            analyzedAt: new Date(),
            provider: 'claude',
            model: 'claude-3-5-sonnet-20241022',
        };
    } catch (error) {
        console.error('[Vision Analysis] Claude error:', error);
        throw new Error(`Claude Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Analyze image with GPT-4 Vision API
 */
async function analyzeWithGPT4(
    imageDataUrl: string,
    apiKey: string,
    prompt?: string
): Promise<VisionAnalysis> {
    const model = getVisionModel('openai', apiKey);
    const base64Image = extractBase64FromDataUrl(imageDataUrl);
    
    const analysisPrompt = prompt || `Analyze this image in detail. Provide:
1. A comprehensive description of what you see
2. Any objects, characters, or items detected
3. The overall scene context
4. If this appears to be a character, describe their appearance, clothing, pose, and expression
5. The art style or medium (if applicable)
6. Dominant colors

Format your response as structured information that can be used for character creation and worldbuilding.`;

    try {
        const result = await generateText({
            model,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            image: base64Image,
                        },
                        {
                            type: 'text',
                            text: analysisPrompt,
                        },
                    ],
                },
            ],
        });

        const description = result.text;
        
        // Extract structured information from the response
        const detectedObjects: string[] = [];
        let sceneDescription: string | undefined;
        let characterDetails: VisionAnalysis['characterDetails'];
        let style: string | undefined;
        const colors: string[] = [];

        // Try to parse structured information from the response
        const lines = description.split('\n');
        
        for (const line of lines) {
            const lowerLine = line.toLowerCase().trim();
            
            if (lowerLine.includes('scene') || lowerLine.includes('setting') || lowerLine.includes('context')) {
                sceneDescription = line.replace(/^[-*•]\s*/, '').trim();
            }
            
            if (lowerLine.includes('style') || lowerLine.includes('medium') || lowerLine.includes('art')) {
                style = line.replace(/^[-*•]\s*/, '').trim();
            }
            
            if (lowerLine.includes('color')) {
                const colorMatch = line.match(/(?:colors?|palette):\s*(.+)/i);
                if (colorMatch) {
                    colors.push(...colorMatch[1].split(',').map(c => c.trim()));
                }
            }
        }

        return {
            description,
            detectedObjects: detectedObjects.length > 0 ? detectedObjects : undefined,
            sceneDescription,
            characterDetails,
            style,
            colors: colors.length > 0 ? colors : undefined,
            analyzedAt: new Date(),
            provider: 'openai',
            model: 'gpt-4o',
        };
    } catch (error) {
        console.error('[Vision Analysis] GPT-4 error:', error);
        throw new Error(`GPT-4 Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Main function to analyze an image with vision API
 * Automatically selects provider based on available API keys
 */
export async function analyzeImageWithVision(
    imageDataUrl: string,
    apiKey: string,
    provider: 'claude' | 'openai' = 'claude',
    customPrompt?: string
): Promise<VisionAnalysis> {
    // Validate image size (rough check on data URL length)
    if (imageDataUrl.length > MAX_IMAGE_SIZE) {
        throw new Error(`Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }

    if (provider === 'openai') {
        return analyzeWithGPT4(imageDataUrl, apiKey, customPrompt);
    } else {
        return analyzeWithClaude(imageDataUrl, apiKey, customPrompt);
    }
}

/**
 * Check if an image needs compression before sending to API
 */
export function shouldCompressImage(dataUrl: string, maxSize: number = 10 * 1024 * 1024): boolean {
    return dataUrl.length > maxSize;
}

/**
 * Compress image data URL (resize if needed)
 */
export async function compressImageDataUrl(
    dataUrl: string,
    maxWidth: number = 2048,
    maxHeight: number = 2048,
    quality: number = 0.85
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG with quality setting
            const mimeType = 'image/jpeg';
            const compressedDataUrl = canvas.toDataURL(mimeType, quality);
            resolve(compressedDataUrl);
        };

        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = dataUrl;
    });
}
