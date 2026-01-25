'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Link as LinkIcon, Check, Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';

interface LinkProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLink: (projectId: string) => void;
    projects: Project[];
    currentProjectId?: string;
    onCreateProject?: () => void;
}

export function LinkProjectModal({
    isOpen,
    onClose,
    onLink,
    projects,
    currentProjectId,
    onCreateProject
}: LinkProjectModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(currentProjectId || null);

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSelectedId(currentProjectId || null);
        }
    }, [isOpen, currentProjectId]);

    const filteredProjects = useMemo(() => {
        return projects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.genre?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    const handleLinkConfirm = () => {
        if (selectedId) {
            onLink(selectedId);
            onClose();
        }
    };

    const handleUnlink = () => {
        onLink('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden glass-card border border-white/10 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0A0A0F]/95 backdrop-blur-sm z-10">
                    <div>
                        <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                            <Folder className="w-5 h-5 text-violet-400" />
                            Link to Project
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select a project to attach this entity to.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-[#0A0A0F]/50">
                    {/* Search */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm transition-all"
                                autoFocus
                            />
                        </div>
                        {onCreateProject && (
                            <Button onClick={onCreateProject} variant="outline" className="glass h-10 px-3">
                                <Plus className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map(project => {
                                const isSelected = selectedId === project.id;
                                const isCurrent = project.id === currentProjectId;

                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => setSelectedId(project.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all border",
                                            isSelected
                                                ? "bg-violet-500/10 border-violet-500/30"
                                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]",
                                        )}
                                    >
                                        {/* Radio / Check */}
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0",
                                            isSelected
                                                ? "bg-violet-500 border-violet-500"
                                                : "border-white/20 group-hover:border-violet-500/50"
                                        )}>
                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-medium text-white truncate">{project.name}</h4>
                                                {isCurrent && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{project.genre} • {project.progress}% Complete</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No projects found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-[#0A0A0F]/95 backdrop-blur-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {currentProjectId && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onLink('');
                                    onClose();
                                }}
                                className="glass h-9 text-red-400 border-red-500/20 hover:bg-red-500/10"
                            >
                                Unlink
                            </Button>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {selectedId ? '1 project selected' : 'No project selected'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="glass h-9">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLinkConfirm}
                            disabled={!selectedId || selectedId === currentProjectId}
                            className="bg-violet-600 hover:bg-violet-500 text-white h-9"
                        >
                            {selectedId === currentProjectId ? 'Already Attached' : selectedId ? 'Change Project' : 'Attach Project'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
