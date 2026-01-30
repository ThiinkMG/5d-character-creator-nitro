'use client';

/**
 * AssetPicker Component
 * 
 * Allows searching and selecting from existing assets (user-uploaded and generated)
 * for attaching to chat sessions
 */

import React, { useState, useMemo } from 'react';
import { Search, X, Image as ImageIcon, FileText, Video, Check, Grid3x3, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { UserAsset } from '@/types/user-asset';
import { Button } from '@/components/ui/button';

type MediaItem = {
    id: string;
    url: string;
    type: 'image' | 'video' | 'document';
    name?: string;
    altText?: string;
    caption?: string;
    sourceType: 'character' | 'world' | 'project';
    sourceId: string;
    sourceName: string;
    location: string;
    uploadedAt?: Date;
    documentType?: string;
    documentContent?: string;
    documentLink?: string;
    /** Original base64 dataUrl - preserved for user assets to avoid re-fetching */
    originalDataUrl?: string;
};

type FilterOption = 'all' | 'images' | 'videos' | 'documents' | 'user-uploaded' | 'generated';
type ViewMode = 'grid' | 'list';

interface AssetPickerProps {
    onSelect: (assets: UserAsset[]) => void;
    onCancel: () => void;
    selectedAssetIds?: Set<string>;
    maxSelections?: number;
}

export function AssetPicker({ onSelect, onCancel, selectedAssetIds = new Set(), maxSelections }: AssetPickerProps) {
    const { 
        characters, 
        worlds, 
        projects, 
        characterDocuments, 
        projectDocuments, 
        getUserAssets
    } = useStore();
    
    const userAssets = getUserAssets();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(selectedAssetIds));
    const [converting, setConverting] = useState(false);

    // Collect all media items (same logic as Media page)
    const allMediaItems = useMemo(() => {
        const items: MediaItem[] = [];

        // Characters
        characters.forEach((character) => {
            if (character.imageUrl) {
                items.push({
                    id: `char-${character.id}-header`,
                    url: character.imageUrl,
                    type: 'image',
                    name: `${character.name} - Header`,
                    sourceType: 'character',
                    sourceId: character.id,
                    sourceName: character.name,
                    location: 'Header',
                    uploadedAt: character.updatedAt instanceof Date ? character.updatedAt : new Date(character.updatedAt)
                });
            }
            if (character.infoboxImageUrl && character.infoboxImageUrl !== 'null') {
                items.push({
                    id: `char-${character.id}-infobox`,
                    url: character.infoboxImageUrl,
                    type: 'image',
                    name: `${character.name} - Infobox`,
                    sourceType: 'character',
                    sourceId: character.id,
                    sourceName: character.name,
                    location: 'Infobox',
                    uploadedAt: character.updatedAt instanceof Date ? character.updatedAt : new Date(character.updatedAt)
                });
            }
            if (character.proseImages) {
                Object.entries(character.proseImages).forEach(([section, image]) => {
                    if (image?.url) {
                        items.push({
                            id: `char-${character.id}-prose-${section}`,
                            url: image.url,
                            type: 'image',
                            name: image.name || `${character.name} - ${section.charAt(0).toUpperCase() + section.slice(1)}`,
                            altText: image.altText,
                            caption: image.caption,
                            sourceType: 'character',
                            sourceId: character.id,
                            sourceName: character.name,
                            location: `${section.charAt(0).toUpperCase() + section.slice(1)} Section`,
                            uploadedAt: character.updatedAt instanceof Date ? character.updatedAt : new Date(character.updatedAt)
                        });
                    }
                });
            }
            character.customSections?.forEach((section) => {
                if (section.attachedImage?.url) {
                    items.push({
                        id: `char-${character.id}-custom-${section.id}-attached`,
                        url: section.attachedImage.url,
                        type: 'image',
                        name: section.attachedImage.name || `${character.name} - ${section.title}`,
                        altText: section.attachedImage.altText,
                        caption: section.attachedImage.caption,
                        sourceType: 'character',
                        sourceId: character.id,
                        sourceName: character.name,
                        location: `${section.title} Section`,
                        uploadedAt: character.updatedAt instanceof Date ? character.updatedAt : new Date(character.updatedAt)
                    });
                }
                if (section.galleryItems) {
                    section.galleryItems.forEach((item) => {
                        items.push({
                            id: `char-${character.id}-gallery-${item.id}`,
                            url: item.url,
                            type: item.type,
                            name: item.caption || `${character.name} - ${section.title} Gallery`,
                            altText: item.altText,
                            caption: item.caption,
                            sourceType: 'character',
                            sourceId: character.id,
                            sourceName: character.name,
                            location: `${section.title} Gallery`,
                            uploadedAt: character.updatedAt instanceof Date ? character.updatedAt : new Date(character.updatedAt)
                        });
                    });
                }
            });
        });

        // Worlds
        worlds.forEach((world) => {
            if (world.imageUrl) {
                items.push({
                    id: `world-${world.id}-header`,
                    url: world.imageUrl,
                    type: 'image',
                    name: `${world.name} - Header`,
                    sourceType: 'world',
                    sourceId: world.id,
                    sourceName: world.name,
                    location: 'Header',
                    uploadedAt: world.updatedAt instanceof Date ? world.updatedAt : new Date(world.updatedAt)
                });
            }
        });

        // Character Documents
        characterDocuments.forEach((doc) => {
            const character = characters.find(c => c.id === doc.characterId);
            items.push({
                id: `doc-char-${doc.id}`,
                url: doc.thumbnail || doc.image || '',
                type: 'document',
                name: doc.title,
                sourceType: 'character',
                sourceId: doc.characterId,
                sourceName: character?.name || 'Unknown Character',
                location: doc.type,
                uploadedAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
                documentType: doc.type,
                documentContent: doc.content,
                documentLink: `/characters/${doc.characterId}?tab=documents&doc=${doc.id}`
            });
        });

        // Project Documents
        projectDocuments.forEach((doc) => {
            const project = projects.find(p => p.id === doc.projectId);
            items.push({
                id: `doc-proj-${doc.id}`,
                url: doc.thumbnail || doc.image || '',
                type: 'document',
                name: doc.title,
                sourceType: 'project',
                sourceId: doc.projectId,
                sourceName: project?.name || 'Unknown Project',
                location: doc.type,
                uploadedAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
                documentType: doc.type,
                documentContent: doc.content,
                documentLink: `/projects/${doc.projectId}?tab=documents&doc=${doc.id}`
            });
        });

        // User Uploaded Assets
        userAssets.forEach((asset) => {
            items.push({
                id: `user-asset-${asset.id}`,
                url: asset.thumbnailUrl || asset.dataUrl || '',
                type: asset.type,
                name: asset.name,
                altText: asset.altText,
                caption: asset.description,
                sourceType: 'character' as const,
                sourceId: asset.id,
                sourceName: 'User Uploads',
                location: 'User Assets',
                uploadedAt: asset.uploadedAt instanceof Date ? asset.uploadedAt : new Date(asset.uploadedAt),
                documentType: asset.type === 'document' ? 'user-document' : undefined,
                documentContent: asset.extractedText,
                // Preserve original dataUrl for later use - this is critical for AI vision
                originalDataUrl: asset.dataUrl
            });
        });

        return items;
    }, [characters, worlds, projects, characterDocuments, projectDocuments, userAssets]);

    // Filter and sort
    const filteredItems = useMemo(() => {
        let filtered = [...allMediaItems];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((item) =>
                item.name?.toLowerCase().includes(query) ||
                item.sourceName.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query) ||
                item.altText?.toLowerCase().includes(query) ||
                item.caption?.toLowerCase().includes(query)
            );
        }

        // Type filter
        if (filterBy === 'images') {
            filtered = filtered.filter((item) => item.type === 'image');
        } else if (filterBy === 'videos') {
            filtered = filtered.filter((item) => item.type === 'video');
        } else if (filterBy === 'documents') {
            filtered = filtered.filter((item) => item.type === 'document');
        } else if (filterBy === 'user-uploaded') {
            filtered = filtered.filter((item) => item.id.startsWith('user-asset-'));
        } else if (filterBy === 'generated') {
            filtered = filtered.filter((item) => !item.id.startsWith('user-asset-'));
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => {
            const dateA = a.uploadedAt instanceof Date ? a.uploadedAt : (a.uploadedAt ? new Date(a.uploadedAt) : null);
            const dateB = b.uploadedAt instanceof Date ? b.uploadedAt : (b.uploadedAt ? new Date(b.uploadedAt) : null);
            const timeA = dateA?.getTime() || 0;
            const timeB = dateB?.getTime() || 0;
            return timeB - timeA;
        });

        return filtered;
    }, [allMediaItems, searchQuery, filterBy]);

    const toggleSelect = (itemId: string) => {
        if (maxSelections && selectedItems.size >= maxSelections && !selectedItems.has(itemId)) {
            return; // Don't allow more selections
        }
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    // Convert MediaItem to UserAsset
    const convertToUserAsset = async (item: MediaItem): Promise<UserAsset> => {
        // If it's already a user asset, return the existing one with full data
        if (item.id.startsWith('user-asset-')) {
            const assetId = item.id.replace('user-asset-', '');
            const existingAsset = userAssets.find(a => a.id === assetId);
            if (existingAsset) {
                console.log('[AssetPicker] Returning existing user asset:', assetId, { hasDataUrl: !!existingAsset.dataUrl });
                return existingAsset;
            }
        }

        // Convert image URL to base64 data URL
        const urlToDataUrl = async (url: string): Promise<string | null> => {
            if (!url) {
                console.warn('[AssetPicker] No URL provided for conversion');
                return null;
            }
            
            if (url.startsWith('data:')) {
                return url; // Already a data URL
            }
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('[AssetPicker] Failed to convert URL to data URL:', error, { url: url.substring(0, 100) });
                // Return null instead of the URL - a regular URL won't work for AI vision
                return null;
            }
        };

        // PRIORITY: Use originalDataUrl if available (preserved from user assets)
        // This is critical for AI vision to work
        let dataUrl: string | null = null;
        
        if (item.originalDataUrl) {
            console.log('[AssetPicker] Using preserved originalDataUrl for:', item.name);
            dataUrl = item.originalDataUrl;
        } else {
            // Try to convert the URL to base64
            dataUrl = await urlToDataUrl(item.url);
        }
        
        const now = new Date();

        // Get image dimensions if it's an image
        let imageWidth: number | undefined;
        let imageHeight: number | undefined;
        if (item.type === 'image' && item.url) {
            try {
                const img = new Image();
                img.src = item.url;
                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        imageWidth = img.width;
                        imageHeight = img.height;
                        resolve(null);
                    };
                    img.onerror = reject;
                });
            } catch (error) {
                console.warn('[AssetPicker] Failed to get image dimensions:', error);
            }
        }

        // Log warning if no dataUrl available for images
        if (item.type === 'image' && !dataUrl) {
            console.error('[AssetPicker] WARNING: Image has no dataUrl - AI vision will not work for:', item.name);
        }

        return {
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: item.name || 'Untitled Asset',
            type: item.type,
            mimeType: item.type === 'image' ? 'image/jpeg' : item.type === 'video' ? 'video/mp4' : 'application/pdf',
            size: 0, // Size unknown for generated assets
            dataUrl: dataUrl || undefined, // Use undefined instead of invalid URL
            thumbnailUrl: item.type === 'image' ? item.url : undefined,
            uploadedAt: item.uploadedAt || now,
            updatedAt: now,
            description: item.caption,
            extractedText: item.documentContent,
            imageWidth,
            imageHeight,
            altText: item.altText,
        };
    };

    const handleAttach = async () => {
        if (selectedItems.size === 0) return;

        setConverting(true);
        try {
            const selectedMediaItems = filteredItems.filter(item => selectedItems.has(item.id));
            const convertedAssets: UserAsset[] = [];

            for (const item of selectedMediaItems) {
                try {
                    const asset = await convertToUserAsset(item);
                    convertedAssets.push(asset);
                } catch (error) {
                    console.error(`Failed to convert ${item.name}:`, error);
                }
            }

            onSelect(convertedAssets);
        } finally {
            setConverting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0A0A0F] rounded-lg border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <div>
                    <h3 className="text-lg font-semibold text-white">Select Assets</h3>
                    <p className="text-sm text-white/60">
                        {selectedItems.size > 0 
                            ? `${selectedItems.size} selected${maxSelections ? ` (max ${maxSelections})` : ''}`
                            : 'Search and select assets to attach'}
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    className="text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-white/10 shrink-0 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50"
                    >
                        <option value="all">All Assets</option>
                        <option value="images">Images</option>
                        <option value="videos">Videos</option>
                        <option value="documents">Documents</option>
                        <option value="user-uploaded">User Uploads</option>
                        <option value="generated">Generated</option>
                    </select>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "h-8 px-2",
                                viewMode === 'grid' && 'bg-primary/20 border-primary/50'
                            )}
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "h-8 px-2",
                                viewMode === 'list' && 'bg-primary/20 border-primary/50'
                            )}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Asset Grid/List */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-16">
                        <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/60">No assets found</p>
                    </div>
                ) : (
                    <div className={cn(
                        viewMode === 'grid'
                            ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'
                            : 'space-y-2'
                    )}>
                        {filteredItems.map((item) => {
                            const isSelected = selectedItems.has(item.id);
                            const isDisabled = maxSelections && selectedItems.size >= maxSelections && !isSelected;
                            
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => !isDisabled && toggleSelect(item.id)}
                                    className={cn(
                                        "relative rounded-lg border transition-all cursor-pointer",
                                        isSelected
                                            ? "ring-2 ring-primary border-primary/50"
                                            : isDisabled
                                            ? "border-white/5 opacity-50 cursor-not-allowed"
                                            : "border-white/10 hover:border-white/20",
                                        viewMode === 'list' && "flex items-center gap-3 p-3",
                                        viewMode === 'grid' && "aspect-square overflow-hidden"
                                    )}
                                >
                                    {viewMode === 'grid' ? (
                                        <>
                                            {item.type === 'image' ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.altText || item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : item.type === 'video' ? (
                                                <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                                    <Video className="w-8 h-8 text-white/40" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                                                    <FileText className="w-8 h-8 text-violet-400" />
                                                </div>
                                            )}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                                                <p className="text-xs text-white truncate">{item.name}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded overflow-hidden bg-black/20 flex-shrink-0">
                                                {item.type === 'image' ? (
                                                    <img
                                                        src={item.url}
                                                        alt={item.altText || item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : item.type === 'video' ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Video className="w-6 h-6 text-white/40" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                                                        <FileText className="w-6 h-6 text-violet-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">{item.name}</p>
                                                <p className="text-xs text-white/60 truncate">{item.sourceName} • {item.location}</p>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-5 h-5 text-primary" />
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 shrink-0">
                <button
                    onClick={() => setSelectedItems(new Set())}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                    disabled={selectedItems.size === 0}
                >
                    Clear Selection
                </button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={converting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAttach}
                        disabled={selectedItems.size === 0 || converting}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {converting ? 'Attaching...' : `Attach ${selectedItems.size > 0 ? `(${selectedItems.size})` : ''}`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
