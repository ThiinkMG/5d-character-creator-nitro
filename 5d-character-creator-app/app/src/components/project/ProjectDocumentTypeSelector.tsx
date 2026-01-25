'use client';

import React from 'react';
import { 
    Film, 
    Tv, 
    BookOpen, 
    FileText, 
    FileCheck, 
    BookMarked,
    Upload
} from 'lucide-react';
import { 
    ProjectDocumentType, 
    PROJECT_DOCUMENT_TYPE_LABELS, 
    PROJECT_DOCUMENT_TYPE_DESCRIPTIONS 
} from '@/types/document';
import { cn } from '@/lib/utils';

interface ProjectDocumentTypeSelectorProps {
    onSelect: (type: ProjectDocumentType) => void;
    selectedType?: ProjectDocumentType;
}

const DOCUMENT_TYPE_ICONS: Record<ProjectDocumentType, React.ComponentType<{ className?: string }>> = {
    'movie-pitch': Film,
    'tv-series-pitch': Tv,
    'book-pitch': BookOpen,
    'treatment': FileText,
    'synopsis': FileCheck,
    'story-bible': BookMarked,
    'imported': Upload,
};

const PITCH_DECKS: ProjectDocumentType[] = ['movie-pitch', 'tv-series-pitch', 'book-pitch'];
const DOCUMENTS: ProjectDocumentType[] = ['treatment', 'synopsis', 'story-bible'];

export function ProjectDocumentTypeSelector({ onSelect, selectedType }: ProjectDocumentTypeSelectorProps) {
    return (
        <div className="space-y-8">
            {/* PITCH DECKS Section */}
            <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    PITCH DECKS
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {PITCH_DECKS.map((type) => {
                        const Icon = DOCUMENT_TYPE_ICONS[type];
                        const isSelected = selectedType === type;
                        return (
                            <button
                                key={type}
                                onClick={() => onSelect(type)}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-xl border transition-all text-left group",
                                    isSelected
                                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                                        : "bg-white/5 border-white/10 hover:border-cyan-500/30 hover:bg-white/10 text-white"
                                )}
                            >
                                <div className={cn(
                                    "p-2.5 rounded-lg shrink-0 transition-colors",
                                    isSelected
                                        ? "bg-cyan-500/20 text-cyan-400"
                                        : "bg-white/5 text-cyan-400/70 group-hover:bg-cyan-500/10"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={cn(
                                        "font-semibold mb-1",
                                        isSelected ? "text-cyan-300" : "text-white"
                                    )}>
                                        {PROJECT_DOCUMENT_TYPE_LABELS[type]}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {PROJECT_DOCUMENT_TYPE_DESCRIPTIONS[type]}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* DOCUMENTS Section */}
            <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    DOCUMENTS
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {DOCUMENTS.map((type) => {
                        const Icon = DOCUMENT_TYPE_ICONS[type];
                        const isSelected = selectedType === type;
                        return (
                            <button
                                key={type}
                                onClick={() => onSelect(type)}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-xl border transition-all text-left group",
                                    isSelected
                                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                                        : "bg-white/5 border-white/10 hover:border-cyan-500/30 hover:bg-white/10 text-white"
                                )}
                            >
                                <div className={cn(
                                    "p-2.5 rounded-lg shrink-0 transition-colors",
                                    isSelected
                                        ? "bg-cyan-500/20 text-cyan-400"
                                        : "bg-white/5 text-cyan-400/70 group-hover:bg-cyan-500/10"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={cn(
                                        "font-semibold mb-1",
                                        isSelected ? "text-cyan-300" : "text-white"
                                    )}>
                                        {PROJECT_DOCUMENT_TYPE_LABELS[type]}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {PROJECT_DOCUMENT_TYPE_DESCRIPTIONS[type]}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
