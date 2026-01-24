'use client';

import React, { useState } from 'react';
import { X, Sparkles, Check, RefreshCw, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TimelineEvent } from '@/types/project';

interface StoryEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<TimelineEvent, 'id' | 'order'>) => void;
    projectContext: string; // Summary or Name to help AI
}

export function StoryEventModal({ isOpen, onClose, onSave, projectContext }: StoryEventModalProps) {
    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [title, setTitle] = useState('');
    const [chapter, setChapter] = useState('');
    const [description, setDescription] = useState('');

    // AI State
    const [aiContext, setAiContext] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedOptions, setGeneratedOptions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Reset
    React.useEffect(() => {
        if (isOpen) {
            setMode('manual');
            setTitle('');
            setChapter('');
            setDescription('');
            setAiContext('');
            setGeneratedOptions([]);
            setError(null);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!title.trim() || !description.trim()) return;
        onSave({ title, description, chapter });
        onClose();
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedOptions([]);

        // Get API Key from localStorage (Shared with Chat Page)
        const savedConfig = localStorage.getItem('5d-api-config');
        let apiKey = '';
        let provider = 'anthropic';

        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                provider = config.provider || 'anthropic';
                apiKey = provider === 'openai' ? config.openaiKey : config.anthropicKey;
            } catch (e) {
                console.error("Failed to parse API config", e);
            }
        }

        if (!apiKey) {
            setError("API Key not found. Please configure it in the Chat or Settings page.");
            setIsGenerating(false);
            return;
        }

        try {
            const prompt = `
Context: Project "${projectContext}"
User Query: ${aiContext}

Task: Generate 3 distinct story event ideas that could happen in this story.
Format: JSON Array with objects { "title": "...", "description": "...", "chapter": "..." }.
Keep descriptions concise (1-2 sentences).
IMPORTANT: Return ONLY valid JSON. No markdown formatting.
`;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    provider,
                    apiKey,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to generate response from API");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let resultText = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    resultText += decoder.decode(value, { stream: true });
                }
            }

            // Attempt to parse JSON from the text
            const jsonMatch = resultText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    setGeneratedOptions(parsed);
                } catch (e) {
                    console.error("JSON Parse Error", resultText);
                    setError("AI returned invalid JSON. Please try again.");
                }
            } else {
                console.error("No JSON found in response", resultText);
                setError("AI response did not contain structured data.");
            }

        } catch (err: any) {
            console.error("Generation Error", err);
            setError(err.message || "Failed to generate events.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectOption = (opt: any) => {
        setTitle(opt.title || '');
        setDescription(opt.description || '');
        setChapter(opt.chapter || '');
        setMode('manual'); // Switch to manual to review/save
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl mx-4 rounded-2xl overflow-hidden glass-card border border-white/10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-[#0A0A0F]/95 backdrop-blur-sm z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-cyan-400" />
                            Add Story Event
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-white/[0.02]">
                    <button
                        onClick={() => setMode('manual')}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                            mode === 'manual' ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "border-transparent text-muted-foreground hover:text-white"
                        )}
                    >
                        Manual Entry
                    </button>
                    <button
                        onClick={() => setMode('ai')}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                            mode === 'ai' ? "border-violet-500 text-violet-400 bg-violet-500/5" : "border-transparent text-muted-foreground hover:text-white"
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5 inline mr-2" />
                        Generate with AI
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-[#0A0A0F]/50">
                    {mode === 'manual' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Chapter/Time</label>
                                    <input
                                        value={chapter}
                                        onChange={e => setChapter(e.target.value)}
                                        placeholder="Ch. 1"
                                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-sm"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Event Title *</label>
                                    <input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. The Discovery"
                                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-sm"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description *</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Describe what happens..."
                                    className="w-full h-32 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-sm resize-none"
                                />
                            </div>
                        </div>
                    ) : (
                        /* AI Mode */
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Context / Idea</label>
                                <textarea
                                    value={aiContext}
                                    onChange={e => setAiContext(e.target.value)}
                                    placeholder="e.g. Something dramatic happens that reveals the protagonist's flaw..."
                                    className="w-full h-24 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm resize-none"
                                />
                            </div>

                            {!isGenerating && generatedOptions.length === 0 && (
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={!aiContext.trim()}
                                        className="bg-violet-600 hover:bg-violet-500 text-white"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Ideas
                                    </Button>
                                </div>
                            )}

                            {isGenerating && (
                                <div className="py-8 flex flex-col items-center justify-center text-violet-400 animate-pulse">
                                    <Sparkles className="w-8 h-8 mb-2 spin-slow" />
                                    <span className="text-sm">Dreaming up events...</span>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            {generatedOptions.length > 0 && (
                                <div className="space-y-3 mt-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-white">Suggested Events</h3>
                                        <Button variant="ghost" size="sm" onClick={handleGenerate} className="h-6 text-xs text-muted-foreground hover:text-white">
                                            <RefreshCw className="w-3 h-3 mr-1" /> Try Again
                                        </Button>
                                    </div>
                                    {generatedOptions.map((opt, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelectOption(opt)}
                                            className="group p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {opt.chapter && (
                                                            <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 rounded">{opt.chapter}</span>
                                                        )}
                                                        <span className="text-sm font-medium text-violet-200 group-hover:text-violet-100">{opt.title}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground group-hover:text-white/70 line-clamp-2">{opt.description}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 mt-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {mode === 'manual' && (
                    <div className="p-4 border-t border-white/5 bg-[#0A0A0F]/95 backdrop-blur-sm flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose} className="glass h-9">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!title.trim() || !description.trim()}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white h-9"
                        >
                            Add Event
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
