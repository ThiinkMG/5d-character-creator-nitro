'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
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
import { ExpandableText } from '@/components/ui/expandable-text';
import { ProseSection } from '@/components/ui/prose-section';
import { ReadingSideNav, useScrollSpy } from '@/components/ui/reading-side-nav';
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
    X,
    Search,
    Save,
    RefreshCw,
    Maximize2,
    Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ImageGeneratorModal } from '@/components/gallery';
import { ImageProvider } from '@/types/image-config';
import { MarkdownProse } from '@/components/ui/markdown-prose';
import { EntityContextNav } from '@/components/navigation/EntityContextNav';
import { Shield, Swords, Link2, Clock, Zap, Target } from 'lucide-react';
import { LinkProjectModal } from '@/components/project/LinkProjectModal';

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

const Infobox = ({ data, title, imageUrl, infoboxImageUrl, type, isEditMode, onUpdate, worldId, onImageChange, heroImageUrl }: any) => {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [customValue, setCustomValue] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Use infobox image if set (and not null/undefined), otherwise fall back to hero image
    const displayImageUrl = (infoboxImageUrl && infoboxImageUrl !== 'null') ? infoboxImageUrl : (imageUrl || heroImageUrl);

    // Pre-generated options for each field
    const fieldOptions: Record<string, string[]> = {
        Genre: ['Fantasy', 'Science Fiction', 'Horror', 'Mystery', 'Thriller', 'Romance', 'Historical Fiction', 'Contemporary', 'Urban Fantasy', 'Steampunk', 'Cyberpunk', 'Superhero', 'Western', 'General'],
        Tone: ['Dark', 'Light', 'Gritty', 'Whimsical', 'Epic', 'Intimate', 'Mysterious', 'Action-Packed', 'Romantic', 'Tragic', 'Comedic', 'Dramatic']
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
        if (fieldLabel === 'Genre') {
            onUpdate(worldId, { genre: value });
        } else if (fieldLabel === 'Tone') {
            onUpdate(worldId, { tone: value });
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
                        <Globe className="w-12 h-12" />
                    </div>
                )}
                {isEditMode && onImageChange && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm z-10 pointer-events-auto">
                        <div className="flex flex-col gap-2 items-center">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onImageChange) {
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
        </div>
    );
};

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
                        ) : React.isValidElement(section.content) ? (
                            section.content
                        ) : (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {typeof section.content === 'object' && section.content !== null
                                    ? JSON.stringify(section.content, null, 2)
                                    : String(section.content)}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
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

    React.useEffect(() => {
        if (isOpen) {
            const remembered = localStorage.getItem('infobox-image-choice');
            if (remembered === 'infobox' || remembered === 'both') {
                setSelectedOption(remembered);
            }
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '1') handleConfirm(false);
            else if (e.key === '2') handleConfirm(true);
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleConfirm = (changeHero: boolean) => {
        if (rememberChoice) {
            localStorage.setItem('infobox-image-choice', changeHero ? 'both' : 'infobox');
        }
        onConfirm(changeHero);
        if (changeHero) onChangeHeroToo();
        setTimeout(() => onClose(), 100);
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0A0A0F] rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Change Infobox Image
                        </h3>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-white/60 text-sm">Choose where to apply this image update</p>
                </div>
                {previewImageUrl && (
                    <div className="p-6 border-b border-white/10">
                        <div className="relative rounded-xl overflow-hidden border-2 border-white/20 bg-black/40">
                            <div className="relative aspect-video">
                                <img src={previewImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                        </div>
                    </div>
                )}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => handleConfirm(false)} onMouseEnter={() => setSelectedOption('infobox')} onMouseLeave={() => setSelectedOption(null)} className={cn("group relative p-5 rounded-xl border-2 transition-all text-left hover:scale-[1.02] hover:shadow-lg", selectedOption === 'infobox' ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10")}>
                            <div className="flex items-start gap-4">
                                <div className={cn("p-3 rounded-lg transition-colors", selectedOption === 'infobox' ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white")}>
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-base">Infobox Only</h4>
                                        <kbd className={cn("px-2 py-1 rounded text-xs font-mono", selectedOption === 'infobox' ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/10 text-white/50 border border-white/10")}>1</kbd>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">Update only the infobox sidebar image</p>
                                </div>
                            </div>
                            {selectedOption === 'infobox' && <div className="absolute top-2 right-2"><Check className="w-5 h-5 text-primary" /></div>}
                        </button>
                        <button onClick={() => handleConfirm(true)} onMouseEnter={() => setSelectedOption('both')} onMouseLeave={() => setSelectedOption(null)} className={cn("group relative p-5 rounded-xl border-2 transition-all text-left hover:scale-[1.02] hover:shadow-lg", selectedOption === 'both' ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10")}>
                            <div className="flex items-start gap-4">
                                <div className={cn("p-3 rounded-lg transition-colors", selectedOption === 'both' ? "bg-primary/30 text-primary" : "bg-primary/20 text-primary/80 group-hover:bg-primary/30")}>
                                    <Link2 className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-base">Both Images</h4>
                                        <kbd className={cn("px-2 py-1 rounded text-xs font-mono", selectedOption === 'both' ? "bg-primary/30 text-white border border-primary/50" : "bg-primary/20 text-primary/90 border border-primary/30")}>2</kbd>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">Update both the infobox and hero header image</p>
                                </div>
                            </div>
                            {selectedOption === 'both' && <div className="absolute top-2 right-2"><Check className="w-5 h-5 text-primary" /></div>}
                        </button>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                            <div className="relative">
                                <input type="checkbox" checked={rememberChoice} onChange={(e) => setRememberChoice(e.target.checked)} className="w-5 h-5 rounded bg-white/5 border-2 border-white/20 text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0F] cursor-pointer transition-all checked:bg-primary checked:border-primary" />
                                {rememberChoice && <Check className="absolute inset-0 w-5 h-5 text-white pointer-events-none p-1" />}
                            </div>
                            <span className="text-white/70 group-hover:text-white transition-colors">Remember my choice for future updates</span>
                        </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors font-medium">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HeaderImageChangeDialog = ({ isOpen, onClose, onConfirm, previewImageUrl }: { isOpen: boolean; onClose: () => void; onConfirm: (updateInfobox: boolean) => void; previewImageUrl?: string | null; }) => {
    const [rememberChoice, setRememberChoice] = React.useState(false);
    const [selectedOption, setSelectedOption] = React.useState<'header' | 'both' | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            const remembered = localStorage.getItem('header-image-choice');
            if (remembered === 'header' || remembered === 'both') setSelectedOption(remembered);
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '1') handleConfirm(false);
            else if (e.key === '2') handleConfirm(true);
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleConfirm = (updateInfobox: boolean) => {
        if (rememberChoice) localStorage.setItem('header-image-choice', updateInfobox ? 'both' : 'header');
        onConfirm(updateInfobox);
        onClose();
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0A0A0F] rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Update Header Image
                        </h3>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-white/60 text-sm">Choose where to apply this image update</p>
                </div>
                {previewImageUrl && (
                    <div className="p-6 border-b border-white/10">
                        <div className="relative rounded-xl overflow-hidden border-2 border-white/20 bg-black/40">
                            <div className="relative aspect-video">
                                <img src={previewImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                        </div>
                    </div>
                )}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => handleConfirm(false)} onMouseEnter={() => setSelectedOption('header')} onMouseLeave={() => setSelectedOption(null)} className={cn("group relative p-5 rounded-xl border-2 transition-all text-left hover:scale-[1.02] hover:shadow-lg", selectedOption === 'header' ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10")}>
                            <div className="flex items-start gap-4">
                                <div className={cn("p-3 rounded-lg transition-colors", selectedOption === 'header' ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white")}>
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-base">Header Only</h4>
                                        <kbd className={cn("px-2 py-1 rounded text-xs font-mono", selectedOption === 'header' ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/10 text-white/50 border border-white/10")}>1</kbd>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">Update only the hero header image</p>
                                </div>
                            </div>
                            {selectedOption === 'header' && <div className="absolute top-2 right-2"><Check className="w-5 h-5 text-primary" /></div>}
                        </button>
                        <button onClick={() => handleConfirm(true)} onMouseEnter={() => setSelectedOption('both')} onMouseLeave={() => setSelectedOption(null)} className={cn("group relative p-5 rounded-xl border-2 transition-all text-left hover:scale-[1.02] hover:shadow-lg", selectedOption === 'both' ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10")}>
                            <div className="flex items-start gap-4">
                                <div className={cn("p-3 rounded-lg transition-colors", selectedOption === 'both' ? "bg-primary/30 text-primary" : "bg-primary/20 text-primary/80 group-hover:bg-primary/30")}>
                                    <Link2 className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-base">Both Images</h4>
                                        <kbd className={cn("px-2 py-1 rounded text-xs font-mono", selectedOption === 'both' ? "bg-primary/30 text-white border border-primary/50" : "bg-primary/20 text-primary/90 border border-primary/30")}>2</kbd>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">Update both the header and infobox image</p>
                                </div>
                            </div>
                            {selectedOption === 'both' && <div className="absolute top-2 right-2"><Check className="w-5 h-5 text-primary" /></div>}
                        </button>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                            <div className="relative">
                                <input type="checkbox" checked={rememberChoice} onChange={(e) => setRememberChoice(e.target.checked)} className="w-5 h-5 rounded bg-white/5 border-2 border-white/20 text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0F] cursor-pointer transition-all checked:bg-primary checked:border-primary" />
                                {rememberChoice && <Check className="absolute inset-0 w-5 h-5 text-white pointer-events-none p-1" />}
                            </div>
                            <span className="text-white/70 group-hover:text-white transition-colors">Remember my choice for future updates</span>
                        </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors font-medium">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function WorldProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    React.use(paramsPromise);
    const params = useParams();
    const router = useRouter();
    const { worlds, updateWorld } = useStore();

    const id = params?.id ? decodeURIComponent(params.id as string) : '';
    const world = worlds.find(w => w.id === id);
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

    // Custom Section State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [lastDeletedSection, setLastDeletedSection] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'prose' | 'structured' | 'reading'>('reading'); // Default to reading view
    const [activeReadingTab, setActiveReadingTab] = useState('overview'); // For tab-based reading view
    const [isSectionEditMode, setIsSectionEditMode] = useState(false); // Separate toggle for section editing

    // Store for project linking
    const { projects, getProjectForWorld, addWorldToProject, removeWorldFromProject } = useStore();
    const currentProject = React.useMemo(() => {
        if (!id) return undefined;
        return getProjectForWorld(id);
    }, [id, projects, getProjectForWorld]);

    // Prose sections for Reading View tabs
    const proseSections = [
        { id: 'overview', title: 'Overview', fieldKey: 'overviewProse' },
        { id: 'history', title: 'History', fieldKey: 'historyProse' },
        { id: 'factions', title: 'Factions', fieldKey: 'factionsProse' },
        { id: 'geography', title: 'Geography', fieldKey: 'geographyProse' }
    ];

    // Direct link navigation
    useEffect(() => {
        if (!world) return;
        // Check hash for direct link navigation
        if (window.location.hash) {
            const hashId = window.location.hash.replace('#', '');
            setTimeout(() => document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth' }), 500);
        }
    }, [world?.id]);

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
            if (!headerDragStart || !headerImageRef.current) return;
            e.preventDefault();
            e.stopPropagation();
            
            // Get container dimensions
            const container = headerImageRef.current;
            const rect = container.getBoundingClientRect();
            
            // Calculate current mouse position as percentage of container
            const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;
            
            // Get the position when drag started (stored in headerDragPosition at click time)
            const startPos = headerDragPosition || { x: 50, y: 50 };
            
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
            
            setHeaderDragPosition({
                x: newX,
                y: newY
            });
        };

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setHeaderDragStart(null);
        };

        // Use capture phase to ensure we catch events
        window.addEventListener('mousemove', handleMouseMove, { passive: false, capture: true });
        window.addEventListener('mouseup', handleMouseUp, { passive: false, capture: true });
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove, { capture: true });
            window.removeEventListener('mouseup', handleMouseUp, { capture: true });
        };
    }, [isRepositioningHeader, headerDragStart, headerDragPosition, world?.headerImagePosition]);

    // Search functionality
    const searchableContent = React.useMemo(() => {
        if (!world || !searchQuery.trim()) return null;
        const query = searchQuery.toLowerCase();
        const matches: Array<{ field: string; content: string }> = [];
        
        const fields = [
            { key: 'name', value: world.name },
            { key: 'description', value: world.description },
            { key: 'overviewProse', value: world.overviewProse },
            { key: 'historyProse', value: world.historyProse },
            { key: 'factionsProse', value: world.factionsProse },
            { key: 'geographyProse', value: world.geographyProse },
        ];
        
        fields.forEach(field => {
            if (field.value && field.value.toLowerCase().includes(query)) {
                matches.push({ field: field.key, content: field.value });
            }
        });
        
        return matches.length > 0 ? matches : null;
    }, [searchQuery, world]);

    // Construct Content Sections (safe to call even if world is null)
    const sections = React.useMemo(() => {
        if (!world) return [];
        return [
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
                        {(world.rules || []).map((rule: any, i: number) => {
                            // Normalize to string: handle both string and object formats
                            let ruleText: string;
                            if (typeof rule === 'string') {
                                ruleText = rule;
                            } else if (rule && typeof rule === 'object' && rule !== null) {
                                // Handle object with name/description
                                ruleText = (rule.name && String(rule.name)) || 
                                          (rule.description && String(rule.description)) || 
                                          JSON.stringify(rule);
                            } else {
                                ruleText = String(rule || '');
                            }
                            return (
                                <li key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <span className="h-6 w-6 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-muted-foreground leading-relaxed pt-0.5">{ruleText}</span>
                                </li>
                            );
                        })}
                    </ul>
                ) : "No rules defined.",
                rawContent: (world.rules || []).map((rule: any) => {
                    // Normalize to string: handle both string and object formats
                    if (typeof rule === 'string') return rule;
                    if (rule && typeof rule === 'object' && rule !== null) {
                        return (rule.name && String(rule.name)) || 
                               (rule.description && String(rule.description)) || 
                               JSON.stringify(rule);
                    }
                    return String(rule || '');
                }),
                fieldId: 'rules',
                fieldType: 'list'
            },
            {
                id: 'societies',
                title: 'Societies & Factions',
                icon: <Users className="w-5 h-5" />,
                content: world.societies?.length ? (
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                        {(world.societies || []).map((society: any, i: number) => {
                            // Normalize to string: handle both string and object formats
                            let societyText: string;
                            if (typeof society === 'string') {
                                societyText = society;
                            } else if (society && typeof society === 'object' && society !== null) {
                                // Handle object with name/description
                                societyText = (society.name && String(society.name)) || 
                                             (society.description && String(society.description)) || 
                                             JSON.stringify(society);
                            } else {
                                societyText = String(society || '');
                            }
                            return (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                                    <span className="text-sm font-medium">{societyText}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : "No societies recorded.",
                rawContent: (world.societies || []).map((society: any) => {
                    // Normalize to string: handle both string and object formats
                    if (typeof society === 'string') return society;
                    if (society && typeof society === 'object' && society !== null) {
                        return (society.name && String(society.name)) || 
                               (society.description && String(society.description)) || 
                               JSON.stringify(society);
                    }
                    return String(society || '');
                }),
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
    }, [world]);

    const infoboxData = React.useMemo(() => {
        if (!world) return { stats: [] };
        return {
            stats: [
                { label: 'WID', value: world.id, readOnly: true },
                { label: 'Genre', value: world.genre },
                { label: 'Tone', value: world.tone || 'N/A' },
                { label: 'Progress', value: `${world.progress}%` }
            ]
        };
    }, [world]);

    // Get section IDs for scroll spy - need to handle both prose and structured views
    const sectionIdsForSpy = React.useMemo(() => {
        if (!world) return [];
        
        // Get all available sections
        const allAvailableSections = viewMode === 'reading' || viewMode === 'prose' 
            ? [
                ...proseSections,
                ...(world.customSections?.map(s => ({
                    id: s.id,
                    title: s.title
                })) || [])
            ]
            : sections;
        
        // Use custom quickNavSections if set, otherwise use all sections
        const quickNavIds = world.quickNavSections && world.quickNavSections.length > 0
            ? world.quickNavSections
            : allAvailableSections.map(s => s.id);
        
        // Filter to only include sections that are in quick nav
        const quickNavSections = allAvailableSections.filter(s => quickNavIds.includes(s.id));
        
        // Map to actual DOM IDs - for prose sections in reading view, they use 'prose-' prefix
        const domIds: string[] = [];
        quickNavSections.forEach(s => {
            if (viewMode === 'reading' || viewMode === 'prose') {
                // Check if it's a prose section
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
    }, [world, viewMode, proseSections, sections]);

    // Use scroll spy to track active section
    const scrollSpyActiveId = useScrollSpy(sectionIdsForSpy, 150);

    // Handle infobox image change
    const handleInfoboxImageChange = (imageUrl: string | null | '__OPEN_MODAL__', changeHero: boolean) => {
        if (!world) return;
        if (imageUrl === '__OPEN_MODAL__') {
            setPendingImageUrl(null);
            setInfoboxImageModalOpen(true);
        } else if (imageUrl === null) {
            // Reset to hero image
            updateWorld(world.id, {
                infoboxImageUrl: null as any
            });
        } else {
            setPendingImageUrl(imageUrl);
            setChangeHeroDialogOpen(true);
        }
    };

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
                const section = world.customSections?.find(s => s.id === targetSectionId);
                if (section && section.type === 'gallery') {
                    const currentImages = section.galleryImages || [];
                    handleUpdateCustomSection(targetSectionId, {
                        galleryImages: [...currentImages, data.imageUrl]
                    });
                }
            } else {
                // Default behavior: update world's main image
                updateWorld(world.id, {
                    imageUrl: data.imageUrl,
                    imageSource: 'generated'
                });
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
            throw error;
        }
    };

    const handleAttachProject = (projectId: string) => {
        if (!projectId) {
            // Unlink: remove from current project
            if (currentProject) {
                removeWorldFromProject(id, currentProject.id);
            }
            return;
        }
        
        if (projectId === currentProject?.id) {
            // If selecting the same project, do nothing
            return;
        }
        
        // If there's a current project, remove the world from it first
        if (currentProject) {
            removeWorldFromProject(id, currentProject.id);
        }
        // Add to new project
        addWorldToProject(id, projectId);
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
        // Generate a unique ID using timestamp + random number to avoid duplicates
        const uniqueId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newSection = {
            id: uniqueId,
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
        if (!world || !world.customSections) return;

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
                                    aria-label="Search world content"
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
                                    title="Export world data"
                                    aria-label="Export world data"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            )}

                            {/* Chat Button */}
                            {!isEditMode && (
                                <Link href={`/chat?mode=world&id=${world.id}`}>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-9 rounded-lg px-3 sm:px-4 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 gap-2"
                                        aria-label="Chat with world"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="hidden sm:inline">Chat</span>
                                    </Button>
                                </Link>
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
                    <div className="absolute inset-0 overflow-hidden">
                        {world.imageUrl ? (
                            <>
                                <div
                                    ref={headerImageRef}
                                    className={cn(
                                        "absolute inset-0 z-20",
                                        isRepositioningHeader && "cursor-move"
                                    )}
                                    onMouseDown={(e) => {
                                        if (isEditMode && isRepositioningHeader) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Get the current object-position (what's currently visible)
                                            const currentPos = headerDragPosition || world.headerImagePosition || { x: 50, y: 50 };
                                            // Get the container dimensions
                                            const container = e.currentTarget;
                                            const rect = container.getBoundingClientRect();
                                            // Store the initial mouse position relative to container
                                            setHeaderDragStart({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top
                                            });
                                            // Store the current position as the starting point for the drag
                                            setHeaderDragPosition(currentPos);
                                        }
                                    }}
                                    style={{
                                        pointerEvents: isRepositioningHeader ? 'auto' : 'auto'
                                    }}
                                >
                                    <img
                                        src={world.imageUrl}
                                        alt={world.name}
                                        className={cn(
                                            "w-full h-full object-cover opacity-90 transition-all duration-200",
                                            isRepositioningHeader && "select-none"
                                        )}
                                        style={{
                                            // Scale up the image so we can pan within it (like background-size: cover with panning)
                                            transform: (isRepositioningHeader || world.headerImagePosition) 
                                                ? `scale(1.5)` 
                                                : undefined,
                                            // Use object-position to control which part of the scaled image is visible
                                            // object-position uses percentages: 0% = left/top, 50% = center, 100% = right/bottom
                                            objectPosition: isRepositioningHeader && headerDragPosition
                                                ? `${headerDragPosition.x}% ${headerDragPosition.y}%`
                                                : world.headerImagePosition
                                                    ? `${world.headerImagePosition.x}% ${world.headerImagePosition.y}%`
                                                    : '50% 50%',
                                            pointerEvents: isRepositioningHeader ? 'none' : 'auto'
                                        }}
                                        draggable={false}
                                        onDragStart={(e) => e.preventDefault()}
                                    />
                                </div>
                                {/* Visual indicator for linked images */}
                                {world.infoboxImageUrl && world.infoboxImageUrl !== 'null' && world.infoboxImageUrl === world.imageUrl && (
                                    <div className="absolute top-4 right-4 bg-primary/90 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-lg z-20">
                                        <Link2 className="w-3.5 h-3.5" />
                                        Linked to Infobox
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getGenreGradient(world.genre)} flex items-center justify-center`}>
                                <Globe className="w-32 h-32 md:w-48 md:h-48 text-white/5" />
                            </div>
                        )}
                        {/* Genre-based Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getGenreGradient(world.genre)} mix-blend-overlay opacity-60`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/60 to-transparent" />
                        {/* Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    </div>

                    {/* Reposition Mode Overlay */}
                    {isEditMode && isRepositioningHeader && (
                        <>
                            <div 
                                className="absolute inset-0 z-30 bg-black/20 pointer-events-none"
                                style={{ backdropFilter: 'blur(2px)' }}
                            />
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
                                                    updateWorld(world.id, {
                                                        headerImagePosition: headerDragPosition
                                                    });
                                                } else if (world.headerImagePosition) {
                                                    // Keep existing position if no change
                                                    updateWorld(world.id, {
                                                        headerImagePosition: world.headerImagePosition
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
                    {world.imageUrl && !isEditMode && (
                        <div className="absolute top-4 left-4 z-20">
                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = world.imageUrl!;
                                    link.download = `${world.name}-header.jpg`;
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

                    {/* Content Overlay with better contrast */}
                    <div className="absolute inset-0 z-10">
                        {/* Dark gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
                        
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-8 relative z-10">
                            {/* Tags Row */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {world.genre && (
                                    <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/80 border border-white/20 backdrop-blur-md text-white shadow-lg">
                                        {world.genre}
                                    </span>
                                )}
                                {world.tone && (
                                    <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/80 border border-white/20 backdrop-blur-md text-white shadow-lg">
                                        {world.tone}
                                    </span>
                                )}
                                <span className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5",
                                    currentProject 
                                        ? "bg-blue-500/90 border-blue-400/50 text-white" 
                                        : "bg-black/80 border-white/20 text-white/90"
                                )}>
                                    <Link2 className="w-3 h-3" />
                                    {currentProject ? 'Linked' : 'Unlinked'}
                                </span>
                                <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/80 border border-white/20 backdrop-blur-md text-white shadow-lg">
                                    {world.progress || 0}% Complete
                                </span>
                            </div>

                            {/* World Name */}
                            {isEditMode ? (
                                <input
                                    value={world.name}
                                    onChange={(e) => updateWorld(world.id, { name: e.target.value })}
                                    className="bg-black/60 backdrop-blur-sm border-2 border-transparent focus:border-amber-500/50 text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight focus:outline-none w-full mb-2 px-2 py-1 rounded-lg shadow-2xl"
                                    placeholder="World Name"
                                />
                            ) : (
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                    {world.name}
                                </h1>
                            )}

                            {/* Tagline */}
                            {isEditMode ? (
                                <div className="flex gap-2 items-center w-full max-w-3xl">
                                    <input
                                        value={world.tagline || ''}
                                        onChange={(e) => updateWorld(world.id, { tagline: e.target.value })}
                                        className="flex-1 bg-black/60 backdrop-blur-sm border-2 border-transparent focus:border-amber-500/50 text-lg md:text-xl italic text-white focus:outline-none px-2 py-1 rounded-lg placeholder:text-white/50 shadow-2xl"
                                        placeholder="Add an atmospheric tagline..."
                                    />
                                </div>
                            ) : (
                                <p className="text-lg md:text-xl lg:text-2xl italic text-white font-light tracking-wide max-w-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                                    {world.tagline || "A world waiting to be discovered."}
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
                                        onClick={() => {
                                            setPendingHeaderImageAction('generate');
                                            setGeneratorModalOpen(true);
                                        }}
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
                                    {world.imageUrl && (
                                        <Button
                                            onClick={() => {
                                                setIsRepositioningHeader(true);
                                                setHeaderDragPosition(world.headerImagePosition || { x: 50, y: 50 });
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
                        <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br ${getGenreGradient(world.genre)} opacity-[0.08] blur-[120px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3 transition-opacity group-hover/prose:opacity-[0.12]`} />
                        {/* Side Accent Line */}
                        <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${getGenreGradient(world.genre)} opacity-90`} />
                        {/* Decorative Quote Mark */}
                        <div className="absolute top-4 right-6 text-white/[0.04] font-serif text-[120px] leading-none select-none pointer-events-none font-black italic group-hover/prose:text-white/[0.06] transition-colors">
                            "
                        </div>
                        <div className="relative z-10 p-6 md:p-8 lg:p-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                        <Sparkles className="w-3.5 h-3.5 text-primary/90" />
                                    </div>
                                    Overview
                                </h3>
                                {isEditMode && (
                                    <button 
                                        onClick={() => handleOpenAIModal('Overview', (val) => updateWorld(world.id, { description: val }))} 
                                        className="p-2 rounded-lg bg-white/5 text-primary hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all"
                                        title="Generate with AI"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {isEditMode ? (
                                <textarea
                                    value={world.description || ''}
                                    onChange={(e) => updateWorld(world.id, { description: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white/90 text-lg leading-relaxed focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px] font-serif resize-none"
                                    placeholder="Describe the world..."
                                />
                            ) : (
                                <div className="max-w-4xl relative">
                                    <MarkdownProse
                                        content={typeof world.description === 'string' ? world.description : (world.description ? String(world.description) : "A world waiting to be discovered. Click Edit to begin your world's journey.")}
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
                {/* MAIN CONTENT GRID */}
                <div className={cn(
                    "mx-auto px-6 py-4 transition-all duration-300",
                    viewMode === 'reading' ? "max-w-[1600px]" : "max-w-7xl"
                )}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left: Sidebar (TOC & Info) */}
                        <div className="lg:col-span-3 space-y-6">
                            <Infobox
                                data={infoboxData}
                                title={world.name}
                                imageUrl={world.imageUrl}
                                infoboxImageUrl={world.infoboxImageUrl}
                                heroImageUrl={world.imageUrl}
                                type="World Setting"
                                isEditMode={isEditMode || isSectionEditMode}
                                onUpdate={updateWorld}
                                worldId={world.id}
                                onImageChange={handleInfoboxImageChange}
                            />
                            <div className="hidden lg:block">
                                {viewMode === 'reading' ? (
                                    <ReadingSideNav
                                        sections={[
                                            ...proseSections,
                                            ...(world.customSections?.map(s => ({
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
                                        // Build ordered list of sections (prose + custom interleaved)
                                        const proseSectionIds = ['prose-overview', 'prose-history', 'prose-factions', 'prose-geography'];
                                        const orderedSections: Array<{ type: 'prose' | 'custom'; id: string; data?: any }> = [];
                                        
                                        const addCustomSectionsAfter = (parentId: string) => {
                                            const customAfter = world.customSections?.filter(s => s.insertAfter === parentId) || [];
                                            customAfter.forEach(custom => {
                                                orderedSections.push({ type: 'custom', id: custom.id, data: custom });
                                                addCustomSectionsAfter(custom.id);
                                            });
                                        };
                                        
                                        proseSectionIds.forEach((proseId) => {
                                            orderedSections.push({ type: 'prose', id: proseId });
                                            addCustomSectionsAfter(proseId);
                                        });
                                        
                                        const customWithoutInsert = world.customSections?.filter(s => !s.insertAfter) || [];
                                        customWithoutInsert.forEach(custom => {
                                            orderedSections.push({ type: 'custom', id: custom.id, data: custom });
                                            addCustomSectionsAfter(custom.id);
                                        });

                                        // Helper to ensure content is always a string
                                        const ensureString = (value: any): string => {
                                            if (typeof value === 'string') return value;
                                            if (value == null) return '';
                                            if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? v : String(v)).join('');
                                            return String(value);
                                        };

                                        const proseSectionMap: Record<string, { title: string; content: string; onChange: (val: string) => void; placeholder: string; attachedImage?: any; onImageChange?: (image: any) => void }> = {
                                            'prose-overview': {
                                                title: 'Overview',
                                                content: ensureString(world.overviewProse || world.description || ''),
                                                onChange: (val) => handleProseChange('overviewProse', val),
                                                placeholder: "Describe this world in rich, evocative prose...",
                                                attachedImage: world.proseImages?.overview,
                                                onImageChange: (image: any) => {
                                                    updateWorld(world.id, {
                                                        proseImages: {
                                                            ...world.proseImages,
                                                            overview: image || undefined
                                                        }
                                                    });
                                                }
                                            },
                                            'prose-history': {
                                                title: 'History & Lore',
                                                content: ensureString(world.historyProse || world.history || ''),
                                                onChange: (val) => handleProseChange('historyProse', val),
                                                placeholder: "Tell the story of this world's past...",
                                                attachedImage: world.proseImages?.history,
                                                onImageChange: (image: any) => {
                                                    updateWorld(world.id, {
                                                        proseImages: {
                                                            ...world.proseImages,
                                                            history: image || undefined
                                                        }
                                                    });
                                                }
                                            },
                                            'prose-factions': {
                                                title: 'Factions & Powers',
                                                content: ensureString(world.factionsProse || ''),
                                                onChange: (val) => handleProseChange('factionsProse', val),
                                                placeholder: "Describe the major factions...",
                                                attachedImage: world.proseImages?.factions,
                                                onImageChange: (image: any) => {
                                                    updateWorld(world.id, {
                                                        proseImages: {
                                                            ...world.proseImages,
                                                            factions: image || undefined
                                                        }
                                                    });
                                                }
                                            },
                                            'prose-geography': {
                                                title: 'Geography & Locations',
                                                content: ensureString(world.geographyProse || world.geography || ''),
                                                onChange: (val) => handleProseChange('geographyProse', val),
                                                placeholder: "Paint a picture of the landscapes...",
                                                attachedImage: world.proseImages?.geography,
                                                onImageChange: (image: any) => {
                                                    updateWorld(world.id, {
                                                        proseImages: {
                                                            ...world.proseImages,
                                                            geography: image || undefined
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
                                                                        <div key={`${section.id}-${item.idx}`} className="relative mb-4 break-inside-avoid rounded-lg overflow-hidden border border-white/10">
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
                                                            return (
                                                                <div className="relative rounded-lg overflow-hidden border border-white/10">
                                                                    <div className="aspect-video">
                                                                        {allMedia[0] && (
                                                                            allMedia[0].type === 'image' ? (
                                                                                <img src={allMedia[0].url} alt={section.title} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <video src={allMedia[0].url} className="w-full h-full object-cover" controls />
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                    {allMedia.map((item) => (
                                                                        <div key={`${section.id}-${item.idx}`} className="relative rounded-lg overflow-hidden border border-white/10 aspect-square">
                                                                            {item.type === 'image' ? (
                                                                                <img src={item.url} alt={`${section.title} - Image ${item.idx + 1}`} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <video src={item.url} className="w-full h-full object-cover" controls />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }
                                                    };

                                                    return (
                                                        <section key={section.id} id={section.id} className="scroll-mt-24">
                                                            <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                                                            {renderGallery()}
                                                        </section>
                                                    );
                                                } else {
                                                    return (
                                                        <section key={section.id} id={section.id} className="scroll-mt-24">
                                                            <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                                                            <MarkdownProse content={section.content || ''} className="prose prose-invert max-w-none" hideMentionSymbol={true} />
                                                            {section.attachedImage && (
                                                                <div className="mt-6 rounded-lg overflow-hidden border border-white/10">
                                                                    <img 
                                                                        src={section.attachedImage.url} 
                                                                        alt={section.attachedImage.altText || section.title}
                                                                        className="w-full h-auto"
                                                                    />
                                                                    {section.attachedImage.caption && (
                                                                        <p className="text-sm text-white/60 p-3 bg-white/5">{section.attachedImage.caption}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </section>
                                                    );
                                                }
                                            }
                                            return null;
                                        });
                                    })()}
                                </div>
                            ) : viewMode === 'prose' ? (
                                /* PROSE EDITOR VIEW */
                                <>
                                    <ProseSection
                                        title="Overview"
                                        content={world.overviewProse || world.description || ''}
                                        onChange={(val) => handleProseChange('overviewProse', val)}
                                        placeholder="Describe this world in rich, evocative prose..."
                                        onAiGenerate={() => handleOpenAIModal('Overview', (val) => handleProseChange('overviewProse', val))}
                                        attachedImage={world.proseImages?.overview}
                                        onImageChange={(image: any) => {
                                            updateWorld(world.id, {
                                                proseImages: {
                                                    ...world.proseImages,
                                                    overview: image || undefined
                                                }
                                            });
                                        }}
                                    />
                                    <ProseSection
                                        title="History & Lore"
                                        content={world.historyProse || world.history || ''}
                                        onChange={(val) => handleProseChange('historyProse', val)}
                                        placeholder="Tell the story of this world's past, its pivotal moments, and the echoes that still resonate..."
                                        onAiGenerate={() => handleOpenAIModal('History', (val) => handleProseChange('historyProse', val))}
                                        attachedImage={world.proseImages?.history}
                                        onImageChange={(image: any) => {
                                            updateWorld(world.id, {
                                                proseImages: {
                                                    ...world.proseImages,
                                                    history: image || undefined
                                                }
                                            });
                                        }}
                                    />
                                    <ProseSection
                                        title="Factions & Powers"
                                        content={world.factionsProse || ''}
                                        onChange={(val) => handleProseChange('factionsProse', val)}
                                        placeholder="Describe the major factions, their goals, leaders, and conflicts..."
                                        onAiGenerate={() => handleOpenAIModal('Factions', (val) => handleProseChange('factionsProse', val))}
                                        attachedImage={world.proseImages?.factions}
                                        onImageChange={(image: any) => {
                                            updateWorld(world.id, {
                                                proseImages: {
                                                    ...world.proseImages,
                                                    factions: image || undefined
                                                }
                                            });
                                        }}
                                    />
                                    <ProseSection
                                        title="Geography & Locations"
                                        content={world.geographyProse || world.geography || ''}
                                        onChange={(val) => handleProseChange('geographyProse', val)}
                                        placeholder="Paint a picture of the landscapes, cities, and places of importance..."
                                        onAiGenerate={() => handleOpenAIModal('Geography', (val) => handleProseChange('geographyProse', val))}
                                        attachedImage={world.proseImages?.geography}
                                        onImageChange={(image: any) => {
                                            updateWorld(world.id, {
                                                proseImages: {
                                                    ...world.proseImages,
                                                    geography: image || undefined
                                                }
                                            });
                                        }}
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

                            {/* Custom Sections - Only render in structured view (prose view handles them interleaved) */}
                            {viewMode === 'structured' && world.customSections?.map((section, idx) => (
                                <CustomSection
                                    key={section.id}
                                    section={section}
                                    isEditMode={isSectionEditMode}
                                    onUpdate={handleUpdateCustomSection}
                                    onDelete={handleDeleteCustomSection}
                                    onMoveUp={() => handleMoveSection(section.id, 'up')}
                                    onMoveDown={() => handleMoveSection(section.id, 'down')}
                                    onOpenAIModal={handleOpenAIModal}
                                    isFirst={idx === 0}
                                    isLast={idx === (world.customSections?.length || 0) - 1}
                                />
                            ))}

                            {/* Add Section Button at bottom (only in structured view, and only if no custom sections exist) */}
                            {viewMode === 'structured' && isSectionEditMode && (!world.customSections || world.customSections.length === 0) && (
                                <button
                                    onClick={() => handleAddCustomSection()}
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
                                    Last updated: {new Date(world.updatedAt).toLocaleDateString()}
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
                itemName={world.name}
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
                itemName={`${world.name} (Infobox)`}
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
                            updateWorld(world.id, {
                                imageUrl: pendingHeaderImageUrl,
                                infoboxImageUrl: pendingHeaderImageUrl,
                                imageSource: pendingHeaderImageAction === 'generate' ? 'generated' : 'uploaded'
                            });
                        } else {
                            updateWorld(world.id, {
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
                        if (changeHero) {
                            updateWorld(world.id, {
                                imageUrl: imageUrlToSet,
                                infoboxImageUrl: imageUrlToSet
                            });
                        } else {
                            updateWorld(world.id, {
                                infoboxImageUrl: imageUrlToSet
                            });
                        }
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
                                    ...(world.customSections?.map(s => ({
                                        id: s.id,
                                        title: s.title
                                    })) || [])
                                ]
                                : sections;

                            // Use custom quickNavSections if set, otherwise use all sections
                            const quickNavIds = world.quickNavSections && world.quickNavSections.length > 0
                                ? world.quickNavSections
                                : allAvailableSections.map(s => s.id);

                            // Filter to only show sections that exist
                            const quickNavSections = allAvailableSections.filter(s => quickNavIds.includes(s.id));

                            return quickNavSections.map(s => {
                                // Check if this section matches the scroll spy active ID
                                let matchesScrollSpy = false;
                                if (scrollSpyActiveId) {
                                    if (viewMode === 'reading' || viewMode === 'prose') {
                                        const isProseSection = proseSections.some(ps => ps.id === s.id);
                                        if (isProseSection) {
                                            matchesScrollSpy = scrollSpyActiveId === `prose-${s.id}`;
                                        } else {
                                            matchesScrollSpy = scrollSpyActiveId === s.id;
                                        }
                                    } else {
                                        matchesScrollSpy = scrollSpyActiveId === s.id;
                                    }
                                }
                                
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
                world={world}
                viewMode={viewMode}
                proseSections={proseSections}
                sections={sections}
                onSave={(sectionIds) => {
                    updateWorld(world.id, { quickNavSections: sectionIds });
                    setQuickNavEditModalOpen(false);
                }}
            />
        </div>
    );
}

// Quick Nav Edit Dialog Component
function QuickNavEditDialog({
    isOpen,
    onClose,
    world,
    viewMode,
    proseSections,
    sections,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    world: any;
    viewMode: string;
    proseSections: any[];
    sections: any[];
    onSave: (sectionIds: string[]) => void;
}) {
    const [selectedSections, setSelectedSections] = React.useState<Set<string>>(new Set());

    const allAvailableSections = React.useMemo(() => {
        return viewMode === 'reading' || viewMode === 'prose' 
            ? [
                ...proseSections,
                ...(world.customSections?.map((s: any) => ({
                    id: s.id,
                    title: s.title
                })) || [])
            ]
            : sections;
    }, [viewMode, proseSections, sections, world.customSections]);

    React.useEffect(() => {
        if (isOpen && world) {
            const currentQuickNav = world.quickNavSections && world.quickNavSections.length > 0
                ? world.quickNavSections
                : allAvailableSections.map((s: any) => s.id);
            setSelectedSections(new Set(currentQuickNav));
        }
    }, [isOpen, world, allAvailableSections]);

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

