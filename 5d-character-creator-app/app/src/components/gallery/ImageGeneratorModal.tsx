'use client';

import React, { useState } from 'react';
import { Wand2, Globe, Sparkles, ExternalLink, Info, X, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageProvider } from '@/types/image-config';

interface ImageGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string, provider: ImageProvider) => Promise<void>;
    onUpload?: (dataUrl: string) => void;
    itemName?: string;
    initialMode?: 'generate' | 'upload';
}

export function ImageGeneratorModal({ isOpen, onClose, onGenerate, onUpload, itemName, initialMode = 'generate' }: ImageGeneratorModalProps) {
    const [mode, setMode] = useState<'generate' | 'upload'>(initialMode);

    // Reset/Sync mode when isOpen or initialMode changes
    React.useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode]);
    const [prompt, setPrompt] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<ImageProvider>('free');
    const [isGenerating, setIsGenerating] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);

    // Load config from localStorage
    const savedConfig = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('5d-api-config') || '{}')
        : {};

    // Check key availability
    const hasGeminiKey = !!savedConfig.geminiKey;
    const hasDalleKey = !!(savedConfig.dalleKey || savedConfig.openaiKey);

    const providers = [
        {
            id: 'free' as const,
            name: 'Free Generator',
            description: 'No API key required',
            available: true,
            icon: Sparkles
        },
        {
            id: 'gemini' as const,
            name: 'Google Gemini',
            description: hasGeminiKey ? 'API key configured' : 'Requires API key',
            available: hasGeminiKey,
            icon: Globe
        },
        {
            id: 'dalle' as const,
            name: 'DALL-E',
            description: hasDalleKey ? 'API key configured' : 'Requires API key',
            available: hasDalleKey,
            icon: Wand2
        },
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        try {
            await onGenerate(prompt, selectedProvider);
            onClose();
        } catch (error) {
            console.error('Generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileChange = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleUploadConfirm = () => {
        if (uploadPreview && onUpload) {
            onUpload(uploadPreview);
            onClose();
            // Reset state
            setUploadPreview(null);
            setMode('generate');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden glass-card border border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-orange-600">
                            <Wand2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white tracking-tight">
                                Change Image
                            </h2>
                            {itemName && (
                                <p className="text-sm text-muted-foreground">for {itemName}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Mode Tabs */}
                {onUpload && (
                    <div className="flex border-b border-white/5 px-6">
                        <button
                            onClick={() => setMode('generate')}
                            className={cn(
                                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                mode === 'generate'
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-white"
                            )}
                        >
                            AI Generator
                        </button>
                        <button
                            onClick={() => setMode('upload')}
                            className={cn(
                                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                mode === 'upload'
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-white"
                            )}
                        >
                            Upload Image
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-6">
                    {mode === 'generate' ? (
                        <>
                            {/* Prompt Input */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Image Description
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="A weathered warrior standing in a field of crimson flowers, dramatic lighting, cinematic composition..."
                                    className="w-full h-32 px-4 py-3 rounded-xl premium-input resize-none"
                                />
                            </div>

                            {/* Provider Selection */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-3">
                                    Image Generator
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {providers.map((provider) => {
                                        const Icon = provider.icon;
                                        const isSelected = selectedProvider === provider.id;
                                        const isDisabled = !provider.available && provider.id !== 'free';

                                        return (
                                            <button
                                                key={provider.id}
                                                onClick={() => !isDisabled && setSelectedProvider(provider.id)}
                                                disabled={isDisabled}
                                                className={cn(
                                                    "relative p-4 rounded-xl text-left transition-all border",
                                                    isDisabled && "opacity-40 cursor-not-allowed",
                                                    isSelected
                                                        ? "border-primary bg-primary/10"
                                                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                                                )}
                                            >
                                                <Icon className={cn(
                                                    "w-5 h-5 mb-2",
                                                    isSelected ? "text-primary" : "text-muted-foreground"
                                                )} />
                                                <div className="text-sm font-medium text-white">{provider.name}</div>
                                                <div className="text-xs text-muted-foreground mt-1">{provider.description}</div>

                                                {isDisabled && (
                                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                                                        <a
                                                            href="/settings"
                                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Add API Key <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-muted-foreground">
                                    <p className="font-medium text-white/80 mb-1">Image Generation API Keys</p>
                                    <p>
                                        The free generator works without any setup. For higher quality results,
                                        configure Gemini or DALL-E API keys in{' '}
                                        <a href="/settings" className="text-primary hover:underline">
                                            Settings &rarr; Image Generation
                                        </a>.
                                    </p>
                                </div>
                            </div>

                        </>
                    ) : (
                        <div className="space-y-6">
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                                    dragActive ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                                )}
                                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="p-4 rounded-full bg-white/5">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-white mb-1">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            SVG, PNG, JPG or GIF (max. 5MB)
                                        </p>
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>

                            {uploadPreview && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Preview</p>
                                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                                        <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setUploadPreview(null)}
                                            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="glass">
                        Cancel
                    </Button>
                    {mode === 'generate' ? (
                        <Button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                            className="premium-button"
                        >
                            {isGenerating ? (
                                'Generating...'
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleUploadConfirm}
                            disabled={!uploadPreview}
                            className="premium-button"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Use Image
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
