'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';


const GENRE_OPTIONS = [
    'Fantasy', 'Sci-Fi', 'Horror', 'Romance', 'Mystery', 'Thriller',
    'Historical Fiction', 'Contemporary', 'Dystopian', 'Urban Fantasy',
    'Epic Fantasy', 'Space Opera', 'Noir', 'Western', 'Steampunk', 'Cyberpunk'
];

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (projectData: Pick<Project, 'name' | 'genre' | 'summary' | 'id'>) => void;
}

export function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
    const [name, setName] = useState('');
    const [summary, setSummary] = useState('');
    const [genre, setGenre] = useState('');
    const [isCustomGenre, setIsCustomGenre] = useState(false);

    // Reset when opening
    React.useEffect(() => {
        if (isOpen) {
            setName('');
            setSummary('');
            setGenre('');
            setIsCustomGenre(false);
        }
    }, [isOpen]);

    const handleCreate = () => {
        if (!name.trim()) return;

        const newId = Date.now().toString(); // Simple ID generation
        onCreate({
            id: newId,
            name: name.trim(),
            genre: genre.trim() || 'Unspecified',
            summary: summary.trim(),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden glass-card border border-white/10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0A0A0F]/95 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/20">
                            <FolderPlus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white tracking-tight">
                                New Project
                            </h2>
                            <p className="text-sm text-muted-foreground">Start a new creative journey</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Project Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. The Last Starship"
                            className="w-full px-4 py-3 rounded-xl premium-input focus:border-cyan-500/50"
                            autoFocus
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
                                    if (!isCustomGenre) setGenre('');
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

                    {/* Summary */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Brief Summary (Optional)
                        </label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="A quick summary of what this project is about..."
                            className="w-full h-24 px-4 py-3 rounded-xl premium-input resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 sticky bottom-0 bg-[#0A0A0F]/95 backdrop-blur-sm">
                    <Button variant="outline" onClick={onClose} className="glass">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!name.trim()}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Create Project
                    </Button>
                </div>
            </div>
        </div>
    );
}
