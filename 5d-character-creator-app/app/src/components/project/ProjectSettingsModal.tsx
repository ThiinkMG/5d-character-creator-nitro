'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Plus, Minus, Check, Tag, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';
import { ProjectAIGenerateModal } from './ProjectAIGenerateModal';

// Pre-populated tag options
const PRESET_TAGS = [
    'Adventure', 'Horror', 'Romance', 'Mystery', 'Comedy', 'Drama', 'Action',
    'Thriller', 'Fantasy', 'Sci-Fi', 'Historical', 'Supernatural', 'Slice-of-Life',
    'Noir', 'Dystopian', 'Steampunk', 'Cyberpunk', 'Post-Apocalyptic'
];

const GENRE_OPTIONS = [
    'Fantasy', 'Sci-Fi', 'Horror', 'Romance', 'Mystery', 'Thriller',
    'Historical Fiction', 'Contemporary', 'Dystopian', 'Urban Fantasy',
    'Epic Fantasy', 'Space Opera', 'Noir', 'Western', 'Steampunk', 'Cyberpunk'
];

interface ProjectSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onSave: (updates: Partial<Project>) => void;
}

export function ProjectSettingsModal({ isOpen, onClose, project, onSave }: ProjectSettingsModalProps) {
    const [description, setDescription] = useState(project.description || '');
    const [genre, setGenre] = useState(project.genre || '');
    const [selectedTags, setSelectedTags] = useState<string[]>(project.tags || []);
    const [customTagInput, setCustomTagInput] = useState('');
    const [showPresetDropdown, setShowPresetDropdown] = useState(false);
    const [showMoreGenres, setShowMoreGenres] = useState(false);
    const [isCustomGenre, setIsCustomGenre] = useState(false);
    const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);

    const MAX_TAGS = 3;

    // Reset state when project changes
    useEffect(() => {
        setDescription(project.description || '');
        setGenre(project.genre || '');
        setSelectedTags(project.tags || []);
        setCustomTagInput('');
    }, [project]);

    const canAddTag = selectedTags.length < MAX_TAGS;

    const handleAddPresetTag = (tag: string) => {
        if (canAddTag && !selectedTags.includes(tag)) {
            setSelectedTags([...selectedTags, tag]);
        }
        setShowPresetDropdown(false);
    };

    const handleAddCustomTag = () => {
        const trimmed = customTagInput.trim();
        if (canAddTag && trimmed && !selectedTags.includes(trimmed)) {
            setSelectedTags([...selectedTags, trimmed]);
            setCustomTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const handleSave = () => {
        onSave({
            description,
            genre,
            tags: selectedTags,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden glass-card border border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0A0A0F]/95 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white tracking-tight">
                                Project Settings
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
                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-muted-foreground">
                                Description
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAIGenerateModal(true)}
                                className="h-7 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                            >
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                Generate with AI
                            </Button>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your project..."
                            className="w-full h-24 px-4 py-3 rounded-xl premium-input resize-none"
                        />
                    </div>

                    {/* Genre */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Genre
                            </label>
                            <button
                                onClick={() => {
                                    setIsCustomGenre(!isCustomGenre);
                                    if (!isCustomGenre) setGenre(''); // Clear when switching to custom
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                {isCustomGenre ? "Switch to Standard" : "Custom write"}
                            </button>
                        </div>

                        <div className="relative group">
                            {isCustomGenre ? (
                                <input
                                    type="text"
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    placeholder="Enter custom genre..."
                                    className="w-full px-4 py-3 rounded-xl premium-input"
                                    autoFocus
                                />
                            ) : (
                                <div className="relative">
                                    <select
                                        value={genre}
                                        onChange={(e) => setGenre(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl premium-input appearance-none bg-[#0A0A0F] cursor-pointer"
                                    >
                                        <option value="" disabled>Select a genre...</option>
                                        {GENRE_OPTIONS.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                        <ChevronDown className="w-4 h-4 opacity-50" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Tags
                            </label>
                            <span className={cn(
                                "text-xs",
                                selectedTags.length >= MAX_TAGS ? "text-amber-400" : "text-muted-foreground"
                            )}>
                                {selectedTags.length}/{MAX_TAGS}
                            </span>
                        </div>

                        {/* Selected Tags Display */}
                        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px] p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            {selectedTags.length === 0 ? (
                                <span className="text-sm text-white/30">No tags selected</span>
                            ) : (
                                selectedTags.map(tag => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    >
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-1 p-0.5 rounded-full hover:bg-cyan-500/30 transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>

                        {/* Add Tags Controls */}
                        {canAddTag && (
                            <div className="space-y-3">
                                {/* Preset Tags Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-colors text-sm"
                                    >
                                        <span className="text-white/70">Choose from presets...</span>
                                        <Plus className="w-4 h-4 text-cyan-400" />
                                    </button>

                                    {showPresetDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-[#0c0c12] border border-white/10 shadow-xl z-20 max-h-48 overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-1">
                                                {PRESET_TAGS.filter(t => !selectedTags.includes(t)).map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => handleAddPresetTag(tag)}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left hover:bg-white/5 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3 text-cyan-400" />
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Custom Tag Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customTagInput}
                                        onChange={(e) => setCustomTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                                        placeholder="Add custom tag..."
                                        className="flex-1 px-4 py-3 rounded-xl premium-input text-sm"
                                        maxLength={20}
                                    />
                                    <button
                                        onClick={handleAddCustomTag}
                                        disabled={!customTagInput.trim()}
                                        className={cn(
                                            "px-4 py-3 rounded-xl transition-all flex items-center gap-2",
                                            customTagInput.trim()
                                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                                                : "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
                                        )}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {!canAddTag && (
                            <p className="text-xs text-amber-400/70 mt-2">
                                Maximum of {MAX_TAGS} tags reached. Remove a tag to add more.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 sticky bottom-0 bg-[#0A0A0F]/95 backdrop-blur-sm">
                    <Button variant="outline" onClick={onClose} className="glass">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* AI Generate Modal */}
            <ProjectAIGenerateModal
                isOpen={showAIGenerateModal}
                onClose={() => setShowAIGenerateModal(false)}
                project={project}
                onApply={(updates) => {
                    if (updates.description) {
                        setDescription(updates.description);
                    }
                    if (updates.genre) {
                        setGenre(updates.genre);
                        setIsCustomGenre(true);
                    }
                    if (updates.tags && updates.tags.length > 0) {
                        // Add new tags, respecting max limit
                        const newTags = [...selectedTags];
                        updates.tags.forEach((tag: string) => {
                            if (newTags.length < MAX_TAGS && !newTags.includes(tag)) {
                                newTags.push(tag);
                            }
                        });
                        setSelectedTags(newTags);
                    }
                    setShowAIGenerateModal(false);
                }}
            />
        </div>
    );
}
