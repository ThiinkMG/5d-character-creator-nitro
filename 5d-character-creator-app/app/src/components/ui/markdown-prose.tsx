'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProseProps {
    content: string;
    className?: string;
    compact?: boolean;
}

/**
 * MarkdownProse: Renders markdown content with styled typography
 * Supports: **bold**, *italic*, lists, blockquotes, headings, links
 */
export function MarkdownProse({ content, className, compact = false }: MarkdownProseProps) {
    return (
        <div className={cn(
            "prose prose-invert max-w-none",
            compact ? "prose-sm" : "prose-base",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headings
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-white/90 mb-3 mt-5 first:mt-0">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-medium text-white/80 mb-2 mt-4 first:mt-0">{children}</h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-base font-medium text-white/70 mb-2 mt-3 first:mt-0">{children}</h4>
                    ),

                    // Paragraphs
                    p: ({ children }) => (
                        <p className={cn(
                            "text-white/70 leading-relaxed",
                            compact ? "mb-2" : "mb-4"
                        )}>{children}</p>
                    ),

                    // Bold & Italic
                    strong: ({ children }) => (
                        <strong className="font-semibold text-white/90">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic text-violet-300/80">{children}</em>
                    ),

                    // Lists
                    ul: ({ children }) => (
                        <ul className={cn(
                            "list-disc list-outside ml-5 text-white/70 space-y-1",
                            compact ? "mb-2" : "mb-4"
                        )}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className={cn(
                            "list-decimal list-outside ml-5 text-white/70 space-y-1",
                            compact ? "mb-2" : "mb-4"
                        )}>{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="pl-1">{children}</li>
                    ),

                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote className={cn(
                            "border-l-4 border-violet-500/50 pl-4 py-2 bg-violet-500/5 rounded-r-lg",
                            "italic text-white/60",
                            compact ? "mb-2" : "mb-4"
                        )}>
                            {children}
                        </blockquote>
                    ),

                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 underline underline-offset-2"
                        >
                            {children}
                        </a>
                    ),

                    // Code
                    code: ({ children, className }) => {
                        // Inline code
                        if (!className) {
                            return (
                                <code className="px-1.5 py-0.5 rounded bg-white/10 text-amber-300/90 font-mono text-sm">
                                    {children}
                                </code>
                            );
                        }
                        // Code block
                        return (
                            <code className={cn(
                                "block p-4 rounded-xl bg-black/40 border border-white/10",
                                "font-mono text-sm text-emerald-300/80 overflow-x-auto",
                                className
                            )}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="mb-4 overflow-hidden rounded-xl">{children}</pre>
                    ),

                    // Horizontal Rule
                    hr: () => (
                        <hr className="border-t border-white/10 my-6" />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default MarkdownProse;
