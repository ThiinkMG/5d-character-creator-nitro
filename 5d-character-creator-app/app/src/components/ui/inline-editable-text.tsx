'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Pencil, Sparkles, Check, X } from 'lucide-react';

interface InlineEditableTextProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    as?: 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'div';
    multiline?: boolean;
    renderView?: (value: string) => React.ReactNode;
    suggestion?: string;
    onAcceptSuggestion?: () => void;
    onRejectSuggestion?: () => void;
}

export function InlineEditableText({
    value,
    onChange,
    placeholder = 'Click to edit...',
    className,
    as: Component = 'p',
    multiline = false,
    renderView,
    suggestion,
    onAcceptSuggestion,
    onRejectSuggestion
}: InlineEditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // For textarea, move cursor to end
            if (multiline && inputRef.current instanceof HTMLTextAreaElement) {
                inputRef.current.selectionStart = inputRef.current.value.length;
            }
        }
    }, [isEditing, multiline]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setLocalValue(value);
            setIsEditing(false);
        }
        if (e.key === 'Enter' && !multiline) {
            handleBlur();
        }
    };

    if (isEditing) {
        const sharedProps = {
            ref: inputRef as any,
            value: localValue,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLocalValue(e.target.value),
            onBlur: handleBlur,
            onKeyDown: handleKeyDown,
            placeholder,
            className: cn(
                "w-full bg-transparent border-none outline-none resize-none",
                "focus:ring-1 focus:ring-primary/30 rounded-md px-2 py-1 -mx-2 -my-1",
                "text-inherit font-inherit leading-inherit",
                className
            )
        };

        if (multiline) {
            return (
                <textarea
                    {...sharedProps}
                    rows={Math.max(3, localValue.split('\n').length)}
                    style={{ minHeight: '80px' }}
                />
            );
        }

        return <input type="text" {...sharedProps} />;
    }

    const displayValue = value || placeholder;
    const isEmpty = !value;

    return (
        <Component
            onClick={() => setIsEditing(true)}
            className={cn(
                "cursor-text group relative transition-all duration-200",
                "hover:bg-primary/5 rounded-md px-2 py-1 -mx-2 -my-1",
                isEmpty && "text-muted-foreground italic",
                className
            )}
        >
            {/* Suggestion Mode */}
            {suggestion ? (
                <div className="mb-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 relative animate-in fade-in slide-in-from-top-2 group-hover:border-violet-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">AI Suggestion</span>
                        </div>
                        <div className="flex items-center gap-1 z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAcceptSuggestion?.(); }}
                                className="flex items-center gap-1 h-6 px-2 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                            >
                                <Check className="w-3 h-3" />
                                Accept
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRejectSuggestion?.(); }}
                                className="h-6 w-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    {renderView ? renderView(suggestion) : <div className="text-white/90 whitespace-pre-line text-sm">{suggestion}</div>}
                </div>
            ) : null}

            <div className={cn("relative", suggestion && "opacity-40 line-through decoration-white/20 blur-[0.5px]")}>
                {renderView ? renderView(value || (isEmpty ? placeholder : '')) : displayValue}
            </div>
            {!suggestion && <Pencil className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </Component>
    );
}
