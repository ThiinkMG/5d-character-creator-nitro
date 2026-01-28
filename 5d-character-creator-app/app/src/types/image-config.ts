export type ImageProvider = 'free' | 'gemini' | 'dalle';

export interface ImageGeneratorConfig {
    provider: ImageProvider;
    geminiKeyConfigured: boolean;
    dalleKeyConfigured: boolean;
}

export interface ImageGenerationRequest {
    prompt: string;
    provider: ImageProvider;
    style?: 'portrait' | 'landscape' | 'square';
}
