'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { EditableField } from '@/components/ui/editable-field';
import { EditableList } from '@/components/ui/editable-list';
import { CustomSection } from '@/components/ui/custom-section';
import { DeleteWarningDialog } from '@/components/ui/delete-warning-dialog';
import { UndoToast } from '@/components/ui/undo-toast';
import { AIGenerateModal } from '@/components/ui/ai-generate-modal';
import { ExpandableText } from '@/components/ui/expandable-text';
import { ProseSection } from '@/components/ui/prose-section';
import {
    ArrowLeft,
    Share2,
    Download,
    Edit3,
    Upload,
    Wand2,
    ChevronDown,
    Map,
    BookOpen,
    Users,
    Scroll,
    Globe,
    Play,
    Sparkles,
    MessageSquare,
    Check,
    Pencil,
    Plus,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ImageGeneratorModal } from '@/components/gallery';
import { ImageProvider } from '@/types/image-config';
import { MarkdownProse } from '@/components/ui/markdown-prose';
import { Shield, Swords, Link2, Clock, Zap, Target } from 'lucide-react';

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
                                ? "bg-violet-500/10 text-violet-400"
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        {section.icon && <span className="opacity-60">{section.icon}</span>}
                        <span>{section.title}</span>
                    </button>
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
        <div className="p-3 text-center bg-violet-500/10 border-b border-violet-500/20">
            <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">
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
                    <Globe className="w-12 h-12" />
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
                    <span className="text-sm text-white font-medium text-right max-w-[60%]">
                        {stat.value}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

