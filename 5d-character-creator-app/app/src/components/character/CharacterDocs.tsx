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
import { CharacterDocument } from '@/types/document';
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
type FilterType = 'all' | 'script' | 'roleplay';

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


    const handleSelectDoc = (docId: string, event?: React.MouseEvent) => {
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
        if (selectedDocs.size === 0) return;
        if (confirm(`Delete ${selectedDocs.size} document(s)?`)) {
            selectedDocs.forEach(id => deleteCharacterDocument(id));
            setSelectedDocs(new Set());
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

    const handleGenerateImage = async (prompt: string, provider: ImageProvider) => {
        if (!selectedDocForImage) return;

        try {
            const savedConfig = JSON.parse(localStorage.getItem('5d-api-config') || '{}');
            const apiKey = provider === 'openai' ? savedConfig.openaiKey : savedConfig.anthropicKey;

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, provider, apiKey }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.imageUrl) {
                    updateCharacterDocument(selectedDocForImage, {
                        image: data.imageUrl,
                        thumbnail: data.imageUrl,
                        imageSource: 'ai-generated'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
        } finally {
            setImageModalOpen(false);
            setSelectedDocForImage(null);
        }
    };

    const handleUploadImage = (file: File) => {
        if (!selectedDocForImage) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            updateCharacterDocument(selectedDocForImage, {
                image: imageUrl,
                thumbnail: imageUrl,
                imageSource: 'uploaded'
            });
        };
        reader.readAsDataURL(file);
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

    const handleDeleteDoc = (docId: string) => {
        if (confirm('Delete this document?')) {
            deleteCharacterDocument(docId);
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
                    {/* Select Mode Toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            if (!isSelectMode) {
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
                            {filterType === 'all' ? 'All Types' : filterType === 'script' ? 'Scripts' : 'Roleplay'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0A0A0F] border-white/20">
                        <DropdownMenuItem onClick={() => setFilterType('all')} className="text-white">
                            All Types
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('script')} className="text-white">
                            Scripts
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('roleplay')} className="text-white">
                            Roleplay
                        </DropdownMenuItem>
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
                    <p className="text-sm text-muted-foreground mt-2">
                        Generate scripts or roleplay sessions to see them here
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
                                    "group relative rounded-lg border transition-all cursor-pointer",
                                    viewMode === 'grid'
                                        ? "bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/10"
                                        : "bg-white/5 border-white/10 hover:border-primary/30 p-4",
                                    isSelected && "border-primary bg-primary/10"
                                )}
                                onClick={(e) => handleSelectDoc(doc.id, e)}
                            >
                                {/* Selection Checkbox - Only show in select mode */}
                                {isSelectMode && (
                                    <div className="absolute top-3 left-3 z-10">
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                            isSelected 
                                                ? "bg-primary border-primary" 
                                                : "bg-black/40 border-white/20"
                                        )}>
                                            {isSelected && <Check className="w-3 h-3 text-black" />}
                                        </div>
                                    </div>
                                )}

                                {/* Actions Menu */}
                                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                    handleDeleteDoc(doc.id);
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
                                                    doc.type === 'script' 
                                                        ? "bg-blue-500/20 text-blue-400" 
                                                        : "bg-purple-500/20 text-purple-400"
                                                )}>
                                                    {doc.type === 'script' ? 'Script' : 'Roleplay'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-16 rounded overflow-hidden bg-black/40 shrink-0">
                                            {doc.thumbnail || doc.image ? (
                                                <img
                                                    src={doc.thumbnail || doc.image}
                                                    alt={doc.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
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
                                                    doc.type === 'script' 
                                                        ? "bg-blue-500/20 text-blue-400" 
                                                        : "bg-purple-500/20 text-purple-400"
                                                )}>
                                                    {doc.type === 'script' ? 'Script' : 'Roleplay'}
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
