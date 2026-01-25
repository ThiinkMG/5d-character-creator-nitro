'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCharacterStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { EditableField } from '@/components/ui/editable-field';
import { EditableList } from '@/components/ui/editable-list';
import { CustomSection } from '@/components/ui/custom-section';
import { DeleteWarningDialog } from '@/components/ui/delete-warning-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    X,
    Search,
    Image as ImageIcon,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { EntityContextNav } from '@/components/navigation/EntityContextNav';
import { ImageGeneratorModal } from '@/components/gallery';
import { ImageProvider } from '@/types/image-config';
import { ExpandableText } from '@/components/ui/expandable-text';
import { MarkdownProse } from '@/components/ui/markdown-prose';
import { useStore } from '@/lib/store';
import { LinkProjectModal } from '@/components/project/LinkProjectModal';
import { CharacterChatModeSelector } from '@/components/chat/CharacterChatModeSelector';
import { CharacterDocs } from '@/components/character/CharacterDocs';

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

// Gallery Display Components
const GallerySlideshow = ({ allMedia, sectionTitle }: { allMedia: Array<{ type: 'image' | 'video'; url: string; idx: number }>; sectionTitle: string }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    
    return (
        <div className="relative">
            <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40">
                {allMedia[currentIdx] && (
                    <>
                        {allMedia[currentIdx].type === 'image' ? (
                            <img 
                                src={allMedia[currentIdx].url} 
                                alt={`${sectionTitle} - Slide ${currentIdx + 1}`}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <video 
                                src={allMedia[currentIdx].url} 
                                className="w-full h-full object-contain"
                                controls
                            />
                        )}
                    </>
                )}
                {allMedia.length > 1 && (
                    <>
                        <button
                            onClick={() => setCurrentIdx((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1))}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all z-10"
                        >
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>
                        <button
                            onClick={() => setCurrentIdx((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all z-10"
                        >
                            <ChevronDown className="w-5 h-5 -rotate-90" />
                        </button>
                    </>
                )}
            </div>
            {allMedia.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {allMedia.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIdx(idx)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all",
                                idx === currentIdx ? "bg-primary w-6" : "bg-white/20"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const GalleryCarousel = ({ allMedia, sectionTitle }: { allMedia: Array<{ type: 'image' | 'video'; url: string; idx: number }>; sectionTitle: string }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    
    return (
        <div className="relative">
            <div className="overflow-hidden rounded-lg border border-white/10">
                <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentIdx * 100}%)` }}
                >
                    {allMedia.map((item) => (
                        <div key={item.idx} className="min-w-full aspect-video bg-black/40 flex items-center justify-center">
                            {item.type === 'image' ? (
                                <img 
                                    src={item.url} 
                                    alt={`${sectionTitle} - Image ${item.idx + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <video 
                                    src={item.url} 
                                    className="max-w-full max-h-full object-contain"
                                    controls
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {allMedia.length > 1 && (
                <>
                    <button
                        onClick={() => setCurrentIdx((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                    >
                        <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>
                    <button
                        onClick={() => setCurrentIdx((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                    >
                        <ChevronDown className="w-5 h-5 -rotate-90" />
                    </button>
                    <div className="flex justify-center gap-2 mt-4">
                        {allMedia.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIdx(idx)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    idx === currentIdx ? "bg-primary w-6" : "bg-white/20"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

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

const Infobox = ({ data, title, imageUrl, infoboxImageUrl, type, isEditMode, onUpdate, characterId, onImageChange, heroImageUrl }: any) => {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [customValue, setCustomValue] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Use infobox image if set (and not null/undefined), otherwise fall back to hero image
    const displayImageUrl = (infoboxImageUrl && infoboxImageUrl !== 'null') ? infoboxImageUrl : (imageUrl || heroImageUrl);

    // Pre-generated options for each field
    const fieldOptions: Record<string, string[]> = {
        Role: ['Protagonist', 'Antagonist', 'Supporting Character', 'Deuteragonist', 'Tritagonist', 'Reluctant Hero', 'Anti-Hero', 'Villain', 'Mentor', 'Sidekick', 'Love Interest', 'Foil'],
        Archetype: ['The Hero', 'The Mentor', 'The Threshold Guardian', 'The Herald', 'The Shapeshifter', 'The Shadow', 'The Ally', 'The Trickster', 'The Magician', 'The Sage', 'The Innocent', 'The Explorer', 'The Creator', 'The Ruler', 'The Caregiver', 'The Everyman', 'The Lover', 'The Jester', 'The Orphan', 'Unknown'],
        Genre: ['Fantasy', 'Science Fiction', 'Horror', 'Mystery', 'Thriller', 'Romance', 'Historical Fiction', 'Contemporary', 'Urban Fantasy', 'Steampunk', 'Cyberpunk', 'Superhero', 'Western', 'General'],
        Phase: ['Foundation', 'Personality', 'Backstory', 'Relationships', 'Arc']
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setEditingField(null);
                setCustomValue('');
            }
        };

        if (editingField) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [editingField]);

    const handleFieldClick = (fieldLabel: string, currentValue: string) => {
        if (!isEditMode) return;
        setEditingField(fieldLabel);
        setCustomValue(currentValue);
    };

    const handleSelectOption = (fieldLabel: string, value: string) => {
        if (fieldLabel === 'Role') {
            onUpdate(characterId, { role: value });
        } else if (fieldLabel === 'Archetype') {
            onUpdate(characterId, { archetype: value });
        } else if (fieldLabel === 'Genre') {
            onUpdate(characterId, { genre: value });
        } else if (fieldLabel === 'Phase') {
            onUpdate(characterId, { phase: value as any });
        }
        setEditingField(null);
        setCustomValue('');
    };

    const handleCustomSubmit = (fieldLabel: string) => {
        if (customValue.trim()) {
            handleSelectOption(fieldLabel, customValue.trim());
        }
    };

    return (
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
            <div className="relative aspect-square bg-black/40 group/image">
                {displayImageUrl ? (
                    <>
                        <img
                            src={displayImageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                        {/* Visual indicator for linked images */}
                        {infoboxImageUrl && infoboxImageUrl !== 'null' && infoboxImageUrl === imageUrl && (
                            <div className="absolute top-2 right-2 bg-primary/90 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-lg">
                                <Link2 className="w-3 h-3" />
                                Linked
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/10">
                        <Users className="w-12 h-12" />
                    </div>
                )}
                {isEditMode && onImageChange && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm z-10 pointer-events-auto">
                        <div className="flex flex-col gap-2 items-center">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Change Image button clicked');
                                    // Trigger image modal via parent component
                                    if (onImageChange) {
                                        // Pass a special signal to open the modal
                                        (onImageChange as any)('__OPEN_MODAL__', false);
                                    }
                                }}
                                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center gap-2"
                                title="Change Infobox Image"
                            >
                                <ImageIcon className="w-4 h-4" />
                                Change Image
                            </button>
                            {infoboxImageUrl && infoboxImageUrl !== 'null' && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Reset to Hero button clicked');
                                        onImageChange(null, false);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium transition-colors flex items-center gap-2"
                                    title="Reset to Hero Image"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reset to Hero
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {/* Download Button for Infobox Image */}
                {displayImageUrl && !isEditMode && (
                    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover/image:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = displayImageUrl;
                                link.download = `${title}-infobox.jpg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
                            title="Download Infobox Image"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="p-4 space-y-3">
                {data.stats && Array.isArray(data.stats) && data.stats.map((stat: any, idx: number) => {
                    const isReadOnly = stat.readOnly === true;
                    const isGenre = stat.label === 'Genre';
                    const genreValues = isGenre && stat.value ? stat.value.split(',').map((v: string) => v.trim()).filter((v: string) => v) : [];
                    const useVerticalLayout = isGenre && (genreValues.length > 1 || (stat.value && stat.value.length > 25));
                    
                    return (
                    <div
                        key={idx}
                        className={cn(
                            "py-2 border-b border-white/5 last:border-0 relative group",
                            !isReadOnly && isEditMode && "cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
                        )}
                        onClick={() => !isReadOnly && handleFieldClick(stat.label, stat.value)}
                    >
                        {useVerticalLayout ? (
                            // Vertical layout for Genre with long text or multiple values
                            <div className="space-y-1.5">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide block">
                                    {stat.label}
                                </span>
                                {editingField === stat.label && !isReadOnly ? (
                                    <div ref={dropdownRef} className="relative z-50 bg-[#0A0A0F] border border-white/20 rounded-lg shadow-2xl p-2 min-w-[200px]">
                                        <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                                            {fieldOptions[stat.label]?.map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectOption(stat.label, option);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="border-t border-white/10 pt-2">
                                            <div className="flex gap-1">
                                                <input
                                                    type="text"
                                                    value={customValue}
                                                    onChange={(e) => setCustomValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.stopPropagation();
                                                            handleCustomSubmit(stat.label);
                                                        } else if (e.key === 'Escape') {
                                                            e.stopPropagation();
                                                            setEditingField(null);
                                                            setCustomValue('');
                                                        }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                                                    placeholder="Custom value..."
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCustomSubmit(stat.label);
                                                    }}
                                                    className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded text-sm transition-colors"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingField(null);
                                                        setCustomValue('');
                                                    }}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded text-sm transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : genreValues.length > 1 ? (
                                    // Multiple genres as tags
                                    <div className="flex flex-wrap gap-1.5">
                                        {genreValues.map((genre: string, gIdx: number) => (
                                            <span
                                                key={gIdx}
                                                className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20 font-medium"
                                            >
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    // Single long genre value
                                    <span className="text-sm text-white font-medium leading-relaxed block">
                                        {stat.value}
                                    </span>
                                )}
                            </div>
                        ) : (
                            // Horizontal layout for other fields
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0 pt-0.5">
                                    {stat.label}
                                </span>
                                {editingField === stat.label && !isReadOnly ? (
                            <div ref={dropdownRef} className="absolute right-0 top-full mt-1 z-50 bg-[#0A0A0F] border border-white/20 rounded-lg shadow-2xl p-2 min-w-[200px]">
                                <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                                    {fieldOptions[stat.label]?.map((option) => (
                                        <button
                                            key={option}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectOption(stat.label, option);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 rounded transition-colors"
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-white/10 pt-2">
                                    <div className="flex gap-1">
                                        <input
                                            type="text"
                                            value={customValue}
                                            onChange={(e) => setCustomValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.stopPropagation();
                                                    handleCustomSubmit(stat.label);
                                                } else if (e.key === 'Escape') {
                                                    e.stopPropagation();
                                                    setEditingField(null);
                                                    setCustomValue('');
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                                            placeholder="Custom value..."
                                            autoFocus
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCustomSubmit(stat.label);
                                            }}
                                            className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded text-sm transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingField(null);
                                                setCustomValue('');
                                            }}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded text-sm transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <span className={cn(
                                "text-sm font-medium break-words text-right",
                                isReadOnly ? "text-white/60 font-mono text-xs" : "text-white"
                            )}>
                                {stat.value}
                            </span>
                        )}
                            </div>
                        )}
                    </div>
                )})}
            </div>

            {/* Tags */}
            {data.tags && Array.isArray(data.tags) && data.tags.length > 0 && (
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
};

// Infobox Image Change Confirmation Dialog
const InfoboxImageChangeDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    onChangeHeroToo,
    previewImageUrl
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: (changeHero: boolean) => void;
    onChangeHeroToo: () => void;
    previewImageUrl?: string | null;
}) => {
    const [rememberChoice, setRememberChoice] = React.useState(false);
    const [selectedOption, setSelectedOption] = React.useState<'infobox' | 'both' | null>(null);

    // Load remembered choice from localStorage
    React.useEffect(() => {
        if (isOpen) {
            const remembered = localStorage.getItem('infobox-image-choice');
            if (remembered === 'infobox' || remembered === 'both') {
                setSelectedOption(remembered);
            }
        }
    }, [isOpen]);

    // Keyboard shortcuts
    React.useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '1') {
                handleConfirm(false);
            } else if (e.key === '2') {
                handleConfirm(true);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleConfirm = (changeHero: boolean) => {
        if (rememberChoice) {
            localStorage.setItem('infobox-image-choice', changeHero ? 'both' : 'infobox');
        }
        // Call onConfirm first to perform the update
        onConfirm(changeHero);
        if (changeHero) {
            onChangeHeroToo();
        }
        // Close after a brief delay to ensure update completes
        setTimeout(() => {
            onClose();
        }, 100);
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0A0A0F] rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Change Infobox Image
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-white/60 text-sm">Choose where to apply this image update</p>
                </div>

                {/* Preview Section */}
                {previewImageUrl && (
                    <div className="p-6 border-b border-white/10">
                        <div className="relative rounded-xl overflow-hidden border-2 border-white/20 bg-black/40">
                            <div className="relative aspect-video">
                                <img
                                    src={previewImageUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <div className="flex items-center gap-2 text-white text-sm font-medium">
                                    <ImageIcon className="w-4 h-4" />
                                    Preview
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Options */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Infobox Only Option */}
                        <button
                            onClick={() => handleConfirm(false)}
                            onMouseEnter={() => setSelectedOption('infobox')}
                            onMouseLeave={() => setSelectedOption(null)}
                            className={cn(
                                "group relative p-5 rounded-xl border-2 transition-all text-left",
                                "hover:scale-[1.02] hover:shadow-lg",
                                selectedOption === 'infobox' 
                                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-lg transition-colors",
                                    selectedOption === 'infobox' 
                                        ? "bg-primary/20 text-primary" 
                                        : "bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white"
                                )}>
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-base">Infobox Only</h4>
                                        <kbd className={cn(
                                            "px-2 py-1 rounded text-xs font-mono",
                                            selectedOption === 'infobox'
                                                ? "bg-primary/20 text-primary border border-primary/30"
                                                : "bg-white/10 text-white/50 border border-white/10"
                                        )}>1</kbd>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">
                                        Update only the infobox sidebar image
                                    </p>
                                </div>
                            </div>
                            {selectedOption === 'infobox' && (
                                <div className="absolute top-2 right-2">
                                    <Check className="w-5 h-5 text-primary" />
                                </div>
                            )}
                        </button>

                        {/* Both Images Option */}
                        <button
                            onClick={() => handleConfirm(true)}
                            onMouseEnter={() => setSelectedOption('both')}
                            onMouseLeave={() => setSelectedOption(null)}
                            className={cn(
                                "group relative p-5 rounded-xl border-2 transition-all text-left",
                                "hover:scale-[1.02] hover:shadow-lg",
                                selectedOption === 'both'
                                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                                    : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-lg transition-colors",
                                    selectedOption === 'both'
                                        ? "bg-primary/30 text-primary" 
                                        : "bg-primary/20 text-primary/80 group-hover:bg-primary/30"
                                )}>
                                    <Link2 className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-base">Both Images</h4>
                                        <kbd className={cn(
                                            "px-2 py-1 rounded text-xs font-mono",
                                            selectedOption === 'both'
                                                ? "bg-primary/30 text-white border border-primary/50"
                                                : "bg-primary/20 text-primary/90 border border-primary/30"
                                        )}>2</kbd>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">
                                        Update both the infobox and hero header image
                                    </p>
                                </div>
                            </div>
                            {selectedOption === 'both' && (
                                <div className="absolute top-2 right-2">
                                    <Check className="w-5 h-5 text-primary" />
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Remember Choice Option */}
                    <div className="pt-4 border-t border-white/10">
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={rememberChoice}
                                    onChange={(e) => setRememberChoice(e.target.checked)}
                                    className="w-5 h-5 rounded bg-white/5 border-2 border-white/20 text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0F] cursor-pointer transition-all checked:bg-primary checked:border-primary"
                                />
                                {rememberChoice && (
                                    <Check className="absolute inset-0 w-5 h-5 text-white pointer-events-none p-1" />
                                )}
                            </div>
                            <span className="text-white/70 group-hover:text-white transition-colors">
                                Remember my choice for future updates
                            </span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HeaderImageChangeDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm,
    previewImageUrl
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: (updateInfobox: boolean) => void;
    previewImageUrl?: string | null;
}) => {
    const [rememberChoice, setRememberChoice] = React.useState(false);
    const [selectedOption, setSelectedOption] = React.useState<'header' | 'both' | null>(null);

    // Load remembered choice from localStorage
    React.useEffect(() => {
        if (isOpen) {
            const remembered = localStorage.getItem('header-image-choice');
            if (remembered === 'header' || remembered === 'both') {
                setSelectedOption(remembered);
            }
        }
    }, [isOpen]);

    // Keyboard shortcuts
    React.useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '1') {
                handleConfirm(false);
            } else if (e.key === '2') {
                handleConfirm(true);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleConfirm = (updateInfobox: boolean) => {
        if (rememberChoice) {
            localStorage.setItem('header-image-choice', updateInfobox ? 'both' : 'header');
        }
        onConfirm(updateInfobox);
        onClose();
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0A0A0F] rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Update Header Image
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-white/60 text-sm">Choose where to apply this image update</p>
                </div>

                {/* Preview Section */}
                {previewImageUrl && (
                    <div className="p-6 border-b border-white/10">
                        <div className="relative rounded-xl overflow-hidden border-2 border-white/20 bg-black/40">
                            <div className="relative aspect-video">
                                <img
                                    src={previewImageUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <div className="flex items-center gap-2 text-white text-sm font-medium">
                                    <ImageIcon className="w-4 h-4" />
                                    Preview
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Options */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Header Only Option */}
                        <button
                            onClick={() => handleConfirm(false)}
                            onMouseEnter={() => setSelectedOption('header')}
                            onMouseLeave={() => setSelectedOption(null)}
                            className={cn(
                                "group relative p-5 rounded-xl border-2 transition-all text-left",
                                "hover:scale-[1.02] hover:shadow-lg",
                                selectedOption === 'header' 
                                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-lg transition-colors",
                                    selectedOption === 'header' 
                                        ? "bg-primary/20 text-primary" 
                                        : "bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white"
                                )}>
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-base">Header Only</h4>
                                        <kbd className={cn(
                                            "px-2 py-1 rounded text-xs font-mono",
                                            selectedOption === 'header'
                                                ? "bg-primary/20 text-primary border border-primary/30"
                                                : "bg-white/10 text-white/50 border border-white/10"
                                        )}>1</kbd>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">
                                        Update only the hero header image
                                    </p>
                                </div>
                            </div>
                            {selectedOption === 'header' && (
                                <div className="absolute top-2 right-2">
                                    <Check className="w-5 h-5 text-primary" />
                                </div>
                            )}
                        </button>

                        {/* Both Images Option */}
                        <button
                            onClick={() => handleConfirm(true)}
                            onMouseEnter={() => setSelectedOption('both')}
                            onMouseLeave={() => setSelectedOption(null)}
                            className={cn(
                                "group relative p-5 rounded-xl border-2 transition-all text-left",
                                "hover:scale-[1.02] hover:shadow-lg",
                                selectedOption === 'both'
                                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                                    : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-lg transition-colors",
                                    selectedOption === 'both'
                                        ? "bg-primary/30 text-primary" 
                                        : "bg-primary/20 text-primary/80 group-hover:bg-primary/30"
                                )}>
                                    <Link2 className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-base">Both Images</h4>
                                        <kbd className={cn(
                                            "px-2 py-1 rounded text-xs font-mono",
                                            selectedOption === 'both'
                                                ? "bg-primary/30 text-white border border-primary/50"
                                                : "bg-primary/20 text-primary/90 border border-primary/30"
                                        )}>2</kbd>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">
                                        Update both the header and infobox image
                                    </p>
                                </div>
                            </div>
                            {selectedOption === 'both' && (
                                <div className="absolute top-2 right-2">
                                    <Check className="w-5 h-5 text-primary" />
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Remember Choice Option */}
                    <div className="pt-4 border-t border-white/10">
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={rememberChoice}
                                    onChange={(e) => setRememberChoice(e.target.checked)}
                                    className="w-5 h-5 rounded bg-white/5 border-2 border-white/20 text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0F] cursor-pointer transition-all checked:bg-primary checked:border-primary"
                                />
                                {rememberChoice && (
                                    <Check className="absolute inset-0 w-5 h-5 text-white pointer-events-none p-1" />
                                )}
                            </div>
                            <span className="text-white/70 group-hover:text-white transition-colors">
                                Remember my choice for future updates
                            </span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
                            <MarkdownProse content={section.content} className="text-white/80" hideMentionSymbol={true} />
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
    const [infoboxImageModalOpen, setInfoboxImageModalOpen] = useState(false);
    const [changeHeroDialogOpen, setChangeHeroDialogOpen] = useState(false);
    const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
    const [headerImageDialogOpen, setHeaderImageDialogOpen] = useState(false);
    const [pendingHeaderImageUrl, setPendingHeaderImageUrl] = useState<string | null>(null);
    const [pendingHeaderImageAction, setPendingHeaderImageAction] = useState<'generate' | 'upload' | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiModalField, setAiModalField] = useState('');
    const [insertHandler, setInsertHandler] = useState<((content: string) => void) | null>(null);
    const [suggestions, setSuggestions] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [quickNavEditModalOpen, setQuickNavEditModalOpen] = useState(false);
    const [isRepositioningHeader, setIsRepositioningHeader] = useState(false);
    const [headerDragPosition, setHeaderDragPosition] = useState<{ x: number; y: number } | null>(null);
    const [headerDragStart, setHeaderDragStart] = useState<{ x: number; y: number } | null>(null);
    const headerImageRef = useRef<HTMLDivElement>(null);
    const initialDragPositionRef = useRef<{ x: number; y: number } | null>(null); // Store position at drag start
    
    // Store for project linking
    const { projects, getProjectForCharacter, addCharacterToProject, removeCharacterFromProject } = useStore();
    const currentProject = React.useMemo(() => {
        if (!characterId) return undefined;
        return getProjectForCharacter(characterId);
    }, [characterId, projects, getProjectForCharacter]);

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
    const [viewMode, setViewMode] = useState<'prose' | 'structured' | 'reading' | 'docs'>('reading'); // Default to reading view
    const [activeReadingTab, setActiveReadingTab] = useState('foundation'); // For tab-based reading view
    const [isSectionEditMode, setIsSectionEditMode] = useState(false); // Separate toggle for section editing

    // Prose sections for Reading View tabs
    const proseSections = [
        { id: 'foundation', title: 'Foundation', fieldKey: 'coreConcept' },
        { id: 'personality', title: 'Personality', fieldKey: 'personalityProse' },
        { id: 'backstory', title: 'Backstory', fieldKey: 'backstoryProse' },
        { id: 'relationships', title: 'Relationships', fieldKey: 'relationshipsProse' },
        { id: 'arc', title: 'Character Arc', fieldKey: 'arcProse' }
    ];

    // Direct link navigation
    useEffect(() => {
        if (!character) return;
        // Check hash for direct link navigation
        if (window.location.hash) {
            const id = window.location.hash.replace('#', '');
            setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 500);
        }
    }, [character?.id]);

    // Scroll handling
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Header image drag handling - works like background-position adjustment
    useEffect(() => {
        if (!isRepositioningHeader || !headerDragStart || !headerImageRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!headerDragStart || !headerImageRef.current || !initialDragPositionRef.current) return;
            e.preventDefault();
            e.stopPropagation();

            // Get container dimensions
            const container = headerImageRef.current;
            const rect = container.getBoundingClientRect();

            // Calculate current mouse position as percentage of container
            const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;

            // Get the INITIAL position when drag started (from ref, doesn't change during drag)
            const startPos = initialDragPositionRef.current;

            // Calculate initial click position as percentage
            const startXPercent = (headerDragStart.x / rect.width) * 100;
            const startYPercent = (headerDragStart.y / rect.height) * 100;

            // Calculate how far the mouse has moved from the initial click
            const deltaX = mouseXPercent - startXPercent;
            const deltaY = mouseYPercent - startYPercent;

            // Adjust the object-position: move in opposite direction of mouse movement
            // (if mouse moves right, we want to show more of the left side, so decrease x%)
            const newX = Math.max(0, Math.min(100, startPos.x - deltaX));
            const newY = Math.max(0, Math.min(100, startPos.y - deltaY));

            setHeaderDragPosition({ x: newX, y: newY });
        };

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setHeaderDragStart(null);
            initialDragPositionRef.current = null;
        };

        // Use capture phase to ensure we catch events
        window.addEventListener('mousemove', handleMouseMove, { passive: false, capture: true });
        window.addEventListener('mouseup', handleMouseUp, { passive: false, capture: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove, { capture: true });
            window.removeEventListener('mouseup', handleMouseUp, { capture: true });
        };
    }, [isRepositioningHeader, headerDragStart]);

    // Search functionality - search within character content (must be before early return)
    const searchableContent = React.useMemo(() => {
        if (!character || !searchQuery.trim()) return null;
        const query = searchQuery.toLowerCase();
        const matches: Array<{ field: string; content: string }> = [];
        
        const fields = [
            { key: 'name', value: character.name },
            { key: 'tagline', value: character.tagline },
            { key: 'coreConcept', value: character.coreConcept },
            { key: 'origin', value: character.origin },
            { key: 'ghost', value: character.ghost },
            { key: 'arcType', value: character.arcType },
            { key: 'climax', value: character.climax },
        ];
        
        fields.forEach(field => {
            if (field.value && field.value.toLowerCase().includes(query)) {
                matches.push({ field: field.key, content: field.value });
            }
        });
        
        return matches.length > 0 ? matches : null;
    }, [searchQuery, character]);

    // Construct Content Sections from Character Data (safe to call even if character is null)
    // Helper function to normalize array items to strings
    const normalizeArrayToStrings = (arr: any[] | undefined): string[] => {
        if (!Array.isArray(arr)) return [];
        return arr.map((item: any) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
                return item.name || item.description || JSON.stringify(item);
            }
            return String(item);
        });
    };

    const sections = React.useMemo(() => {
        if (!character) return [];
        return [
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
                        colorContent: normalizeArrayToStrings(character.motivations),
                        colorClass: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
                        fieldId: 'motivations'
                    },
                    {
                        id: 'flaws',
                        title: 'Flaws & Shadows',
                        colorContent: normalizeArrayToStrings(character.flaws),
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
                        listContent: normalizeArrayToStrings(character.allies),
                        dotColor: "bg-emerald-400",
                        fieldId: 'allies'
                    },
                    {
                        id: 'enemies',
                        title: 'Enemies',
                        listContent: normalizeArrayToStrings(character.enemies),
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
    }, [character]);

    // Get section IDs for scroll spy - need to handle both prose and structured views
    const sectionIdsForSpy = React.useMemo(() => {
        if (!character) return [];
        
        // Get all available sections
        const allAvailableSections = viewMode === 'reading' || viewMode === 'prose' 
            ? [
                ...proseSections,
                ...(character.customSections?.map(s => ({
                    id: s.id,
                    title: s.title
                })) || [])
            ]
            : sections;
        
        // Use custom quickNavSections if set, otherwise use all sections
        const quickNavIds = character.quickNavSections && character.quickNavSections.length > 0
            ? character.quickNavSections
            : allAvailableSections.map(s => s.id);
        
        // Filter to only include sections that are in quick nav
        const quickNavSections = allAvailableSections.filter(s => quickNavIds.includes(s.id));
        
        // Map to actual DOM IDs - for prose sections in reading view, they use 'prose-' prefix
        const domIds: string[] = [];
        quickNavSections.forEach(s => {
            if (viewMode === 'reading' || viewMode === 'prose') {
                // Check if it's a prose section (foundation, personality, etc.)
                const isProseSection = proseSections.some(ps => ps.id === s.id);
                if (isProseSection) {
                    // Prose sections use 'prose-' prefix in reading view
                    domIds.push(`prose-${s.id}`);
                } else {
                    // Custom sections use their ID as-is
                    domIds.push(s.id);
                }
            } else {
                // Structured view uses IDs as-is
                domIds.push(s.id);
            }
        });
        
        return domIds;
    }, [character, viewMode, proseSections, sections]);

    // Use scroll spy to track active section
    const scrollSpyActiveId = useScrollSpy(sectionIdsForSpy, 150);

    const infoboxData = React.useMemo(() => {
        if (!character) {
            return {
                stats: [],
                tags: []
            };
        }
        return {
            stats: [
                { label: 'CID', value: character.id, readOnly: true },
                { label: 'Role', value: character.role },
                { label: 'Archetype', value: character.archetype || 'Unknown' },
                { label: 'Genre', value: character.genre || 'N/A' },
                { label: 'Phase', value: character.phase }
            ],
            tags: Array.isArray(character.motivations) ? character.motivations : []
        };
    }, [character]);

    // Early return AFTER all hooks
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

    const handleGenerateImage = async (prompt: string, provider: ImageProvider, targetSectionId?: string) => {
        try {
            // Get API keys from localStorage
            const savedConfig = typeof window !== 'undefined'
                ? JSON.parse(localStorage.getItem('5d-api-config') || '{}')
                : {};

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(savedConfig.geminiKey && { 'x-gemini-key': savedConfig.geminiKey }),
                    ...(savedConfig.openaiKey && { 'x-openai-key': savedConfig.openaiKey }),
                    ...(savedConfig.dalleKey && { 'x-openai-key': savedConfig.dalleKey }),
                },
                body: JSON.stringify({ prompt, provider })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Image generation failed');
            }

            // If targetSectionId is provided, add to that gallery section
            if (targetSectionId) {
                const section = character.customSections?.find(s => s.id === targetSectionId);
                if (section && section.type === 'gallery') {
                    const currentImages = section.galleryImages || [];
                    handleUpdateCustomSection(targetSectionId, {
                        galleryImages: [...currentImages, data.imageUrl]
                    });
                }
            } else {
                // Default behavior: update character's main image
                updateCharacter(character.id, {
                    imageUrl: data.imageUrl,
                    imageSource: 'generated'
                });
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
            throw error;
        }
    };

    const handleExport = () => {
        const content = JSON.stringify(character, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.name.replace(/\s+/g, '_')}_Profile.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleAttachProject = (projectId: string) => {
        if (!projectId) {
            // Unlink: remove from current project
            if (currentProject) {
                removeCharacterFromProject(characterId, currentProject.id);
            }
            return;
        }
        
        if (projectId === currentProject?.id) {
            // If selecting the same project, do nothing
            return;
        }
        
        // If there's a current project, remove the character from it first
        if (currentProject) {
            removeCharacterFromProject(characterId, currentProject.id);
        }
        // Add to new project
        addCharacterToProject(characterId, projectId);
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

    const handleAddCustomSection = (type: 'text' | 'gallery' = 'text', insertAfterId?: string) => {
        const newSection = {
            id: `custom-${Date.now()}`,
            title: type === 'gallery' ? 'New Gallery' : 'New Section',
            content: '',
            order: (character.customSections?.length || 0) + 10, // Start after standard sections
            type: type,
            insertAfter: insertAfterId, // Store where to insert this section
            ...(type === 'gallery' && { galleryImages: [] })
        };

        let updatedSections: typeof character.customSections;
        
        // If insertAfterId is provided, insert at the correct position
        if (insertAfterId) {
            if (insertAfterId.startsWith('prose-')) {
                // Inserting after a prose section - find all sections that also insert after this prose section
                // and add the new one at the beginning of that group
                const sectionsAfterThisProse = character.customSections?.filter(s => s.insertAfter === insertAfterId) || [];
                const otherSections = character.customSections?.filter(s => s.insertAfter !== insertAfterId) || [];
                updatedSections = [...sectionsAfterThisProse, newSection, ...otherSections];
            } else {
                // Inserting after a custom section
                const insertIndex = character.customSections?.findIndex(s => s.id === insertAfterId);
                if (insertIndex !== undefined && insertIndex !== -1) {
                    updatedSections = [
                        ...(character.customSections || []).slice(0, insertIndex + 1),
                        newSection,
                        ...(character.customSections || []).slice(insertIndex + 1)
                    ];
                } else {
                    // Custom section not found, add at end
                    updatedSections = [...(character.customSections || []), newSection];
                }
            }
        } else {
            // No insertAfterId means add at the end
            updatedSections = [...(character.customSections || []), newSection];
        }

        // Auto-add new custom section to quick nav if quickNavSections is set
        // If quickNavSections is empty/null, it will show all sections by default
        let updatedQuickNav = character.quickNavSections;
        if (updatedQuickNav && updatedQuickNav.length > 0) {
            // Only add if not already in the list
            if (!updatedQuickNav.includes(newSection.id)) {
                updatedQuickNav = [...updatedQuickNav, newSection.id];
            }
        }

        updateCharacter(character.id, {
            customSections: updatedSections,
            quickNavSections: updatedQuickNav,
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
        
        // If title changed, update navigation automatically
        if (data.title && data.title !== character.customSections?.find(s => s.id === sectionId)?.title) {
            // Navigation will update automatically via the sections array computed from customSections
        }
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
        
        // Remove from quick nav if it was there
        const updatedQuickNav = character.quickNavSections?.filter(id => id !== sectionToDelete) || undefined;
        
        updateCharacter(character.id, { 
            trashedSections: updatedTrash,
            quickNavSections: updatedQuickNav
        });

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
        if (!character || !character.customSections) return;

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

    return (
        <div className="min-h-screen bg-[#08080c] pb-24">
            {/* Unified Top Navigation Bar - Always Visible */}
            <div className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                isScrolled 
                    ? "bg-[#08080c]/95 backdrop-blur-xl border-white/10 shadow-lg" 
                    : "bg-[#08080c]/80 backdrop-blur-md border-white/5"
            )}>
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Left: Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-white/5 transition-all group shrink-0"
                            title="Go back"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                        </button>

                        {/* Center: Search & Attach Project */}
                        <div className="flex-1 flex items-center gap-2 sm:gap-3 max-w-2xl mx-2 sm:mx-4 min-w-0">
                            {/* Search */}
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchOpen(true)}
                                    onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                                    placeholder="Search..."
                                    className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                    aria-label="Search character content"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchQuery('');
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10"
                                        aria-label="Clear search"
                                    >
                                        <X className="w-3.5 h-3.5 text-white/40" />
                                    </button>
                                )}
                            </div>

                            {/* Attach Project */}
                            {!currentProject ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsLinkModalOpen(true)}
                                    className="h-9 px-2 sm:px-3 text-xs text-white/70 hover:text-white hover:bg-white/10 border border-white/10 gap-1.5 shrink-0"
                                    title="Attach to project"
                                >
                                    <Link2 className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline">Attach Project</span>
                                </Button>
                            ) : (
                                <button
                                    onClick={() => setIsLinkModalOpen(true)}
                                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs shrink-0 hover:bg-violet-500/20 transition-colors cursor-pointer"
                                    title="Change linked project"
                                >
                                    <Link2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline max-w-[120px] truncate">{currentProject.name}</span>
                                </button>
                            )}
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            {/* Edit Button */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={cn(
                                    "h-9 rounded-lg px-2 sm:px-3 gap-1.5 sm:gap-2 transition-all",
                                    isEditMode
                                        ? "bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                        : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                                )}
                                aria-label={isEditMode ? "Done editing" : "Edit page"}
                            >
                                {isEditMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                <span className="hidden sm:inline">{isEditMode ? 'Done' : 'Edit'}</span>
                            </Button>

                            {/* Download Button */}
                            {!isEditMode && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleExport}
                                    className="h-9 w-9 p-0 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                                    title="Export character data"
                                    aria-label="Export character data"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            )}

                            {/* Chat Button */}
                            {!isEditMode && (
                                <CharacterChatModeSelector 
                                    characterId={character.id} 
                                    characterName={character.name} 
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Results Dropdown */}
                {isSearchOpen && searchableContent && (
                    <div className="absolute top-full left-0 right-0 bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-white/10 max-h-[400px] overflow-y-auto">
                        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4">
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Search Results</div>
                            <div className="space-y-2">
                                {searchableContent.map((match, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setIsSearchOpen(false);
                                            setTimeout(() => {
                                                const element = document.getElementById(match.field);
                                                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 100);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSearchQuery('');
                                                setIsSearchOpen(false);
                                                setTimeout(() => {
                                                    const element = document.getElementById(match.field);
                                                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }, 100);
                                            }
                                        }}
                                    >
                                        <div className="text-xs text-primary/60 uppercase tracking-wide mb-1">{match.field}</div>
                                        <div className="text-sm text-white/80 line-clamp-2">{match.content}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Full Hero Section with Header Image */}
            <div className="relative pt-20 mb-8">
                {/* Hero Banner Background */}
                <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        {character.imageUrl ? (
                            <>
                                <div
                                    ref={headerImageRef}
                                    className={cn(
                                        "absolute inset-0 z-20",
                                        isRepositioningHeader && "cursor-move"
                                    )}
                                    onMouseDown={(e) => {
                                        if (isEditMode && isRepositioningHeader && headerImageRef.current) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Store the initial click position relative to the container
                                            const rect = headerImageRef.current.getBoundingClientRect();
                                            setHeaderDragStart({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top
                                            });
                                            // Store the initial object-position at drag start (doesn't change during drag)
                                            initialDragPositionRef.current = headerDragPosition || character.headerImagePosition || { x: 50, y: 50 };
                                        }
                                    }}
                                    style={{
                                        pointerEvents: isRepositioningHeader ? 'auto' : 'auto'
                                    }}
                                >
                                    <img
                                        src={character.imageUrl}
                                        alt={character.name}
                                        className={cn(
                                            "w-full h-full object-cover opacity-90",
                                            isRepositioningHeader && "select-none"
                                        )}
                                        style={{
                                            // Scale up image to give more room for repositioning
                                            transform: (isRepositioningHeader || character.headerImagePosition)
                                                ? `scale(1.5)`
                                                : undefined,
                                            // Use object-position for focal point adjustment (percentages)
                                            // Default is 50% 50% (centered), values range from 0-100%
                                            objectPosition: headerDragPosition
                                                ? `${headerDragPosition.x}% ${headerDragPosition.y}%`
                                                : character.headerImagePosition
                                                    ? `${character.headerImagePosition.x}% ${character.headerImagePosition.y}%`
                                                    : '50% 50%',
                                            pointerEvents: isRepositioningHeader ? 'none' : 'auto'
                                        }}
                                        draggable={false}
                                        onDragStart={(e) => e.preventDefault()}
                                    />
                                </div>
                                {/* Visual indicator for linked images */}
                                {character.infoboxImageUrl && character.infoboxImageUrl !== 'null' && character.infoboxImageUrl === character.imageUrl && (
                                    <div className="absolute top-4 right-4 bg-primary/90 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-lg z-20">
                                        <Link2 className="w-3.5 h-3.5" />
                                        Linked to Infobox
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getGenreGradient(character.genre)} flex items-center justify-center`}>
                                <Users className="w-32 h-32 md:w-48 md:h-48 text-white/5" />
                            </div>
                        )}
                        {/* Genre-based Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getGenreGradient(character.genre)} mix-blend-overlay opacity-60`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/60 to-transparent" />
                        {/* Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    </div>

                    {/* Reposition Mode Overlay */}
                    {isEditMode && isRepositioningHeader && (
                        <>
                            {/* Subtle border indicator - no darkening overlay */}
                            <div
                                className="absolute inset-0 z-30 pointer-events-none border-4 border-primary/50 rounded-sm"
                            />

                            {/* Instructions and controls - positioned to not block the image */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
                                <div className="bg-black/90 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl">
                                    <div className="text-center mb-3">
                                        <p className="text-white text-sm font-semibold mb-1">Drag image to reposition</p>
                                        <p className="text-white/60 text-xs">Click and drag the image above to adjust its position</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                if (headerDragPosition) {
                                                    updateCharacter(character.id, {
                                                        headerImagePosition: headerDragPosition
                                                    });
                                                }
                                                setIsRepositioningHeader(false);
                                                setHeaderDragPosition(null);
                                                setHeaderDragStart(null);
                                            }}
                                            size="sm"
                                            className="flex-1 bg-primary text-white hover:bg-primary/90"
                                        >
                                            <Save className="w-3.5 h-3.5 mr-1.5" />
                                            Save
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setIsRepositioningHeader(false);
                                                setHeaderDragPosition(null);
                                                setHeaderDragStart(null);
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Download Button for Header Image */}
                    {character.imageUrl && !isEditMode && (
                        <div className="absolute top-4 left-4 z-20">
                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = character.imageUrl!;
                                    link.download = `${character.name}-header.jpg`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all flex items-center gap-2"
                                title="Download Header Image"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Content Overlay */}
                    <div className="absolute inset-0 z-10">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-8">
                            {/* Tags Row */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {character.role && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/10 backdrop-blur-md text-white/80 shadow-sm">
                                        {character.role}
                                    </span>
                                )}
                                {character.archetype && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/10 backdrop-blur-md text-white/80 shadow-sm">
                                        {character.archetype}
                                    </span>
                                )}
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm flex items-center gap-1.5",
                                    currentProject 
                                        ? "bg-blue-500/10 border-blue-500/20 text-blue-200" 
                                        : "bg-white/5 border-white/5 text-white/40"
                                )}>
                                    <Link2 className="w-3 h-3" />
                                    {currentProject ? 'Linked' : 'Unlinked'}
                                </span>
                                {character.genre && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/20 border border-white/5 backdrop-blur-md text-white/60 shadow-sm">
                                        {character.genre}
                                    </span>
                                )}
                                {character.phase && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 backdrop-blur-md text-primary/90 shadow-sm flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        {character.phase}
                                    </span>
                                )}
                            </div>

                            {/* Character Name */}
                            {isEditMode ? (
                                <input
                                    value={character.name}
                                    onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
                                    className="bg-transparent text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight focus:outline-none focus:border-b-2 focus:border-amber-500/50 w-full mb-2 drop-shadow-2xl"
                                    placeholder="Character Name"
                                />
                            ) : (
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-2xl">
                                    {character.name}
                                </h1>
                            )}

                            {/* Tagline */}
                            {isEditMode ? (
                                <div className="flex gap-2 items-center w-full max-w-3xl">
                                    <input
                                        value={character.tagline || ''}
                                        onChange={(e) => updateCharacter(character.id, { tagline: e.target.value })}
                                        className="flex-1 bg-transparent text-lg md:text-xl italic text-white/80 focus:outline-none focus:border-b-2 focus:border-amber-500/50 placeholder:text-white/30 drop-shadow-lg"
                                        placeholder="Add an atmospheric tagline..."
                                    />
                                </div>
                            ) : (
                                <p className="text-lg md:text-xl lg:text-2xl italic text-white/80 font-light tracking-wide max-w-3xl drop-shadow-lg">
                                    {character.tagline || "A legend drafted in shadow and light."}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Edit Mode Controls - Top Right Corner */}
                    {isEditMode && !isRepositioningHeader && (
                        <div className="absolute top-4 right-4 z-30">
                            <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl">
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={() => setGeneratorModalOpen(true)}
                                        size="sm"
                                        className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 gap-2 text-xs"
                                    >
                                        <Wand2 className="w-3.5 h-3.5" />
                                        Generate with AI
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = (e: any) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const dataUrl = event.target?.result as string;
                                                        setPendingHeaderImageUrl(dataUrl);
                                                        setPendingHeaderImageAction('upload');
                                                        setHeaderImageDialogOpen(true);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            };
                                            input.click();
                                        }}
                                        size="sm"
                                        variant="outline"
                                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 text-xs"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        Upload Image
                                    </Button>
                                    {character.imageUrl && (
                                        <Button
                                            onClick={() => {
                                                setIsRepositioningHeader(true);
                                                // Use percentage-based position (50% = centered)
                                                setHeaderDragPosition(character.headerImagePosition || { x: 50, y: 50 });
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 text-xs"
                                        >
                                            <Maximize2 className="w-3.5 h-3.5" />
                                            Reposition Image
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Core Concept Card - Always Visible */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
                <div className="ml-0 md:ml-[140px]">
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0E] shadow-2xl group/prose transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                        {/* Ambient Background Gradient */}
                        <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br ${getGenreGradient(character.genre)} opacity-[0.08] blur-[120px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3 transition-opacity group-hover/prose:opacity-[0.12]`} />

                        {/* Side Accent Line - Enhanced */}
                        <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${getGenreGradient(character.genre)} opacity-90`} />

                        {/* Decorative Quote Mark - More Visible */}
                        <div className="absolute top-4 right-6 text-white/[0.04] font-serif text-[120px] leading-none select-none pointer-events-none font-black italic group-hover/prose:text-white/[0.06] transition-colors">
                            "
                        </div>

                        <div className="relative z-10 p-6 md:p-8 lg:p-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                        <Sparkles className="w-3.5 h-3.5 text-primary/90" />
                                    </div>
                                    Core Concept
                                </h3>
                                {isEditMode && (
                                    <button 
                                        onClick={() => handleOpenAIModal('Core Concept', (val) => updateCharacter(character.id, { coreConcept: val }))} 
                                        className="p-2 rounded-lg bg-white/5 text-primary hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all"
                                        title="Generate with AI"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {isEditMode ? (
                                <textarea
                                    value={character.coreConcept || ''}
                                    onChange={(e) => updateCharacter(character.id, { coreConcept: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white/90 text-lg leading-relaxed focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px] font-serif resize-none"
                                    placeholder="Describe the core concept..."
                                />
                            ) : (
                                <div className="max-w-4xl relative">
                                    <MarkdownProse
                                        content={character.coreConcept || "No core concept defined. Click Edit to begin your character's journey."}
                                        className="prose-lg md:prose-xl text-white/90 font-serif leading-loose tracking-wide"
                                        hideMentionSymbol={true}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAILS CONTAINER - Always Visible */}
            <div>
                {/* Removed redundant sticky navigation tabs - navigation is handled by sidebar */}

                {/* MAIN CONTENT GRID */}
                {viewMode === 'docs' ? (
                    /* Docs View - Full Width, No Sidebar, No Structured Data */
                    <div className="mx-auto px-6 py-4 transition-all duration-300 max-w-7xl">
                        {/* View Mode Toggle - Only show toggle bar */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex gap-2 p-1 rounded-lg bg-white/5 border border-white/10">
                                <button
                                    onClick={() => setViewMode('reading')}
                                    className={cn(
                                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        "text-white/60 hover:text-white"
                                    )}
                                >
                                    Reading View
                                </button>
                                <button
                                    onClick={() => setViewMode('prose')}
                                    className={cn(
                                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        "text-white/60 hover:text-white"
                                    )}
                                >
                                    Editor
                                </button>
                                <button
                                    onClick={() => setViewMode('structured')}
                                    className={cn(
                                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        "text-white/60 hover:text-white"
                                    )}
                                >
                                    Structured View
                                </button>
                                <button
                                    onClick={() => setViewMode('docs')}
                                    className={cn(
                                        "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                        "bg-primary text-white"
                                    )}
                                >
                                    <FileText className="w-4 h-4" />
                                    Docs
                                </button>
                            </div>
                        </div>
                        <CharacterDocs 
                            characterId={character.id} 
                            characterName={character.name} 
                        />
                    </div>
                ) : (
                    <div className={cn(
                        "mx-auto px-6 py-4 transition-all duration-300",
                        viewMode === 'reading' ? "max-w-[1600px]" : "max-w-7xl"
                    )}>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Left: Sidebar (TOC & Info) */}
                            <div className="lg:col-span-3 space-y-6">
                            <Infobox
                                data={infoboxData}
                                title={character.name}
                                imageUrl={character.imageUrl}
                                infoboxImageUrl={character.infoboxImageUrl}
                                heroImageUrl={character.imageUrl}
                                type="Character Profile"
                                isEditMode={isEditMode || isSectionEditMode}
                                onUpdate={updateCharacter}
                                characterId={character.id}
                                onImageChange={(imageUrl: string | null | '__OPEN_MODAL__', changeHero: boolean) => {
                                    console.log('onImageChange called:', imageUrl, changeHero);
                                    if (imageUrl === '__OPEN_MODAL__') {
                                        // Open the image modal
                                        console.log('Opening infobox image modal');
                                        setPendingImageUrl(null);
                                        setInfoboxImageModalOpen(true);
                                    } else if (imageUrl === null) {
                                        // Reset to hero image - set to null explicitly
                                        console.log('Resetting infobox image to hero');
                                        updateCharacter(character.id, {
                                            infoboxImageUrl: null as any
                                        });
                                    } else {
                                        // This will be handled by the dialog
                                        console.log('Setting pending image URL:', imageUrl);
                                        setPendingImageUrl(imageUrl);
                                        setChangeHeroDialogOpen(true);
                                    }
                                }}
                            />
                            <div className="hidden lg:block">
                                {viewMode === 'reading' ? (
                                    <ReadingSideNav
                                        sections={[
                                            ...proseSections,
                                            ...(character.customSections?.map(s => ({
                                                id: s.id,
                                                title: s.title
                                            })) || [])
                                        ]}
                                        activeSection={activeReadingTab}
                                        onNavigate={(sectionId) => {
                                            setActiveReadingTab(sectionId);
                                            const element = document.getElementById(sectionId);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth' });
                                            }
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
                        <div className="lg:col-span-9 space-y-6">
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
                                    <button
                                        onClick={() => setViewMode('docs')}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                            "text-white/60 hover:text-white"
                                        )}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Docs
                                    </button>
                                </div>
                                
                                {/* Edit Sections Toggle - Only show in Editor/Prose mode */}
                                {viewMode === 'prose' && (
                                    <button
                                        onClick={() => setIsSectionEditMode(!isSectionEditMode)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                            isSectionEditMode
                                                ? "bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                                : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                                        )}
                                        title={isSectionEditMode ? "Done editing sections" : "Edit sections"}
                                    >
                                        {isSectionEditMode ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>Done</span>
                                            </>
                                        ) : (
                                            <>
                                                <Pencil className="w-4 h-4" />
                                                <span>Edit Sections</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {viewMode === 'reading' ? (
                                /* BLOG-STYLE READING VIEW */
                                <div className="space-y-8">
                                    {(() => {
                                        // Build ordered list of sections (prose + custom interleaved) - same logic as prose editor
                                        const proseSectionIds = ['prose-foundation', 'prose-personality', 'prose-backstory', 'prose-relationships', 'prose-arc'];
                                        const orderedSections: Array<{ type: 'prose' | 'custom'; id: string; data?: any }> = [];
                                        
                                        // Helper function to recursively add custom sections after a parent
                                        const addCustomSectionsAfter = (parentId: string) => {
                                            const customAfter = character.customSections?.filter(s => s.insertAfter === parentId) || [];
                                            customAfter.forEach(custom => {
                                                orderedSections.push({ type: 'custom', id: custom.id, data: custom });
                                                // Recursively add sections after this custom section
                                                addCustomSectionsAfter(custom.id);
                                            });
                                        };
                                        
                                        // Add prose sections and custom sections in order
                                        proseSectionIds.forEach((proseId) => {
                                            // Add the prose section
                                            orderedSections.push({ type: 'prose', id: proseId });
                                            
                                            // Find and add custom sections that should appear after this prose section (recursively)
                                            addCustomSectionsAfter(proseId);
                                        });
                                        
                                        // Add custom sections that don't have insertAfter (should go at end)
                                        const customWithoutInsert = character.customSections?.filter(s => !s.insertAfter) || [];
                                        customWithoutInsert.forEach(custom => {
                                            orderedSections.push({ type: 'custom', id: custom.id, data: custom });
                                            // Recursively add sections after this one
                                            addCustomSectionsAfter(custom.id);
                                        });

                                        // Map of prose section data
                                        const proseSectionMap: Record<string, { title: string; content: string; onChange: (val: string) => void; placeholder: string; attachedImage?: any; onImageChange?: (image: any) => void }> = {
                                            'prose-foundation': {
                                                title: 'Foundation',
                                                content: character.coreConcept || '',
                                                onChange: (val) => handleProseChange('coreConcept', val),
                                                placeholder: "Describe who this character is at their core...",
                                                attachedImage: character.proseImages?.foundation,
                                                onImageChange: (image: any) => {
                                                    updateCharacter(character.id, {
                                                        proseImages: {
                                                            ...character.proseImages,
                                                            foundation: image || undefined
                                                        }
                                                    });
                                                }
                                            },
                                            'prose-personality': {
                                                title: 'Personality',
                                                content: character.personalityProse || '',
                                                onChange: (val) => handleProseChange('personalityProse', val),
                                                placeholder: "Describe their personality...",
                                                attachedImage: character.proseImages?.personality,
                                                onImageChange: (image: any) => {
                                                    updateCharacter(character.id, {
                                                        proseImages: {
                                                            ...character.proseImages,
                                                            personality: image || undefined
                                                        }
                                                    });
                                                }
                                            },
                                            'prose-backstory': {
                                                title: 'Backstory',
                                                content: character.backstoryProse || character.origin || '',
                                                onChange: (val) => handleProseChange('backstoryProse', val),
                                                placeholder: "Tell their origin story...",
                                                attachedImage: character.proseImages?.backstory,
                                                onImageChange: (image: any) => {
                                                    updateCharacter(character.id, {
                                                        proseImages: {
                                                            ...character.proseImages,
                                                            backstory: image || undefined
                                                        }
                                                    });
                                                }
                                            },
                                            'prose-relationships': {
                                                title: 'Relationships',
                                                content: character.relationshipsProse || '',
                                                onChange: (val) => handleProseChange('relationshipsProse', val),
                                                placeholder: "Describe key relationships...",
                                                attachedImage: character.proseImages?.relationships,
                                                onImageChange: (image: any) => {
                                                    updateCharacter(character.id, {
                                                        proseImages: {
                                                            ...character.proseImages,
                                                            relationships: image || undefined
                                                        }
                                                    });
                                                }
                                            },
                                            'prose-arc': {
                                                title: 'Character Arc',
                                                content: character.arcProse || character.arcType || '',
                                                onChange: (val) => handleProseChange('arcProse', val),
                                                placeholder: "Outline their narrative journey...",
                                                attachedImage: character.proseImages?.arc,
                                                onImageChange: (image: any) => {
                                                    updateCharacter(character.id, {
                                                        proseImages: {
                                                            ...character.proseImages,
                                                            arc: image || undefined
                                                        }
                                                    });
                                                }
                                            }
                                        };

                                        return orderedSections.map((item) => {
                                            if (item.type === 'prose') {
                                                const proseData = proseSectionMap[item.id];
                                                if (!proseData) return null;
                                                
                                                return (
                                                    <ProseSection
                                                        key={item.id}
                                                        id={item.id}
                                                        title={proseData.title}
                                                        content={proseData.content}
                                                        onChange={proseData.onChange}
                                                        placeholder={proseData.placeholder}
                                                        readOnly={true}
                                                        attachedImage={proseData.attachedImage}
                                                        onImageChange={proseData.onImageChange}
                                                    />
                                                );
                                            } else if (item.type === 'custom') {
                                                const section = item.data;
                                                if (section.type === 'gallery') {
                                                    const displayType = section.galleryDisplayType || 'grid';
                                                    const allMedia = [
                                                        ...(section.galleryImages?.map((url: string, idx: number) => ({ type: 'image' as const, url, idx })) || []),
                                                        ...(section.galleryVideos?.map((url: string, idx: number) => ({ type: 'video' as const, url, idx: idx + (section.galleryImages?.length || 0) })) || [])
                                                    ];

                                                    const renderGallery = () => {
                                                        if (displayType === 'masonry') {
                                                            return (
                                                                <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
                                                                    {allMedia.map((item) => (
                                                                        <div key={item.idx} className="relative mb-4 break-inside-avoid rounded-lg overflow-hidden border border-white/10">
                                                                            {item.type === 'image' ? (
                                                                                <img 
                                                                                    src={item.url} 
                                                                                    alt={`${section.title} - Image ${item.idx + 1}`}
                                                                                    className="w-full h-auto object-cover"
                                                                                />
                                                                            ) : (
                                                                                <video 
                                                                                    src={item.url} 
                                                                                    className="w-full h-auto"
                                                                                    controls
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        } else if (displayType === 'slideshow') {
                                                            return <GallerySlideshow allMedia={allMedia} sectionTitle={section.title} />;
                                                        } else if (displayType === 'card') {
                                                            return (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                    {allMedia.map((item) => (
                                                                        <div key={item.idx} className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                                                                            {item.type === 'image' ? (
                                                                                <img 
                                                                                    src={item.url} 
                                                                                    alt={`${section.title} - Image ${item.idx + 1}`}
                                                                                    className="w-full aspect-video object-cover"
                                                                                />
                                                                            ) : (
                                                                                <video 
                                                                                    src={item.url} 
                                                                                    className="w-full aspect-video object-cover"
                                                                                    controls
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        } else if (displayType === 'carousel') {
                                                            return <GalleryCarousel allMedia={allMedia} sectionTitle={section.title} />;
                                                        } else {
                                                            // Default: grid
                                                            return (
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                                    {allMedia.map((item) => (
                                                                        <div key={item.idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                                                                            {item.type === 'image' ? (
                                                                                <img 
                                                                                    src={item.url} 
                                                                                    alt={`${section.title} - Image ${item.idx + 1}`}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <video 
                                                                                    src={item.url} 
                                                                                    className="w-full h-full object-cover"
                                                                                    controls
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }
                                                    };

                                                    return (
                                                        <section key={section.id} id={section.id} className="space-y-4 scroll-mt-24">
                                                            <h2 className="text-2xl font-bold text-white mb-4 font-serif tracking-wide">
                                                                {section.title}
                                                            </h2>
                                                            {allMedia.length > 0 ? renderGallery() : (
                                                                <div className="text-center py-8 text-white/30">
                                                                    No media in this gallery
                                                                </div>
                                                            )}
                                                        </section>
                                                    );
                                                } else {
                                                    return (
                                                        <ProseSection
                                                            key={section.id}
                                                            id={section.id}
                                                            title={section.title}
                                                            content={section.content || ''}
                                                            onChange={(val) => handleUpdateCustomSection(section.id, { content: val })}
                                                            placeholder={`Content for ${section.title}...`}
                                                            readOnly={true}
                                                            attachedImage={section.attachedImage}
                                                        />
                                                    );
                                                }
                                            }
                                            return null;
                                        });
                                    })()}
                                </div>
                            ) : viewMode === 'prose' ? (
                                /* EDITOR PROSE VIEW - Shows all sections like Reading View but editable */
                                <div className="space-y-12">
                                    {(() => {
                                        // Build ordered list of sections (prose + custom interleaved)
                                        const proseSectionIds = ['prose-foundation', 'prose-personality', 'prose-backstory', 'prose-relationships', 'prose-arc'];
                                        const orderedSections: Array<{ type: 'prose' | 'custom' | 'add-button'; id: string; data?: any }> = [];
                                        
                                        // Helper function to recursively add custom sections after a parent
                                        const addCustomSectionsAfter = (parentId: string) => {
                                            const customAfter = character.customSections?.filter(s => s.insertAfter === parentId) || [];
                                            customAfter.forEach(custom => {
                                                orderedSections.push({ type: 'custom', id: custom.id, data: custom });
                                                // Recursively add sections after this custom section
                                                addCustomSectionsAfter(custom.id);
                                            });
                                        };
                                        
                                        // Add prose sections and custom sections in order
                                        proseSectionIds.forEach((proseId) => {
                                            // Add the prose section
                                            orderedSections.push({ type: 'prose', id: proseId });
                                            
                                            // Find and add custom sections that should appear after this prose section (recursively)
                                            addCustomSectionsAfter(proseId);
                                        });
                                        
                                        // Add custom sections that don't have insertAfter (should go at end)
                                        const customWithoutInsert = character.customSections?.filter(s => !s.insertAfter) || [];
                                        customWithoutInsert.forEach(custom => {
                                            orderedSections.push({ type: 'custom', id: custom.id, data: custom });
                                            // Recursively add sections after this one
                                            addCustomSectionsAfter(custom.id);
                                        });
                                        
                                        // Add "+" button ONLY at the very end (if in edit mode)
                                        if (isSectionEditMode) {
                                            orderedSections.push({ type: 'add-button', id: 'add-at-end', data: { insertAfter: undefined } });
                                        }
                                        
                                        return orderedSections.map((item, idx) => {
                                            if (item.type === 'prose') {
                                                const proseSectionMap: Record<string, any> = {
                                                    'prose-foundation': {
                                                        title: 'Foundation',
                                                        content: character.coreConcept || '',
                                                        onChange: (val: string) => handleProseChange('coreConcept', val),
                                                        placeholder: "Describe who this character is at their core...",
                                                        onAiGenerate: () => handleOpenAIModal('Foundation', (val) => handleSetSuggestion('coreConcept', val)),
                                                        suggestion: suggestions['coreConcept'],
                                                        onAcceptSuggestion: () => handleAcceptSuggestion('coreConcept'),
                                                        onRejectSuggestion: () => handleRejectSuggestion('coreConcept'),
                                                        attachedImage: character.proseImages?.foundation,
                                                        onImageChange: (image: any) => {
                                                            updateCharacter(character.id, {
                                                                proseImages: {
                                                                    ...character.proseImages,
                                                                    foundation: image || undefined
                                                                }
                                                            });
                                                        }
                                                    },
                                                    'prose-personality': {
                                                        title: 'Personality',
                                                        content: character.personalityProse || '',
                                                        onChange: (val: string) => handleProseChange('personalityProse', val),
                                                        placeholder: "Describe their personality, motivations, flaws, and fears...",
                                                        onAiGenerate: () => handleOpenAIModal('Personality', (val) => handleSetSuggestion('personalityProse', val)),
                                                        suggestion: suggestions['personalityProse'],
                                                        onAcceptSuggestion: () => handleAcceptSuggestion('personalityProse'),
                                                        onRejectSuggestion: () => handleRejectSuggestion('personalityProse'),
                                                        attachedImage: character.proseImages?.personality,
                                                        onImageChange: (image: any) => {
                                                            updateCharacter(character.id, {
                                                                proseImages: {
                                                                    ...character.proseImages,
                                                                    personality: image || undefined
                                                                }
                                                            });
                                                        }
                                                    },
                                                    'prose-backstory': {
                                                        title: 'Backstory',
                                                        content: character.backstoryProse || character.origin || '',
                                                        onChange: (val: string) => handleProseChange('backstoryProse', val),
                                                        placeholder: "Tell their origin story, formative experiences...",
                                                        onAiGenerate: () => handleOpenAIModal('Backstory', (val) => handleSetSuggestion('backstoryProse', val)),
                                                        suggestion: suggestions['backstoryProse'],
                                                        onAcceptSuggestion: () => handleAcceptSuggestion('backstoryProse'),
                                                        onRejectSuggestion: () => handleRejectSuggestion('backstoryProse'),
                                                        attachedImage: character.proseImages?.backstory,
                                                        onImageChange: (image: any) => {
                                                            updateCharacter(character.id, {
                                                                proseImages: {
                                                                    ...character.proseImages,
                                                                    backstory: image || undefined
                                                                }
                                                            });
                                                        }
                                                    },
                                                    'prose-relationships': {
                                                        title: 'Relationships',
                                                        content: character.relationshipsProse || '',
                                                        onChange: (val: string) => handleProseChange('relationshipsProse', val),
                                                        placeholder: "Describe key relationships...",
                                                        onAiGenerate: () => handleOpenAIModal('Relationships', (val) => handleSetSuggestion('relationshipsProse', val)),
                                                        suggestion: suggestions['relationshipsProse'],
                                                        onAcceptSuggestion: () => handleAcceptSuggestion('relationshipsProse'),
                                                        onRejectSuggestion: () => handleRejectSuggestion('relationshipsProse'),
                                                        attachedImage: character.proseImages?.relationships,
                                                        onImageChange: (image: any) => {
                                                            updateCharacter(character.id, {
                                                                proseImages: {
                                                                    ...character.proseImages,
                                                                    relationships: image || undefined
                                                                }
                                                            });
                                                        }
                                                    },
                                                    'prose-arc': {
                                                        title: 'Character Arc',
                                                        content: character.arcProse || character.arcType || '',
                                                        onChange: (val: string) => handleProseChange('arcProse', val),
                                                        placeholder: "Outline their narrative journey...",
                                                        onAiGenerate: () => handleOpenAIModal('Character Arc', (val) => handleSetSuggestion('arcProse', val)),
                                                        suggestion: suggestions['arcProse'],
                                                        onAcceptSuggestion: () => handleAcceptSuggestion('arcProse'),
                                                        onRejectSuggestion: () => handleRejectSuggestion('arcProse'),
                                                        attachedImage: character.proseImages?.arc,
                                                        onImageChange: (image: any) => {
                                                            updateCharacter(character.id, {
                                                                proseImages: {
                                                                    ...character.proseImages,
                                                                    arc: image || undefined
                                                                }
                                                            });
                                                        }
                                                    }
                                                };
                                                
                                                const proseData = proseSectionMap[item.id];
                                                if (!proseData) return null;
                                                
                                                return (
                                                    <ProseSection
                                                        key={item.id}
                                                        id={item.id}
                                                        title={proseData.title}
                                                        content={proseData.content}
                                                        onChange={proseData.onChange}
                                                        placeholder={proseData.placeholder}
                                                        onAiGenerate={proseData.onAiGenerate}
                                                        readOnly={false}
                                                        suggestion={proseData.suggestion}
                                                        onAcceptSuggestion={proseData.onAcceptSuggestion}
                                                        onRejectSuggestion={proseData.onRejectSuggestion}
                                                        attachedImage={proseData.attachedImage}
                                                        onImageChange={proseData.onImageChange}
                                                    />
                                                );
                                            } else if (item.type === 'custom') {
                                                const section = item.data;
                                                // Find the index of this custom section in the full custom sections array for move buttons
                                                const customSectionIdx = character.customSections?.findIndex(s => s.id === section.id) ?? -1;
                                                const isFirstCustom = customSectionIdx === 0;
                                                const isLastCustom = customSectionIdx === (character.customSections?.length ?? 0) - 1;
                                                
                                                return (
                                                    <CustomSection
                                                        key={section.id}
                                                        section={section}
                                                        isEditMode={isSectionEditMode}
                                                        onUpdate={handleUpdateCustomSection}
                                                        onDelete={handleDeleteCustomSection}
                                                        onMoveUp={() => handleMoveSection(section.id, 'up')}
                                                        onMoveDown={() => handleMoveSection(section.id, 'down')}
                                                        onOpenAIModal={handleOpenAIModal}
                                                        onAddSectionAfter={(type) => handleAddCustomSection(type, section.id)}
                                                        onGenerateImage={(prompt, provider, sectionId) => handleGenerateImage(prompt, provider, sectionId)}
                                                        isFirst={isFirstCustom}
                                                        isLast={isLastCustom}
                                                        viewMode={viewMode}
                                                    />
                                                );
                                            } else if (item.type === 'add-button') {
                                                const { insertAfter } = item.data;
                                                return (
                                                    <div key={item.id} className="flex items-center justify-center py-4 -my-8">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-px w-12 bg-white/10" />
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleAddCustomSection('text', insertAfter)}
                                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all group"
                                                                    title="Add Text Section"
                                                                >
                                                                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAddCustomSection('gallery', insertAfter)}
                                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all group"
                                                                    title="Add Gallery Section"
                                                                >
                                                                    <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                                </button>
                                                            </div>
                                                            <div className="h-px w-12 bg-white/10" />
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        });
                                    })()}
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

                            {/* Custom Sections - Only render in structured view (prose view handles them interleaved) */}
                            {viewMode === 'structured' && character.customSections?.map((section, idx) => (
                                <CustomSection
                                    key={section.id}
                                    section={section}
                                    isEditMode={isSectionEditMode}
                                    onUpdate={handleUpdateCustomSection}
                                    onDelete={handleDeleteCustomSection}
                                    onMoveUp={() => handleMoveSection(section.id, 'up')}
                                    onMoveDown={() => handleMoveSection(section.id, 'down')}
                                    onOpenAIModal={handleOpenAIModal}
                                    onAddSectionAfter={(type) => handleAddCustomSection(type, section.id)}
                                    onGenerateImage={(prompt, provider, sectionId) => handleGenerateImage(prompt, provider, sectionId)}
                                    isFirst={idx === 0}
                                    isLast={idx === (character.customSections?.length || 0) - 1}
                                    viewMode={viewMode}
                                />
                            ))}

                            {/* Add Section Button at bottom (only in structured view, and only if no custom sections exist) */}
                            {viewMode === 'structured' && isSectionEditMode && (!character.customSections || character.customSections.length === 0) && (
                                <button
                                    onClick={() => handleAddCustomSection('text')}
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
                </div>
                )}
            </div>{/* End of Details */}

            {/* Generator Modal */}
            <ImageGeneratorModal
                isOpen={generatorModalOpen}
                onClose={() => {
                    setGeneratorModalOpen(false);
                    setPendingHeaderImageAction(null);
                }}
                onGenerate={async (prompt, provider) => {
                    setPendingHeaderImageAction('generate');
                    try {
                        // Get API keys from localStorage
                        const savedConfig = typeof window !== 'undefined'
                            ? JSON.parse(localStorage.getItem('5d-api-config') || '{}')
                            : {};

                        const response = await fetch('/api/generate-image', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(savedConfig.geminiKey && { 'x-gemini-key': savedConfig.geminiKey }),
                                ...(savedConfig.openaiKey && { 'x-openai-key': savedConfig.openaiKey }),
                                ...(savedConfig.dalleKey && { 'x-openai-key': savedConfig.dalleKey }),
                            },
                            body: JSON.stringify({ prompt, provider })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.error || 'Image generation failed');
                        }

                        setGeneratorModalOpen(false);
                        return data.imageUrl;
                    } catch (error) {
                        setPendingHeaderImageAction(null);
                        throw error;
                    }
                }}
                onUpload={(dataUrl) => {
                    setPendingHeaderImageUrl(dataUrl);
                    setPendingHeaderImageAction('upload');
                    setGeneratorModalOpen(false);
                    setHeaderImageDialogOpen(true);
                }}
                itemName={character.name}
            />

            {/* Infobox Image Generator Modal */}
            <ImageGeneratorModal
                isOpen={infoboxImageModalOpen}
                onClose={() => {
                    setInfoboxImageModalOpen(false);
                    setPendingImageUrl(null);
                }}
                onGenerate={async (prompt, provider) => {
                    try {
                        const savedConfig = typeof window !== 'undefined'
                            ? JSON.parse(localStorage.getItem('5d-api-config') || '{}')
                            : {};

                        const response = await fetch('/api/generate-image', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(savedConfig.geminiKey && { 'x-gemini-key': savedConfig.geminiKey }),
                                ...(savedConfig.openaiKey && { 'x-openai-key': savedConfig.openaiKey }),
                                ...(savedConfig.dalleKey && { 'x-openai-key': savedConfig.dalleKey }),
                            },
                            body: JSON.stringify({ prompt, provider })
                        });

                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.error || 'Image generation failed');
                        }
                        setPendingImageUrl(data.imageUrl);
                        setInfoboxImageModalOpen(false);
                        setChangeHeroDialogOpen(true);
                        return data.imageUrl;
                    } catch (error) {
                        console.error('Failed to generate image:', error);
                        throw error;
                    }
                }}
                onUpload={(dataUrl) => {
                    setPendingImageUrl(dataUrl);
                    setInfoboxImageModalOpen(false);
                    setChangeHeroDialogOpen(true);
                }}
                itemName={`${character.name} (Infobox)`}
            />

            {/* Change Hero Dialog */}
            <HeaderImageChangeDialog
                isOpen={headerImageDialogOpen}
                onClose={() => {
                    setHeaderImageDialogOpen(false);
                    setPendingHeaderImageUrl(null);
                    setPendingHeaderImageAction(null);
                }}
                onConfirm={(updateInfobox) => {
                    if (pendingHeaderImageUrl) {
                        if (updateInfobox) {
                            // Update both header and infobox
                            updateCharacter(character.id, {
                                imageUrl: pendingHeaderImageUrl,
                                infoboxImageUrl: pendingHeaderImageUrl,
                                imageSource: pendingHeaderImageAction === 'generate' ? 'generated' : 'uploaded'
                            });
                        } else {
                            // Update only header
                            updateCharacter(character.id, {
                                imageUrl: pendingHeaderImageUrl,
                                imageSource: pendingHeaderImageAction === 'generate' ? 'generated' : 'uploaded'
                            });
                        }
                    }
                    setPendingHeaderImageUrl(null);
                    setPendingHeaderImageAction(null);
                }}
                previewImageUrl={pendingHeaderImageUrl}
            />

            <InfoboxImageChangeDialog
                isOpen={changeHeroDialogOpen}
                onClose={() => {
                    setChangeHeroDialogOpen(false);
                    setPendingImageUrl(null);
                }}
                onConfirm={(changeHero) => {
                    if (pendingImageUrl) {
                        const imageUrlToSet = pendingImageUrl;
                        console.log('Updating infobox image:', { changeHero, imageUrlToSet, characterId: character.id });
                        if (changeHero) {
                            // Update both hero and infobox
                            updateCharacter(character.id, {
                                imageUrl: imageUrlToSet,
                                infoboxImageUrl: imageUrlToSet
                            });
                        } else {
                            // Update only infobox - explicitly set the value
                            updateCharacter(character.id, {
                                infoboxImageUrl: imageUrlToSet
                            });
                        }
                        // Force a small delay to ensure state update completes
                        setTimeout(() => {
                            setPendingImageUrl(null);
                            setChangeHeroDialogOpen(false);
                        }, 50);
                    }
                }}
                onChangeHeroToo={() => {
                    // This is handled in onConfirm
                }}
                previewImageUrl={pendingImageUrl}
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

            {/* Link Project Modal */}
            <LinkProjectModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onLink={handleAttachProject}
                projects={projects}
                currentProjectId={currentProject?.id}
                onCreateProject={() => router.push('/projects')}
            />

            {/* Bottom Navigation Tabs - Always Visible */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#08080c]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
                    <div className="flex items-center justify-center gap-1 py-2 sm:py-3 overflow-x-auto scrollbar-hide relative group">
                        {(() => {
                            // Get all available sections
                            const allAvailableSections = viewMode === 'reading' || viewMode === 'prose' 
                                ? [
                                    ...proseSections,
                                    ...(character.customSections?.map(s => ({
                                        id: s.id,
                                        title: s.title
                                    })) || [])
                                ]
                                : sections;

                            // Use custom quickNavSections if set, otherwise use all sections
                            const quickNavIds = character.quickNavSections && character.quickNavSections.length > 0
                                ? character.quickNavSections
                                : allAvailableSections.map(s => s.id);

                            // Filter to only show sections that exist
                            const quickNavSections = allAvailableSections.filter(s => quickNavIds.includes(s.id));

                            return quickNavSections.map(s => {
                                // Check if this section matches the scroll spy active ID
                                // For prose sections, the DOM ID is 'prose-{id}', but the section ID is just '{id}'
                                let matchesScrollSpy = false;
                                if (scrollSpyActiveId) {
                                    if (viewMode === 'reading' || viewMode === 'prose') {
                                        // Check if it's a prose section
                                        const isProseSection = proseSections.some(ps => ps.id === s.id);
                                        if (isProseSection) {
                                            // Match 'prose-{id}' from scroll spy with section id '{id}'
                                            matchesScrollSpy = scrollSpyActiveId === `prose-${s.id}`;
                                        } else {
                                            // Custom sections match directly
                                            matchesScrollSpy = scrollSpyActiveId === s.id;
                                        }
                                    } else {
                                        // Structured view matches directly
                                        matchesScrollSpy = scrollSpyActiveId === s.id;
                                    }
                                }
                                
                                // Use scroll spy if available, otherwise fall back to manual state
                                const isActive = matchesScrollSpy || (viewMode === 'reading' || viewMode === 'prose'
                                    ? activeReadingTab === s.id
                                    : activeSection === s.id);
                                
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            if (viewMode === 'reading' || viewMode === 'prose') {
                                                setActiveReadingTab(s.id);
                                                setTimeout(() => {
                                                    // Try multiple possible IDs for the section
                                                    const element = document.getElementById(s.id) || 
                                                                    document.getElementById(`prose-${s.id}`) ||
                                                                    document.getElementById(s.id.startsWith('prose-') ? s.id : `prose-${s.id}`);
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: 'smooth' });
                                                    }
                                                }, 100);
                                            } else {
                                                setActiveSection(s.id);
                                                setTimeout(() => {
                                                    handleNavigate(s.id);
                                                }, 100);
                                            }
                                        }}
                                        className={cn(
                                            "px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap relative",
                                            isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                : "text-white/50 hover:text-white hover:bg-white/5"
                                        )}
                                        aria-label={`Navigate to ${s.title}`}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        {s.title.split(' ')[0]}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                                        )}
                                    </button>
                                );
                            });
                        })()}
                        
                        {/* Edit Quick Nav Button */}
                        {isEditMode && (
                            <button
                                onClick={() => setQuickNavEditModalOpen(true)}
                                className="ml-2 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                                title="Edit Quick Navigation"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Nav Edit Modal */}
            <QuickNavEditDialog
                isOpen={quickNavEditModalOpen}
                onClose={() => setQuickNavEditModalOpen(false)}
                character={character}
                viewMode={viewMode}
                proseSections={proseSections}
                sections={sections}
                onSave={(sectionIds) => {
                    updateCharacter(character.id, { quickNavSections: sectionIds });
                    setQuickNavEditModalOpen(false);
                }}
            />
        </div >
    );
}

// Quick Nav Edit Dialog Component
function QuickNavEditDialog({
    isOpen,
    onClose,
    character,
    viewMode,
    proseSections,
    sections,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    character: any;
    viewMode: string;
    proseSections: any[];
    sections: any[];
    onSave: (sectionIds: string[]) => void;
}) {
    const [selectedSections, setSelectedSections] = React.useState<Set<string>>(new Set());

    // Get all available sections
    const allAvailableSections = React.useMemo(() => {
        return viewMode === 'reading' || viewMode === 'prose' 
            ? [
                ...proseSections,
                ...(character.customSections?.map((s: any) => ({
                    id: s.id,
                    title: s.title
                })) || [])
            ]
            : sections;
    }, [viewMode, proseSections, sections, character.customSections]);

    // Initialize selected sections
    React.useEffect(() => {
        if (isOpen && character) {
            const currentQuickNav = character.quickNavSections && character.quickNavSections.length > 0
                ? character.quickNavSections
                : allAvailableSections.map((s: any) => s.id);
            setSelectedSections(new Set(currentQuickNav));
        }
    }, [isOpen, character, allAvailableSections]);

    const toggleSection = (sectionId: string) => {
        const newSelected = new Set(selectedSections);
        if (newSelected.has(sectionId)) {
            newSelected.delete(sectionId);
        } else {
            newSelected.add(sectionId);
        }
        setSelectedSections(newSelected);
    };

    const selectAll = () => {
        setSelectedSections(new Set(allAvailableSections.map((s: any) => s.id)));
    };

    const deselectAll = () => {
        setSelectedSections(new Set());
    };

    const handleSave = () => {
        const sectionIds = Array.from(selectedSections);
        onSave(sectionIds.length > 0 ? sectionIds : allAvailableSections.map((s: any) => s.id));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#12121a] border border-white/10 text-white sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="w-5 h-5" />
                        Edit Quick Navigation
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                        Select which sections to display in the quick navigation bar at the bottom of the page.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto py-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-white/70">
                            {selectedSections.size} of {allAvailableSections.length} sections selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAll}
                                className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 text-xs"
                            >
                                Select All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={deselectAll}
                                className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 text-xs"
                            >
                                Deselect All
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {allAvailableSections.map((section: any) => {
                            const isSelected = selectedSections.has(section.id);
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => toggleSection(section.id)}
                                    className={cn(
                                        "w-full p-3 rounded-lg border transition-all text-left flex items-center gap-3",
                                        isSelected
                                            ? "bg-primary/20 border-primary/50 text-white"
                                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                                        isSelected
                                            ? "bg-primary border-primary"
                                            : "border-white/30"
                                    )}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium">{section.title}</span>
                                    <span className="text-xs text-white/40 ml-auto">{section.id}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-primary text-white hover:bg-primary/90"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
