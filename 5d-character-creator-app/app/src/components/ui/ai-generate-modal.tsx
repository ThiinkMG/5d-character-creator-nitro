'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Loader2, ToggleLeft, ToggleRight, Copy, Check, Users, Globe, Folder } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { MentionInput } from './mention-input';
import { useStore } from '@/lib/store';

interface AIGenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (content: string) => void;
    fieldLabel?: string;
    entityContext?: Record<string, any>;
}

// Utility function to extract mentioned entities from markdown text
function extractMentionedEntities(text: string, store: any): Array<{ type: 'character' | 'world' | 'project'; id: string; name: string; data: any }> {
    const mentions: Array<{ type: 'character' | 'world' | 'project'; id: string; name: string; data: any }> = [];
    
    // Match mention format: [@Name](type:id)
    const mentionRegex = /\[@([^\]]+)\]\((character|world|project):([^)]+)\)/g;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
        const [, name, type, id] = match;
        let entity = null;
        
        if (type === 'character') {
            entity = store.getCharacter(id);
        } else if (type === 'world') {
            entity = store.getWorld(id);
        } else if (type === 'project') {
            entity = store.getProject(id);
        }
        
        if (entity) {
            // Avoid duplicates
            if (!mentions.find(m => m.type === type && m.id === id)) {
                mentions.push({ type: type as 'character' | 'world' | 'project', id, name, data: entity });
            }
        }
    }
    
    return mentions;
}

