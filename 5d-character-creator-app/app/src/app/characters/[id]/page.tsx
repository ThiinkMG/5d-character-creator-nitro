'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCharacterStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { EditableField } from '@/components/ui/editable-field';
import { EditableList } from '@/components/ui/editable-list';
import { CustomSection } from '@/components/ui/custom-section';
import { DeleteWarningDialog } from '@/components/ui/delete-warning-dialog';
import { UndoToast } from '@/components/ui/undo-toast';
import { AIGenerateModal } from '@/components/ui/ai-generate-modal';
import { ProseSection } from '@/components/ui/prose-section';
import { ReadingSideNav, useScrollSpy } from '@/components/ui/reading-side-nav';
import {
    ArrowLeft,
    Share2,
    Download,
    Edit3,
    Upload,
    Wand2,
    Check,
    MessageSquare,
    Save,
    RefreshCw,
    Maximize2,
    Calendar,
    ChevronDown,
    ChevronRight,
    Users,
    Heart,
    BookOpen,
    Sparkles,
    Play,
    Bookmark,
    Link2,
    Clock,
    Skull,
    Zap,
    Shield,
    Swords,
    Target,
    Plus,
    Pencil,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ImageGeneratorModal } from '@/components/gallery';
import { ImageProvider } from '@/types/image-config';
import { ExpandableText } from '@/components/ui/expandable-text';
import { MarkdownProse } from '@/components/ui/markdown-prose';

