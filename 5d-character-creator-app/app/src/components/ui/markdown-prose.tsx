'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

// Helper to extract text content from React children using React.Children utilities
function extractTextFromChildren(children: React.ReactNode): string {
    if (typeof children === 'string') return children;
    if (typeof children === 'number') return String(children);
    
    // Use React.Children utilities for safe traversal
    let text = '';
    React.Children.forEach(children, (child) => {
        if (typeof child === 'string') {
            text += child;
        } else if (typeof child === 'number') {
            text += String(child);
        } else if (React.isValidElement(child) && (child.props as { children?: React.ReactNode })?.children) {
            text += extractTextFromChildren((child.props as { children: React.ReactNode }).children);
        } else if (Array.isArray(child)) {
            text += extractTextFromChildren(child);
        }
    });
    return text;
}

interface MarkdownProseProps {
    content: string;
    className?: string;
    compact?: boolean;
    hideMentionSymbol?: boolean; // Hide "@" symbol in reading view
}

// Component to render mention links
function MentionLink({ type, id, children, hideSymbol = false }: { type: string; id: string; children: React.ReactNode; hideSymbol?: boolean }) {
    const router = useRouter();
    const { getCharacter, getWorld, getProject } = useStore();
    let entity: any = null;
    let path = '';
    
    if (type === 'character') {
        entity = getCharacter(id);
        path = `/characters/${encodeURIComponent(id)}`;
    } else if (type === 'world') {
        entity = getWorld(id);
        path = `/worlds/${encodeURIComponent(id)}`;
    } else if (type === 'project') {
        entity = getProject(id);
        path = `/projects/${encodeURIComponent(id)}`;
    }
    
    if (!entity) {
        // Entity not found, show as plain text
        return <span className="text-white/50 line-through">{children}</span>;
    }
    
    // Strip "@" symbol if hideSymbol is true
    // ReactMarkdown passes link text as children, which for mentions is "@Name"
    const displayText = React.useMemo(() => {
        if (!hideSymbol) return children;
        
        // Extract all text content first
        const allText = extractTextFromChildren(children);
        
        // If the text starts with "@", strip it and return a simple string
        if (allText.startsWith('@')) {
            return allText.slice(1);
        }
        
        // Otherwise, recursively process to strip "@" from nested structures
        const processNode = (node: React.ReactNode): React.ReactNode => {
            if (typeof node === 'string') {
                return node.startsWith('@') ? node.slice(1) : node;
            }
            if (typeof node === 'number') return node;
            if (node === null || node === undefined) return node;
            
            if (Array.isArray(node)) {
                return node.map(processNode);
            }
            
            if (React.isValidElement(node)) {
                const nodeProps = node.props as { children?: React.ReactNode };
                const processedChildren = nodeProps.children
                    ? (Array.isArray(nodeProps.children)
                        ? nodeProps.children.map(processNode)
                        : processNode(nodeProps.children))
                    : nodeProps.children;
                
                return React.cloneElement(node as React.ReactElement<any>, {
                    ...nodeProps,
                    children: processedChildren
                });
            }
            
            return node;
        };
        
        return processNode(children);
    }, [children, hideSymbol]);
    
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(path);
    };
    
    return (
        <Link
            href={path}
            className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium cursor-pointer"
            onClick={handleClick}
        >
            {displayText}
        </Link>
    );
}

/**
 * MarkdownProse: Renders markdown content with styled typography
 * Supports: **bold**, *italic*, lists, blockquotes, headings, links
 */
export function MarkdownProse({ content, className, compact = false, hideMentionSymbol = false }: MarkdownProseProps) {
    // Ensure content is always a string
    const contentString = React.useMemo(() => {
        if (typeof content === 'string') {
            return content;
        }
        if (content == null) {
            return '';
        }
        // If it's an array or object, try to stringify it
        if (Array.isArray(content)) {
            return (content as unknown[]).map(item => 
                typeof item === 'string' ? item : JSON.stringify(item)
            ).join('');
        }
        // For objects, stringify them
        return String(content);
    }, [content]);

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

                    // Links - Handle both regular links and mention links
                    a: ({ href, children }) => {
                        // Check if this is a mention link (format: type:id)
                        const mentionMatch = href?.match(/^(character|world|project):(.+)$/);
                        
                        if (mentionMatch) {
                            const [, type, id] = mentionMatch;
                            return <MentionLink type={type} id={id} hideSymbol={hideMentionSymbol}>{children}</MentionLink>;
                        }
                        
                        // Regular link
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 underline underline-offset-2"
                            >
                                {children}
                            </a>
                        );
                    },

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
                {contentString}
            </ReactMarkdown>
        </div>
    );
}

export default MarkdownProse;