const ContentSectionBlock = ({
    section,
    isFirst,
    isEditMode = false,
    onContentChange,
    onListChange,
    onOpenAIModal
}: {
    section: any;
    isFirst: boolean;
    isEditMode?: boolean;
    onContentChange?: (fieldId: string, value: string) => void;
    onListChange?: (fieldId: string, items: string[]) => void;
    onOpenAIModal?: (fieldLabel: string, handler: (content: string) => void) => void;
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
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <span className="text-violet-400">{section.icon}</span>
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
                {/* Editable text field */}
                {section.fieldId && section.fieldType === 'text' ? (
                    <div className="prose prose-invert max-w-none mb-6">
                        <EditableField
                            value={section.rawContent || ''}
                            onSave={(val) => onContentChange?.(section.fieldId, val)}
                            placeholder={`Enter ${section.title.toLowerCase()}...`}
                            multiline
                            isEditModeActive={isEditMode}
                            showAIButton={isEditMode}
                            onAIGenerate={() => onOpenAIModal?.(section.title, (val) => onContentChange?.(section.fieldId, val))}
                        />
                    </div>
                ) : section.fieldId && section.fieldType === 'list' ? (
                    <div className="prose prose-invert max-w-none mb-6">
                        <EditableList
                            items={section.rawContent || []}
                            onSave={(items) => onListChange?.(section.fieldId, items)}
                            colorClass="bg-violet-500/10 text-violet-300 border border-violet-500/20"
                            isEditModeActive={isEditMode}
                            showAIButton={isEditMode}
                            onAIGenerate={() => onOpenAIModal?.(section.title, (val) => {
                                const items = val.split('\n').filter(line => line.trim());
                                onListChange?.(section.fieldId, items);
                            })}
                        />
                    </div>
                ) : section.content && (
                    <div className="prose prose-invert max-w-none mb-6">
                        {typeof section.content === 'string' ? (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {section.content}
                            </p>
                        ) : (
                            section.content
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};


// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function WorldProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { worlds, updateWorld } = useStore();

    const [decodedId, setDecodedId] = useState<string>('');
    const id = params?.id ? decodeURIComponent(params.id as string) : '';
    const world = worlds.find(w => w.id === id);
    const [activeSection, setActiveSection] = useState('overview');
    const [isScrolled, setIsScrolled] = useState(false);
    const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiModalField, setAiModalField] = useState('');
    const [insertHandler, setInsertHandler] = useState<((content: string) => void) | null>(null);

    // Custom Section State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [lastDeletedSection, setLastDeletedSection] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'prose' | 'structured'>('prose');

    // Collapsible View State
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!world) return;
        // Check hash for direct link navigation
        if (window.location.hash) {
            setIsExpanded(true);
            const id = window.location.hash.replace('#', '');
            setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 500);
        } else {
            // Check persistence
            const savedState = localStorage.getItem(`entity-view-preference-${world.id}`);
            if (savedState === 'expanded') setIsExpanded(true);
        }
    }, [world?.id]);

    const toggleView = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        if (world) {
            localStorage.setItem(`entity-view-preference-${world.id}`, newState ? 'expanded' : 'collapsed');
        }
    };

    useEffect(() => {
        if (params?.id) {
            setDecodedId(decodeURIComponent(params.id as string));
        }
    }, [params]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!decodedId && !id) return null;

    if (!world) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h2 className="text-xl font-semibold mb-2">World Not Found</h2>
                <Button onClick={() => router.push('/worlds')} variant="outline">
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
            await new Promise(resolve => setTimeout(resolve, 2000));
            const seed = Math.floor(Math.random() * 1000);
            const mockUrl = `https://picsum.photos/seed/${seed}/1920/1080`;

            updateWorld(world.id, {
                imageUrl: mockUrl,
                imageSource: 'generated'
            });
        } catch (error) {
            console.error('Failed to generate image:', error);
        }
    };

    const handleExport = () => {
        const content = JSON.stringify(world, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${world.name.replace(/\s+/g, '_')}_Lore.json`;
        document.body.click();
        a.click();
        URL.revokeObjectURL(url);
    };

    // Field change handlers for inline editing
    const handleContentChange = (fieldId: string, value: string) => {
        updateWorld(world.id, { [fieldId]: value, updatedAt: new Date() });
    };

    const handleListChange = (fieldId: string, items: string[]) => {
        updateWorld(world.id, { [fieldId]: items, updatedAt: new Date() });
    };

    const handleProseChange = (fieldId: string, value: string) => {
        updateWorld(world.id, { [fieldId]: value, updatedAt: new Date() });
    };

    const handleOpenAIModal = (fieldLabel: string, handler: (content: string) => void) => {
        setAiModalField(fieldLabel);
        setInsertHandler(() => handler); // Wrap in arrow function to avoid React executing it immediately if it were a state updater
        setAiModalOpen(true);
    };

    // Custom Section Handlers
    // Custom Section Handlers

    const handleAddCustomSection = () => {
        const newSection = {
            id: `custom-${Date.now()}`,
            title: 'New Section',
            content: '',
            order: (world.customSections?.length || 0) + 10
        };

        updateWorld(world.id, {
            customSections: [...(world.customSections || []), newSection],
            updatedAt: new Date()
        });

        // Auto scroll to new section
        setTimeout(() => {
            document.getElementById(newSection.id)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleUpdateCustomSection = (sectionId: string, data: any) => {
        const updatedSections = (world.customSections || []).map(s =>
            s.id === sectionId ? { ...s, ...data } : s
        );
        updateWorld(world.id, {
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

        const section = world.customSections?.find(s => s.id === sectionToDelete);
        if (!section) return;

        setLastDeletedSection(section);

        const updatedSections = world.customSections?.filter(s => s.id !== sectionToDelete) || [];
        updateWorld(world.id, {
            customSections: updatedSections,
            updatedAt: new Date()
        });

        // Add to trash in store
        const trashItem = {
            ...section,
            deletedAt: new Date(),
            sourceEntityId: world.id
        };
        const updatedTrash = [...(world.trashedSections || []), trashItem];
        updateWorld(world.id, { trashedSections: updatedTrash });

        setDeleteDialogOpen(false);
        setSectionToDelete(null);
        setShowUndoToast(true);
    };

    const handleUndoDelete = () => {
        if (!lastDeletedSection) return;

        // Restore section
        updateWorld(world.id, {
            customSections: [...(world.customSections || []), lastDeletedSection],
            updatedAt: new Date()
        });

        // Remove from trash
        const updatedTrash = world.trashedSections?.filter(s => s.id !== lastDeletedSection.id) || [];
        updateWorld(world.id, { trashedSections: updatedTrash });

        setShowUndoToast(false);
        setLastDeletedSection(null);
    };

    const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
        if (!world.customSections) return;

        const index = world.customSections.findIndex(s => s.id === sectionId);
        if (index === -1) return;

        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === world.customSections.length - 1) return;

        const newSections = [...world.customSections];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];

        updateWorld(world.id, {
            customSections: newSections,
            updatedAt: new Date()
        });
    };

    // Construct Content Sections
    const sections = [
        {
            id: 'overview',
            title: 'Description',
            icon: <Scroll className="w-5 h-5" />,
            content: world.description || "A world waiting to be discovered.",
            rawContent: world.description || '',
            fieldId: 'description',
            fieldType: 'text'
        },
        {
            id: 'rules',
            title: 'Rules & Systems',
            icon: <BookOpen className="w-5 h-5" />,
            content: world.rules?.length ? (
                <ul className="space-y-3">
                    {world.rules.map((rule, i) => (
                        <li key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="h-6 w-6 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">
                                {i + 1}
                            </span>
                            <span className="text-sm text-muted-foreground leading-relaxed pt-0.5">{rule}</span>
                        </li>
                    ))}
                </ul>
            ) : "No rules defined.",
            rawContent: world.rules || [],
            fieldId: 'rules',
            fieldType: 'list'
        },
        {
            id: 'societies',
            title: 'Societies & Factions',
            icon: <Users className="w-5 h-5" />,
            content: world.societies?.length ? (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                    {world.societies.map((society, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                            <span className="text-sm font-medium">{society}</span>
                        </div>
                    ))}
                </div>
            ) : "No societies recorded.",
            rawContent: world.societies || [],
            fieldId: 'societies',
            fieldType: 'list'
        },
        {
            id: 'history',
            title: 'History & Lore',
            icon: <Scroll className="w-5 h-5" />,
            content: world.history || "The history of this world has been lost to time.",
            rawContent: world.history || '',
            fieldId: 'history',
            fieldType: 'text'
        },
        {
            id: 'geography',
            title: 'Geography',
            icon: <Map className="w-5 h-5" />,
            content: world.geography || "The map is currently blank.",
            rawContent: world.geography || '',
            fieldId: 'geography',
            fieldType: 'text'
        }
    ];

    const infoboxData = {
        stats: [
            { label: 'Genre', value: world.genre },
            { label: 'Tone', value: world.tone || 'N/A' },
            { label: 'WID', value: world.id },
            { label: 'Progress', value: `${world.progress}%` }
        ]
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
                        <h2 className="text-lg font-semibold text-white">{world.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/chat?mode=world&resume=${world.id}`}>
                            <Button variant="ghost" size="sm">
                                <MessageSquare className="w-4 h-4 mr-2" /> Chat
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* MAGAZINE HERO HEADER */}
            <div className="relative w-full h-[50vh] min-h-[400px] group">
                {/* Background Layer */}
                <div className="absolute inset-0">
                    {world.imageUrl ? (
                        <img
                            src={world.imageUrl}
                            alt={world.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getGenreGradient(world.genre)}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#08080c]/30 via-transparent to-[#08080c]/80" />
                </div>

                {/* Navbar Placeholder space */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none" />

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-30">
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:bg-black/40 transition-all group/back"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover/back:-translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Header Content */}
                <div className="absolute bottom-0 left-0 w-full z-20 px-6 pb-16">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-8">
                        {/* Overlapping Avatar/Icon */}
                        <div className="relative -mb-12 shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#08080c] shadow-2xl overflow-hidden bg-[#1a103c] flex items-center justify-center relative group/avatar">
                                {world.imageUrl ? (
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${world.imageUrl})` }} />
                                ) : (
                                    <Globe className="w-16 h-16 text-white/20" />
                                )}

                                <button
                                    onClick={() => setGeneratorModalOpen(true)}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <Wand2 className="w-8 h-8 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Title & Meta */}
                        <div className="flex-1 mb-2">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md",
                                    "bg-white/10 border-white/10 text-white/80"
                                )}>
                                    World Setting
                                </span>
                                {world.genre && (
                                    <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-primary-foreground text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                        {world.genre}
                                    </span>
                                )}
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md transition-colors cursor-pointer",
                                    isEditMode ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                                )} onClick={() => setIsEditMode(!isEditMode)}>
                                    {isEditMode ? 'Editing Enabled' : 'Read Only'}
                                </span>
                            </div>

                            {isEditMode ? (
                                <input
                                    type="text"
                                    value={world.name}
                                    onChange={(e) => updateWorld(world.id, { name: e.target.value })}
                                    className="text-4xl md:text-6xl font-black text-white tracking-tight bg-transparent border-b border-white/20 focus:border-white outline-none w-full"
                                />
                            ) : (
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
                                    {world.name}
                                </h1>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mb-4">
                            <Link href={`/chat?mode=world&resume=${world.id}`}>
                                <Button className="rounded-full h-12 px-8 bg-white text-black hover:bg-white/90 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Enter World
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK STATS & SUMMARY */}
            <div className="max-w-7xl mx-auto px-6 mb-12 relative z-10">


                {/* Featured Prose (Summary) */}
                {!isExpanded && (
                    <div className="pl-0 md:pl-[180px]">
                        {isEditMode ? (
                            <div className="mb-6">
                                <textarea
                                    value={world.description || ''}
                                    onChange={(e) => updateWorld(world.id, { description: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white/90 text-lg leading-relaxed focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 min-h-[150px]"
                                    placeholder="Describe the world..."
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={() => handleOpenAIModal('description', (val) => updateWorld(world.id, { description: val }))}
                                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Generate
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-4xl mb-6">
                                <MarkdownProse
                                    content={world.description || "A world waiting to be discovered."}
                                    className="prose-lg text-white/90 leading-relaxed drop-shadow-sm font-serif italic opacity-90"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#08080c]/30 via-[#08080c]/10 to-[#08080c]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08080c]/90 via-transparent to-transparent" />


            {/* TOGGLE CONTROL */}
            <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col items-center gap-2">
                {!isExpanded && (
                    <div className="flex items-center gap-3 text-xs text-white/30 uppercase tracking-widest font-medium mb-2 animate-in fade-in zoom-in duration-500">
                        <span>{sections.filter((s: any) => s.content || (s.rawContent && s.rawContent.length > 0)).length} Sections Completed</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{(world.progress || 0)}% Developed</span>
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
                "transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden",
                isExpanded ? "max-h-[5000px] opacity-100 transform translate-y-0" : "max-h-0 opacity-0 transform translate-y-8"
            )}>
                {/* Sticky Nav */}
                <div className="sticky top-24 z-30 flex justify-center mb-8 pointer-events-none">
                    <div className="bg-[#08080c]/80 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex gap-1 shadow-2xl pointer-events-auto">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleNavigate(s.id)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                                    activeSection === s.id ? "bg-primary text-white shadow-md" : "text-white/50 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {s.title.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left: Sidebar (TOC & Info) */}
                        <div className="lg:col-span-3 space-y-6">
                            <Infobox
                                data={infoboxData}
                                title={world.name}
                                imageUrl={world.imageUrl}
                                type="World Setting"
                            />
                            <div className="hidden lg:block">
                                <TableOfContents
                                    sections={sections}
                                    activeSection={activeSection}
                                    onNavigate={handleNavigate}
                                />
                            </div>
                        </div>

                        {/* Right: Content Sections */}
                        <div className="lg:col-span-9 space-y-6">
                            {/* View Mode Toggle */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2 p-1 rounded-lg bg-white/5 border border-white/10">
                                    <button
                                        onClick={() => setViewMode('prose')}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                            viewMode === 'prose' ? "bg-violet-600 text-white" : "text-white/60 hover:text-white"
                                        )}
                                    >
                                        Narrative View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('structured')}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                            viewMode === 'structured' ? "bg-violet-600 text-white" : "text-white/60 hover:text-white"
                                        )}
                                    >
                                        Structured View
                                    </button>
                                </div>
                            </div>

                            {viewMode === 'prose' ? (
                                /* NARRATIVE PROSE VIEW */
                                <>
                                    <ProseSection
                                        title="Overview"
                                        content={world.overviewProse || world.description || ''}
                                        onChange={(val) => handleProseChange('overviewProse', val)}
                                        placeholder="Describe this world in rich, evocative prose..."
                                        onAiGenerate={() => handleOpenAIModal('Overview', (val) => handleProseChange('overviewProse', val))}
                                    />

                                    <ProseSection
                                        title="History & Lore"
                                        content={world.historyProse || world.history || ''}
                                        onChange={(val) => handleProseChange('historyProse', val)}
                                        placeholder="Tell the story of this world's past, its pivotal moments, and the echoes that still resonate..."
                                        onAiGenerate={() => handleOpenAIModal('History', (val) => handleProseChange('historyProse', val))}
                                    />

                                    <ProseSection
                                        title="Factions & Powers"
                                        content={world.factionsProse || ''}
                                        onChange={(val) => handleProseChange('factionsProse', val)}
                                        placeholder="Describe the major factions, their goals, leaders, and conflicts..."
                                        onAiGenerate={() => handleOpenAIModal('Factions', (val) => handleProseChange('factionsProse', val))}
                                    />

                                    <ProseSection
                                        title="Geography & Locations"
                                        content={world.geographyProse || world.geography || ''}
                                        onChange={(val) => handleProseChange('geographyProse', val)}
                                        placeholder="Paint a picture of the landscapes, cities, and places of importance..."
                                        onAiGenerate={() => handleOpenAIModal('Geography', (val) => handleProseChange('geographyProse', val))}
                                    />
                                </>
                            ) : (
                                /* STRUCTURED VIEW (Legacy) */
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
                                        />
                                    ))}
                                </>
                            )}

                            {/* Custom Sections */}
                            {world.customSections?.map((section, idx) => (
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
                                    isLast={idx === (world.customSections?.length || 0) - 1}
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

                            {/* Footer */}
                            <div className="pt-12 mt-12 border-t border-white/5 flex justify-between items-center text-sm text-muted-foreground">
                                <div>
                                    Last updated: {new Date(world.updatedAt).toLocaleDateString()}
                                </div>
                                <button
                                    className={cn(
                                        "hover:text-white transition-colors",
                                        isEditMode && "text-violet-400"
                                    )}
                                    onClick={() => setIsEditMode(!isEditMode)}
                                >
                                    {isEditMode ? 'Done Editing' : 'Edit Page'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div> {/* End of Collapsible Details */}

            {/* Generator Modal */}
            <ImageGeneratorModal
                isOpen={generatorModalOpen}
                onClose={() => setGeneratorModalOpen(false)}
                onGenerate={handleGenerateImage}
                onUpload={(dataUrl) => {
                    updateWorld(world.id, { imageUrl: dataUrl });
                    setGeneratorModalOpen(false);
                }}
                itemName={world.name}
            />

            {/* AI Content Generation Modal */}
            <AIGenerateModal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                onInsert={(content) => {
                    if (insertHandler) {
                        insertHandler(content);
                    }
                    setAiModalOpen(false);
                }}
                fieldLabel={aiModalField}
                entityContext={world}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteWarningDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDeleteSection}
                title="Delete Custom Section"
                itemName={world.customSections?.find(s => s.id === sectionToDelete)?.title}
            />

            {/* Undo Toast */}
            {showUndoToast && (
                <UndoToast
                    onUndo={handleUndoDelete}
                    onClose={() => setShowUndoToast(false)}
                    message="Section moved to trash"
                />
            )}
        </div>
    );
}