// Helper: Get gradient based on genre/theme
const getGenreGradient = (genre?: string) => {
    const g = (genre || '').toLowerCase();
    if (g.includes('fantasy') || g.includes('magic')) return 'from-violet-900/40 via-purple-900/20';
    if (g.includes('sci-fi') || g.includes('cyber')) return 'from-cyan-900/40 via-blue-900/20';
    if (g.includes('horror') || g.includes('dark')) return 'from-red-900/40 via-rose-900/20';
    if (g.includes('historical')) return 'from-amber-900/40 via-orange-900/20';
    return 'from-zinc-900/40 via-zinc-900/20';
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const TableOfContents = ({ sections, activeSection, onNavigate }: any) => (
    <nav
        className="sticky top-24 rounded-2xl overflow-hidden glass-card border border-white/5"
    >
        <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contents
            </h3>
        </div>
        <div className="p-2">
            {sections.map((section: any) => (
                <div key={section.id}>
                    <button
                        onClick={() => onNavigate(section.id)}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all",
                            activeSection === section.id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        {section.icon && <span className="opacity-60">{section.icon}</span>}
                        <span>{section.title}</span>
                    </button>
                    {section.subsections && (
                        <div className="ml-6 border-l border-white/5">
                            {section.subsections.map((sub: any) => (
                                <button
                                    key={sub.id}
                                    onClick={() => onNavigate(sub.id)}
                                    className={cn(
                                        "w-full px-3 py-1.5 text-left text-xs transition-all",
                                        activeSection === sub.id
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-white/70"
                                    )}
                                >
                                    {sub.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </nav>
);

const Infobox = ({ data, title, imageUrl, type }: any) => (
    <div
        className="rounded-2xl overflow-hidden glass-card border border-white/5"
    >
        {/* Header */}
        <div className="p-3 text-center bg-primary/10 border-b border-primary/20">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
                {type}
            </span>
            <h3 className="text-lg font-bold text-white mt-1">{title}</h3>
        </div>

        {/* Thumbnail Image */}
        <div className="relative aspect-square bg-black/40">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="flex items-center justify-center h-full text-white/10">
                    <Users className="w-12 h-12" />
                </div>
            )}
        </div>

        {/* Stats */}
        <div className="p-4 space-y-3">
            {data.stats.map((stat: any, idx: number) => (
                <div
                    key={idx}
                    className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                >
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {stat.label}
                    </span>
                    <span className="text-sm text-white font-medium">
                        {stat.value}
                    </span>
                </div>
            ))}
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
            <div className="px-4 pb-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Motivations
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {data.tags.map((tag: string, idx: number) => (
                        <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded-md bg-white/5 text-white/50"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const ContentSectionBlock = ({
    section,
    isFirst,
    isEditMode = false,
    onContentChange,
    onListChange,
    onOpenAIModal,
    suggestions = {},
    onAcceptSuggestion,
    onRejectSuggestion,
    onSetSuggestion
}: {
    section: any;
    isFirst: boolean;
    isEditMode?: boolean;
    onContentChange?: (fieldId: string, value: string) => void;
    onListChange?: (fieldId: string, items: string[]) => void;
    onOpenAIModal?: (fieldLabel: string, handler: (content: string) => void) => void;
    suggestions?: Record<string, string>;
    onAcceptSuggestion?: (fieldId: string) => void;
    onRejectSuggestion?: (fieldId: string) => void;
    onSetSuggestion?: (fieldId: string, content: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(!section.collapsed);

    return (
        <section
            id={section.id}
            className={`scroll-mt-24 ${!isFirst ? 'pt-8 border-t border-white/5' : ''}`}
        >
            {/* Section Header */}
            <div
                className="flex items-center gap-3 mb-4 cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {section.icon && (
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                        <span className="text-primary">{section.icon}</span>
                    </div>
                )}
                <h2 className="text-xl font-bold text-white tracking-tight flex-1">
                    {section.title}
                </h2>
                <ChevronDown
                    className={`w-5 h-5 text-white/30 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                />
            </div>

            {/* Section Content */}
            <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                {/* Main Content */}
                {section.id === 'overview' && section.fieldId ? (
                    <div className="mb-6">
                        <EditableField
                            value={section.content || ''}
                            onSave={(val) => onContentChange?.(section.fieldId, val)}
                            placeholder="Describe the core concept..."
                            multiline
                            isEditModeActive={true}
                            showAIButton={true}
                            onAIGenerate={() => onOpenAIModal?.(section.title, (val) => onSetSuggestion?.(section.fieldId, val))}
                            suggestion={suggestions[section.fieldId]}
                            onAcceptSuggestion={() => onAcceptSuggestion?.(section.fieldId)}
                            onRejectSuggestion={() => onRejectSuggestion?.(section.fieldId)}
                        />
                    </div>
                ) : section.content && typeof section.content === 'string' ? (
                    <div className="mb-6">
                        {section.fieldId ? (
                            <EditableField
                                value={section.content}
                                onSave={(val) => onContentChange?.(section.fieldId, val)}
                                placeholder={`Enter ${section.title.toLowerCase()}...`}
                                multiline
                                isEditModeActive={true}
                                showAIButton={true}
                                onAIGenerate={() => onOpenAIModal?.(section.title, (val) => onSetSuggestion?.(section.fieldId, val))}
                                suggestion={suggestions[section.fieldId]}
                                onAcceptSuggestion={() => onAcceptSuggestion?.(section.fieldId)}
                                onRejectSuggestion={() => onRejectSuggestion?.(section.fieldId)}
                            />
                        ) : (
                            <MarkdownProse content={section.content} className="text-white/80" />
                        )}
                    </div>
                ) : null}

                {/* Subsections */}
                {section.subsections && section.subsections.length > 0 && (
                    <div className="space-y-6">
                        {section.subsections.map((sub: any) => (
                            <div
                                key={sub.id}
                                id={sub.id}
                                className="scroll-mt-24 pl-4 border-l-2 border-white/10"
                            >
                                <h3 className="text-base font-semibold text-white/90 mb-2">
                                    {sub.title}
                                </h3>
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                    {sub.colorContent !== undefined && sub.fieldId ? (
                                        <EditableList
                                            items={sub.colorContent || []}
                                            onSave={(items) => onListChange?.(sub.fieldId, items)}
                                            colorClass={sub.colorClass}
                                            isEditModeActive={true}
                                            showAIButton={true}
                                            onAIGenerate={() => onOpenAIModal?.(sub.title, (val) => {
                                                const items = val.split('\n').filter(line => line.trim());
                                                onListChange?.(sub.fieldId, items);
                                            })}
                                        />
                                    ) : sub.listContent !== undefined && sub.fieldId ? (
                                        <EditableList
                                            items={sub.listContent || []}
                                            onSave={(items) => onListChange?.(sub.fieldId, items)}
                                            colorClass={cn("bg-white/5 text-white/70", sub.dotColor)}
                                            isEditModeActive={true}
                                            showAIButton={true}
                                            onAIGenerate={() => onOpenAIModal?.(sub.title, (val) => {
                                                const items = val.split('\n').filter(line => line.trim());
                                                onListChange?.(sub.fieldId, items);
                                            })}
                                        />
                                    ) : sub.fieldId ? (
                                        <EditableField
                                            value={sub.content || ''}
                                            onSave={(val) => onContentChange?.(sub.fieldId, val)}
                                            placeholder={`Enter ${sub.title.toLowerCase()}...`}
                                            multiline
                                            isEditModeActive={true}
                                            showAIButton={true}
                                            onAIGenerate={() => onOpenAIModal?.(sub.title, (val) => onSetSuggestion?.(sub.fieldId, val))}
                                            suggestion={suggestions[sub.fieldId]}
                                            onAcceptSuggestion={() => onAcceptSuggestion?.(sub.fieldId)}
                                            onRejectSuggestion={() => onRejectSuggestion?.(sub.fieldId)}
                                        />
                                    ) : (
                                        <span className="whitespace-pre-line">{sub.content || "Not defined yet."}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};


// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function CharacterProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    // Unwrap params to satisfy Next.js 15 dynamic APIs constraint
    React.use(paramsPromise);
    const params = useParams();
    const router = useRouter();
    const { characters, updateCharacter } = useCharacterStore();

    // Find character
    const characterId = params?.id ? decodeURIComponent(params.id as string) : '';
    const character = characters.find(c => c.id === characterId);

    // Local State
    const [activeSection, setActiveSection] = useState('overview');
    const [isScrolled, setIsScrolled] = useState(false);
    const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiModalField, setAiModalField] = useState('');
    const [insertHandler, setInsertHandler] = useState<((content: string) => void) | null>(null);
    const [suggestions, setSuggestions] = useState<Record<string, string>>({});

    // Suggestion Handlers
    const handleSetSuggestion = (fieldId: string, content: string) => {
        setSuggestions(prev => ({ ...prev, [fieldId]: content }));
    };

    const handleAcceptSuggestion = (fieldId: string) => {
        const content = suggestions[fieldId];
        if (content) {
            handleContentChange(fieldId, content);
            setSuggestions(prev => {
                const next = { ...prev };
                delete next[fieldId];
                return next;
            });
        }
    };

    const handleRejectSuggestion = (fieldId: string) => {
        setSuggestions(prev => {
            const next = { ...prev };
            delete next[fieldId];
            return next;
        });
    };

    // Custom Section State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [lastDeletedSection, setLastDeletedSection] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'prose' | 'structured' | 'reading'>('prose'); // NEW: Default to prose view
    const [activeReadingTab, setActiveReadingTab] = useState('foundation'); // For tab-based reading view

    // Prose sections for Reading View tabs
    const proseSections = [
        { id: 'foundation', title: 'Foundation', fieldKey: 'coreConcept' },
        { id: 'personality', title: 'Personality', fieldKey: 'personalityProse' },
        { id: 'backstory', title: 'Backstory', fieldKey: 'backstoryProse' },
        { id: 'relationships', title: 'Relationships', fieldKey: 'relationshipsProse' },
        { id: 'arc', title: 'Character Arc', fieldKey: 'arcProse' }
    ];

    // Collapsible View State
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!character) return;
        // Check hash for direct link navigation
        if (window.location.hash) {
            setIsExpanded(true);
            const id = window.location.hash.replace('#', '');
            setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 500);
        } else {
            // Check persistence
            const savedState = localStorage.getItem(`entity-view-preference-${character.id}`);
            if (savedState === 'expanded') setIsExpanded(true);
        }
    }, [character?.id]);

    const toggleView = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        if (character) {
            localStorage.setItem(`entity-view-preference-${character.id}`, newState ? 'expanded' : 'collapsed');
        }
    };

    // Scroll handling
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!character) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h2 className="text-xl font-semibold mb-2">Character Not Found</h2>
                <Button onClick={() => router.push('/characters')} variant="outline">
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    const handleNavigate = (sectionId: string) => {
        setActiveSection(sectionId);
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleGenerateImage = async (prompt: string, provider: ImageProvider) => {
        try {
            // Mock API call simulation
            await new Promise(resolve => setTimeout(resolve, 2000));
            const seed = Math.floor(Math.random() * 1000);
            const mockUrl = `https://picsum.photos/seed/${seed}/1920/1080`; // Cinema ratio

            updateCharacter(character.id, {
                imageUrl: mockUrl,
                imageSource: 'generated'
            });
        } catch (error) {
            console.error('Failed to generate image:', error);
        }
    };

    const handleExport = () => {
        const content = JSON.stringify(character, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.name.replace(/\s+/g, '_')}_Profile.json`;
        document.body.click();
        a.click();
        URL.revokeObjectURL(url);
    };

    // Field change handlers for inline editing
    const handleContentChange = (fieldId: string, value: string) => {
        updateCharacter(character.id, { [fieldId]: value, updatedAt: new Date() });
    };

    const handleListChange = (fieldId: string, items: string[]) => {
        updateCharacter(character.id, { [fieldId]: items, updatedAt: new Date() });
    };

    // Handler for prose field changes
    const handleProseChange = (fieldId: string, value: string) => {
        updateCharacter(character.id, { [fieldId]: value, updatedAt: new Date() });
    };

    const handleOpenAIModal = (fieldLabel: string, handler: (content: string) => void) => {
        setAiModalField(fieldLabel);
        setInsertHandler(() => handler);
        setAiModalOpen(true);
    };

    // Custom Section Handlers
    // Custom Section Handlers

    const handleAddCustomSection = () => {
        const newSection = {
            id: `custom-${Date.now()}`,
            title: 'New Section',
            content: '',
            order: (character.customSections?.length || 0) + 10 // Start after standard sections
        };

        updateCharacter(character.id, {
            customSections: [...(character.customSections || []), newSection],
            updatedAt: new Date()
        });

        // Auto scroll to new section
        setTimeout(() => {
            document.getElementById(newSection.id)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleUpdateCustomSection = (sectionId: string, data: any) => {
        const updatedSections = (character.customSections || []).map(s =>
            s.id === sectionId ? { ...s, ...data } : s
        );
        updateCharacter(character.id, {
            customSections: updatedSections,
            updatedAt: new Date()
        });
    };

    const handleDeleteCustomSection = (sectionId: string) => {
        setSectionToDelete(sectionId);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteSection = () => {
        if (!sectionToDelete) return;

        const section = character.customSections?.find(s => s.id === sectionToDelete);
        if (!section) return;

        // Add to trash logic would go here if we were persisting trash fully
        // For now we'll just keep it in local state for the Undo Toast
        setLastDeletedSection(section);

        const updatedSections = character.customSections?.filter(s => s.id !== sectionToDelete) || [];
        updateCharacter(character.id, {
            customSections: updatedSections,
            updatedAt: new Date()
        });

        // Also add to trash in store
        const trashItem = {
            ...section,
            deletedAt: new Date(),
            sourceEntityId: character.id
        };
        const updatedTrash = [...(character.trashedSections || []), trashItem];
        updateCharacter(character.id, { trashedSections: updatedTrash });

        setDeleteDialogOpen(false);
        setSectionToDelete(null);
        setShowUndoToast(true);
    };

    const handleUndoDelete = () => {
        if (!lastDeletedSection) return;

        // Restore section
        updateCharacter(character.id, {
            customSections: [...(character.customSections || []), lastDeletedSection],
            updatedAt: new Date()
        });

        // Remove from trash
        const updatedTrash = character.trashedSections?.filter(s => s.id !== lastDeletedSection.id) || [];
        updateCharacter(character.id, { trashedSections: updatedTrash });

        setShowUndoToast(false);
        setLastDeletedSection(null);
    };

    const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
        if (!character.customSections) return;

        const index = character.customSections.findIndex(s => s.id === sectionId);
        if (index === -1) return;

        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === character.customSections.length - 1) return;

        const newSections = [...character.customSections];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];

        updateCharacter(character.id, {
            customSections: newSections,
            updatedAt: new Date()
        });
    };

    // Construct Content Sections from Character Data
    const sections = [
        {
            id: 'overview',
            title: 'Overview',
            icon: <BookOpen className="w-5 h-5" />,
            content: character.coreConcept || "A character waiting to be defined.",
            fieldId: 'coreConcept'
        },
        {
            id: 'personality',
            title: 'Personality Matrix',
            icon: <Heart className="w-5 h-5" />,
            content: '',
            subsections: [
                {
                    id: 'motivations',
                    title: 'Core Motivations',
                    colorContent: character.motivations,
                    colorClass: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
                    fieldId: 'motivations'
                },
                {
                    id: 'flaws',
                    title: 'Flaws & Shadows',
                    colorContent: character.flaws,
                    colorClass: "bg-red-500/10 text-red-300 border border-red-500/20",
                    fieldId: 'flaws'
                }
            ]
        },
        {
            id: 'backstory',
            title: 'Backstory & Origin',
            icon: <Skull className="w-5 h-5" />,
            content: '',
            subsections: [
                {
                    id: 'origin',
                    title: 'Origin Story',
                    content: character.origin || "Origin unknown.",
                    fieldId: 'origin'
                },
                {
                    id: 'ghost',
                    title: 'The Ghost (Trauma)',
                    content: character.ghost || "No defining trauma listed.",
                    fieldId: 'ghost'
                }
            ]
        },
        {
            id: 'relationships',
            title: 'Relationship Web',
            icon: <Users className="w-5 h-5" />,
            content: 'Key connections and dynamics.',
            subsections: [
                {
                    id: 'allies',
                    title: 'Allies',
                    listContent: character.allies,
                    dotColor: "bg-emerald-400",
                    fieldId: 'allies'
                },
                {
                    id: 'enemies',
                    title: 'Enemies',
                    listContent: character.enemies,
                    dotColor: "bg-red-400",
                    fieldId: 'enemies'
                }
            ]
        },
        {
            id: 'arc',
            title: 'Narrative Arc',
            icon: <Sparkles className="w-5 h-5" />,
            content: '',
            subsections: [
                {
                    id: 'arc-type',
                    title: 'Arc Type',
                    content: character.arcType || "Undefined Arc",
                    fieldId: 'arcType'
                },
                {
                    id: 'climax',
                    title: 'Climax Resolution',
                    content: character.climax || "The ending has not been written.",
                    fieldId: 'climax'
                }
            ]
        }
    ];

    const infoboxData = {
        stats: [
            { label: 'Role', value: character.role },
            { label: 'Archetype', value: character.archetype || 'Unknown' },
            { label: 'Genre', value: character.genre || 'N/A' },
            { label: 'Phase', value: character.phase }
        ],
        tags: character.motivations || []
    };

    return (
        <div className="min-h-screen bg-[#08080c] pb-20">
            {/* Sticky Navigation Bar */}
            <div
                className={cn(
                    "fixed top-0 left-0 right-0 z-40 transition-all duration-500 border-b border-white/5",
                    isScrolled ? "translate-y-0 opacity-100 bg-[#08080c]/90 backdrop-blur-xl" : "-translate-y-full opacity-0"
                )}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-white/5 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 text-white/60" />
                        </button>
                        <h2 className="text-lg font-semibold text-white">{character.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/chat?mode=chat_with&id=${character.id}`)}>
                            <Play className="w-4 h-4 mr-2" /> Play
                        </Button>
                    </div>
                </div>
            </div>

            {viewMode === 'reading' ? (
                /* SIMPLIFIED READING HEADER */
                <div className="max-w-7xl mx-auto px-6 pt-8 pb-4 mb-8 border-b border-white/10">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4 text-sm text-white/40">
                                <button
                                    onClick={() => router.back()}
                                    className="hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <span>/</span>
                                <span>Characters</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight font-serif mb-2">
                                {character.name}
                            </h1>
                            <p className="text-lg text-white/60 font-serif italic max-w-2xl">
                                {character.tagline || "A legend drafted in shadow and light."}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white/40 hover:text-white"
                                onClick={() => setIsEditMode(!isEditMode)}
                            >
                                {isEditMode ? 'Done' : 'Edit'}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* MAGAZINE-STYLE HERO HEADER (Legacy/Editor) */
                <div className="relative group mb-6">
                    {/* Hero Banner (Background + Gradient) */}
                    <div className="relative h-[250px] w-full overflow-hidden">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            {character.imageUrl ? (
                                <img
                                    src={character.imageUrl}
                                    alt={character.name}
                                    className="w-full h-full object-cover opacity-90"
                                />
                            ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${getGenreGradient(character.genre)} flex items-center justify-center`}>
                                    <Users className="w-32 h-32 text-white/5" />
                                </div>
                            )}
                            {/* Genre-based Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${getGenreGradient(character.genre)} mix-blend-overlay opacity-60`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/40 to-transparent" />
                            {/* Texture Overlay (noise) */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                        </div>

                        {/* Navigation (Top Left) */}
                        <div className="absolute top-6 left-6 z-30">
                            <button
                                onClick={() => router.back()}
                                className="p-2.5 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all text-white border border-white/10 group/back"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover/back:-translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        {/* Action Bar (Top Right) */}
                        <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-2 transition-all p-1 rounded-full",
                                isEditMode ? "bg-black/40 backdrop-blur-md border border-amber-500/30 pr-4" : ""
                            )}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={cn(
                                        "h-9 rounded-full px-4 backdrop-blur-md transition-all gap-2",
                                        isEditMode
                                            ? "bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                            : "bg-black/20 text-white hover:bg-white/10 border border-white/5"
                                    )}
                                    onClick={() => setIsEditMode(!isEditMode)}
                                >
                                    {isEditMode ? <Check className="w-4 h-4" /> : <Pencil className="w-3.5 h-3.5" />}
                                    {isEditMode ? 'Done Editing' : 'Edit Page'}
                                </Button>

                                {/* Contextual Actions (Only show when not editing or if useful) */}
                                {!isEditMode && (
                                    <>
                                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-white/10 border border-white/5" onClick={handleExport} title="Export">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Link href={`/chat?mode=chat_with&id=${character.id}`}>
                                            <Button size="sm" variant="ghost" className="h-9 rounded-full px-4 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 backdrop-blur-md gap-2" title="Chat">
                                                <MessageSquare className="w-4 h-4" />
                                                <span className="hidden sm:inline">Chat</span>
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Title & Metadata (Bottom Left inside Banner) */}
                        <div className="absolute bottom-6 left-[160px] right-6 z-20 flex flex-col justify-end min-h-[100px]">
                            {/* Pills */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {character.role && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/10 backdrop-blur-md text-white/80 shadow-sm">
                                        {character.role}
                                    </span>
                                )}
                                {character.archetype && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/10 backdrop-blur-md text-white/80 shadow-sm">
                                        {character.archetype}
                                    </span>
                                )}
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm flex items-center gap-1.5",
                                    character.worldId ? "bg-blue-500/10 border-blue-500/20 text-blue-200" : "bg-white/5 border-white/5 text-white/40"
                                )}>
                                    <Link2 className="w-3 h-3" />
                                    {character.worldId ? 'Linked' : 'Unlinked'}
                                </span>
                                {character.genre && (
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm",
                                        "bg-black/20 border-white/5 text-white/60"
                                    )}>
                                        {character.genre}
                                    </span>
                                )}
                                {character.phase && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 backdrop-blur-md text-primary/90 shadow-sm flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        {character.phase}
                                    </span>
                                )}
                            </div>

                            {/* Name */}
                            {isEditMode ? (
                                <input
                                    value={character.name}
                                    onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
                                    className="bg-transparent text-5xl font-black text-white tracking-tight focus:outline-none focus:border-b focus:border-amber-500/50 w-full mb-1"
                                    placeholder="Character Name"
                                />
                            ) : (
                                <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-xl">
                                    {character.name}
                                </h1>
                            )}

                            {/* Tagline */}
                            {isEditMode ? (
                                <div className="flex gap-2 items-center w-full max-w-2xl">
                                    <input
                                        value={character.tagline || ''}
                                        onChange={(e) => updateCharacter(character.id, { tagline: e.target.value })}
                                        className="flex-1 bg-transparent text-lg italic text-white/70 focus:outline-none focus:border-b focus:border-amber-500/50 placeholder:text-white/20"
                                        placeholder="Add an atmospheric tagline..."
                                    />
                                    <button
                                        onClick={() => handleOpenAIModal('Tagline', (val) => updateCharacter(character.id, { tagline: val }))}
                                        className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
                                        title="Generate Tagline"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-lg italic text-white/70 font-light tracking-wide drop-shadow-md line-clamp-1">
                                    {character.tagline || "A legend drafted in shadow and light."}
                                </p>
                            )}
                        </div>

                        {/* Watermark Icon */}
                        <div className="absolute -bottom-10 -right-10 text-white/5 rotate-12 pointer-events-none z-0">
                            <Users className="w-64 h-64" />
                        </div>
                    </div>

                    {/* Overlapping Avatar */}
                    <div className="absolute -bottom-8 left-8 z-30 group/avatar">
                        <div className="relative w-28 h-28 rounded-full p-1 bg-[#08080c] shadow-2xl">
                            <div className="w-full h-full rounded-full overflow-hidden ring-1 ring-white/10 relative">
                                {character.imageUrl ? (
                                    <img src={character.imageUrl} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                        <Users className="w-10 h-10 text-white/20" />
                                    </div>
                                )}

                                {/* Hover Change Image */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                                    onClick={() => setGeneratorModalOpen(true)}>
                                    <Wand2 className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            {/* Status Indicator */}
                            <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#08080c] flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 border border-[#08080c]" title="Active" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FEATURED PROSE (Summary) */}
            <div className="max-w-7xl mx-auto px-6 mb-12">
                <div className="pl-[0px] md:pl-[140px]">
                    {/* Featured Prose (Core Concept) */}
                    {!isExpanded && (
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0E] shadow-2xl group/prose transition-all duration-500 hover:border-white/20">
                            {/* Ambient Background Gradient */}
                            <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br ${getGenreGradient(character.genre)} opacity-[0.07] blur-[100px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3`} />

                            {/* Side Accent Line */}
                            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${getGenreGradient(character.genre)} opacity-80`} />

                            {/* Decorative Quote Mark */}
                            <div className="absolute top-6 right-8 text-white/[0.03] font-serif text-9xl leading-none select-none pointer-events-none font-black italic">
                                "
                            </div>

                            <div className="relative z-10 p-8 md:p-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary/80" />
                                        Core Concept
                                    </h3>
                                    {isEditMode && (
                                        <button onClick={() => handleOpenAIModal('Core Concept', (val) => updateCharacter(character.id, { coreConcept: val }))} className="p-1.5 rounded-lg bg-white/5 text-primary hover:bg-primary/10 transition-colors">
                                            <Wand2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {isEditMode ? (
                                    <textarea
                                        value={character.coreConcept || ''}
                                        onChange={(e) => updateCharacter(character.id, { coreConcept: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white/90 text-lg leading-relaxed focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 min-h-[150px] font-serif"
                                        placeholder="Describe the core concept..."
                                    />
                                ) : (
                                    <div className="max-w-4xl relative">
                                        <MarkdownProse
                                            content={character.coreConcept || "No core concept defined. Click Edit to begin your character's journey."}
                                            className="prose-xl text-white/90 font-serif leading-loose tracking-wide"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TOGGLE CONTROL */}
            <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col items-center gap-2">
                {!isExpanded && (
                    <div className="flex items-center gap-3 text-xs text-white/30 uppercase tracking-widest font-medium mb-2 animate-in fade-in zoom-in duration-500">
                        <span>{sections.filter((s: any) => s.content || (s.subsections && s.subsections.some((sub: any) => sub.content || sub.listContent))).length} Sections Completed</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{(character.progress || 0)}% Developed</span>
                    </div>
                )}
                <button
                    onClick={toggleView}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium text-white/70 hover:text-white group/toggle backdrop-blur-md shadow-lg"
                >
                    <span>{isExpanded ? 'Hide Full Details' : 'Show Full Details'}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-500 text-primary", isExpanded ? "rotate-180" : "")} />
                </button>
            </div>

            {/* COLLAPSIBLE DETAILS CONTAINER */}
            <div className={cn(
                "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden",
                isExpanded ? "max-h-[5000px] opacity-100 transform translate-y-0" : "max-h-0 opacity-0 transform translate-y-4"
            )}>
                {/* Sticky Nav (Only when expanded) */}
                <div className="sticky top-20 z-30 flex justify-center mb-24 pointer-events-none">
                    <div className="bg-[#08080c] border border-white/10 rounded-full p-1.5 flex gap-1 shadow-2xl pointer-events-auto">
                        {(viewMode === 'reading' || viewMode === 'prose' ? proseSections : sections).map(s => (
                            <button
                                key={s.id}
                                onClick={() => viewMode === 'reading' || viewMode === 'prose'
                                    ? setActiveReadingTab(s.id)
                                    : handleNavigate(s.id)
                                }
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                                    (viewMode === 'reading' || viewMode === 'prose'
                                        ? activeReadingTab === s.id
                                        : activeSection === s.id)
                                        ? "bg-primary text-white shadow-md"
                                        : "text-white/50 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {s.title.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className={cn(
                    "mx-auto px-6 py-4 transition-all duration-300",
                    viewMode === 'reading' ? "max-w-[1600px]" : "max-w-7xl"
                )}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left: Sidebar (TOC & Info) */}
                        <div className="lg:col-span-2 space-y-6">
                            <Infobox
                                data={infoboxData}
                                title={character.name}
                                imageUrl={character.imageUrl}
                                type="Character Profile"
                            />
                            <div className="hidden lg:block">
                                {viewMode === 'reading' ? (
                                    <ReadingSideNav
                                        sections={proseSections}
                                        activeSection={activeReadingTab}
                                        onNavigate={(sectionId) => {
                                            setActiveReadingTab(sectionId);
                                            document.getElementById(`prose-${sectionId}`)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    />
                                ) : (
                                    <TableOfContents
                                        sections={sections}
                                        activeSection={activeSection}
                                        onNavigate={handleNavigate}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right: Content Sections */}
                        <div className="lg:col-span-10 space-y-6">
                            {/* View Mode Toggle */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2 p-1 rounded-lg bg-white/5 border border-white/10">
                                    <button
                                        onClick={() => setViewMode('reading')}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                            viewMode === 'reading' ? "bg-primary text-white" : "text-white/60 hover:text-white"
                                        )}
                                    >
                                        Reading View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('prose')}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                            viewMode === 'prose' ? "bg-primary text-white" : "text-white/60 hover:text-white"
                                        )}
                                    >
                                        Editor
                                    </button>
                                    <button
                                        onClick={() => setViewMode('structured')}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                            viewMode === 'structured' ? "bg-primary text-white" : "text-white/60 hover:text-white"
                                        )}
                                    >
                                        Structured View
                                    </button>
                                </div>
                            </div>

                            {viewMode === 'reading' ? (
                                /* BLOG-STYLE READING VIEW */
                                <div className="space-y-12">
                                    <ProseSection
                                        id="prose-foundation"
                                        title="Foundation"
                                        content={character.coreConcept || ''}
                                        onChange={(val) => handleProseChange('coreConcept', val)}
                                        placeholder="Describe who this character is at their core..."
                                        readOnly={true}
                                    />

                                    <ProseSection
                                        id="prose-personality"
                                        title="Personality"
                                        content={character.personalityProse || ''}
                                        onChange={(val) => handleProseChange('personalityProse', val)}
                                        placeholder="Describe their personality..."
                                        readOnly={true}
                                    />

                                    <ProseSection
                                        id="prose-backstory"
                                        title="Backstory"
                                        content={character.backstoryProse || character.origin || ''}
                                        onChange={(val) => handleProseChange('backstoryProse', val)}
                                        placeholder="Tell their origin story..."
                                        readOnly={true}
                                    />

                                    <ProseSection
                                        id="prose-relationships"
                                        title="Relationships"
                                        content={character.relationshipsProse || ''}
                                        onChange={(val) => handleProseChange('relationshipsProse', val)}
                                        placeholder="Describe key relationships..."
                                        readOnly={true}
                                    />

                                    <ProseSection
                                        id="prose-arc"
                                        title="Character Arc"
                                        content={character.arcProse || character.arcType || ''}
                                        onChange={(val) => handleProseChange('arcProse', val)}
                                        placeholder="Outline their narrative journey..."
                                        readOnly={true}
                                    />
                                </div>
                            ) : viewMode === 'prose' ? (
                                /* EDITOR PROSE VIEW - Shows all sections like Reading View but editable */
                                <div className="space-y-12">
                                    <ProseSection
                                        id="prose-foundation"
                                        title="Foundation"
                                        content={character.coreConcept || ''}
                                        onChange={(val) => handleProseChange('coreConcept', val)}
                                        placeholder="Describe who this character is at their core..."
                                        onAiGenerate={() => handleOpenAIModal('Foundation', (val) => handleSetSuggestion('coreConcept', val))}
                                        readOnly={false}
                                        suggestion={suggestions['coreConcept']}
                                        onAcceptSuggestion={() => handleAcceptSuggestion('coreConcept')}
                                        onRejectSuggestion={() => handleRejectSuggestion('coreConcept')}
                                    />

                                    <ProseSection
                                        id="prose-personality"
                                        title="Personality"
                                        content={character.personalityProse || ''}
                                        onChange={(val) => handleProseChange('personalityProse', val)}
                                        placeholder="Describe their personality, motivations, flaws, and fears..."
                                        onAiGenerate={() => handleOpenAIModal('Personality', (val) => handleSetSuggestion('personalityProse', val))}
                                        readOnly={false}
                                        suggestion={suggestions['personalityProse']}
                                        onAcceptSuggestion={() => handleAcceptSuggestion('personalityProse')}
                                        onRejectSuggestion={() => handleRejectSuggestion('personalityProse')}
                                    />

                                    <ProseSection
                                        id="prose-backstory"
                                        title="Backstory"
                                        content={character.backstoryProse || character.origin || ''}
                                        onChange={(val) => handleProseChange('backstoryProse', val)}
                                        placeholder="Tell their origin story, formative experiences..."
                                        onAiGenerate={() => handleOpenAIModal('Backstory', (val) => handleSetSuggestion('backstoryProse', val))}
                                        readOnly={false}
                                        suggestion={suggestions['backstoryProse']}
                                        onAcceptSuggestion={() => handleAcceptSuggestion('backstoryProse')}
                                        onRejectSuggestion={() => handleRejectSuggestion('backstoryProse')}
                                    />

                                    <ProseSection
                                        id="prose-relationships"
                                        title="Relationships"
                                        content={character.relationshipsProse || ''}
                                        onChange={(val) => handleProseChange('relationshipsProse', val)}
                                        placeholder="Describe key relationships..."
                                        onAiGenerate={() => handleOpenAIModal('Relationships', (val) => handleSetSuggestion('relationshipsProse', val))}
                                        readOnly={false}
                                        suggestion={suggestions['relationshipsProse']}
                                        onAcceptSuggestion={() => handleAcceptSuggestion('relationshipsProse')}
                                        onRejectSuggestion={() => handleRejectSuggestion('relationshipsProse')}
                                    />

                                    <ProseSection
                                        id="prose-arc"
                                        title="Character Arc"
                                        content={character.arcProse || character.arcType || ''}
                                        onChange={(val) => handleProseChange('arcProse', val)}
                                        placeholder="Outline their narrative journey..."
                                        onAiGenerate={() => handleOpenAIModal('Character Arc', (val) => handleSetSuggestion('arcProse', val))}
                                        readOnly={false}
                                        suggestion={suggestions['arcProse']}
                                        onAcceptSuggestion={() => handleAcceptSuggestion('arcProse')}
                                        onRejectSuggestion={() => handleRejectSuggestion('arcProse')}
                                    />
                                </div>
                            ) : (
                                /* STRUCTURED TAG VIEW (Legacy) */
                                <>
                                    {sections.map((section, idx) => (
                                        <ContentSectionBlock
                                            key={section.id}
                                            section={section}
                                            isFirst={idx === 0}
                                            isEditMode={isEditMode}
                                            onContentChange={handleContentChange}
                                            onListChange={handleListChange}
                                            onOpenAIModal={handleOpenAIModal}
                                            suggestions={suggestions}
                                            onAcceptSuggestion={handleAcceptSuggestion}
                                            onRejectSuggestion={handleRejectSuggestion}
                                            onSetSuggestion={handleSetSuggestion}
                                        />
                                    ))}
                                </>
                            )}

                            {/* Custom Sections */}
                            {character.customSections?.map((section, idx) => (
                                <CustomSection
                                    key={section.id}
                                    section={section}
                                    isEditMode={isEditMode}
                                    onUpdate={handleUpdateCustomSection}
                                    onDelete={handleDeleteCustomSection}
                                    onMoveUp={() => handleMoveSection(section.id, 'up')}
                                    onMoveDown={() => handleMoveSection(section.id, 'down')}
                                    onOpenAIModal={handleOpenAIModal}
                                    isFirst={idx === 0}
                                    isLast={idx === (character.customSections?.length || 0) - 1}
                                />
                            ))}

                            {/* Add Section Button */}
                            {isEditMode && (
                                <button
                                    onClick={handleAddCustomSection}
                                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 
                                         text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all group"
                                >
                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="font-semibold">Add Custom Section</span>
                                </button>
                            )}

                            {/* Footer Actions */}
                            <div className="pt-12 mt-12 border-t border-white/5 flex justify-between items-center text-sm text-muted-foreground">
                                <div>
                                    Last updated: {new Date(character.updatedAt).toLocaleDateString()}
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        className={cn(
                                            "hover:text-white transition-colors",
                                            isEditMode && "text-emerald-400"
                                        )}
                                        onClick={() => setIsEditMode(!isEditMode)}
                                    >
                                        {isEditMode ? 'Done Editing' : 'Edit Page'}
                                    </button>
                                    <button className="hover:text-white transition-colors">View History</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>{/* End of Main Content Grid */}
            </div>{/* End of Collapsible Details */}

            {/* Generator Modal */}
            <ImageGeneratorModal
                isOpen={generatorModalOpen}
                onClose={() => setGeneratorModalOpen(false)
                }
                onGenerate={handleGenerateImage}
                onUpload={(dataUrl) => {
                    updateCharacter(character.id, { imageUrl: dataUrl });
                    setGeneratorModalOpen(false);
                }}
                itemName={character.name}
            />

            {/* AI Content Generation Modal */}
            <AIGenerateModal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                onInsert={(content) => {
                    if (insertHandler) {
                        insertHandler(content);
                    }
                    console.log('AI generated content:', content);
                    setAiModalOpen(false);
                }}
                fieldLabel={aiModalField}
                entityContext={character}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteWarningDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDeleteSection}
                title="Delete Custom Section"
                itemName={character.customSections?.find(s => s.id === sectionToDelete)?.title}
            />

            {/* Undo Toast */}
            {
                showUndoToast && (
                    <UndoToast
                        onUndo={handleUndoDelete}
                        onClose={() => setShowUndoToast(false)}
                        message="Section moved to trash"
                    />
                )
            }
        </div >
    );
}

