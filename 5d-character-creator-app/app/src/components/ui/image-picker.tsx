'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Wand2, Upload, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageGeneratorModal } from '@/components/gallery';
import { ImageProvider } from '@/types/image-config';
import { cn } from '@/lib/utils';
import { getApiConfigForImageGeneration } from '@/lib/api-keys';

interface ImagePickerProps {
    value: string | null;
    onChange: (imageUrl: string | null, source?: 'ai-generated' | 'uploaded') => void;
    label?: string;
    placeholder?: string;
    className?: string;
    aspectRatio?: 'square' | 'video' | 'auto';
    size?: 'sm' | 'md' | 'lg';
}

export function ImagePicker({
    value,
    onChange,
    label = 'Image',
    placeholder = 'No image selected',
    className,
    aspectRatio = 'video',
    size = 'md'
}: ImagePickerProps) {
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModalMode, setImageModalMode] = useState<'generate' | 'upload'>('generate');
    const [isGenerating, setIsGenerating] = useState(false);

    const sizeClasses = {
        sm: 'w-24 h-16',
        md: 'w-32 h-20',
        lg: 'w-48 h-32'
    };

    const aspectClasses = {
        square: 'aspect-square',
        video: 'aspect-video',
        auto: ''
    };

    const handleGenerateImage = async (prompt: string, provider: ImageProvider): Promise<string | null> => {
        setIsGenerating(true);
        try {
            // Use utility function to get keys (checks admin keys first)
            const savedConfig = getApiConfigForImageGeneration();

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(savedConfig.geminiKey && { 'x-gemini-key': savedConfig.geminiKey }),
                    ...(savedConfig.openaiKey && { 'x-openai-key': savedConfig.openaiKey }),
                    ...(savedConfig.dalleKey && { 'x-openai-key': savedConfig.dalleKey }),
                },
                body: JSON.stringify({ prompt, provider }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.imageUrl) {
                    onChange(data.imageUrl, 'ai-generated');
                    setImageModalOpen(false);
                    return data.imageUrl;
                }
                return null;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate image');
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
            throw error;
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUploadImage = (dataUrl: string) => {
        onChange(dataUrl, 'uploaded');
        setImageModalOpen(false);
    };

    return (
        <>
            <div className={cn("space-y-2", className)}>
                {label && (
                    <label className="text-sm font-medium text-white mb-2 block">
                        {label}
                    </label>
                )}

                {/* Preview Area */}
                <div className="flex items-start gap-3">
                    {/* Image Preview */}
                    <div className={cn(
                        "relative rounded-lg border border-white/10 overflow-hidden bg-white/5 shrink-0 group",
                        sizeClasses[size],
                        aspectClasses[aspectRatio]
                    )}>
                        {value ? (
                            <>
                                <img
                                    src={value}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => onChange(null)}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title="Remove image"
                                    type="button"
                                >
                                    <X className="w-3.5 h-3.5 text-white" />
                                </button>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className={cn(
                                    "text-muted-foreground",
                                    size === 'sm' ? "w-6 h-6" : size === 'md' ? "w-8 h-8" : "w-12 h-12"
                                )} />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setImageModalMode('generate');
                                    setImageModalOpen(true);
                                }}
                                disabled={isGenerating}
                                className="flex-1 bg-white/5 border-white/10 hover:bg-white/10"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Generate
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setImageModalMode('upload');
                                    setImageModalOpen(true);
                                }}
                                className="flex-1 bg-white/5 border-white/10 hover:bg-white/10"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload
                            </Button>
                        </div>
                        {value && (
                            <p className="text-xs text-muted-foreground">
                                Image ready to save
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Generator Modal */}
            {imageModalOpen && (
                <ImageGeneratorModal
                    isOpen={imageModalOpen}
                    onClose={() => {
                        setImageModalOpen(false);
                    }}
                    onGenerate={handleGenerateImage}
                    onUpload={handleUploadImage}
                    itemName={placeholder}
                    initialMode={imageModalMode}
                />
            )}
        </>
    );
}
