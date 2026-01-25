'use client';

import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileDown, FileCode, X, ChevronLeft, ChevronRight, Minimize2, Maximize2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReadingSideNav, useScrollSpy } from '@/components/ui/reading-side-nav';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CharacterDocument, ProjectDocument, DocumentType, ProjectDocumentType, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLORS, PROJECT_DOCUMENT_TYPE_LABELS, PROJECT_DOCUMENT_TYPE_COLORS } from '@/types/document';
import { cn } from '@/lib/utils';

interface DocumentReaderProps {
    document: CharacterDocument | ProjectDocument;
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
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const sections = useMemo(() => extractSections(document.content), [document.content]);
    const sectionIds = useMemo(() => sections.map(s => s.id), [sections]);
    const scrollSpyActiveId = useScrollSpy(sectionIds, 100);

    const handleNavigate = (sectionId: string) => {
        const element = window.document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Determine document type labels and colors
    const isProjectDoc = 'projectId' in document;
    const docTypeLabel = isProjectDoc 
        ? (PROJECT_DOCUMENT_TYPE_LABELS[document.type as ProjectDocumentType] || document.type)
        : (DOCUMENT_TYPE_LABELS[document.type as DocumentType] || document.type);
    const docTypeColor = isProjectDoc
        ? (PROJECT_DOCUMENT_TYPE_COLORS[document.type as ProjectDocumentType] || "bg-gray-500/20 text-gray-400")
        : (DOCUMENT_TYPE_COLORS[document.type as DocumentType] || "bg-gray-500/20 text-gray-400");

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent 
                showCloseButton={false}
                className={cn(
                    "max-w-[95vw] w-[95vw] max-h-[98vh] bg-[#0c0c14] border-white/10 p-0 flex flex-col overflow-hidden transition-all duration-300",
                    isMinimized ? "h-auto max-h-[50vh]" : "h-[98vh]",
                    // Override default dialog max-width constraints
                    "!max-w-[95vw] sm:!max-w-[95vw]"
                )}
            >
                <VisuallyHidden>
                    <DialogTitle>{document.title}</DialogTitle>
                </VisuallyHidden>
                
                {/* Header - Enhanced with controls */}
                <div className="px-6 lg:px-10 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0c0c14] to-[#0a0a0f] shrink-0">
                    <div className="flex-1 min-w-0 pr-6">
                        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 line-clamp-1">
                            {document.title}
                        </h2>
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className={cn(
                                "text-xs px-2.5 py-1 rounded-md font-medium border",
                                docTypeColor,
                                "border-current/30"
                            )}>
                                {docTypeLabel}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Created {new Date(document.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Nav Toggle */}
                        {sections.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsNavVisible(!isNavVisible)}
                                className={cn(
                                    "text-muted-foreground hover:text-white hover:bg-white/5 h-9 w-9 p-0 rounded-lg transition-colors",
                                    !isNavVisible && "bg-white/5"
                                )}
                                title={isNavVisible ? "Hide navigation" : "Show navigation"}
                            >
                                <Menu className="w-4 h-4" />
                            </Button>
                        )}
                        {/* Minimize/Expand Toggle - Better visual feedback */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMinimized(!isMinimized)}
                            className={cn(
                                "text-muted-foreground hover:text-white hover:bg-white/5 h-9 w-9 p-0 rounded-lg transition-colors",
                                isMinimized && "bg-white/5"
                            )}
                            title={isMinimized ? "Expand to full screen" : "Minimize to compact view"}
                        >
                            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                        </Button>
                        {/* Close - Single close button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-muted-foreground hover:bg-red-500/10 hover:text-red-400 h-9 w-9 p-0 rounded-lg transition-colors"
                            title="Close document"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Content with Side Navigation */}
                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* Main Content - Enhanced spacing and readability */}
                    <div className={cn(
                        "overflow-y-auto min-w-0 transition-all duration-300",
                        isNavVisible && sections.length > 0 ? "flex-1" : "flex-1"
                    )}>
                        <div className={cn(
                            "w-full mx-auto py-8 transition-all duration-300",
                            // Responsive padding - minimal padding to maximize content width
                            isNavVisible && sections.length > 0
                                ? "px-6 lg:px-8 xl:px-12 2xl:px-16"
                                : "px-6 lg:px-8 xl:px-12 2xl:px-16",
                            // No max-width constraint - use full available width
                            // Only constrain on very large screens for optimal readability
                            "2xl:max-w-[160ch]"
                        )}>
                            {document.image && (
                                <div className="rounded-xl overflow-hidden mb-12 shadow-2xl border border-white/10">
                                    <img
                                        src={document.image}
                                        alt={document.title}
                                        className="w-full h-auto"
                                    />
                                </div>
                            )}

                            {/* Render content with section IDs - Enhanced typography */}
                            <div className="prose prose-invert max-w-none prose-lg prose-xl prose-headings:font-bold prose-p:leading-relaxed prose-p:text-white/90">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, ''); // Strip HTML tags
                                        const section = sections.find(s => s.title === title && s.level === 1);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 1)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h1 id={id} className="scroll-mt-32 text-5xl font-bold text-white mb-10 mt-16 first:mt-0 leading-tight tracking-tight">
                                                {children}
                                            </h1>
                                        );
                                    },
                                    h2: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, '');
                                        const section = sections.find(s => s.title === title && s.level === 2);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 2)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h2 id={id} className="scroll-mt-32 text-4xl font-semibold text-white/95 mb-8 mt-12 first:mt-0 leading-tight">
                                                {children}
                                            </h2>
                                        );
                                    },
                                    h3: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, '');
                                        const section = sections.find(s => s.title === title && s.level === 3);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 3)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h3 id={id} className="scroll-mt-32 text-3xl font-medium text-white/90 mb-6 mt-10 first:mt-0 leading-snug">
                                                {children}
                                            </h3>
                                        );
                                    },
                                    h4: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, '');
                                        const section = sections.find(s => s.title === title && s.level === 4);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 4)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h4 id={id} className="scroll-mt-32 text-2xl font-medium text-white/85 mb-5 mt-8 first:mt-0 leading-snug">
                                                {children}
                                            </h4>
                                        );
                                    },
                                    h5: ({ children }) => {
                                        const title = String(children).replace(/<[^>]*>/g, '');
                                        const section = sections.find(s => s.title === title && s.level === 5);
                                        const id = section?.id || `doc-section-${sections.findIndex(s => s.title === title && s.level === 5)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                        return (
                                            <h5 id={id} className="scroll-mt-32 text-xl font-medium text-white/80 mb-4 mt-6 first:mt-0">
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
                                        <p className="text-white/90 leading-relaxed mb-7 text-lg">{children}</p>
                                    ),
                                    strong: ({ children }) => (
                                        <strong className="font-semibold text-white/90">{children}</strong>
                                    ),
                                    em: ({ children }) => (
                                        <em className="italic text-violet-300/80">{children}</em>
                                    ),
                                    ul: ({ children }) => (
                                        <ul className="list-disc list-outside ml-6 text-white/80 space-y-2 mb-6">{children}</ul>
                                    ),
                                    ol: ({ children }) => (
                                        <ol className="list-decimal list-outside ml-6 text-white/80 space-y-2 mb-6">{children}</ol>
                                    ),
                                    li: ({ children }) => (
                                        <li className="pl-2 leading-relaxed">{children}</li>
                                    ),
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-violet-500/50 pl-6 py-4 bg-violet-500/5 rounded-r-lg italic text-white/70 mb-6 my-8">
                                            {children}
                                        </blockquote>
                                    ),
                                    code: ({ children, className }) => {
                                        if (!className) {
                                            return (
                                                <code className="px-2.5 py-1 rounded-md bg-white/15 text-amber-300/95 font-mono text-base">
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
                                        <pre className="mb-8 overflow-hidden rounded-xl">{children}</pre>
                                    ),
                                    hr: () => (
                                        <hr className="border-t border-white/20 my-12" />
                                    ),
                                }}
                            >
                                {document.content}
                            </ReactMarkdown>
                        </div>
                        </div>
                    </div>

                    {/* Side Navigation - Collapsible */}
                    {sections.length > 0 && isNavVisible && (
                        <div className={cn(
                            "border-l border-white/10 p-4 lg:p-6 overflow-y-auto bg-gradient-to-b from-[#08080c] to-[#050508] shrink-0 transition-all duration-300",
                            "w-64 lg:w-72"
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-2">
                                    Contents
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsNavVisible(false)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
                                    title="Hide navigation"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                            <ReadingSideNav
                                sections={sections.map(s => ({ id: s.id, title: s.title }))}
                                activeSection={scrollSpyActiveId}
                                onNavigate={handleNavigate}
                            />
                        </div>
                    )}
                    
                    {/* Show Nav Button when hidden */}
                    {sections.length > 0 && !isNavVisible && (
                        <div className="border-l border-white/10 p-2 shrink-0 flex items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsNavVisible(true)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg"
                                title="Show navigation"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer Actions - Enhanced - Always visible but compact when minimized */}
                <div className={cn(
                    "px-6 lg:px-10 border-t border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0c0c14] to-[#0a0a0f] shrink-0 transition-all duration-300",
                    isMinimized ? "py-2" : "py-4"
                )}>
                    <div className={cn(
                        "text-xs text-muted-foreground flex items-center gap-4 transition-opacity",
                        isMinimized && "opacity-60"
                    )}>
                        {sections.length > 0 && (
                            <span>{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
                        )}
                        {!isMinimized && (
                            <>
                                <span className="text-white/40">•</span>
                                <span>{document.content.split(/\s+/).length.toLocaleString()} words</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDownloadPDF}
                            className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-xs"
                            title="Download as PDF"
                        >
                            <FileDown className="w-3.5 h-3.5 mr-1.5" />
                            {!isMinimized && "PDF"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDownloadMarkdown}
                            className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-xs"
                            title="Download as Markdown"
                        >
                            <FileCode className="w-3.5 h-3.5 mr-1.5" />
                            {!isMinimized && "Markdown"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
