'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
    Download,
    Search,
    Filter,
    Grid3x3,
    List,
    CheckSquare,
    Square,
    Trash2,
    Image as ImageIcon,
    Video,
    X,
    ArrowUpDown,
    Calendar,
    FileImage,
    FileVideo,
    MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import { DeleteWarningDialog } from '@/components/ui/delete-warning-dialog';

type MediaItem = {
    id: string;
    url: string;
    type: 'image' | 'video';
    name?: string;
    altText?: string;
    caption?: string;
    sourceType: 'character' | 'world' | 'project';
    sourceId: string;
    sourceName: string;
    location: string; // e.g., "Header", "Infobox", "Foundation Section", "Gallery Section"
    uploadedAt?: Date;
};

type SortOption = 'name' | 'date' | 'source' | 'type';
type FilterOption = 'all' | 'images' | 'videos' | 'characters' | 'worlds' | 'projects';
type ViewMode = 'grid' | 'list';

export default function MediaPage() {
    const { characters, worlds, projects, updateCharacter, updateWorld } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

    // Collect all media items from characters, worlds, and projects
    const allMediaItems = useMemo(() => {
        const items: MediaItem[] = [];

        // Characters
        characters.forEach((character) => {
            // Header image
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

            // Infobox image
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

            // Prose section images
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

            // Custom section images
            character.customSections?.forEach((section) => {
                // Attached images in text sections
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

                // Gallery items
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

                // Legacy gallery arrays
                section.galleryImages?.forEach((url, idx) => {
                    items.push({
                        id: `char-${character.id}-gallery-img-${idx}`,
                        url,
                        type: 'image',
                        name: `${character.name} - ${section.title} Gallery`,
                        sourceType: 'character',
                        sourceId: character.id,
                        sourceName: character.name,
                        location: `${section.title} Gallery`,
                        uploadedAt: character.updatedAt instanceof Date ? character.updatedAt : new Date(character.updatedAt)
                    });
                });

                section.galleryVideos?.forEach((url, idx) => {
                    items.push({
                        id: `char-${character.id}-gallery-vid-${idx}`,
                        url,
                        type: 'video',
                        name: `${character.name} - ${section.title} Gallery`,
                        sourceType: 'character',
                        sourceId: character.id,
                        sourceName: character.name,
                        location: `${section.title} Gallery`,
                        uploadedAt: character.updatedAt instanceof Date ? character.updatedAt : new Date(character.updatedAt)
                    });
                });
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

        // Projects (if they have images in the future)
        projects.forEach((project) => {
            // Add project images if they exist
        });

        return items;
    }, [characters, worlds, projects]);

    // Filter and sort media items
    const filteredAndSortedItems = useMemo(() => {
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
        } else if (filterBy === 'characters') {
            filtered = filtered.filter((item) => item.sourceType === 'character');
        } else if (filterBy === 'worlds') {
            filtered = filtered.filter((item) => item.sourceType === 'world');
        } else if (filterBy === 'projects') {
            filtered = filtered.filter((item) => item.sourceType === 'project');
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'date':
                    const dateA = a.uploadedAt instanceof Date ? a.uploadedAt : (a.uploadedAt ? new Date(a.uploadedAt) : null);
                    const dateB = b.uploadedAt instanceof Date ? b.uploadedAt : (b.uploadedAt ? new Date(b.uploadedAt) : null);
                    const timeA = dateA?.getTime() || 0;
                    const timeB = dateB?.getTime() || 0;
                    return timeB - timeA;
                case 'source':
                    return a.sourceName.localeCompare(b.sourceName);
                case 'type':
                    return a.type.localeCompare(b.type);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [allMediaItems, searchQuery, filterBy, sortBy]);

    // Download functions
    const downloadItem = async (item: MediaItem) => {
        try {
            // Ensure filename has proper extension
            let filename = item.name || `media-${item.id}`;
            // Remove any existing extension and add correct one
            filename = filename.replace(/\.[^/.]+$/, '');
            filename += item.type === 'image' ? '.jpg' : '.mp4';
            
            let blob: Blob;
            
            // If it's a data URL, convert to blob directly
            if (item.url.startsWith('data:')) {
                try {
                    // Parse data URL: data:[<mediatype>][;base64],<data>
                    const base64Match = item.url.match(/^data:([^;]+);base64,(.+)$/);
                    if (base64Match) {
                        const mimeType = base64Match[1] || 'image/jpeg';
                        const base64Data = base64Match[2];
                        // Convert base64 to binary
                        const byteCharacters = atob(base64Data);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        blob = new Blob([byteArray], { type: mimeType });
                    } else {
                        // Fallback to fetch for non-base64 data URLs
                        const response = await fetch(item.url);
                        blob = await response.blob();
                    }
                } catch (dataUrlError) {
                    console.warn('Data URL conversion failed, trying fetch:', dataUrlError);
                    // Fallback to fetch
                    const response = await fetch(item.url);
                    blob = await response.blob();
                }
            } else {
                // For regular URLs, fetch as blob to ensure download
                try {
                    const response = await fetch(item.url, {
                        mode: 'cors',
                        credentials: 'omit',
                        cache: 'no-cache'
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to fetch: ${response.statusText}`);
                    }
                    blob = await response.blob();
                } catch (fetchError) {
                    // If CORS fails, try to create image and convert to blob using canvas
                    console.warn('Direct fetch failed, trying canvas method:', fetchError);
                    blob = await new Promise<Blob>((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        
                        img.onload = () => {
                            try {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                const ctx = canvas.getContext('2d');
                                if (!ctx) {
                                    reject(new Error('Could not get canvas context'));
                                    return;
                                }
                                ctx.drawImage(img, 0, 0);
                                canvas.toBlob((canvasBlob) => {
                                    if (canvasBlob) {
                                        resolve(canvasBlob);
                                    } else {
                                        reject(new Error('Failed to convert canvas to blob'));
                                    }
                                }, 'image/jpeg', 0.95);
                            } catch (err) {
                                reject(err);
                            }
                        };
                        img.onerror = () => reject(new Error('Failed to load image'));
                        img.src = item.url;
                    });
                }
            }
            
            // Create blob URL and download
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';
            link.setAttribute('download', filename);
            
            // Add to DOM
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            
            // Cleanup after a delay
            setTimeout(() => {
                try {
                    if (document.body.contains(link)) {
                        document.body.removeChild(link);
                    }
                    URL.revokeObjectURL(blobUrl);
                } catch (cleanupError) {
                    console.warn('Cleanup error:', cleanupError);
                }
            }, 100);
        } catch (error) {
            console.error('Download failed:', error);
            // Final fallback: show user-friendly message
            alert(`Unable to download "${item.name || 'image'}". This may be due to browser security restrictions. Please try:\n\n1. Right-clicking the image and selecting "Save image as..."\n2. Or opening the image in a new tab and saving it from there.`);
        }
    };

    const downloadSelected = async () => {
        if (selectedItems.size === 0) return;
        
        try {
            const zip = new JSZip();
            const itemsToDownload = filteredAndSortedItems.filter(item => selectedItems.has(item.id));
            
            // Download all items as blobs and add to zip
            for (const item of itemsToDownload) {
                try {
                    let blob: Blob;
                    
                    if (item.url.startsWith('data:')) {
                        try {
                            // Parse data URL: data:[<mediatype>][;base64],<data>
                            const base64Match = item.url.match(/^data:([^;]+);base64,(.+)$/);
                            if (base64Match) {
                                const mimeType = base64Match[1] || 'image/jpeg';
                                const base64Data = base64Match[2];
                                // Convert base64 to binary
                                const byteCharacters = atob(base64Data);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                blob = new Blob([byteArray], { type: mimeType });
                            } else {
                                // Fallback to fetch for non-base64 data URLs
                                const response = await fetch(item.url);
                                blob = await response.blob();
                            }
                        } catch (dataUrlError) {
                            console.warn('Data URL conversion failed, trying fetch:', dataUrlError);
                            // Fallback to fetch
                            const response = await fetch(item.url);
                            blob = await response.blob();
                        }
                    } else {
                        try {
                            const response = await fetch(item.url, {
                                mode: 'cors',
                                credentials: 'omit',
                                cache: 'no-cache'
                            });
                            if (!response.ok) throw new Error('Fetch failed');
                            blob = await response.blob();
                        } catch (fetchError) {
                            // Canvas fallback for CORS
                            blob = await new Promise<Blob>((resolve, reject) => {
                                const img = new Image();
                                img.crossOrigin = 'anonymous';
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    const ctx = canvas.getContext('2d');
                                    if (!ctx) {
                                        reject(new Error('No canvas context'));
                                        return;
                                    }
                                    ctx.drawImage(img, 0, 0);
                                    canvas.toBlob((canvasBlob) => {
                                        if (canvasBlob) resolve(canvasBlob);
                                        else reject(new Error('Blob conversion failed'));
                                    }, 'image/jpeg', 0.95);
                                };
                                img.onerror = () => reject(new Error('Image load failed'));
                                img.src = item.url;
                            });
                        }
                    }
                    
                    // Create filename
                    let filename = item.name || `media-${item.id}`;
                    filename = filename.replace(/\.[^/.]+$/, '');
                    filename += item.type === 'image' ? '.jpg' : '.mp4';
                    
                    // Add to zip
                    zip.file(filename, blob);
                } catch (error) {
                    console.error(`Failed to add ${item.name} to zip:`, error);
                }
            }
            
            // Generate zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            
            // Download zip
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = `media-${new Date().toISOString().split('T')[0]}.zip`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                URL.revokeObjectURL(zipUrl);
            }, 100);
        } catch (error) {
            console.error('Failed to create zip:', error);
            alert('Failed to create zip file. Downloading items individually...');
            // Fallback to individual downloads
            selectedItems.forEach((id) => {
                const item = filteredAndSortedItems.find((i) => i.id === id);
                if (item) {
                    setTimeout(() => downloadItem(item), 100);
                }
            });
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === filteredAndSortedItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredAndSortedItems.map((item) => item.id)));
        }
    };

    const isAllSelected = selectedItems.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0;

    // Delete functions - define deleteMediaItem first since confirmDelete uses it
    const deleteMediaItem = (itemId: string) => {
        const item = allMediaItems.find(i => i.id === itemId);
        if (!item) return;

        if (item.sourceType === 'character') {
            const character = characters.find(c => c.id === item.sourceId);
            if (!character) return;

            // Determine which image to remove based on location
            if (item.location === 'Header') {
                updateCharacter(character.id, { imageUrl: null as any });
            } else if (item.location === 'Infobox') {
                updateCharacter(character.id, { infoboxImageUrl: null as any });
            } else if (item.location.includes('Section') && !item.location.includes('Gallery')) {
                // Prose section image
                const sectionName = item.location.replace(' Section', '').toLowerCase();
                const proseImages = { ...character.proseImages };
                if (proseImages && sectionName in proseImages) {
                    const updated = { ...proseImages };
                    delete updated[sectionName as keyof typeof proseImages];
                    updateCharacter(character.id, { proseImages: updated });
                }
            } else if (item.location.includes('Gallery')) {
                // Gallery item - need to find and remove from custom section
                const sectionTitle = item.location.replace(' Gallery', '');
                const section = character.customSections?.find(s => s.title === sectionTitle);
                if (section) {
                    if (section.galleryItems) {
                        const itemIdPart = itemId.split('-gallery-')[1];
                        const updatedItems = section.galleryItems.filter(gi => gi.id !== itemIdPart);
                        updateCharacter(character.id, {
                            customSections: character.customSections?.map(s =>
                                s.id === section.id ? { ...s, galleryItems: updatedItems } : s
                            )
                        });
                    } else if (section.galleryImages) {
                        // Find index of this image in galleryImages array
                        const imageIndex = section.galleryImages.findIndex((url, idx) => {
                            const expectedId = `char-${character.id}-gallery-img-${idx}`;
                            return expectedId === itemId;
                        });
                        if (imageIndex !== -1) {
                            const updatedImages = section.galleryImages.filter((_, idx) => idx !== imageIndex);
                            updateCharacter(character.id, {
                                customSections: character.customSections?.map(s =>
                                    s.id === section.id ? { ...s, galleryImages: updatedImages } : s
                                )
                            });
                        }
                    }
                }
            } else if (item.location.includes('Custom') || item.id.includes('-custom-')) {
                // Attached image in custom section
                const sectionIdMatch = item.id.match(/custom-([^-]+)-/);
                if (sectionIdMatch) {
                    const sectionId = sectionIdMatch[1];
                    const section = character.customSections?.find(s => s.id === sectionId);
                    if (section) {
                        updateCharacter(character.id, {
                            customSections: character.customSections?.map(s =>
                                s.id === section.id ? { ...s, attachedImage: undefined } : s
                            )
                        });
                    }
                }
            }
        } else if (item.sourceType === 'world') {
            const world = worlds.find(w => w.id === item.sourceId);
            if (world && item.location === 'Header') {
                updateWorld(world.id, { imageUrl: null as any });
            }
        }
    };

    const handleDeleteItem = (itemId: string) => {
        setItemToDelete(itemId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedItems.size === 0) return;
        setItemToDelete(null); // null means bulk delete
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            // Delete single item
            deleteMediaItem(itemToDelete);
            setItemToDelete(null);
        } else if (selectedItems.size > 0) {
            // Delete selected items
            selectedItems.forEach(id => deleteMediaItem(id));
            setSelectedItems(new Set());
        }
        setDeleteDialogOpen(false);
    };

    // Context menu handler
    const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuOpen(itemId);
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
    };

    // Close context menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => {
            setContextMenuOpen(null);
            setContextMenuPosition(null);
        };
        if (contextMenuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenuOpen]);

    return (
        <div className="min-h-screen bg-[#08080c] ml-[72px]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
                    <p className="text-white/60">Manage all your images and videos</p>
                </div>

                {/* Toolbar */}
                <div className="bg-[#0A0A0F] rounded-xl border border-white/10 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search media..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50"
                            >
                                <option value="all">All Media</option>
                                <option value="images">Images Only</option>
                                <option value="videos">Videos Only</option>
                                <option value="characters">From Characters</option>
                                <option value="worlds">From Worlds</option>
                                <option value="projects">From Projects</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="name">Sort by Name</option>
                                <option value="source">Sort by Source</option>
                                <option value="type">Sort by Type</option>
                            </select>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
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
                                        viewMode === 'list' && 'bg-primary/20 border-primary/50'
                                    )}
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedItems.size > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-white/70">
                                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={downloadSelected}
                                className="bg-primary/20 border-primary/50 text-primary hover:bg-primary/30"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download as ZIP
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleDeleteSelected}
                                className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Selected
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItems(new Set())}
                                className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Clear Selection
                            </Button>
                        </div>
                    )}
                </div>

                {/* Media Grid/List */}
                {filteredAndSortedItems.length === 0 ? (
                    <div className="text-center py-16">
                        <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/60">No media found</p>
                    </div>
                ) : (
                    <div className={cn(
                        viewMode === 'grid'
                            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                            : 'space-y-2'
                    )}>
                        {filteredAndSortedItems.map((item) => (
                            <MediaCard
                                key={item.id}
                                item={item}
                                viewMode={viewMode}
                                isSelected={selectedItems.has(item.id)}
                                onSelect={() => toggleSelect(item.id)}
                                onDownload={() => downloadItem(item)}
                                onDelete={() => handleDeleteItem(item.id)}
                                onContextMenu={(e) => handleContextMenu(e, item.id)}
                                contextMenuOpen={contextMenuOpen === item.id}
                                contextMenuPosition={contextMenuPosition}
                                onCloseContextMenu={() => {
                                    setContextMenuOpen(null);
                                    setContextMenuPosition(null);
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Select All Button */}
                {filteredAndSortedItems.length > 0 && (
                    <div className="mt-6 flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleSelectAll}
                            className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        >
                            {isAllSelected ? (
                                <>
                                    <Square className="w-4 h-4 mr-2" />
                                    Deselect All
                                </>
                            ) : (
                                <>
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    Select All
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteWarningDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setItemToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Media"
                description={
                    itemToDelete
                        ? "This media item will be permanently removed from its source (character/world). This action cannot be undone."
                        : `These ${selectedItems.size} media item${selectedItems.size !== 1 ? 's' : ''} will be permanently removed from their sources. This action cannot be undone.`
                }
                itemName={
                    itemToDelete
                        ? filteredAndSortedItems.find(i => i.id === itemToDelete)?.name || 'this media item'
                        : `${selectedItems.size} selected media item${selectedItems.size !== 1 ? 's' : ''}`
                }
            />
        </div>
    );
}

function MediaCard({
    item,
    viewMode,
    isSelected,
    onSelect,
    onDownload,
    onDelete,
    onContextMenu,
    contextMenuOpen,
    contextMenuPosition,
    onCloseContextMenu
}: {
    item: MediaItem;
    viewMode: ViewMode;
    isSelected: boolean;
    onSelect: () => void;
    onDownload: () => void;
    onDelete: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    contextMenuOpen: boolean;
    contextMenuPosition: { x: number; y: number } | null;
    onCloseContextMenu: () => void;
}) {
    if (viewMode === 'list') {
        return (
            <div
                className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer relative",
                    isSelected
                        ? "bg-primary/20 border-primary/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
                onClick={onSelect}
                onContextMenu={onContextMenu}
            >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                    {item.type === 'image' ? (
                        <img 
                            src={item.url} 
                            alt={item.altText || item.name} 
                            className="w-full h-full object-cover pointer-events-none"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-white/40" />
                        </div>
                    )}
                    {isSelected && (
                        <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                            <CheckSquare className="w-6 h-6 text-white" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{item.name || 'Untitled'}</div>
                    <div className="text-white/60 text-sm truncate">
                        {item.sourceName} • {item.location}
                    </div>
                    {item.caption && (
                        <div className="text-white/50 text-xs mt-1 truncate">{item.caption}</div>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        item.sourceType === 'character' && "bg-blue-500/20 text-blue-300",
                        item.sourceType === 'world' && "bg-green-500/20 text-green-300",
                        item.sourceType === 'project' && "bg-purple-500/20 text-purple-300"
                    )}>
                        {item.sourceType}
                    </span>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownload();
                        }}
                        className="h-8 w-8 p-0"
                        title="Download"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Context Menu for List View */}
                {contextMenuOpen && contextMenuPosition && (
                    <div
                        className="fixed z-50 bg-[#0A0A0F] border border-white/20 rounded-lg shadow-2xl py-2 min-w-[180px]"
                        style={{
                            left: `${contextMenuPosition.x}px`,
                            top: `${contextMenuPosition.y}px`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownload();
                                onCloseContextMenu();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                                onCloseContextMenu();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "group relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer",
                isSelected
                    ? "ring-2 ring-primary border-primary/50"
                    : "border-white/10 hover:border-white/20"
            )}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect();
            }}
            onContextMenu={onContextMenu}
        >
            {item.type === 'image' ? (
                <img 
                    src={item.url} 
                    alt={item.altText || item.name} 
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                />
            ) : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center">
                    <Video className="w-12 h-12 text-white/40" />
                </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-white text-sm font-medium truncate mb-1">{item.name || 'Untitled'}</div>
                    <div className="text-white/70 text-xs truncate mb-2">
                        {item.sourceName} • {item.location}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            item.sourceType === 'character' && "bg-blue-500/30 text-blue-200",
                            item.sourceType === 'world' && "bg-green-500/30 text-green-200",
                            item.sourceType === 'project' && "bg-purple-500/30 text-purple-200"
                        )}>
                            {item.sourceType}
                        </span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDownload();
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className="h-7 px-2 text-xs bg-white/10 hover:bg-white/20 text-white"
                        >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                        </Button>
                    </div>
                </div>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-white" />
                </div>
            )}

            {/* Type Badge */}
            <div className="absolute top-2 left-2">
                {item.type === 'image' ? (
                    <FileImage className="w-4 h-4 text-white/80" />
                ) : (
                    <FileVideo className="w-4 h-4 text-white/80" />
                )}
            </div>

            {/* Context Menu */}
            {contextMenuOpen && contextMenuPosition && (
                <div
                    className="fixed z-50 bg-[#0A0A0F] border border-white/20 rounded-lg shadow-2xl py-2 min-w-[180px]"
                    style={{
                        left: `${contextMenuPosition.x}px`,
                        top: `${contextMenuPosition.y}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownload();
                            onCloseContextMenu();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                            onCloseContextMenu();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
