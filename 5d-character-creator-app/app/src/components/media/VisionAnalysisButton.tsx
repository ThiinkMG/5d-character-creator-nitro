'use client';

/**
 * VisionAnalysisButton Component
 * 
 * Button to trigger vision analysis on images and display results
 */

import React, { useState } from 'react';
import { Eye, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { UserAsset, VisionAnalysis } from '@/types/user-asset';
import { Button } from '@/components/ui/button';
import { getChatApiKey, getApiConfig } from '@/lib/api-keys';
import { compressImageDataUrl, shouldCompressImage } from '@/lib/vision-analysis';

interface VisionAnalysisButtonProps {
    asset: UserAsset;
    className?: string;
    size?: 'sm' | 'md';
    showLabel?: boolean;
}

export function VisionAnalysisButton({ 
    asset, 
    className,
    size = 'sm',
    showLabel = false 
}: VisionAnalysisButtonProps) {
    const { updateUserAssetVisionAnalysis } = useStore();
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Only show for images
    if (asset.type !== 'image') {
        return null;
    }

    const handleAnalyze = async () => {
        if (!asset.dataUrl) {
            setError('Image data not available');
            return;
        }

        setAnalyzing(true);
        setError(null);

        try {
            const apiConfig = getApiConfig();
            const provider = apiConfig.provider || 'anthropic';
            const apiKey = getChatApiKey(provider);
            const isAdminMode = typeof window !== 'undefined' && localStorage.getItem('5d-admin-mode') === 'true';

            if (!apiKey) {
                throw new Error(`API key required for ${provider === 'openai' ? 'OpenAI' : 'Anthropic'}`);
            }

            // Compress image if needed
            let imageDataUrl = asset.dataUrl;
            if (shouldCompressImage(imageDataUrl)) {
                try {
                    imageDataUrl = await compressImageDataUrl(imageDataUrl);
                } catch (compressError) {
                    console.warn('Image compression failed, proceeding with original:', compressError);
                }
            }

            // Call vision API
            const response = await fetch('/api/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageDataUrl,
                    provider: provider === 'openai' ? 'openai' : 'claude',
                    apiKey,
                    isAdminMode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Vision analysis failed');
            }

            const { analysis } = await response.json();
            
            // Update asset with vision analysis
            updateUserAssetVisionAnalysis(
                asset.id,
                analysis as VisionAnalysis,
                provider === 'openai' ? 'openai' : 'claude'
            );
        } catch (err) {
            console.error('Vision analysis error:', err);
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const hasAnalysis = !!asset.visionAnalysis;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {hasAnalysis && (
                <div className="flex items-center gap-1 text-xs text-green-400/80" title="Vision analysis available">
                    <CheckCircle2 className="w-3 h-3" />
                    {showLabel && <span>Analyzed</span>}
                </div>
            )}
            <Button
                size={size}
                variant="ghost"
                onClick={handleAnalyze}
                disabled={analyzing || !asset.dataUrl}
                className={cn(
                    "text-white/70 hover:text-white",
                    hasAnalysis && "text-green-400/80 hover:text-green-400"
                )}
                title={hasAnalysis ? 'Re-analyze image' : 'Analyze image with AI vision'}
            >
                {analyzing ? (
                    <>
                        <Loader2 className={cn("animate-spin", size === 'sm' ? "w-4 h-4" : "w-5 h-5")} />
                        {showLabel && <span className="ml-2">Analyzing...</span>}
                    </>
                ) : (
                    <>
                        {hasAnalysis ? (
                            <Sparkles className={cn(size === 'sm' ? "w-4 h-4" : "w-5 h-5")} />
                        ) : (
                            <Eye className={cn(size === 'sm' ? "w-4 h-4" : "w-5 h-5")} />
                        )}
                        {showLabel && <span className="ml-2">{hasAnalysis ? 'Re-analyze' : 'Analyze'}</span>}
                    </>
                )}
            </Button>
            {error && (
                <div className="flex items-center gap-1 text-xs text-red-400" title={error}>
                    <AlertCircle className="w-3 h-3" />
                </div>
            )}
        </div>
    );
}
