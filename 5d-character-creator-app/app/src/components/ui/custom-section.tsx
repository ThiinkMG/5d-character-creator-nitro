'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown,
    Trash2,
    ArrowUp,
    ArrowDown,
    Sparkles,
    Pencil,
    Check,
    X,
    GripVertical,
    Image as ImageIcon,
    Plus,
    Wand2,
    Video,
    LayoutGrid,
    Film,
    Grid3x3,
    Play,
    RefreshCw,
    Crop,
    Edit2,
    Save,
    Move,
    Upload as UploadIcon,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { EditableField } from './editable-field';
import { InlineEditableText } from './inline-editable-text';
import { MarkdownProse } from './markdown-prose';
import { ImageGeneratorModal } from '@/components/gallery';
import { ImageProvider } from '@/types/image-config';
import { ImageCropper } from './image-cropper';

interface CustomSectionData {
    id: string;
    title: string;
    content: string;
    order: number;
    type?: 'text' | 'gallery';
    galleryImages?: string[];
    galleryVideos?: string[];
    galleryItems?: Array<{
        id: string;
        url: string;
        type: 'image' | 'video';
        altText?: string;
        caption?: string;
        order: number;
    }>;
    galleryDisplayType?: 'grid' | 'masonry' | 'slideshow' | 'card' | 'carousel';
    attachedImage?: {
        url: string;
        aspectRatio: string;
        position: { x: number; y: number; scale: number };
        size?: 'small' | 'medium' | 'large';
    };
}

interface CustomSectionProps {
    section: CustomSectionData;
    isEditMode: boolean;
    onUpdate: (id: string, updates: Partial<CustomSectionData>) => void;
    onDelete: (id: string) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onOpenAIModal?: (fieldLabel: string, handler: (content: string) => void) => void;
    onAddSectionAfter?: (type: 'text' | 'gallery') => void;
    onGenerateImage?: (prompt: string, provider: ImageProvider) => Promise<void>;
    isFirst?: boolean;
    isLast?: boolean;
    viewMode?: 'prose' | 'structured' | 'reading';
}