export function AIGenerateModal({
    isOpen,
    onClose,
    onInsert,
    fieldLabel = 'content',
    entityContext
}: AIGenerateModalProps) {
    const store = useStore();
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [usePageContext, setUsePageContext] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    // Extract mentioned entities from prompt
    const mentionedEntities = useMemo(() => {
        return extractMentionedEntities(prompt, store);
    }, [prompt, store]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // No longer need textareaRef since MentionInput handles its own ref

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

        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

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

            // Build context from page entity and mentioned entities
            const allContexts: any[] = [];
            
            if (usePageContext && entityContext) {
                // Extract only relevant context fields to avoid token limit issues
                const sanitizedContext: Record<string, any> = {};
                
                // Essential fields that are always useful
                const essentialFields = ['name', 'role', 'archetype', 'genre', 'phase', 'tagline', 'coreConcept'];
                essentialFields.forEach(field => {
                    if (entityContext[field] && typeof entityContext[field] === 'string' && entityContext[field].length < 500) {
                        sanitizedContext[field] = entityContext[field];
                    }
                });

                // Include short text fields that might be relevant
                const textFields = ['origin', 'ghost', 'arcType', 'climax'];
                textFields.forEach(field => {
                    if (entityContext[field] && typeof entityContext[field] === 'string' && entityContext[field].length < 1000) {
                        sanitizedContext[field] = entityContext[field];
                    }
                });

                // Include arrays but limit their size
                const arrayFields = ['motivations', 'flaws', 'allies', 'enemies'];
                arrayFields.forEach(field => {
                    if (Array.isArray(entityContext[field]) && entityContext[field].length > 0) {
                        // Limit to first 5 items and ensure strings are short
                        sanitizedContext[field] = entityContext[field]
                            .slice(0, 5)
                            .filter((item: any) => typeof item === 'string' && item.length < 200);
                    }
                });

                // Exclude large fields that aren't needed for context
                // (imageUrl, customSections, trashedSections, etc. are excluded)
                
                allContexts.push({
                    type: 'current_entity',
                    data: sanitizedContext
                });
            }
            
            // Add mentioned entities context
            if (mentionedEntities.length > 0) {
                mentionedEntities.forEach(mention => {
                    // Sanitize entity data similar to page context
                    const sanitized: Record<string, any> = {};
                    const essentialFields = ['name', 'role', 'archetype', 'genre', 'phase', 'tagline', 'coreConcept', 'description', 'summary'];
                    essentialFields.forEach(field => {
                        if (mention.data[field] && typeof mention.data[field] === 'string' && mention.data[field].length < 500) {
                            sanitized[field] = mention.data[field];
                        }
                    });
                    
                    allContexts.push({
                        type: mention.type,
                        name: mention.name,
                        data: sanitized
                    });
                });
            }
            
            // Add context to system prompt
            if (allContexts.length > 0) {
                const contextString = JSON.stringify(allContexts, null, 2);
                const maxContextLength = 8000; // Increased to accommodate multiple entities
                
                if (contextString.length > maxContextLength) {
                    // Truncate but keep at least the current entity
                    const truncated = allContexts.slice(0, 1);
                    systemPrompt += `\n\nCONTEXT (Use this data to inform your writing for the ${fieldLabel} section):\n${JSON.stringify(truncated, null, 2)}`;
                } else {
                    systemPrompt += `\n\nCONTEXT (Use this data to inform your writing for the ${fieldLabel} section. The current_entity is the main entity being edited, and other entries are referenced entities):\n${contextString}`;
                }
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
            reader = response.body?.getReader() || null;
            const decoder = new TextDecoder();

            if (reader) {
                while (true) {
                    // Check if component is still mounted before reading
                    if (!mounted) {
                        reader.cancel();
                        break;
                    }

                    const { done, value } = await reader.read();
                    if (done) break;

                    // Check again after async operation
                    if (!mounted) {
                        reader.cancel();
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    // Only update state if component is still mounted
                    if (mounted) {
                        setGeneratedContent(prev => prev + chunk);
                    }
                }
            }
        } catch (err) {
            console.error('Generation error:', err);
            // Only set error if component is still mounted
            if (mounted) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        } finally {
            // Clean up reader if still active
            if (reader) {
                try {
                    reader.cancel();
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
            // Only update loading state if component is still mounted
            if (mounted) {
                setIsGenerating(false);
            }
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
    
    const handlePromptKeyDown = (e: React.KeyboardEvent) => {
        handleKeyDown(e);
    };

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                onContextMenu={(e) => {
                    // Allow context menu on backdrop, but close modal if clicking backdrop
                    if (e.target === e.currentTarget) {
                        e.preventDefault();
                    }
                }}
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
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/2 border border-white/5">
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

                    {/* Attached Entities Display */}
                    {mentionedEntities.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                                Attached Entities ({mentionedEntities.length})
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {mentionedEntities.map((entity, idx) => {
                                    const Icon = entity.type === 'character' ? Users : entity.type === 'world' ? Globe : Folder;
                                    const colorClass = entity.type === 'character' 
                                        ? 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                                        : entity.type === 'world'
                                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                                    
                                    return (
                                        <div
                                            key={`${entity.type}-${entity.id}-${idx}`}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border",
                                                colorClass
                                            )}
                                        >
                                            <Icon className="w-3 h-3" />
                                            <span>{entity.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                            Instructions {mentionedEntities.length > 0 && <span className="text-primary">(Use @ to link entities)</span>}
                        </label>
                        <MentionInput
                            value={prompt}
                            onChange={setPrompt}
                            onKeyDown={handlePromptKeyDown}
                            placeholder={configError ? "Please configure API keys first..." : `Describe what you want to generate for ${fieldLabel}. Use @ to link characters, worlds, or projects for context...`}
                            disabled={!!configError || isGenerating}
                            multiline
                            minRows={4}
                            className="w-full"
                        />
                        {!configError && (
                            <p className="text-xs text-white/30 mt-1">
                                Press Ctrl+Enter to generate • Type @ to mention entities for context
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
                        <div 
                            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                            onContextMenu={(e) => {
                                // Allow context menu (right-click) to work normally for text selection and autocorrect
                                e.stopPropagation();
                            }}
                        >
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
                            <div 
                                className="p-4 rounded-lg bg-white/2 border border-white/5 text-sm text-white/80 whitespace-pre-wrap max-h-48 overflow-y-auto"
                                onContextMenu={(e) => {
                                    // Allow context menu (right-click) to work normally
                                    e.stopPropagation();
                                }}
                            >
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
