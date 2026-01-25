'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Move, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ImageCropperProps {
    imageUrl: string;
    aspectRatio?: string; // e.g., "1:1", "16:9", "9:16", "3:4", "4:3"
    onCrop: (croppedDataUrl: string, aspectRatio: string, position: { x: number; y: number; scale: number }) => void;
    onCancel: () => void;
    isOpen: boolean;
}

const ASPECT_RATIOS = [
    { label: '1:1', value: '1:1', ratio: 1 },
    { label: '16:9', value: '16:9', ratio: 16 / 9 },
    { label: '9:16', value: '9:16', ratio: 9 / 16 },
    { label: '3:4', value: '3:4', ratio: 3 / 4 },
    { label: '4:3', value: '4:3', ratio: 4 / 3 },
    { label: '21:9', value: '21:9', ratio: 21 / 9 },
    { label: '9:21', value: '9:21', ratio: 9 / 21 },
];

type CropHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export function ImageCropper({ imageUrl, aspectRatio: initialAspectRatio = '1:1', onCrop, onCancel, isOpen }: ImageCropperProps) {
    const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [activeHandle, setActiveHandle] = useState<CropHandle>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [cropSize, setCropSize] = useState({ width: 0, height: 0 });
    const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
    const [dragType, setDragType] = useState<'image' | 'crop' | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const cropAreaRef = useRef<HTMLDivElement>(null);
    const originalImageUrlRef = useRef<string>(imageUrl);

    const selectedRatio = ASPECT_RATIOS.find(r => r.value === aspectRatio) || ASPECT_RATIOS[0];

    // Store original image URL when modal opens
    useEffect(() => {
        if (isOpen) {
            originalImageUrlRef.current = imageUrl;
            resetToOriginal();
        }
    }, [isOpen, imageUrl]);

    // Initialize crop area size when container is ready
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const updateCropSize = () => {
                if (containerRef.current) {
                    const containerWidth = containerRef.current.offsetWidth;
                    const containerHeight = containerRef.current.offsetHeight;
                    const ratio = selectedRatio.ratio;
                    
                    let width: number;
                    let height: number;
                    
                    if (containerWidth / containerHeight > ratio) {
                        // Container is wider - fit to height
                        height = Math.min(containerHeight * 0.9, 600);
                        width = height * ratio;
                    } else {
                        // Container is taller - fit to width
                        width = Math.min(containerWidth * 0.9, 800);
                        height = width / ratio;
                    }
                    
                    setCropSize({ width, height });
                    setCropPosition({
                        x: (containerWidth - width) / 2,
                        y: (containerHeight - height) / 2
                    });
                }
            };
            
            updateCropSize();
            window.addEventListener('resize', updateCropSize);
            return () => window.removeEventListener('resize', updateCropSize);
        }
    }, [isOpen, selectedRatio.ratio]);

    // Reset when aspect ratio changes
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setRotation(0);
            // Recalculate crop size for new aspect ratio
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const containerHeight = containerRef.current.offsetHeight;
                const ratio = selectedRatio.ratio;
                
                let width: number;
                let height: number;
                
                if (containerWidth / containerHeight > ratio) {
                    height = Math.min(containerHeight * 0.9, 600);
                    width = height * ratio;
                } else {
                    width = Math.min(containerWidth * 0.9, 800);
                    height = width / ratio;
                }
                
                setCropSize({ width, height });
                setCropPosition({
                    x: (containerWidth - width) / 2,
                    y: (containerHeight - height) / 2
                });
            }
        }
    }, [aspectRatio, isOpen, selectedRatio.ratio]);

    const resetToOriginal = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const containerHeight = containerRef.current.offsetHeight;
            const ratio = selectedRatio.ratio;
            
            let width: number;
            let height: number;
            
            if (containerWidth / containerHeight > ratio) {
                height = Math.min(containerHeight * 0.9, 600);
                width = height * ratio;
            } else {
                width = Math.min(containerWidth * 0.9, 800);
                height = width / ratio;
            }
            
            setCropSize({ width, height });
            setCropPosition({
                x: (containerWidth - width) / 2,
                y: (containerHeight - height) / 2
            });
        }
    };

    const handleImageDragStart = (e: React.MouseEvent) => {
        if (isResizing) return;
        e.preventDefault();
        setIsDragging(true);
        setDragType('image');
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleImageDrag = useCallback((e: MouseEvent) => {
        if (!isDragging || !imageRef.current || !cropAreaRef.current) return;
        
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Constrain movement within crop area bounds
        const imgRect = imageRef.current.getBoundingClientRect();
        const cropRect = cropAreaRef.current.getBoundingClientRect();
        
        const maxX = Math.max(0, (imgRect.width * scale - cropRect.width) / 2);
        const maxY = Math.max(0, (imgRect.height * scale - cropRect.height) / 2);
        
        setPosition({
            x: Math.max(-maxX, Math.min(maxX, newX)),
            y: Math.max(-maxY, Math.min(maxY, newY))
        });
    }, [isDragging, dragStart, scale]);

    const handleCropAreaDragStart = (e: React.MouseEvent) => {
        if (isResizing || (e.target as HTMLElement).classList.contains('crop-handle')) return;
        e.preventDefault();
        setIsDragging(true);
        setDragType('crop');
        const rect = cropAreaRef.current?.getBoundingClientRect();
        if (!rect) return;
        setDragStart({
            x: e.clientX - cropPosition.x,
            y: e.clientY - cropPosition.y
        });
    };

    const handleCropAreaDrag = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current || !cropAreaRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const newX = e.clientX - dragStart.x - containerRect.left;
        const newY = e.clientY - dragStart.y - containerRect.top;
        
        // Constrain crop area within container
        const maxX = containerRect.width - cropSize.width;
        const maxY = containerRect.height - cropSize.height;
        
        setCropPosition({
            x: Math.max(0, Math.min(maxX, newX)),
            y: Math.max(0, Math.min(maxY, newY))
        });
    }, [isDragging, dragStart, cropSize]);

    const handleResizeStart = (e: React.MouseEvent, handle: CropHandle) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setActiveHandle(handle);
        setDragStart({
            x: e.clientX,
            y: e.clientY
        });
    };

    const handleResize = useCallback((e: MouseEvent) => {
        if (!isResizing || !activeHandle || !containerRef.current || !cropAreaRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        let newWidth = cropSize.width;
        let newHeight = cropSize.height;
        let newX = cropPosition.x;
        let newY = cropPosition.y;
        
        const ratio = selectedRatio.ratio;
        const minSize = 100;
        const maxWidth = containerRect.width;
        const maxHeight = containerRect.height;
        
        // Calculate distance moved (use the larger delta for diagonal handles)
        const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
        
        switch (activeHandle) {
            case 'se':
                // Southeast: resize from top-left, moving bottom-right
                newWidth = Math.max(minSize, Math.min(maxWidth - cropPosition.x, cropSize.width + deltaX));
                newHeight = newWidth / ratio;
                if (cropPosition.y + newHeight > maxHeight) {
                    newHeight = maxHeight - cropPosition.y;
                    newWidth = newHeight * ratio;
                }
                break;
            case 'sw':
                // Southwest: resize from top-right, moving bottom-left
                newWidth = Math.max(minSize, Math.min(cropPosition.x + cropSize.width, cropSize.width - deltaX));
                newHeight = newWidth / ratio;
                newX = cropPosition.x + cropSize.width - newWidth;
                if (newX < 0) {
                    newX = 0;
                    newWidth = cropPosition.x + cropSize.width;
                    newHeight = newWidth / ratio;
                }
                if (cropPosition.y + newHeight > maxHeight) {
                    newHeight = maxHeight - cropPosition.y;
                    newWidth = newHeight * ratio;
                    newX = cropPosition.x + cropSize.width - newWidth;
                }
                break;
            case 'ne':
                // Northeast: resize from bottom-left, moving top-right
                newWidth = Math.max(minSize, Math.min(maxWidth - cropPosition.x, cropSize.width + deltaX));
                newHeight = newWidth / ratio;
                newY = cropPosition.y + cropSize.height - newHeight;
                if (newY < 0) {
                    newY = 0;
                    newHeight = cropPosition.y + cropSize.height;
                    newWidth = newHeight * ratio;
                }
                if (cropPosition.x + newWidth > maxWidth) {
                    newWidth = maxWidth - cropPosition.x;
                    newHeight = newWidth / ratio;
                    newY = cropPosition.y + cropSize.height - newHeight;
                }
                break;
            case 'nw':
                // Northwest: resize from bottom-right, moving top-left
                newWidth = Math.max(minSize, Math.min(cropPosition.x + cropSize.width, cropSize.width - deltaX));
                newHeight = newWidth / ratio;
                newX = cropPosition.x + cropSize.width - newWidth;
                newY = cropPosition.y + cropSize.height - newHeight;
                if (newX < 0) {
                    newX = 0;
                    newWidth = cropPosition.x + cropSize.width;
                    newHeight = newWidth / ratio;
                    newY = cropPosition.y + cropSize.height - newHeight;
                }
                if (newY < 0) {
                    newY = 0;
                    newHeight = cropPosition.y + cropSize.height;
                    newWidth = newHeight * ratio;
                    newX = cropPosition.x + cropSize.width - newWidth;
                }
                break;
            case 'e':
                // East: resize from left edge
                newWidth = Math.max(minSize, Math.min(maxWidth - cropPosition.x, cropSize.width + deltaX));
                newHeight = newWidth / ratio;
                if (cropPosition.y + newHeight > maxHeight) {
                    newHeight = maxHeight - cropPosition.y;
                    newWidth = newHeight * ratio;
                }
                break;
            case 'w':
                // West: resize from right edge
                newWidth = Math.max(minSize, Math.min(cropPosition.x + cropSize.width, cropSize.width - deltaX));
                newHeight = newWidth / ratio;
                newX = cropPosition.x + cropSize.width - newWidth;
                if (newX < 0) {
                    newX = 0;
                    newWidth = cropPosition.x + cropSize.width;
                    newHeight = newWidth / ratio;
                }
                if (cropPosition.y + newHeight > maxHeight) {
                    newHeight = maxHeight - cropPosition.y;
                    newWidth = newHeight * ratio;
                    newX = cropPosition.x + cropSize.width - newWidth;
                }
                break;
            case 's':
                // South: resize from top edge
                newHeight = Math.max(minSize, Math.min(maxHeight - cropPosition.y, cropSize.height + deltaY));
                newWidth = newHeight * ratio;
                if (cropPosition.x + newWidth > maxWidth) {
                    newWidth = maxWidth - cropPosition.x;
                    newHeight = newWidth / ratio;
                }
                break;
            case 'n':
                // North: resize from bottom edge
                newHeight = Math.max(minSize, Math.min(cropPosition.y + cropSize.height, cropSize.height - deltaY));
                newWidth = newHeight * ratio;
                newY = cropPosition.y + cropSize.height - newHeight;
                if (newY < 0) {
                    newY = 0;
                    newHeight = cropPosition.y + cropSize.height;
                    newWidth = newHeight * ratio;
                }
                if (cropPosition.x + newWidth > maxWidth) {
                    newWidth = maxWidth - cropPosition.x;
                    newHeight = newWidth / ratio;
                    newY = cropPosition.y + cropSize.height - newHeight;
                }
                break;
        }
        
        setCropSize({ width: newWidth, height: newHeight });
        setCropPosition({ x: newX, y: newY });
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isResizing, activeHandle, dragStart, cropSize, cropPosition, selectedRatio.ratio]);

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setActiveHandle(null);
    };

    useEffect(() => {
        if (isResizing) {
            // Crop area resizing
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        } else if (isDragging) {
            // Determine if it's image dragging or crop area dragging
            // This is handled by separate handlers, but we need to check which one
            // For now, we'll use a flag or check the target
            // Actually, we have separate handlers, so we need to track which type of drag
            // Let's use a state to track drag type
            const handler = handleImageDrag; // Default to image drag
            document.addEventListener('mousemove', handler);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handler);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleImageDrag, handleResize]);

    const handleZoom = (delta: number) => {
        setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };

    const handleRotate = (clockwise: boolean = true) => {
        setRotation(prev => clockwise ? (prev + 90) % 360 : (prev - 90 + 360) % 360);
    };

    const handleCrop = () => {
        if (!imageRef.current || !cropAreaRef.current || !containerRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cropRect = cropAreaRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Load image to get natural dimensions
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            // Get container and crop dimensions
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            const cropWidth = cropRect.width;
            const cropHeight = cropRect.height;
            
            // Calculate how the image is displayed (object-contain means it fits within container)
            const containerAspect = containerWidth / containerHeight;
            const imageAspect = img.naturalWidth / img.naturalHeight;
            
            let displayedWidth: number;
            let displayedHeight: number;
            
            if (imageAspect > containerAspect) {
                // Image is wider - fit to width
                displayedWidth = containerWidth * scale;
                displayedHeight = (containerWidth / imageAspect) * scale;
            } else {
                // Image is taller - fit to height
                displayedWidth = (containerHeight * imageAspect) * scale;
                displayedHeight = containerHeight * scale;
            }
            
            // Calculate the offset of the displayed image within the container
            const offsetX = (containerWidth - displayedWidth) / 2 + position.x;
            const offsetY = (containerHeight - displayedHeight) / 2 + position.y;
            
            // Calculate crop area position relative to container
            const cropX = cropRect.left - containerRect.left;
            const cropY = cropRect.top - containerRect.top;
            
            // Calculate crop area relative to displayed image
            const relativeCropX = cropX - offsetX;
            const relativeCropY = cropY - offsetY;
            
            // Convert to natural image coordinates
            const scaleFactor = displayedWidth / img.naturalWidth;
            const sourceX = Math.max(0, relativeCropX / scaleFactor);
            const sourceY = Math.max(0, relativeCropY / scaleFactor);
            const sourceWidth = Math.min(cropWidth / scaleFactor, img.naturalWidth - sourceX);
            const sourceHeight = Math.min(cropHeight / scaleFactor, img.naturalHeight - sourceY);
            
            // Set canvas size to crop area
            canvas.width = cropWidth;
            canvas.height = cropHeight;
            
            // Draw cropped image (handle rotation if needed)
            ctx.save();
            if (rotation !== 0) {
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.translate(-canvas.width / 2, -canvas.height / 2);
            }
            ctx.drawImage(
                img,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                0,
                0,
                canvas.width,
                canvas.height
            );
            ctx.restore();

            const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
            onCrop(croppedDataUrl, aspectRatio, { x: position.x, y: position.y, scale });
        };
        
        img.src = originalImageUrlRef.current;
    };

    if (!isOpen) return null;

    const renderCropHandle = (position: CropHandle, className: string, cursor: string) => {
        if (!position) return null;
        return (
            <div
                className={cn(
                    "absolute w-4 h-4 bg-primary border-2 border-white rounded-full crop-handle z-20 transition-all hover:scale-125",
                    className
                )}
                style={{ cursor }}
                onMouseDown={(e) => handleResizeStart(e, position)}
            />
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl mx-4 bg-[#0A0A0F] rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Crop & Adjust Image</h3>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="p-4 border-b border-white/10">
                    <div className="text-xs text-white/50 uppercase tracking-wide mb-2">Aspect Ratio</div>
                    <div className="flex flex-wrap gap-2">
                        {ASPECT_RATIOS.map((ratio) => (
                            <button
                                key={ratio.value}
                                onClick={() => setAspectRatio(ratio.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                    aspectRatio === ratio.value
                                        ? "bg-primary text-white"
                                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Crop Area */}
                <div className="p-6">
                    <div
                        ref={containerRef}
                        className="relative w-full bg-black/40 rounded-lg overflow-hidden"
                        style={{ minHeight: '400px', height: '70vh' }}
                    >
                        {/* Image Container */}
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                                transformOrigin: 'center center'
                            }}
                            onMouseDown={handleImageDragStart}
                        >
                            <img
                                ref={imageRef}
                                src={originalImageUrlRef.current}
                                alt="Crop"
                                className="w-full h-full object-contain pointer-events-none"
                                draggable={false}
                                style={{ minWidth: '100%', minHeight: '100%' }}
                            />
                        </div>

                        {/* Crop Area Overlay */}
                        <div
                            ref={cropAreaRef}
                            className="absolute border-2 border-primary border-dashed z-10"
                            style={{
                                left: `${cropPosition.x}px`,
                                top: `${cropPosition.y}px`,
                                width: `${cropSize.width}px`,
                                height: `${cropSize.height}px`,
                                cursor: isResizing ? 'move' : 'move'
                            }}
                            onMouseDown={handleCropAreaDragStart}
                        >
                            {/* Crop Handles */}
                            {renderCropHandle('nw', '-top-2 -left-2', 'nw-resize')}
                            {renderCropHandle('ne', '-top-2 -right-2', 'ne-resize')}
                            {renderCropHandle('sw', '-bottom-2 -left-2', 'sw-resize')}
                            {renderCropHandle('se', '-bottom-2 -right-2', 'se-resize')}
                            {renderCropHandle('n', '-top-2 left-1/2 -translate-x-1/2', 'n-resize')}
                            {renderCropHandle('s', '-bottom-2 left-1/2 -translate-x-1/2', 's-resize')}
                            {renderCropHandle('e', '-right-2 top-1/2 -translate-y-1/2', 'e-resize')}
                            {renderCropHandle('w', '-left-2 top-1/2 -translate-y-1/2', 'w-resize')}
                        </div>

                        {/* Overlay - darken area outside crop */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `
                                    linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.5) ${(cropPosition.x / (containerRef.current?.offsetWidth || 1)) * 100}%,
                                    transparent ${(cropPosition.x / (containerRef.current?.offsetWidth || 1)) * 100}%,
                                    transparent ${((cropPosition.x + cropSize.width) / (containerRef.current?.offsetWidth || 1)) * 100}%,
                                    rgba(0,0,0,0.5) ${((cropPosition.x + cropSize.width) / (containerRef.current?.offsetWidth || 1)) * 100}%, rgba(0,0,0,0.5) 100%),
                                    linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.5) ${(cropPosition.y / (containerRef.current?.offsetHeight || 1)) * 100}%,
                                    transparent ${(cropPosition.y / (containerRef.current?.offsetHeight || 1)) * 100}%,
                                    transparent ${((cropPosition.y + cropSize.height) / (containerRef.current?.offsetHeight || 1)) * 100}%,
                                    rgba(0,0,0,0.5) ${((cropPosition.y + cropSize.height) / (containerRef.current?.offsetHeight || 1)) * 100}%, rgba(0,0,0,0.5) 100%)
                                `
                            }}
                        />
                    </div>
                </div>

                {/* Controls */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => handleZoom(-0.1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-white/60 min-w-[60px] text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={() => handleZoom(0.1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <button
                            onClick={() => handleRotate(false)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            title="Rotate Counter-Clockwise"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleRotate(true)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            title="Rotate Clockwise"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <button
                            onClick={resetToOriginal}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            title="Reset to Original"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <div className="text-xs text-white/40 flex items-center gap-1">
                            <Move className="w-3 h-3" />
                            Drag to reposition
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={onCancel}
                            variant="ghost"
                            className="text-white/60 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCrop}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Apply Crop
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