export function CustomSection({
    section,
    isEditMode,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onOpenAIModal,
    onAddSectionAfter,
    onGenerateImage,
    isFirst,
    isLast,
    viewMode = 'structured'
}: CustomSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(section.title);
    const [galleryModalOpen, setGalleryModalOpen] = useState(false);
    const [showDisplayOptions, setShowDisplayOptions] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [slideshowIndex, setSlideshowIndex] = useState(0);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
    const [galleryManageOpen, setGalleryManageOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingAltText, setEditingAltText] = useState('');
    const [editingCaption, setEditingCaption] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const displayOptionsRef = useRef<HTMLDivElement>(null);
    const sectionType = section.type || 'text';
    const displayType = section.galleryDisplayType || 'grid';

    // Close display options when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (displayOptionsRef.current && !displayOptionsRef.current.contains(event.target as Node)) {
                setShowDisplayOptions(false);
            }
        };

        if (showDisplayOptions) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDisplayOptions]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setTempImageUrl(dataUrl);
            setCropperOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCrop = (croppedDataUrl: string, aspectRatio: string, position: { x: number; y: number; scale: number }) => {
        onUpdate(section.id, {
            attachedImage: { url: croppedDataUrl, aspectRatio, position }
        });
        setCropperOpen(false);
        setTempImageUrl(null);
    };

    const getAspectRatioClass = (ratio: string) => {
        const ratios: Record<string, string> = {
            '1:1': 'aspect-square',
            '16:9': 'aspect-video',
            '9:16': 'aspect-[9/16]',
            '3:4': 'aspect-[3/4]',
            '4:3': 'aspect-[4/3]',
            '21:9': 'aspect-[21/9]',
            '9:21': 'aspect-[9/21]',
        };
        return ratios[ratio] || 'aspect-video';
    };

    const handleSaveTitle = () => {
        if (titleValue.trim()) {
            onUpdate(section.id, { title: titleValue });
            setIsEditingTitle(false);
        }
    };

    const handleCancelTitle = () => {
        setTitleValue(section.title);
        setIsEditingTitle(false);
    };

    return (
        <section
            id={section.id}
            className={cn(
                "scroll-mt-24 transition-all group",
                viewMode === 'prose' ? "glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10" :
                "pt-8 border-t border-white/5"
            )}
        >
            {/* Header */}
            <div className={cn(
                "flex items-center gap-3 mb-4 group",
                viewMode === 'prose' && "flex items-center justify-between"
            )}>
                <div className="flex items-center gap-3 flex-1">
                    <div
                        className={cn(
                            "p-2 rounded-xl border cursor-pointer",
                            sectionType === 'gallery' 
                                ? "bg-fuchsia-500/10 border-fuchsia-500/20"
                                : "bg-violet-500/10 border-violet-500/20"
                        )}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <span className={sectionType === 'gallery' ? "text-fuchsia-400" : "text-violet-400"}>
                            {sectionType === 'gallery' ? (
                                <ImageIcon className="w-5 h-5" />
                            ) : (
                                <Sparkles className="w-5 h-5" />
                            )}
                        </span>
                    </div>

                    {isEditingTitle ? (
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="text"
                                value={titleValue}
                                onChange={(e) => setTitleValue(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xl font-bold text-white focus:outline-none focus:border-violet-500/50"
                                autoFocus
                                placeholder="Section Title"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTitle();
                                    if (e.key === 'Escape') handleCancelTitle();
                                }}
                            />
                            <button
                                onClick={handleSaveTitle}
                                className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCancelTitle}
                                className="p-1.5 rounded bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <h2
                            className={cn(
                                "font-bold text-white tracking-tight flex-1",
                                isEditMode ? "cursor-text" : "cursor-pointer"
                            )}
                            onClick={(e) => {
                                if (isEditMode) {
                                    e.stopPropagation();
                                    setIsEditingTitle(true);
                                } else {
                                    setIsExpanded(!isExpanded);
                                }
                            }}
                            onDoubleClick={(e) => {
                                if (isEditMode) {
                                    e.stopPropagation();
                                    setIsEditingTitle(true);
                                }
                            }}
                        >
                            {section.title}
                        </h2>
                    )}
                </div>
                
                {viewMode === 'prose' && onOpenAIModal && sectionType === 'text' && (
                    <button
                        onClick={() => onOpenAIModal(section.title, (newVal) => onUpdate(section.id, { content: newVal }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20
                                transition-all hover:scale-105"
                        title={`Generate ${section.title} with AI`}
                    >
                        <Wand2 className="w-3.5 h-3.5" />
                        Generate
                    </button>
                )}

                {/* Gallery Management & Display Type Selector */}
                {isEditMode && sectionType === 'gallery' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setGalleryManageOpen(true)}
                            className="p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                            title="Manage Gallery"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowDisplayOptions(!showDisplayOptions)}
                                className="p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                                title="Display Options"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            {showDisplayOptions && (
                                <div ref={displayOptionsRef} className="absolute right-0 top-full mt-1 z-50 bg-[#0A0A0F] border border-white/20 rounded-lg shadow-2xl p-2 min-w-[180px]">
                                    <div className="text-xs text-white/50 uppercase tracking-wide mb-2 px-2">Display Type</div>
                                    {(['grid', 'masonry', 'slideshow', 'card', 'carousel'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                onUpdate(section.id, { galleryDisplayType: type });
                                                setShowDisplayOptions(false);
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2",
                                                displayType === type
                                                    ? "bg-primary/20 text-primary"
                                                    : "text-white/80 hover:bg-white/10"
                                            )}
                                        >
                                            {type === 'grid' && <Grid3x3 className="w-4 h-4" />}
                                            {type === 'masonry' && <LayoutGrid className="w-4 h-4" />}
                                            {type === 'slideshow' && <Film className="w-4 h-4" />}
                                            {type === 'card' && <ImageIcon className="w-4 h-4" />}
                                            {type === 'carousel' && <Play className="w-4 h-4" />}
                                            <span className="capitalize">{type}</span>
                                            {displayType === type && <Check className="w-3 h-3 ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Edit Controls */}
                {isEditMode && (
                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                        {!isEditingTitle && (
                            <button
                                onClick={() => setIsEditingTitle(true)}
                                className="p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                                title="Rename Section"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}

                        <div className="w-px h-4 bg-white/10 mx-1" />

                        <button
                            onClick={onMoveUp}
                            disabled={isFirst}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                isFirst ? "text-white/10 cursor-not-allowed" : "hover:bg-white/5 text-white/40 hover:text-white"
                            )}
                            title="Move Up"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onMoveDown}
                            disabled={isLast}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                isLast ? "text-white/10 cursor-not-allowed" : "hover:bg-white/5 text-white/40 hover:text-white"
                            )}
                            title="Move Down"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-white/10 mx-1" />

                        <button
                            onClick={() => onDelete(section.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-colors"
                            title="Delete Section"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {!isEditingTitle && (
                    <ChevronDown
                        className={cn(
                            "w-5 h-5 text-white/30 transition-transform duration-300 cursor-pointer",
                            isExpanded ? "rotate-0" : "-rotate-90"
                        )}
                        onClick={() => setIsExpanded(!isExpanded)}
                    />
                )}
            </div>

            {/* Content */}
            <div
                className={cn(
                    "transition-all duration-300",
                    isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
                )}
            >
                {sectionType === 'gallery' ? (
                    <div className="mb-6">
                        {/* Gallery Display based on displayType */}
                        {(() => {
                            // Use galleryItems if available, otherwise fall back to legacy format
                            let allMedia: Array<{ type: 'image' | 'video'; url: string; idx: number; altText?: string; caption?: string }>;
                            
                            if (section.galleryItems && section.galleryItems.length > 0) {
                                const sortedItems = [...section.galleryItems].sort((a, b) => a.order - b.order);
                                allMedia = sortedItems.map((item, idx) => ({
                                    type: item.type,
                                    url: item.url,
                                    idx,
                                    altText: item.altText,
                                    caption: item.caption
                                }));
                            } else {
                                // Legacy format
                                allMedia = [
                                    ...(section.galleryImages?.map((url, idx) => ({ type: 'image' as const, url, idx })) || []),
                                    ...(section.galleryVideos?.map((url, idx) => ({ type: 'video' as const, url, idx: idx + (section.galleryImages?.length || 0) })) || [])
                                ];
                            }

                            if (displayType === 'masonry') {
                                return (
                                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 mb-4">
                                        {allMedia.map((item) => (
                                            <div key={item.idx} className="relative group mb-4 break-inside-avoid rounded-lg overflow-hidden border border-white/10">
                                                {item.type === 'image' ? (
                                                    <img 
                                                        src={item.url} 
                                                        alt={item.altText || `${section.title} - Image ${item.idx + 1}`}
                                                        className="w-full h-auto object-cover"
                                                    />
                                                ) : (
                                                    <video 
                                                        src={item.url} 
                                                        className="w-full h-auto"
                                                        controls
                                                    />
                                                )}
                                                {/* Caption Display */}
                                                {item.caption && (
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                                        <p className="text-sm text-white line-clamp-2">{item.caption}</p>
                                                    </div>
                                                )}
                                                {isEditMode && (
                                                    <button
                                                        onClick={() => {
                                                            if (section.galleryItems && section.galleryItems.length > 0) {
                                                                const itemToDelete = section.galleryItems.find((_, i) => {
                                                                    const sorted = [...section.galleryItems].sort((a, b) => a.order - b.order);
                                                                    return i === item.idx;
                                                                });
                                                                if (itemToDelete) {
                                                                    const updatedItems = section.galleryItems
                                                                        .filter(i => i.id !== itemToDelete.id)
                                                                        .map((i, idx) => ({ ...i, order: idx }));
                                                                    onUpdate(section.id, { galleryItems: updatedItems });
                                                                }
                                                            } else {
                                                                // Legacy format
                                                                if (item.type === 'image') {
                                                                    const updatedImages = section.galleryImages?.filter((_, i) => i !== item.idx) || [];
                                                                    onUpdate(section.id, { galleryImages: updatedImages });
                                                                } else {
                                                                    const videoIdx = item.idx - (section.galleryImages?.length || 0);
                                                                    const updatedVideos = section.galleryVideos?.filter((_, i) => i !== videoIdx) || [];
                                                                    onUpdate(section.id, { galleryVideos: updatedVideos });
                                                                }
                                                            }
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            } else if (displayType === 'slideshow') {
                                return (
                                    <div className="relative mb-4">
                                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40">
                                            {allMedia[slideshowIndex] && (
                                                <>
                                                    {allMedia[slideshowIndex].type === 'image' ? (
                                                        <img 
                                                            src={allMedia[slideshowIndex].url} 
                                                            alt={`${section.title} - Slide ${slideshowIndex + 1}`}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <video 
                                                            src={allMedia[slideshowIndex].url} 
                                                            className="w-full h-full object-contain"
                                                            controls
                                                        />
                                                    )}
                                                </>
                                            )}
                                            {allMedia.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={() => setSlideshowIndex((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1))}
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                                                    >
                                                        <ChevronDown className="w-5 h-5 rotate-90" />
                                                    </button>
                                                    <button
                                                        onClick={() => setSlideshowIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0))}
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
                                                        onClick={() => setSlideshowIndex(idx)}
                                                        className={cn(
                                                            "w-2 h-2 rounded-full transition-all",
                                                            idx === slideshowIndex ? "bg-primary w-6" : "bg-white/20"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            } else if (displayType === 'card') {
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                                        {allMedia.map((item) => (
                                            <div key={item.idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
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
                                                {/* Caption Display */}
                                                {item.caption && (
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                                        <p className="text-sm text-white line-clamp-2">{item.caption}</p>
                                                    </div>
                                                )}
                                                {isEditMode && (
                                                    <button
                                                        onClick={() => {
                                                            if (section.galleryItems && section.galleryItems.length > 0) {
                                                                const itemToDelete = section.galleryItems.find((_, i) => {
                                                                    const sorted = [...section.galleryItems].sort((a, b) => a.order - b.order);
                                                                    return i === item.idx;
                                                                });
                                                                if (itemToDelete) {
                                                                    const updatedItems = section.galleryItems
                                                                        .filter(i => i.id !== itemToDelete.id)
                                                                        .map((i, idx) => ({ ...i, order: idx }));
                                                                    onUpdate(section.id, { galleryItems: updatedItems });
                                                                }
                                                            } else {
                                                                // Legacy format
                                                                if (item.type === 'image') {
                                                                    const updatedImages = section.galleryImages?.filter((_, i) => i !== item.idx) || [];
                                                                    onUpdate(section.id, { galleryImages: updatedImages });
                                                                } else {
                                                                    const videoIdx = item.idx - (section.galleryImages?.length || 0);
                                                                    const updatedVideos = section.galleryVideos?.filter((_, i) => i !== videoIdx) || [];
                                                                    onUpdate(section.id, { galleryVideos: updatedVideos });
                                                                }
                                                            }
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            } else if (displayType === 'carousel') {
                                return (
                                    <div className="relative mb-4">
                                        <div className="overflow-hidden rounded-lg border border-white/10">
                                            <div 
                                                className="flex transition-transform duration-300 ease-in-out"
                                                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                                            >
                                                {allMedia.map((item) => (
                                                    <div key={item.idx} className="min-w-full aspect-video bg-black/40 flex items-center justify-center">
                                                        {item.type === 'image' ? (
                                                            <img 
                                                                src={item.url} 
                                                                alt={`${section.title} - Image ${item.idx + 1}`}
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
                                                    onClick={() => setCarouselIndex((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1))}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                                                >
                                                    <ChevronDown className="w-5 h-5 rotate-90" />
                                                </button>
                                                <button
                                                    onClick={() => setCarouselIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0))}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                                                >
                                                    <ChevronDown className="w-5 h-5 -rotate-90" />
                                                </button>
                                                <div className="flex justify-center gap-2 mt-4">
                                                    {allMedia.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setCarouselIndex(idx)}
                                                            className={cn(
                                                                "w-2 h-2 rounded-full transition-all",
                                                                idx === carouselIndex ? "bg-primary w-6" : "bg-white/20"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            } else {
                                // Default: grid
                                return (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                                        {allMedia.map((item) => (
                                            <div key={item.idx} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
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
                                                {/* Caption Display */}
                                                {item.caption && (
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                                        <p className="text-sm text-white line-clamp-2">{item.caption}</p>
                                                    </div>
                                                )}
                                                {isEditMode && (
                                                    <button
                                                        onClick={() => {
                                                            if (section.galleryItems && section.galleryItems.length > 0) {
                                                                const itemToDelete = section.galleryItems.find((_, i) => {
                                                                    const sorted = [...section.galleryItems].sort((a, b) => a.order - b.order);
                                                                    return i === item.idx;
                                                                });
                                                                if (itemToDelete) {
                                                                    const updatedItems = section.galleryItems
                                                                        .filter(i => i.id !== itemToDelete.id)
                                                                        .map((i, idx) => ({ ...i, order: idx }));
                                                                    onUpdate(section.id, { galleryItems: updatedItems });
                                                                }
                                                            } else {
                                                                // Legacy format
                                                                if (item.type === 'image') {
                                                                    const updatedImages = section.galleryImages?.filter((_, i) => i !== item.idx) || [];
                                                                    onUpdate(section.id, { galleryImages: updatedImages });
                                                                } else {
                                                                    const videoIdx = item.idx - (section.galleryImages?.length || 0);
                                                                    const updatedVideos = section.galleryVideos?.filter((_, i) => i !== videoIdx) || [];
                                                                    onUpdate(section.id, { galleryVideos: updatedVideos });
                                                                }
                                                            }
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                        })()}

                        {/* Upload Area */}
                        {isEditMode && (
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    id={`gallery-upload-${section.id}`}
                                    multiple
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length === 0) return;

                                        setUploadingFiles(true);
                                        const newImages: string[] = [];
                                        const newVideos: string[] = [];

                                        // Size limits: Images max 10MB, Videos max 50MB
                                        const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
                                        const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

                                        for (const file of files) {
                                            if (file.size > (file.type.startsWith('video/') ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE)) {
                                                alert(`${file.name} exceeds size limit (${file.type.startsWith('video/') ? '50MB' : '10MB'})`);
                                                continue;
                                            }

                                            const dataUrl = await new Promise<string>((resolve) => {
                                                const reader = new FileReader();
                                                reader.onload = (event) => resolve(event.target?.result as string);
                                                reader.readAsDataURL(file);
                                            });

                                            if (file.type.startsWith('video/')) {
                                                newVideos.push(dataUrl);
                                            } else {
                                                newImages.push(dataUrl);
                                            }
                                        }

                                        const currentImages = section.galleryImages || [];
                                        const currentVideos = section.galleryVideos || [];
                                        
                                        onUpdate(section.id, {
                                            galleryImages: [...currentImages, ...newImages],
                                            galleryVideos: [...currentVideos, ...newVideos]
                                        });

                                        setUploadingFiles(false);
                                        // Reset input
                                        e.target.value = '';
                                    }}
                                />
                                <button
                                    onClick={() => document.getElementById(`gallery-upload-${section.id}`)?.click()}
                                    disabled={uploadingFiles}
                                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center gap-2 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadingFiles ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            <span>Add Images or Videos</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-white/30 text-center">
                                    Images: max 10MB | Videos: max 50MB
                                </p>
                            </div>
                        )}
                        {!isEditMode && (!section.galleryImages?.length && !section.galleryVideos?.length) && (
                            <div className="text-center py-8 text-white/30">
                                No media in this gallery
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={cn(
                        "prose prose-invert max-w-none",
                        viewMode === 'prose' ? "" : "mb-6"
                    )}>
                        {/* Attached Image Display */}
                        {section.attachedImage && (
                            <div className={cn("mb-4", getSizeClass(section.attachedImage.size))}>
                                <div className={cn(
                                    "relative rounded-lg overflow-hidden border border-white/10 group/image",
                                    getAspectRatioClass(section.attachedImage.aspectRatio)
                                )}>
                                    <div
                                        className="absolute inset-0 overflow-hidden"
                                        style={{
                                            transform: `translate(${section.attachedImage.position.x}px, ${section.attachedImage.position.y}px) scale(${section.attachedImage.position.scale})`,
                                            transformOrigin: 'center center'
                                        }}
                                    >
                                    <img
                                        src={section.attachedImage.url}
                                        alt={section.attachedImage.altText || `${section.title} image`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Caption Display */}
                                {section.attachedImage.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                        <p className="text-sm text-white">{section.attachedImage.caption}</p>
                                    </div>
                                )}
                                {isEditMode && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity">
                                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                                                {(['small', 'medium', 'large'] as const).map((size) => {
                                                    const scaleMap = {
                                                        'small': 0.7,
                                                        'medium': 1.0,
                                                        'large': 1.3
                                                    };
                                                    return (
                                                        <button
                                                            key={size}
                                                            onClick={() => {
                                                                onUpdate(section.id, {
                                                                    attachedImage: {
                                                                        ...section.attachedImage!,
                                                                        size,
                                                                        position: {
                                                                            ...section.attachedImage!.position,
                                                                            scale: scaleMap[size]
                                                                        }
                                                                    }
                                                                });
                                                            }}
                                                            className={cn(
                                                                "p-2 rounded-lg text-xs font-medium transition-colors",
                                                                (section.attachedImage?.size || 'medium') === size
                                                                    ? "bg-primary text-white"
                                                                    : "bg-white/10 hover:bg-white/20 text-white"
                                                            )}
                                                            title={`Set size to ${size}`}
                                                        >
                                                            {size === 'small' && <Minimize2 className="w-3 h-3" />}
                                                            {size === 'medium' && <Maximize2 className="w-3 h-3" />}
                                                            {size === 'large' && <Maximize2 className="w-3 h-3" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex items-center justify-center gap-2 h-full">
                                                <button
                                                    onClick={() => {
                                                        setTempImageUrl(section.attachedImage!.url);
                                                        setCropperOpen(true);
                                                    }}
                                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                    title="Crop/Adjust Image"
                                                >
                                                    <Crop className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onUpdate(section.id, { attachedImage: undefined })}
                                                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                                                    title="Remove Image"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Image Upload Button (only in edit mode) */}
                        {isEditMode && !section.attachedImage && (
                            <div className="mb-4">
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    className="w-full py-3 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center gap-2 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    <span>Attach Image</span>
                                </button>
                            </div>
                        )}

                        {viewMode === 'prose' ? (
                            <InlineEditableText
                                value={section.content}
                                onChange={(val) => onUpdate(section.id, { content: val })}
                                placeholder={`Write content for ${section.title}...`}
                                multiline
                                as="div"
                                className="text-base leading-relaxed text-white/85"
                                renderView={(val) => <MarkdownProse content={val} className="text-white/85 prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-white/90" />}
                            />
                        ) : (
                            <EditableField
                                value={section.content}
                                onSave={(val) => onUpdate(section.id, { content: val })}
                                placeholder={`Write content for ${section.title}...`}
                                multiline
                                isEditModeActive={isEditMode}
                                showAIButton={isEditMode}
                                onAIGenerate={() => onOpenAIModal?.(section.title, (newVal) => onUpdate(section.id, { content: newVal }))}
                                minRows={3}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Add Section Button (only after last section in prose view) */}
            {isEditMode && onAddSectionAfter && isLast && viewMode === 'prose' && (
                <div className="flex items-center justify-center py-4 -mb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-px w-12 bg-white/10" />
                        <div className="flex gap-1">
                            <button
                                onClick={() => onAddSectionAfter('text')}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all group"
                                title="Add Text Section"
                            >
                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={() => onAddSectionAfter('gallery')}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all group"
                                title="Add Gallery Section"
                            >
                                <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                        <div className="h-px w-12 bg-white/10" />
                    </div>
                </div>
            )}

            {/* Gallery Image Generator Modal */}
            {sectionType === 'gallery' && isEditMode && (
                <ImageGeneratorModal
                    isOpen={galleryModalOpen}
                    onClose={() => setGalleryModalOpen(false)}
                    onGenerate={async (prompt, provider) => {
                        if (onGenerateImage) {
                            try {
                                await onGenerateImage(prompt, provider, section.id);
                            } catch (error) {
                                console.error('Failed to generate image:', error);
                            }
                        }
                    }}
                    onUpload={(dataUrl) => {
                        const currentItems = section.galleryItems || [];
                        const newItem = {
                            id: `img-${Date.now()}`,
                            url: dataUrl,
                            type: 'image' as const,
                            order: currentItems.length
                        };
                        onUpdate(section.id, { galleryItems: [...currentItems, newItem] });
                        setGalleryModalOpen(false);
                    }}
                    itemName={section.title}
                />
            )}

            {/* Image Cropper Modal */}
            {tempImageUrl && (
                <ImageCropper
                    imageUrl={tempImageUrl}
                    aspectRatio={section.attachedImage?.aspectRatio || '1:1'}
                    onCrop={handleCrop}
                    onCancel={() => {
                        setCropperOpen(false);
                        setTempImageUrl(null);
                    }}
                    isOpen={cropperOpen}
                />
            )}

            {/* Gallery Management Modal */}
            {sectionType === 'gallery' && (
                <GalleryManagementPane
                    isOpen={galleryManageOpen}
                    onClose={() => {
                        setGalleryManageOpen(false);
                        setEditingItemId(null);
                        setEditingAltText('');
                        setEditingCaption('');
                    }}
                    section={section}
                    onUpdate={onUpdate}
                    onGenerateImage={onGenerateImage}
                />
            )}
        </section>
    );
}

// Gallery Management Pane Component
const GalleryManagementPane = ({
    isOpen,
    onClose,
    section,
    onUpdate,
    onGenerateImage
}: {
    isOpen: boolean;
    onClose: () => void;
    section: CustomSectionData;
    onUpdate: (id: string, updates: Partial<CustomSectionData>) => void;
    onGenerateImage?: (prompt: string, provider: ImageProvider) => Promise<void>;
}) => {
    const [draggedItem, setDraggedItem] = useState<number | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingAltText, setEditingAltText] = useState('');
    const [editingCaption, setEditingCaption] = useState('');
    const [cropperOpen, setCropperOpen] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
    const [croppingItemId, setCroppingItemId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Convert legacy galleryImages/galleryVideos to galleryItems format
    const getGalleryItems = () => {
        if (section.galleryItems && section.galleryItems.length > 0) {
            return [...section.galleryItems].sort((a, b) => a.order - b.order);
        }
        
        const items: Array<{ id: string; url: string; type: 'image' | 'video'; altText?: string; caption?: string; order: number }> = [];
        
        section.galleryImages?.forEach((url, idx) => {
            items.push({
                id: `img-${idx}-${Date.now()}`,
                url,
                type: 'image',
                order: idx
            });
        });
        
        section.galleryVideos?.forEach((url, idx) => {
            items.push({
                id: `vid-${idx}-${Date.now()}`,
                url,
                type: 'video',
                order: (section.galleryImages?.length || 0) + idx
            });
        });
        
        // Auto-migrate if we have legacy data
        if (items.length > 0 && (!section.galleryItems || section.galleryItems.length === 0)) {
            onUpdate(section.id, { galleryItems: items });
        }
        
        return items;
    };

    const galleryItems = getGalleryItems();

    const handleDragStart = (index: number) => {
        setDraggedItem(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;
        
        const newItems = [...galleryItems];
        const dragged = newItems[draggedItem];
        newItems.splice(draggedItem, 1);
        newItems.splice(index, 0, dragged);
        
        // Update order
        const updatedItems = newItems.map((item, idx) => ({ ...item, order: idx }));
        onUpdate(section.id, { galleryItems: updatedItems });
        setDraggedItem(index);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const handleDeleteItem = (itemId: string) => {
        const updatedItems = galleryItems.filter(item => item.id !== itemId).map((item, idx) => ({ ...item, order: idx }));
        onUpdate(section.id, { galleryItems: updatedItems });
    };

    const handleEditItem = (item: typeof galleryItems[0]) => {
        setEditingItemId(item.id);
        setEditingAltText(item.altText || '');
        setEditingCaption(item.caption || '');
    };

    const handleSaveEdit = () => {
        if (editingItemId) {
            const updatedItems = galleryItems.map(item =>
                item.id === editingItemId
                    ? { ...item, altText: editingAltText, caption: editingCaption }
                    : item
            );
            onUpdate(section.id, { galleryItems: updatedItems });
            setEditingItemId(null);
            setEditingAltText('');
            setEditingCaption('');
        }
    };

    const handleCropItem = (itemId: string) => {
        const item = galleryItems.find(i => i.id === itemId);
        if (item) {
            setTempImageUrl(item.url);
            setCroppingItemId(itemId);
            setCropperOpen(true);
        }
    };

    const handleCrop = (croppedDataUrl: string, aspectRatio: string, position: { x: number; y: number; scale: number }) => {
        if (croppingItemId) {
            const updatedItems = galleryItems.map(item =>
                item.id === croppingItemId
                    ? { ...item, url: croppedDataUrl }
                    : item
            );
            onUpdate(section.id, { galleryItems: updatedItems });
        }
        setCropperOpen(false);
        setTempImageUrl(null);
        setCroppingItemId(null);
    };

    const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newItems: typeof galleryItems = [];
        let processed = 0;

        files.forEach((file, idx) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                const isVideo = file.type.startsWith('video/');
                newItems.push({
                    id: `${isVideo ? 'vid' : 'img'}-${Date.now()}-${idx}`,
                    url: dataUrl,
                    type: isVideo ? 'video' : 'image',
                    order: galleryItems.length + processed
                });
                processed++;
                
                if (processed === files.length) {
                    onUpdate(section.id, { galleryItems: [...galleryItems, ...newItems] });
                }
            };
            reader.readAsDataURL(file);
        });
        
        e.target.value = '';
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-[#0A0A0F] rounded-2xl border border-white/20 shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-white">Manage Gallery: {section.title}</h3>
                            <p className="text-sm text-white/50 mt-1">Rearrange, edit, crop, and manage your gallery items</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Upload Area */}
                        <div className="mb-6">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={handleUploadFiles}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-4 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center gap-2 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
                            >
                                <UploadIcon className="w-5 h-5" />
                                <span>Upload Images or Videos</span>
                            </button>
                        </div>

                        {/* Gallery Grid */}
                        {galleryItems.length === 0 ? (
                            <div className="text-center py-12 text-white/40">
                                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No items in this gallery. Upload some images or videos to get started.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {galleryItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={cn(
                                            "relative group rounded-lg overflow-hidden border-2 border-white/10 bg-black/40",
                                            draggedItem === index && "opacity-50",
                                            editingItemId === item.id && "border-primary ring-2 ring-primary/50"
                                        )}
                                    >
                                        {/* Media Preview */}
                                        <div className="aspect-square relative">
                                            {item.type === 'image' ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.altText || `Gallery item ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <video
                                                    src={item.url}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                />
                                            )}
                                            
                                            {/* Drag Handle */}
                                            <div className="absolute top-2 left-2 p-1.5 rounded bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                                                <GripVertical className="w-4 h-4 text-white" />
                                            </div>

                                            {/* Actions Overlay */}
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditItem(item)}
                                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                    title="Edit Alt Text & Caption"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {item.type === 'image' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                const input = document.createElement('input');
                                                                input.type = 'file';
                                                                input.accept = 'image/*';
                                                                input.onchange = (e: Event) => {
                                                                    const file = (e.target as HTMLInputElement).files?.[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onload = (event) => {
                                                                            const dataUrl = event.target?.result as string;
                                                                            const updatedItems = galleryItems.map(i =>
                                                                                i.id === item.id
                                                                                    ? { ...i, url: dataUrl }
                                                                                    : i
                                                                            );
                                                                            onUpdate(section.id, { galleryItems: updatedItems });
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                };
                                                                input.click();
                                                            }}
                                                            className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                                                            title="Change Image"
                                                        >
                                                            <ImageIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCropItem(item.id)}
                                                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                            title="Crop Image"
                                                        >
                                                            <Crop className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Edit Form */}
                                        {editingItemId === item.id && (
                                            <div className="p-3 bg-black/60 border-t border-white/10">
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="text-xs text-white/60 mb-1 block">Alt Text</label>
                                                        <input
                                                            type="text"
                                                            value={editingAltText}
                                                            onChange={(e) => setEditingAltText(e.target.value)}
                                                            className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                                                            placeholder="Describe the image..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-white/60 mb-1 block">Caption</label>
                                                        <textarea
                                                            value={editingCaption}
                                                            onChange={(e) => setEditingCaption(e.target.value)}
                                                            className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 resize-none"
                                                            placeholder="Add a caption..."
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="flex-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded text-sm transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <Save className="w-3.5 h-3.5" />
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingItemId(null);
                                                                setEditingAltText('');
                                                                setEditingCaption('');
                                                            }}
                                                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-sm transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Caption Preview */}
                                        {!editingItemId && item.caption && (
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-xs text-white line-clamp-2">{item.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 flex items-center justify-between">
                        <div className="text-sm text-white/50">
                            {galleryItems.length} item{galleryItems.length !== 1 ? 's' : ''} in gallery
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Cropper for Gallery Items */}
            {tempImageUrl && (
                <ImageCropper
                    imageUrl={tempImageUrl}
                    aspectRatio="1:1"
                    onCrop={handleCrop}
                    onCancel={() => {
                        setCropperOpen(false);
                        setTempImageUrl(null);
                        setCroppingItemId(null);
                    }}
                    isOpen={cropperOpen}
                />
            )}
        </>
    );
};
