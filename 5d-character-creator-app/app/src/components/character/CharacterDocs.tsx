'use client';

import React, { useState, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import { 
    FileText, Grid3x3, List, Search, Filter, Download, Trash2, 
    Image as ImageIcon, Upload, Wand2, Eye, X, Check, 
    ChevronDown, SortAsc, SortDesc, FileDown, FileCode, 
    MoreVertical, Edit2, Calendar, Tag, CheckSquare, Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    CharacterDocument,
    DocumentType,
    SUPPORTED_EXTENSIONS,
    DOCUMENT_TYPE_LABELS,
    DOCUMENT_TYPE_COLORS
} from '@/types/document';
import { useStore } from '@/lib/store';
import { ImageGeneratorModal } from '@/components/gallery';
import { ImageProvider } from '@/types/image-config';
import { MarkdownProse } from '@/components/ui/markdown-prose';
import { ReadingSideNav, useScrollSpy } from '@/components/ui/reading-side-nav';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DocumentReader } from './DocumentReader';

interface CharacterDocsProps {
    characterId: string;
    characterName: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';
type FilterType = 'all' | DocumentType;

export function CharacterDocs({ characterId, characterName }: CharacterDocsProps) {
    const { 
        characterDocuments, 
        addCharacterDocument, 
        updateCharacterDocument, 
        deleteCharacterDocument,
        getCharacterDocuments 
    } = useStore();

    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<CharacterDocument | null>(null);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModalMode, setImageModalMode] = useState<'generate' | 'upload'>('generate');
    const [selectedDocForImage, setSelectedDocForImage] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState<string | null>(null);
    const [titleEditValue, setTitleEditValue] = useState('');
    const [activeSection, setActiveSection] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const documents = useMemo(() => {
        let filtered = getCharacterDocuments(characterId);

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(doc => 
                doc.title.toLowerCase().includes(query) ||
                doc.content.toLowerCase().includes(query)
            );
        }

        // Apply type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(doc => doc.type === filterType);
        }

