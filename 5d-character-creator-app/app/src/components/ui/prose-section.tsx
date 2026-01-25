'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { InlineEditableText } from './inline-editable-text';
import { MarkdownProse } from './markdown-prose';
import { Wand2, Image as ImageIcon, X, Crop, Settings2, Maximize2, Minimize2 } from 'lucide-react';
import { ImageCropper } from './image-cropper';

interface AttachedImage {
    url: string;
    aspectRatio: string;
    position: { x: number; y: number; scale: number };
    size?: 'small' | 'medium' | 'large';
    name?: string;
    altText?: string;
    caption?: string;
}

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
    attachedImage?: AttachedImage;
    onImageChange?: (image: AttachedImage | null) => void;
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
    onRejectSuggestion,
    attachedImage,
    onImageChange
}: ProseSectionProps) {
    const [cropperOpen, setCropperOpen] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
    const [imageManagerOpen, setImageManagerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (onImageChange) {
            onImageChange({ 
                url: croppedDataUrl, 
                aspectRatio, 
                position,
                size: attachedImage?.size || 'medium',
                name: attachedImage?.name,
                altText: attachedImage?.altText,
                caption: attachedImage?.caption
            });
        }
        setCropperOpen(false);
        setTempImageUrl(null);
    };

    const getSizeClass = (size: 'small' | 'medium' | 'large' = 'medium') => {
        const sizes: Record<string, string> = {
            'small': 'max-w-xs mx-auto',
            'medium': 'max-w-2xl mx-auto',
            'large': 'max-w-4xl mx-auto',
        };
        return sizes[size] || sizes['medium'];
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
                    <div className="flex items-center gap-2">
                        {onImageChange && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                {attachedImage ? (
                                    <button
                                        onClick={() => setImageManagerOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                                bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10
                                                transition-all hover:scale-105"
                                        title="Manage Image"
                                    >
                                        <Settings2 className="w-3.5 h-3.5" />
                                        Manage Image
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                                bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10
                                                transition-all hover:scale-105"
                                        title="Attach Image"
                                    >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        Image
                                    </button>
                                )}
                            </>
                        )}
                        {onAiGenerate && (
                            <button
                                onClick={onAiGenerate}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                        bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20
                                        transition-all hover:scale-105"
                                title={`Generate ${title} with AI`}
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                                Generate
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Attached Image Display - Only in edit mode */}
            {!readOnly && attachedImage && (
                <div className={cn("mb-4", getSizeClass(attachedImage.size))}>
                    <div className={cn(
                        "relative rounded-lg overflow-hidden border border-white/10 group/image",
                        getAspectRatioClass(attachedImage.aspectRatio)
                    )}>
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                                transform: `translate(${attachedImage.position.x}px, ${attachedImage.position.y}px) scale(${attachedImage.position.scale})`,
                                transformOrigin: 'center center'
                            }}
                        >
                            <img
                                src={attachedImage.url}
                                alt={attachedImage.altText || `${title} image`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Caption Display */}
                        {attachedImage.caption && (
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                <p className="text-sm text-white">{attachedImage.caption}</p>
                            </div>
                        )}
                        {onImageChange && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => {
                                        setTempImageUrl(attachedImage.url);
                                        setCropperOpen(true);
                                    }}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    title="Crop/Adjust Image"
                                >
                                    <Crop className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onImageChange(null)}
                                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                                    title="Remove Image"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {readOnly ? (
                <div className="prose-primary">
                    <h2 className="text-2xl font-bold text-white mb-4 font-serif tracking-wide">{title}</h2>
                    {/* Image with caption in reading view */}
                    {attachedImage && (
                        <div className={cn("mb-6", getSizeClass(attachedImage.size))}>
                            <div className={cn(
                                "relative rounded-lg overflow-hidden border border-white/10",
                                getAspectRatioClass(attachedImage.aspectRatio)
                            )}>
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{
                                        transform: `translate(${attachedImage.position.x}px, ${attachedImage.position.y}px) scale(${attachedImage.position.scale})`,
                                        transformOrigin: 'center center'
                                    }}
                                >
                                    <img
                                        src={attachedImage.url}
                                        alt={attachedImage.altText || `${title} image`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {attachedImage.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 to-transparent">
                                        <p className="text-base text-white font-serif">{attachedImage.caption}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <MarkdownProse
                        content={content || '*No content.*'}
                        className="text-lg leading-relaxed text-white/90 font-serif"
                        hideMentionSymbol={true}
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

            {/* Image Cropper Modal */}
            {tempImageUrl && (
                <ImageCropper
                    imageUrl={tempImageUrl}
                    aspectRatio={attachedImage?.aspectRatio || '1:1'}
                    onCrop={handleCrop}
                    onCancel={() => {
                        setCropperOpen(false);
                        setTempImageUrl(null);
                    }}
                    isOpen={cropperOpen}
                />
            )}

            {/* Image Manager Modal */}
            {imageManagerOpen && attachedImage && onImageChange && (
                <SectionImageManager
                    isOpen={imageManagerOpen}
                    onClose={() => setImageManagerOpen(false)}
                    attachedImage={attachedImage}
                    onImageChange={onImageChange}
                    onCropRequest={(imageUrl) => {
                        setTempImageUrl(imageUrl);
                        setCropperOpen(true);
                        setImageManagerOpen(false);
                    }}
                    onUploadRequest={() => {
                        fileInputRef.current?.click();
                        setImageManagerOpen(false);
                    }}
                />
            )}
        </section>
    );
}

// Section Image Manager Component
interface SectionImageManagerProps {
    isOpen: boolean;
    onClose: () => void;
    attachedImage: AttachedImage;
    onImageChange: (image: AttachedImage | null) => void;
    onCropRequest: (imageUrl: string) => void;
    onUploadRequest: () => void;
}

const SectionImageManager = ({
    isOpen,
    onClose,
    attachedImage,
    onImageChange,
    onCropRequest,
    onUploadRequest
}: SectionImageManagerProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div 
                className="relative w-full max-w-lg bg-[#0A0A0F] rounded-2xl border border-white/20 shadow-2xl flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-lg font-semibold text-white">Manage Section Image</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className={cn(
                        "relative mb-4 rounded-lg overflow-hidden border border-white/10 max-h-[300px]",
                        attachedImage.aspectRatio === '1:1' ? 'aspect-square' :
                        attachedImage.aspectRatio === '16:9' ? 'aspect-video' :
                        attachedImage.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                        attachedImage.aspectRatio === '3:4' ? 'aspect-[3/4]' :
                        attachedImage.aspectRatio === '4:3' ? 'aspect-[4/3]' :
                        attachedImage.aspectRatio === '21:9' ? 'aspect-[21/9]' :
                        attachedImage.aspectRatio === '9:21' ? 'aspect-[9/21]' :
                        'aspect-video'
                    )}>
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                                transform: `translate(${attachedImage.position.x}px, ${attachedImage.position.y}px) scale(${attachedImage.position.scale})`,
                                transformOrigin: 'center center'
                            }}
                        >
                            <img
                                src={attachedImage.url}
                                alt="Section image"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Image Info */}
                    <div className="space-y-2 text-sm text-white/60 mb-6">
                        <div>Aspect Ratio: <span className="text-white">{attachedImage.aspectRatio}</span></div>
                        <div>Position: <span className="text-white">X: {attachedImage.position.x.toFixed(0)}, Y: {attachedImage.position.y.toFixed(0)}</span></div>
                        <div>Scale: <span className="text-white">{(attachedImage.position.scale * 100).toFixed(0)}%</span></div>
                        <div>Size: <span className="text-white capitalize">{attachedImage.size || 'medium'}</span></div>
                    </div>

                    {/* Image Name */}
                    <div className="mb-4">
                        <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">Image Name</label>
                        <input
                            type="text"
                            value={attachedImage.name || ''}
                            onChange={(e) => {
                                onImageChange({
                                    ...attachedImage,
                                    name: e.target.value
                                });
                            }}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                            placeholder="Enter image name..."
                        />
                    </div>

                    {/* Alt Text */}
                    <div className="mb-4">
                        <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">Alt Text</label>
                        <input
                            type="text"
                            value={attachedImage.altText || ''}
                            onChange={(e) => {
                                onImageChange({
                                    ...attachedImage,
                                    altText: e.target.value
                                });
                            }}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                            placeholder="Describe the image for accessibility..."
                        />
                    </div>

                    {/* Caption */}
                    <div className="mb-4">
                        <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">Caption</label>
                        <textarea
                            value={attachedImage.caption || ''}
                            onChange={(e) => {
                                onImageChange({
                                    ...attachedImage,
                                    caption: e.target.value
                                });
                            }}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 resize-none"
                            placeholder="Add a caption (will display in reading view)..."
                            rows={3}
                        />
                    </div>

                    {/* Size Options */}
                    <div className="mb-6">
                        <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">Display Size</label>
                        <div className="flex gap-2">
                            {(['small', 'medium', 'large'] as const).map((size) => {
                                // Calculate scale based on size
                                const scaleMap = {
                                    'small': 0.7,
                                    'medium': 1.0,
                                    'large': 1.3
                                };
                                return (
                                    <button
                                        key={size}
                                        onClick={() => {
                                            onImageChange({
                                                ...attachedImage,
                                                size,
                                                position: {
                                                    ...attachedImage.position,
                                                    scale: scaleMap[size]
                                                }
                                            });
                                        }}
                                        className={cn(
                                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                                            (attachedImage.size || 'medium') === size
                                                ? "bg-primary text-white"
                                                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {size === 'small' && <Minimize2 className="w-4 h-4" />}
                                        {size === 'medium' && <Maximize2 className="w-4 h-4" />}
                                        {size === 'large' && <Maximize2 className="w-4 h-4" />}
                                        <span className="capitalize">{size}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => {
                                onCropRequest(attachedImage.url);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                        >
                            <Crop className="w-4 h-4" />
                            Crop & Adjust
                        </button>
                        <button
                            onClick={onUploadRequest}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                        >
                            <ImageIcon className="w-4 h-4" />
                            Change Image
                        </button>
                        <button
                            onClick={() => {
                                onImageChange(null);
                                onClose();
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Remove Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
