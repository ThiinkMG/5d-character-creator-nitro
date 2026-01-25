'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { MentionInput } from './mention-input';

interface EditableFieldProps {
    value: string;
    onSave: (value: string) => void;
    label?: string;
    placeholder?: string;
    multiline?: boolean;
    isEditModeActive?: boolean;
    className?: string;
    showAIButton?: boolean;
    onAIGenerate?: () => void;
    minRows?: number;
    suggestion?: string;
    onAcceptSuggestion?: () => void;
    onRejectSuggestion?: () => void;
}

export function EditableField({
    value,
    onSave,
    label,
    placeholder = 'Enter text...',
    multiline = false,
    isEditModeActive = false,
    className,
    showAIButton = false,
    onAIGenerate,
    minRows = 3,
    suggestion,
    onAcceptSuggestion,
    onRejectSuggestion
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className={cn("flex flex-col gap-2", className)}>
                {label && (
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                    </label>
                )}
                <div className="flex items-start gap-2">
                    {multiline ? (
                        <MentionInput
                            value={editValue}
                            onChange={setEditValue}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 
                                       text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50
                                       resize-y transition-colors"
                            multiline
                            minRows={minRows}
                        />
                    ) : (
                        <MentionInput
                            value={editValue}
                            onChange={setEditValue}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 
                                       text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50
                                       transition-colors"
                        />
                    )}
                    <div className="flex gap-1 shrink-0">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSave}
                            className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/10"
                        >
                            <Check className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("group relative", className)}>
            {label && (
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                    {label}
                </label>
            )}
            {/* Suggestion Review Mode */}
            {suggestion && isEditModeActive ? (
                <div className="mt-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 relative animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">AI Suggestion</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onAcceptSuggestion}
                                className="h-6 px-2 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                            >
                                <Check className="w-3 h-3 mr-1" />
                                Accept
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onRejectSuggestion}
                                className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                    <div className="text-white/90 whitespace-pre-line text-sm">
                        {suggestion}
                    </div>
                </div>
            ) : null}

            <div className="flex items-start gap-2">
                <div className="flex-1 min-h-[1.5em]">
                    {value ? (
                        <span className={cn("text-muted-foreground whitespace-pre-line", suggestion && isEditModeActive && "opacity-40 line-through decoration-white/20")}>{value}</span>
                    ) : (
                        <span className="text-white/30 italic">{placeholder}</span>
                    )}
                </div>
                {isEditModeActive && !suggestion && (
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            title="Edit"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {showAIButton && onAIGenerate && (
                            <button
                                onClick={onAIGenerate}
                                className="p-1.5 rounded-md hover:bg-primary/10 text-primary/70 hover:text-primary transition-all"
                                title="Generate with AI"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
