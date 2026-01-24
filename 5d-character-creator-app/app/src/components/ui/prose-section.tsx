'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { InlineEditableText } from './inline-editable-text';
import { MarkdownProse } from './markdown-prose';
import { Wand2 } from 'lucide-react';

interface ProseSectionProps {
    id?: string;
    title: string;
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    onAiGenerate?: () => void;
    className?: string;
    readOnly?: boolean;
    suggestion?: string;
    onAcceptSuggestion?: () => void;
    onRejectSuggestion?: () => void;
}

export function ProseSection({
    id,
    title,
    content,
    onChange,
    placeholder = 'Click to add content...',
    onAiGenerate,
    className,
    readOnly = false,
    suggestion,
    onAcceptSuggestion,
    onRejectSuggestion
}: ProseSectionProps) {
    return (
        <section
            id={id}
            className={cn(
                "transition-all group scroll-mt-24",
                !readOnly && "glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10",
                readOnly && "py-8 border-b border-white/5 last:border-b-0",
                className
            )}>
            {!readOnly && (
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white/95 tracking-tight">
                        {title}
                    </h3>
                    {onAiGenerate && (
                        <button
                            onClick={onAiGenerate}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                    bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20
                                    transition-all hover:scale-105
                                    opacity-0 group-focus-within:opacity-100 pointer-events-none group-focus-within:pointer-events-auto"
                            title={`Generate ${title} with AI`}
                        >
                            <Wand2 className="w-3.5 h-3.5" />
                            Generate
                        </button>
                    )}
                </div>
            )}

            {readOnly ? (
                <div className="prose-primary mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 font-serif tracking-wide border-b border-white/10 pb-4">{title}</h2>
                    <MarkdownProse
                        content={content || '*No content.*'}
                        className="text-lg leading-loose text-white/90 font-serif"
                    />
                </div>
            ) : (
                <div className="prose-primary">
                    <InlineEditableText
                        value={content}
                        onChange={onChange}
                        placeholder={placeholder}
                        multiline
                        as="div"
                        className="text-base leading-relaxed text-white/85"
                        renderView={(val) => <MarkdownProse content={val} className="text-white/85 prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-white/90" />}
                        suggestion={suggestion}
                        onAcceptSuggestion={onAcceptSuggestion}
                        onRejectSuggestion={onRejectSuggestion}
                    />
                </div>
            )}
        </section>
    );
}
