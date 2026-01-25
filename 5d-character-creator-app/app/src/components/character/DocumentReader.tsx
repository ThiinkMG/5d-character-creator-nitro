'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileDown, FileCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReadingSideNav, useScrollSpy } from '@/components/ui/reading-side-nav';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { CharacterDocument } from '@/types/document';
import { cn } from '@/lib/utils';

interface DocumentReaderProps {
    document: CharacterDocument;
    onClose: () => void;
    onDownloadPDF: () => void;
    onDownloadMarkdown: () => void;
}

// Extract sections from markdown content
function extractSections(content: string): Array<{ id: string; title: string; level: number }> {
    const sections: Array<{ id: string; title: string; level: number }> = [];
    const lines = content.split('\n');
    
    lines.forEach((line) => {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const title = headingMatch[2].trim();
            // Create a consistent ID based on title and index
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const id = `doc-section-${sections.length}-${slug}`;
            sections.push({ id, title, level });
        }
    });
    
    return sections;
}

export function DocumentReader({ document, onClose, onDownloadPDF, onDownloadMarkdown }: DocumentReaderProps) {
    const sections = useMemo(() => extractSections(document.content), [document.content]);
    const sectionIds = useMemo(() => sections.map(s => s.id), [sections]);
    const scrollSpyActiveId = useScrollSpy(sectionIds, 100);

    const handleNavigate = (sectionId: string) => {
        const element = window.document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-full max-h-[98vh] bg-[#0c0c14] border-white/10 p-0 flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0c0c14] to-[#0a0a0f]">
                    <div className="flex-1 min-w-0 pr-8">
                        <h2 className="text-3xl font-bold text-white mb-3 line-clamp-2">
                            {document.title}
                        </h2>
                        <div className="flex items-center gap-6">
                            <span className={cn(
                                "text-sm px-3 py-1.5 rounded-md font-medium",
                                document.type === 'script' 
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                                    : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            )}>
                                {document.type === 'script' ? 'Script' : 'Roleplay'}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                                Created {new Date(document.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-white hover:bg-white/5 shrink-0 h-10 w-10 p-0 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content with Side Navigation */}
                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* Main Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-4xl mx-auto px-12 py-10">
                            {document.image && (
                                <div className="rounded-xl overflow-hidden mb-10 shadow-2xl border border-white/10">
                                    <img
                                        src={document.image}
                                        alt={document.title}
                                        className="w-full h-auto"
                                    />
                                </div>
                            )}

                            {/* Render content with section IDs */}
                            <div className="prose prose-invert max-w-none prose-lg">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, ''); // Strip HTML tags
                                        const section = sections.find(s => s.title === title && s.level === 1);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 1)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h1 id={id} className="scroll-mt-32 text-5xl font-bold text-white mb-8 mt-12 first:mt-0 leading-tight">
                                                {children}
                                            </h1>
                                        );
                                    },
                                    h2: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, '');
                                        const section = sections.find(s => s.title === title && s.level === 2);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 2)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h2 id={id} className="scroll-mt-32 text-4xl font-semibold text-white/95 mb-6 mt-10 first:mt-0 leading-tight">
                                                {children}
                                            </h2>
                                        );
                                    },
                                    h3: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, '');
                                        const section = sections.find(s => s.title === title && s.level === 3);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 3)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h3 id={id} className="scroll-mt-32 text-3xl font-medium text-white/90 mb-5 mt-8 first:mt-0 leading-snug">
                                                {children}
                                            </h3>
                                        );
                                    },
                                    h4: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, '');
                                        const section = sections.find(s => s.title === title && s.level === 4);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 4)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h4 id={id} className="scroll-mt-32 text-2xl font-medium text-white/85 mb-4 mt-6 first:mt-0 leading-snug">
                                                {children}
                                            </h4>
                                        );
                                    },
                                    h5: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, '');
                                        const section = sections.find(s => s.title === title && s.level === 5);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 5)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h5 id={id} className="scroll-mt-32 text-xl font-medium text-white/80 mb-3 mt-5 first:mt-0">
                                                {children}
                                            </h5>
                                        );
                                    },
                                    h6: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, '');
                                        const section = sections.find(s => s.title === title && s.level === 6);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 6)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h6 id={id} className="scroll-mt-32 text-lg font-medium text-white/75 mb-3 mt-5 first:mt-0">
                                                {children}
                                            </h6>
                                        );
                                    },
                                    p: ({ children }) => (
                                        <p className="text-white/75 leading-relaxed mb-6 text-lg">{children}</p>
                                    ),
                                    strong: ({ children }) => (
                                        <strong className="font-semibold text-white/90">{children}</strong>
                                    ),
                                    em: ({ children }) => (
                                        <em className="italic text-violet-300/80">{children}</em>
                                    ),
                                    ul: ({ children }) => (
                                        <ul className="list-disc list-outside ml-5 text-white/70 space-y-1 mb-4">{children}</ul>
                                    ),
                                    ol: ({ children }) => (
                                        <ol className="list-decimal list-outside ml-5 text-white/70 space-y-1 mb-4">{children}</ol>
                                    ),
                                    li: ({ children }) => (
                                        <li className="pl-1">{children}</li>
                                    ),
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-violet-500/50 pl-4 py-2 bg-violet-500/5 rounded-r-lg italic text-white/60 mb-4">
                                            {children}
                                        </blockquote>
                                    ),
                                    code: ({ children, className }) => {
                                        if (!className) {
                                            return (
                                                <code className="px-2 py-1 rounded-md bg-white/15 text-amber-300/95 font-mono text-base">
                                                    {children}
                                                </code>
                                            );
                                        }
                                        return (
                                            <code className="block p-6 rounded-xl bg-black/50 border border-white/20 font-mono text-base text-emerald-300/90 overflow-x-auto my-6">
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre: ({ children }) => (
                                        <pre className="mb-6 overflow-hidden rounded-xl">{children}</pre>
                                    ),
                                    hr: () => (
                                        <hr className="border-t border-white/20 my-10" />
                                    ),
                                }}
                            >
                                {document.content}
                            </ReactMarkdown>
                        </div>
                        </div>
                    </div>

                    {/* Side Navigation */}
                    {sections.length > 0 && (
                        <div className="w-80 border-l border-white/10 p-6 overflow-y-auto bg-gradient-to-b from-[#08080c] to-[#050508] shrink-0">
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                                    Contents
                                </h3>
                            </div>
                            <ReadingSideNav
                                sections={sections.map(s => ({ id: s.id, title: s.title }))}
                                activeSection={scrollSpyActiveId}
                                onNavigate={handleNavigate}
                            />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-5 border-t border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0c0c14] to-[#0a0a0f]">
                    <div className="text-sm text-muted-foreground">
                        {sections.length > 0 && (
                            <span>{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={onDownloadPDF}
                            className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 px-6 py-2.5 h-auto"
                        >
                            <FileDown className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onDownloadMarkdown}
                            className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 px-6 py-2.5 h-auto"
                        >
                            <FileCode className="w-4 h-4 mr-2" />
                            Download Markdown
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
