'use client';

import React, { useState } from 'react';
import {
    ChevronDown,
    Trash2,
    ArrowUp,
    ArrowDown,
    Sparkles,
    Pencil,
    Check,
    X,
    GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { EditableField } from './editable-field';

interface CustomSectionData {
    id: string;
    title: string;
    content: string;
    order: number;
}

interface CustomSectionProps {
    section: CustomSectionData;
    isEditMode: boolean;
    onUpdate: (id: string, updates: Partial<CustomSectionData>) => void;
    onDelete: (id: string) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onOpenAIModal?: (fieldLabel: string, handler: (content: string) => void) => void;
    isFirst?: boolean;
    isLast?: boolean;
}

export function CustomSection({
    section,
    isEditMode,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onOpenAIModal,
    isFirst,
    isLast
}: CustomSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(section.title);

    const handleSaveTitle = () => {
        if (titleValue.trim()) {
            onUpdate(section.id, { title: titleValue });
            setIsEditingTitle(false);
        }
    };

    const handleCancelTitle = () => {
        setTitleValue(section.title);
        setIsEditingTitle(false);
    };

    return (
        <section
            id={section.id}
            className="pt-8 border-t border-white/5 scroll-mt-24"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 group">
                <div
                    className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span className="text-violet-400">
                        <Sparkles className="w-5 h-5" />
                    </span>
                </div>

                {isEditingTitle ? (
                    <div className="flex-1 flex items-center gap-2">
                        <input
                            type="text"
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xl font-bold text-white focus:outline-none focus:border-violet-500/50"
                            autoFocus
                            placeholder="Section Title"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle();
                                if (e.key === 'Escape') handleCancelTitle();
                            }}
                        />
                        <button
                            onClick={handleSaveTitle}
                            className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCancelTitle}
                            className="p-1.5 rounded bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <h2
                        className="text-xl font-bold text-white tracking-tight flex-1 cursor-pointer"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {section.title}
                    </h2>
                )}

                {/* Edit Controls */}
                {isEditMode && (
                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                        {!isEditingTitle && (
                            <button
                                onClick={() => setIsEditingTitle(true)}
                                className="p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                                title="Rename Section"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}

                        <div className="w-px h-4 bg-white/10 mx-1" />

                        <button
                            onClick={onMoveUp}
                            disabled={isFirst}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                isFirst ? "text-white/10 cursor-not-allowed" : "hover:bg-white/5 text-white/40 hover:text-white"
                            )}
                            title="Move Up"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onMoveDown}
                            disabled={isLast}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                isLast ? "text-white/10 cursor-not-allowed" : "hover:bg-white/5 text-white/40 hover:text-white"
                            )}
                            title="Move Down"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-white/10 mx-1" />

                        <button
                            onClick={() => onDelete(section.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-colors"
                            title="Delete Section"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {!isEditingTitle && (
                    <ChevronDown
                        className={cn(
                            "w-5 h-5 text-white/30 transition-transform duration-300 cursor-pointer",
                            isExpanded ? "rotate-0" : "-rotate-90"
                        )}
                        onClick={() => setIsExpanded(!isExpanded)}
                    />
                )}
            </div>

            {/* Content */}
            <div
                className={cn(
                    "transition-all duration-300",
                    isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
                )}
            >
                <div className="prose prose-invert max-w-none mb-6">
                    <EditableField
                        value={section.content}
                        onSave={(val) => onUpdate(section.id, { content: val })}
                        placeholder={`Write content for ${section.title}...`}
                        multiline
                        isEditModeActive={isEditMode}
                        showAIButton={isEditMode}
                        onAIGenerate={() => onOpenAIModal?.(section.title, (newVal) => onUpdate(section.id, { content: newVal }))}
                        minRows={3}
                    />
                </div>
            </div>
        </section>
    );
}