        // Apply sort
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'a-z':
                    return a.title.localeCompare(b.title);
                case 'z-a':
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [characterId, searchQuery, filterType, sortBy, getCharacterDocuments]);

    // Get unique document types for filter dropdown
    const availableTypes = useMemo(() => {
        const allDocs = getCharacterDocuments(characterId);
        const types = new Set(allDocs.map(d => d.type));
        return Array.from(types) as DocumentType[];
    }, [characterId, getCharacterDocuments]);

    // Handle file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        for (const file of Array.from(files)) {
            try {
                // Check file extension
                const extension = '.' + file.name.split('.').pop()?.toLowerCase();
                if (!SUPPORTED_EXTENSIONS.includes(extension)) {
                    console.warn(`Unsupported file type: ${file.name}`);
                    alert(`Unsupported file type: ${file.name}\nSupported: .md, .txt, .json, .pdf`);
                    continue;
                }

                // Parse file content via API (handles PDFs and text files)
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/parse-document', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to parse document');
                }

                const { content, fileType } = await response.json();

                // Create document
                const title = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
                const now = new Date();

                addCharacterDocument({
                    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    characterId,
                    type: 'uploaded',
                    title,
                    content,
                    createdAt: now,
                    updatedAt: now,
                    sourceFile: {
                        name: file.name,
                        type: file.type || fileType || 'text/plain',
                        size: file.size
                    }
                });

                console.log(`Successfully uploaded: ${file.name}`);
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSelectDoc = (docId: string, event?: React.MouseEvent) => {
        // Stop propagation to prevent conflicts
        if (event) {
            event.stopPropagation();
        }
        
        // In select mode, always toggle selection
        if (isSelectMode) {
            setSelectedDocs(prev => {
                const next = new Set(prev);
                if (next.has(docId)) {
                    next.delete(docId);
                } else {
                    next.add(docId);
                }
                return next;
            });
            return;
        }

        // In regular mode, open document reader
        const doc = documents.find(d => d.id === docId);
        if (doc) {
            setPreviewDoc(doc);
        }
    };

    const handleSelectAll = () => {
        if (selectedDocs.size === documents.length) {
            setSelectedDocs(new Set());
        } else {
            setSelectedDocs(new Set(documents.map(d => d.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedDocs.size === 0) {
            console.log('[CharacterDocs] No documents selected for deletion');
            return;
        }

        const count = selectedDocs.size;
        const confirmed = window.confirm(`Delete ${count} document${count !== 1 ? 's' : ''}? This action cannot be undone.`);

        if (confirmed) {
            console.log('[CharacterDocs] Deleting documents:', Array.from(selectedDocs));
            // Create a copy of selectedDocs to avoid issues during iteration
            const idsToDelete = Array.from(selectedDocs);

            // Delete each document
            idsToDelete.forEach(id => {
                deleteCharacterDocument(id);
            });

            // Clear selection and exit select mode
            setSelectedDocs(new Set());
            setIsSelectMode(false);

            console.log('[CharacterDocs] Successfully deleted', count, 'document(s)');
        }
    };

    const handleBulkDownload = async () => {
        if (selectedDocs.size === 0) return;
        
        const selectedDocuments = documents.filter(d => selectedDocs.has(d.id));
        const zip = new JSZip();
        
        selectedDocuments.forEach(doc => {
            const fileName = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.md`;
            zip.file(fileName, doc.content);
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${characterName}_documents_${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPDF = async (doc: CharacterDocument) => {
        // Simple PDF generation using browser print
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${doc.title}</title>
                <style>
                    body { font-family: 'Georgia', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { color: #F97316; border-bottom: 2px solid #F97316; padding-bottom: 10px; }
                    img { max-width: 100%; height: auto; margin: 20px 0; }
                    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
                    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
                </style>
            </head>
            <body>
                ${doc.image ? `<img src="${doc.image}" alt="${doc.title}" />` : ''}
                <h1>${doc.title}</h1>
                <div>${doc.content.replace(/\n/g, '<br>')}</div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const handleDownloadMarkdown = (doc: CharacterDocument) => {
        const blob = new Blob([doc.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImageChange = (docId: string, action: 'upload' | 'generate') => {
        setSelectedDocForImage(docId);
        setImageModalMode(action);
        setImageModalOpen(true);
    };

    const handleRemoveImage = (docId: string, event?: React.MouseEvent) => {
        if (event) {
            event.stopPropagation();
        }
        updateCharacterDocument(docId, {
            thumbnail: undefined,
            image: undefined,
            imageSource: undefined,
        });
    };

    const handleGenerateImage = async (prompt: string, provider: ImageProvider): Promise<string | null> => {
        if (!selectedDocForImage) return null;

        try {
            const savedConfig = JSON.parse(localStorage.getItem('5d-api-config') || '{}');

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(savedConfig.geminiKey && { 'x-gemini-key': savedConfig.geminiKey }),
                    ...(savedConfig.openaiKey && { 'x-openai-key': savedConfig.openaiKey }),
                    ...(savedConfig.dalleKey && { 'x-openai-key': savedConfig.dalleKey }),
                },
                body: JSON.stringify({ prompt, provider }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.imageUrl) {
                    updateCharacterDocument(selectedDocForImage, {
                        image: data.imageUrl,
                        thumbnail: data.imageUrl,
                        imageSource: 'ai-generated'
                    });
                    return data.imageUrl;
                }
            }
            return null;
        } catch (error) {
            console.error('Failed to generate image:', error);
            throw error;
        } finally {
            setImageModalOpen(false);
            setSelectedDocForImage(null);
        }
    };

    const handleUploadImage = (dataUrl: string) => {
        if (!selectedDocForImage) return;

        updateCharacterDocument(selectedDocForImage, {
            image: dataUrl,
            thumbnail: dataUrl,
            imageSource: 'uploaded'
        });
        setImageModalOpen(false);
        setSelectedDocForImage(null);
    };

    const handleEditTitle = (doc: CharacterDocument) => {
        setEditingTitle(doc.id);
        setTitleEditValue(doc.title);
    };

    const handleSaveTitle = (docId: string) => {
        if (titleEditValue.trim()) {
            updateCharacterDocument(docId, { title: titleEditValue.trim() });
        }
        setEditingTitle(null);
        setTitleEditValue('');
    };

    const handleDeleteDoc = (docId: string, event?: React.MouseEvent) => {
        // Stop propagation to prevent card click
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        const confirmed = window.confirm('Delete this document?');
        if (confirmed) {
            deleteCharacterDocument(docId);
            // Remove from selection if it was selected
            setSelectedDocs(prev => {
                const next = new Set(prev);
                next.delete(docId);
                return next;
            });
            // Close preview if this document was being previewed
            if (previewDoc?.id === docId) {
                setPreviewDoc(null);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Documents</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Scripts and roleplay sessions for {characterName}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Upload Button */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".md,.txt,.json,.markdown,.pdf"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                    >
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Uploading...' : 'Upload Document'}
                    </Button>

                    {/* Select Mode Toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const newSelectMode = !isSelectMode;
                            setIsSelectMode(newSelectMode);
                            // Clear selection when exiting select mode
                            if (!newSelectMode) {
                                setSelectedDocs(new Set());
                            }
                        }}
                        className={cn(
                            "gap-2 bg-white/5 border-white/10",
                            isSelectMode && "bg-primary/20 border-primary/30 text-primary"
                        )}
                    >
                        {isSelectMode ? (
                            <>
                                <CheckSquare className="w-4 h-4" />
                                Select Mode
                            </>
                        ) : (
                            <>
                                <Square className="w-4 h-4" />
                                Select Mode
                            </>
                        )}
                    </Button>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "h-8 px-3",
                                viewMode === 'grid' ? "bg-primary/20 text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "h-8 px-3",
                                viewMode === 'list' ? "bg-primary/20 text-primary" : "text-muted-foreground"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search, Filter, Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10"
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 bg-white/5 border-white/10">
                            <Filter className="w-4 h-4" />
                            {filterType === 'all' ? 'All Types' : DOCUMENT_TYPE_LABELS[filterType as DocumentType] || filterType}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0A0A0F] border-white/20">
                        <DropdownMenuItem onClick={() => setFilterType('all')} className="text-white">
                            All Types
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        {availableTypes.map(type => (
                            <DropdownMenuItem
                                key={type}
                                onClick={() => setFilterType(type)}
                                className="text-white"
                            >
                                <span className={cn("text-xs px-2 py-0.5 rounded mr-2", DOCUMENT_TYPE_COLORS[type])}>
                                    {DOCUMENT_TYPE_LABELS[type]}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 bg-white/5 border-white/10">
                            {sortBy === 'newest' && <SortDesc className="w-4 h-4" />}
                            {sortBy === 'oldest' && <SortAsc className="w-4 h-4" />}
                            {sortBy === 'a-z' && <span className="text-xs">A-Z</span>}
                            {sortBy === 'z-a' && <span className="text-xs">Z-A</span>}
                            Sort
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0A0A0F] border-white/20">
                        <DropdownMenuItem onClick={() => setSortBy('newest')} className="text-white">
                            <SortDesc className="w-4 h-4 mr-2" />
                            Newest First
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('oldest')} className="text-white">
                            <SortAsc className="w-4 h-4 mr-2" />
                            Oldest First
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('a-z')} className="text-white">
                            A-Z
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('z-a')} className="text-white">
                            Z-A
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Bulk Actions Bar */}
            {(isSelectMode && selectedDocs.size > 0) && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-sm text-white">
                        {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDownload}
                            className="bg-white/5 border-white/10"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download ZIP
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="bg-red-500/10 border-red-500/20 text-red-400"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDocs(new Set())}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Documents Grid/List */}
            {documents.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No documents yet</p>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                        Upload documents or generate scripts and roleplay sessions
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2 bg-white/5 border-white/10"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Your First Document
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                        Supports: .md, .txt, .json, .pdf files
                    </p>
                </div>
            ) : (
                <div className={cn(
                    viewMode === 'grid' 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "space-y-2"
                )}>
                    {documents.map(doc => {
                        const isSelected = selectedDocs.has(doc.id);
                        const isEditing = editingTitle === doc.id;

                        return (
                            <div
                                key={doc.id}
                                className={cn(
                                    "group relative rounded-lg border transition-all",
                                    viewMode === 'grid'
                                        ? "bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/10"
                                        : "bg-white/5 border-white/10 hover:border-primary/30 p-4",
                                    isSelected && "border-primary bg-primary/10",
                                    isSelectMode ? "cursor-pointer" : "cursor-pointer"
                                )}
                                onClick={(e) => {
                                    // Only handle click if not clicking on interactive elements
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('button') && !target.closest('[role="menuitem"]') && !target.closest('input')) {
                                        handleSelectDoc(doc.id, e);
                                    }
                                }}
                            >
                                {/* Selection Checkbox - Only show in select mode */}
                                {isSelectMode && (
                                    <div 
                                        className="absolute top-3 left-3 z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectDoc(doc.id, e);
                                        }}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                                            isSelected 
                                                ? "bg-primary border-primary" 
                                                : "bg-black/40 border-white/20 hover:border-primary/50"
                                        )}>
                                            {isSelected && <Check className="w-3 h-3 text-black" />}
                                        </div>
                                    </div>
                                )}

                                {/* Actions Menu - Always visible in select mode for easier access */}
                                <div className={cn(
                                    "absolute top-3 right-3 z-10 transition-opacity",
                                    isSelectMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#0A0A0F] border-white/20 w-48">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewDoc(doc);
                                                }}
                                                className="text-white"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Preview
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditTitle(doc);
                                                }}
                                                className="text-white"
                                            >
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Edit Title
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleImageChange(doc.id, 'generate');
                                                }}
                                                className="text-white"
                                            >
                                                <Wand2 className="w-4 h-4 mr-2" />
                                                Generate Image
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleImageChange(doc.id, 'upload');
                                                }}
                                                className="text-white"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Image
                                            </DropdownMenuItem>
                                            {(doc.thumbnail || doc.image) && (
                                                <DropdownMenuItem
                                                    onClick={(e) => handleRemoveImage(doc.id, e)}
                                                    className="text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Remove Image
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadPDF(doc);
                                                }}
                                                className="text-white"
                                            >
                                                <FileDown className="w-4 h-4 mr-2" />
                                                Download PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadMarkdown(doc);
                                                }}
                                                className="text-white"
                                            >
                                                <FileCode className="w-4 h-4 mr-2" />
                                                Download Markdown
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    handleDeleteDoc(doc.id, e);
                                                }}
                                                className="text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {viewMode === 'grid' ? (
                                    <>
                                        {/* Thumbnail */}
                                        <div className="aspect-video rounded-t-lg overflow-hidden bg-black/40 border-b border-white/10">
                                            {doc.thumbnail || doc.image ? (
                                                <img
                                                    src={doc.thumbnail || doc.image}
                                                    alt={doc.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileText className="w-12 h-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            {isEditing ? (
                                                <Input
                                                    value={titleEditValue}
                                                    onChange={(e) => setTitleEditValue(e.target.value)}
                                                    onBlur={() => handleSaveTitle(doc.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveTitle(doc.id);
                                                        if (e.key === 'Escape') {
                                                            setEditingTitle(null);
                                                            setTitleEditValue('');
                                                        }
                                                    }}
                                                    autoFocus
                                                    className="bg-white/10 border-white/20"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <h3 className="font-semibold text-white mb-1 line-clamp-2">
                                                    {doc.title}
                                                </h3>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded",
                                                    DOCUMENT_TYPE_COLORS[doc.type] || "bg-gray-500/20 text-gray-400"
                                                )}>
                                                    {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        {/* Only show thumbnail in list view if image exists */}
                                        {(doc.thumbnail || doc.image) && (
                                            <div className="w-16 h-12 rounded overflow-hidden bg-black/40 shrink-0">
                                                <img
                                                    src={doc.thumbnail || doc.image}
                                                    alt={doc.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            {isEditing ? (
                                                <Input
                                                    value={titleEditValue}
                                                    onChange={(e) => setTitleEditValue(e.target.value)}
                                                    onBlur={() => handleSaveTitle(doc.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveTitle(doc.id);
                                                        if (e.key === 'Escape') {
                                                            setEditingTitle(null);
                                                            setTitleEditValue('');
                                                        }
                                                    }}
                                                    autoFocus
                                                    className="bg-white/10 border-white/20"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <h3 className="font-semibold text-white mb-1">
                                                    {doc.title}
                                                </h3>
                                            )}
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded",
                                                    DOCUMENT_TYPE_COLORS[doc.type] || "bg-gray-500/20 text-gray-400"
                                                )}>
                                                    {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Select All - Only show in select mode */}
            {isSelectMode && documents.length > 0 && (
                <div className="flex items-center justify-center pt-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="text-muted-foreground hover:text-white"
                    >
                        {selectedDocs.size === documents.length ? 'Deselect All' : 'Select All'}
                    </Button>
                </div>
            )}

            {/* Document Reader Dialog */}
            {previewDoc && (
                <DocumentReader
                    document={previewDoc}
                    onClose={() => setPreviewDoc(null)}
                    onDownloadPDF={() => handleDownloadPDF(previewDoc)}
                    onDownloadMarkdown={() => handleDownloadMarkdown(previewDoc)}
                />
            )}

            {/* Image Generator/Upload Modal */}
            <ImageGeneratorModal
                isOpen={imageModalOpen}
                onClose={() => {
                    setImageModalOpen(false);
                    setSelectedDocForImage(null);
                }}
                onGenerate={handleGenerateImage}
                onUpload={handleUploadImage}
                itemName={selectedDocForImage ? documents.find(d => d.id === selectedDocForImage)?.title || 'Document' : 'Document'}
                initialMode={imageModalMode}
            />
        </div>
    );
}
