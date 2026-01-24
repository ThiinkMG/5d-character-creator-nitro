'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Loader2, ToggleLeft, ToggleRight, Copy, Check } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AIGenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (content: string) => void;
    fieldLabel?: string;
    entityContext?: Record<string, any>;
}

export function AIGenerateModal({
    isOpen,
    onClose,
    onInsert,
    fieldLabel = 'content',
    entityContext
}: AIGenerateModalProps) {
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [usePageContext, setUsePageContext] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    const [configError, setConfigError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            setGeneratedContent('');
            setError(null);
            setCopied(false);

            // Check for API configuration
            const savedConfig = localStorage.getItem('5d-api-config');
            if (!savedConfig) {
                setConfigError('API not configured');
            } else {
                try {
                    const config = JSON.parse(savedConfig);
                    const apiKey = config.provider === 'openai' ? config.openaiKey : config.anthropicKey;
                    if (!apiKey) {
                        setConfigError('API key not found');
                    } else {
                        setConfigError(null);
                    }
                } catch (e) {
                    setConfigError('Invalid configuration');
                }
            }
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setGeneratedContent('');

        console.log('Starting generation...');

        try {
            // Get API config from localStorage
            const savedConfig = localStorage.getItem('5d-api-config');
            if (!savedConfig) {
                throw new Error('API not configured. Please set up your API key in Settings.');
            }

            const config = JSON.parse(savedConfig);
            const apiKey = config.provider === 'openai' ? config.openaiKey : config.anthropicKey;

            if (!apiKey) {
                throw new Error('API key not found. Please configure in Settings.');
            }

            // Build context-aware prompt
            let systemPrompt = `You are a creative writing assistant helping to generate ${fieldLabel} for a character/world profile. 
Generate content that is vivid, specific, and fits naturally with the overall narrative.
Respond ONLY with the generated content, no explanations or preamble.`;

            let userPrompt = prompt;

            if (usePageContext && entityContext) {
                systemPrompt += `\n\nCONTEXT (Use this character/world data to inform your writing for the ${fieldLabel} section):\n${JSON.stringify(entityContext, null, 2)}`;
            }

            // Combine system and user prompt to avoid "role: system" issues with some providers
            const fullPrompt = `${systemPrompt}\n\nTask: ${userPrompt}`;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'user', content: fullPrompt }
                    ],
                    provider: config.provider || 'anthropic',
                    apiKey
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Generation failed:', errorData);
                throw new Error(errorData.error || 'Generation failed');
            }

            // Stream the response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let content = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    content += chunk;
                    setGeneratedContent(prev => prev + chunk); // Use functional update for streaming
                }
            }
        } catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInsert = () => {
        onInsert(generatedContent);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleGenerate();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Generate with AI
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Generate {fieldLabel}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Config Warning */}
                    {configError && (
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm flex items-start gap-3">
                            <div className="p-1 bg-yellow-500/20 rounded">
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div>
                                <strong className="block mb-1">AI Setup Required</strong>
                                <p className="text-white/70 mb-2">
                                    To use AI generation, you need to configure your API keys in Settings.
                                </p>
                                <a href="/settings" className="text-primary hover:underline">
                                    Go to Settings &rarr;
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Context Toggle */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Use <strong>{fieldLabel}</strong> context for generation
                            </span>
                        </div>
                        <button
                            onClick={() => setUsePageContext(!usePageContext)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
                                usePageContext
                                    ? "bg-primary/20 text-primary"
                                    : "bg-white/5 text-white/50"
                            )}
                        >
                            {usePageContext ? (
                                <>
                                    <ToggleRight className="w-4 h-4" />
                                    On
                                </>
                            ) : (
                                <>
                                    <ToggleLeft className="w-4 h-4" />
                                    Off
                                </>
                            )}
                        </button>
                    </div>

                    {/* Prompt Input */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                            Instructions
                        </label>
                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!!configError || isGenerating}
                            placeholder={configError ? "Please configure API keys first..." : `Describe what you want to generate for ${fieldLabel}...`}
                            className="w-full h-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 
                                       text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50
                                       resize-none transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {!configError && (
                            <p className="text-xs text-white/30 mt-1">
                                Press Ctrl+Enter to generate
                            </p>
                        )}
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating || !!configError}
                        className="w-full bg-primary hover:bg-primary/90"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); console.log('Spinner clicked') }}>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate
                            </>
                        )}
                    </Button>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Generated Content */}
                    {generatedContent && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Generated Content
                                </label>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3 h-3" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-white/80 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {generatedContent}
                            </div>
                            <Button
                                onClick={handleInsert}
                                className="w-full bg-emerald-600 hover:bg-emerald-500"
                                disabled={isGenerating}
                            >
                                Insert Content
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
