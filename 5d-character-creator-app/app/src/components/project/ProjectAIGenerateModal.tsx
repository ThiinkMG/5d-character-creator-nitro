'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';
import { useStore } from '@/lib/store';

interface ProjectAIGenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onApply: (updates: { description?: string; genre?: string; tags?: string[] }) => void;
}

export function ProjectAIGenerateModal({ isOpen, onClose, project, onApply }: ProjectAIGenerateModalProps) {
    const { characters, worlds } = useStore();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<{
        description?: string;
        genre?: string;
        tags?: string[];
    } | null>(null);
    
    // What to generate
    const [generateDescription, setGenerateDescription] = useState(true);
    const [generateGenre, setGenerateGenre] = useState(false);
    const [generateTags, setGenerateTags] = useState(false);

    // Get project context
    const projectCharacters = characters.filter(c => c.projectId === project.id);
    const projectWorlds = worlds.filter(w => w.projectId === project.id);

    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            setGeneratedContent(null);
            setError(null);
            setGenerateDescription(true);
            setGenerateGenre(false);
            setGenerateTags(false);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt or context for generation');
            return;
        }

        if (!generateDescription && !generateGenre && !generateTags) {
            setError('Please select at least one field to generate');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedContent(null);

        try {
            // Get API config
            const savedConfig = localStorage.getItem('5d-api-config');
            if (!savedConfig) {
                throw new Error('API not configured. Please set up your API key in Settings.');
            }

            const config = JSON.parse(savedConfig);
            const apiKey = config.provider === 'openai' ? config.openaiKey : config.anthropicKey;
            const provider = config.provider || 'anthropic';

            if (!apiKey) {
                throw new Error('API key not found. Please configure in Settings.');
            }

            // Build context
            let contextPrompt = `Project: "${project.name}"
Summary: ${project.summary || 'No summary available'}
Genre: ${project.genre || 'Not specified'}`;

            if (projectCharacters.length > 0) {
                contextPrompt += `\nCharacters: ${projectCharacters.map(c => c.name).join(', ')}`;
            }

            if (projectWorlds.length > 0) {
                contextPrompt += `\nWorlds: ${projectWorlds.map(w => w.name).join(', ')}`;
            }

            // Build generation request
            const fieldsToGenerate: string[] = [];
            if (generateDescription) fieldsToGenerate.push('description');
            if (generateGenre) fieldsToGenerate.push('genre');
            if (generateTags) fieldsToGenerate.push('tags');

            const generationPrompt = `You are helping to generate project metadata for "${project.name}".

${contextPrompt}

User Request: ${prompt}

Task: Generate the following fields based on the project context and user request:
${fieldsToGenerate.map(f => `- ${f}`).join('\n')}

${generateDescription ? 'Description: Write a compelling 2-4 paragraph description of this project that captures its essence, themes, and unique qualities. Make it engaging and specific.' : ''}
${generateGenre ? 'Genre: Suggest an appropriate genre that fits this project. Return just the genre name (e.g., "Fantasy", "Sci-Fi Thriller", "Historical Fiction").' : ''}
${generateTags ? 'Tags: Suggest 2-3 relevant tags (single words or short phrases) that describe this project. Return as a comma-separated list.' : ''}

Return your response as JSON in this format:
{
  ${generateDescription ? '"description": "..."' : ''}
  ${generateGenre ? '"genre": "..."' : ''}
  ${generateTags ? '"tags": ["tag1", "tag2", "tag3"]' : ''}
}

IMPORTANT: Return ONLY valid JSON. No markdown formatting, no explanations.`;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a creative writing assistant. Generate project metadata in JSON format only.'
                        },
                        {
                            role: 'user',
                            content: generationPrompt
                        }
                    ],
                    provider,
                    apiKey,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to generate content');
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

            // Parse JSON from response
            let parsed: any = {};
            try {
                // Try to extract JSON from markdown code blocks if present
                const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || resultText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } else {
                    parsed = JSON.parse(resultText);
                }
            } catch (e) {
                // If JSON parsing fails, try to extract fields manually
                if (generateDescription && resultText.includes('description')) {
                    const descMatch = resultText.match(/"description"\s*:\s*"([^"]+)"/);
                    if (descMatch) parsed.description = descMatch[1];
                }
                if (generateGenre && resultText.includes('genre')) {
                    const genreMatch = resultText.match(/"genre"\s*:\s*"([^"]+)"/);
                    if (genreMatch) parsed.genre = genreMatch[1];
                }
                if (generateTags && resultText.includes('tags')) {
                    const tagsMatch = resultText.match(/"tags"\s*:\s*\[([^\]]+)\]/);
                    if (tagsMatch) {
                        parsed.tags = tagsMatch[1].split(',').map((t: string) => t.trim().replace(/"/g, ''));
                    }
                }
            }

            setGeneratedContent(parsed);
        } catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        if (generatedContent) {
            onApply(generatedContent);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden glass-card border border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0A0A0F]/95 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white tracking-tight">
                                Generate with AI
                            </h2>
                            <p className="text-sm text-muted-foreground">{project.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* What to Generate */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-3">
                            Generate
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                                <button
                                    onClick={() => setGenerateDescription(!generateDescription)}
                                    className="flex items-center justify-center"
                                >
                                    {generateDescription ? (
                                        <CheckSquare className="w-5 h-5 text-cyan-400" />
                                    ) : (
                                        <Square className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-white">Description</span>
                                    <p className="text-xs text-muted-foreground">Generate a compelling project description</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                                <button
                                    onClick={() => setGenerateGenre(!generateGenre)}
                                    className="flex items-center justify-center"
                                >
                                    {generateGenre ? (
                                        <CheckSquare className="w-5 h-5 text-cyan-400" />
                                    ) : (
                                        <Square className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-white">Genre</span>
                                    <p className="text-xs text-muted-foreground">Suggest an appropriate genre</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                                <button
                                    onClick={() => setGenerateTags(!generateTags)}
                                    className="flex items-center justify-center"
                                >
                                    {generateTags ? (
                                        <CheckSquare className="w-5 h-5 text-cyan-400" />
                                    ) : (
                                        <Square className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-white">Tags</span>
                                    <p className="text-xs text-muted-foreground">Suggest relevant tags (2-3)</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Prompt/Context */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Context / Instructions
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe what you want to generate, or provide context about the project..."
                            className="w-full h-32 px-4 py-3 rounded-xl premium-input resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            The AI will use your project's current data (characters, worlds, summary) plus your instructions to generate content.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Generated Content Preview */}
                    {generatedContent && (
                        <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20">
                            <h3 className="text-sm font-medium text-cyan-400">Generated Content</h3>
                            
                            {generatedContent.description && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Description:</p>
                                    <p className="text-sm text-white leading-relaxed">{generatedContent.description}</p>
                                </div>
                            )}
                            
                            {generatedContent.genre && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Genre:</p>
                                    <p className="text-sm text-white">{generatedContent.genre}</p>
                                </div>
                            )}
                            
                            {generatedContent.tags && generatedContent.tags.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Tags:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {generatedContent.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300 text-xs border border-cyan-500/30"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 sticky bottom-0 bg-[#0A0A0F]/95 backdrop-blur-sm">
                    <Button variant="outline" onClick={onClose} className="glass">
                        Cancel
                    </Button>
                    {!generatedContent ? (
                        <Button 
                            onClick={handleGenerate} 
                            disabled={isGenerating || !prompt.trim()}
                            className="bg-violet-600 hover:bg-violet-500 text-white"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleApply} 
                            className="bg-cyan-600 hover:bg-cyan-500 text-white"
                        >
                            Apply to Project
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
