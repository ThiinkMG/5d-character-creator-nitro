'use client';

import React, { useState, useMemo } from 'react';
import {
    FileText, Grid3x3, List, Search, Filter, Download, Trash2,
    Eye, X, MoreVertical, Edit2, RefreshCw, ArrowUpDown, Import, Image as ImageIcon
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
    ProjectDocument,
    ProjectDocumentType,
    PROJECT_DOCUMENT_TYPE_LABELS,
    PROJECT_DOCUMENT_TYPE_COLORS,
} from '@/types/document';
import { useStore } from '@/lib/store';
import { DocumentReader } from '@/components/character/DocumentReader';
import { ProjectDocumentTypeSelector } from './ProjectDocumentTypeSelector';
import { ImportLinkedDocsModal, ImportableItem } from './ImportLinkedDocsModal';
import { DocumentThumbnailModal } from './DocumentThumbnailModal';

interface ProjectDocsProps {
    projectId: string;
    projectName: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';
type FilterType = 'all' | ProjectDocumentType;

export function ProjectDocs({ projectId, projectName }: ProjectDocsProps) {
    const { 
        projectDocuments, 
        addProjectDocument, 
        updateProjectDocument, 
        deleteProjectDocument,
        getProjectDocuments 
    } = useStore();

    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [selectedTypeForNew, setSelectedTypeForNew] = useState<ProjectDocumentType | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [thumbnailDoc, setThumbnailDoc] = useState<ProjectDocument | null>(null);

    const documents = useMemo(() => {
        let filtered = getProjectDocuments(projectId);

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
    }, [projectId, searchQuery, filterType, sortBy, getProjectDocuments]);

    // Get unique document types for filter dropdown
    const availableTypes = useMemo(() => {
        const allDocs = getProjectDocuments(projectId);
        const types = new Set(allDocs.map(d => d.type));
        return Array.from(types) as ProjectDocumentType[];
    }, [projectId, getProjectDocuments]);

    const handleDelete = (docId: string) => {
        if (confirm('Are you sure you want to delete this document?')) {
            deleteProjectDocument(docId);
        }
    };

    const handleDownload = (doc: ProjectDocument, format: 'markdown' | 'pdf') => {
        if (format === 'markdown') {
            const blob = new Blob([doc.content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc.title}.md`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // PDF download would require a library like jsPDF
            alert('PDF download coming soon');
        }
    };

    const [replaceDocId, setReplaceDocId] = useState<string | null>(null);

    const handleCreateNew = (type: ProjectDocumentType) => {
        setSelectedTypeForNew(type);
        setShowTypeSelector(false);
        // Navigate to chat with this document type
        const outputType = type === 'movie-pitch' ? 'pitch_movie' : 
                          type === 'tv-series-pitch' ? 'pitch_tv' : 
                          type === 'book-pitch' ? 'pitch_book' : 
                          type === 'treatment' ? 'treatment' : 
                          type === 'synopsis' ? 'synopsis' : 'story_bible';
        const url = replaceDocId 
            ? `/chat?mode=project&id=${projectId}&output=${outputType}&replaceDocId=${replaceDocId}`
            : `/chat?mode=project&id=${projectId}&output=${outputType}`;
        window.location.href = url;
    };

    const handleReplaceContent = (doc: ProjectDocument) => {
        setReplaceDocId(doc.id);
        setSelectedTypeForNew(null);
        setShowTypeSelector(true);
    };

    const handleThumbnailSave = (thumbnail: string | null, imageSource?: 'ai-generated' | 'uploaded') => {
        if (thumbnailDoc) {
            updateProjectDocument(thumbnailDoc.id, {
                thumbnail: thumbnail || undefined,
                image: thumbnail || undefined,
                imageSource: imageSource,
            });
            setThumbnailDoc(null);
        }
    };

    // Track which source items have already been imported
    const importedSourceIds = useMemo(() => {
        const allDocs = getProjectDocuments(projectId);
        const ids = new Set<string>();
        allDocs.forEach(doc => {
            if (doc.metadata?.sourceItemId) {
                ids.add(doc.metadata.sourceItemId);
            }
        });
        return ids;
    }, [projectId, getProjectDocuments, projectDocuments]);

    const handleImportDocuments = (items: ImportableItem[]) => {
        items.forEach((item, index) => {
            const projectDoc: ProjectDocument = {
                id: `proj-doc-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                projectId,
                type: 'imported',
                title: `${item.title} (from ${item.sourceEntityName})`,
                content: item.content,
                thumbnail: item.thumbnail,
                image: item.image,
                imageSource: item.imageSource,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                    sourceItemId: item.id, // Track original source for duplicate detection
                    characters: item.type === 'character-doc' ? [item.sourceEntityId] : undefined,
                    worlds: item.type === 'world-section' ? [item.sourceEntityId] : undefined,
                }
            };
            addProjectDocument(projectDoc);
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Project Documents</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage pitch decks, treatments, synopses, and story bibles for {projectName}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setImportModalOpen(true)}
                        className="glass border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                        <Import className="w-4 h-4 mr-2" />
                        Import from Linked
                    </Button>
                    <DropdownMenu open={showTypeSelector} onOpenChange={setShowTypeSelector}>
                        <DropdownMenuTrigger asChild>
                            <Button className="premium-button">
                                <FileText className="w-4 h-4 mr-2" />
                                New Document
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 p-4 bg-[#0c0c14] border-white/10">
                            <ProjectDocumentTypeSelector
                                onSelect={(type) => {
                                    handleCreateNew(type);
                                    setReplaceDocId(null);
                                }}
                                selectedType={selectedTypeForNew || undefined}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search documents..."
                        className="pl-10 premium-input"
                    />
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="glass">
                                <Filter className="w-4 h-4 mr-2" />
                                {filterType === 'all' ? 'All Types' : PROJECT_DOCUMENT_TYPE_LABELS[filterType]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0c0c14] border-white/10">
                            <DropdownMenuItem onClick={() => setFilterType('all')}>
                                All Types
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {availableTypes.map(type => (
                                <DropdownMenuItem key={type} onClick={() => setFilterType(type)}>
                                    {PROJECT_DOCUMENT_TYPE_LABELS[type]}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="glass">
                                <ArrowUpDown className="w-4 h-4 mr-2" />
                                Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0c0c14] border-white/10">
                            <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest First</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('oldest')}>Oldest First</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('a-z')}>A-Z</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('z-a')}>Z-A</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={cn(viewMode === 'grid' && 'bg-primary/20 text-primary')}
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={cn(viewMode === 'list' && 'bg-primary/20 text-primary')}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Documents Grid/List */}
            {documents.length === 0 ? (
                <div className="text-center py-12 glass-card rounded-2xl">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">No documents yet</p>
                    <p className="text-sm text-muted-foreground/70">
                        Create your first pitch deck, treatment, or story bible
                    </p>
                </div>
            ) : (
                <div className={cn(
                    viewMode === 'grid' 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "space-y-2"
                )}>
                    {documents.map(doc => (
                        <div
                            key={doc.id}
                            className={cn(
                                "group relative rounded-lg border transition-all cursor-pointer",
                                viewMode === 'grid'
                                    ? "bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/10 p-4"
                                    : "bg-white/5 border-white/10 hover:border-primary/30 p-4"
                            )}
                            onClick={() => setPreviewDoc(doc)}
                        >
                            {viewMode === 'grid' ? (
                                <>
                                    {doc.thumbnail && (
                                        <div className="rounded-lg overflow-hidden mb-3 aspect-video bg-white/5">
                                            <img src={doc.thumbnail} alt={doc.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between mb-2">
                                        <span className={cn(
                                            "text-xs px-2 py-1 rounded-md font-medium border",
                                            PROJECT_DOCUMENT_TYPE_COLORS[doc.type] || "bg-gray-500/20 text-gray-400"
                                        )}>
                                            {PROJECT_DOCUMENT_TYPE_LABELS[doc.type]}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#0c0c14] border-white/10">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(doc, 'markdown'); }}>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setThumbnailDoc(doc);
                                                    }}
                                                    className="text-violet-400"
                                                >
                                                    <ImageIcon className="w-4 h-4 mr-2" />
                                                    {doc.thumbnail ? 'Change Thumbnail' : 'Add Thumbnail'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={(e) => { 
                                                        e.stopPropagation();
                                                        handleReplaceContent(doc);
                                                    }}
                                                    className="text-cyan-400"
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Replace Content
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        handleDelete(doc.id); 
                                                    }}
                                                    className="text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <h3 className="font-semibold text-white mb-1 line-clamp-2">{doc.title}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                        {(doc.content || '').slice(0, 100)}...
                                    </p>
                                    <p className="text-xs text-muted-foreground/50">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </p>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    {/* Only show thumbnail in list view if image exists */}
                                    {doc.thumbnail && (
                                        <div className="w-16 h-12 rounded overflow-hidden bg-black/40 shrink-0">
                                            <img src={doc.thumbnail} alt={doc.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={cn(
                                                "text-xs px-2 py-1 rounded-md font-medium border",
                                                PROJECT_DOCUMENT_TYPE_COLORS[doc.type] || "bg-gray-500/20 text-gray-400"
                                            )}>
                                                {PROJECT_DOCUMENT_TYPE_LABELS[doc.type]}
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#0c0c14] border-white/10">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(doc, 'markdown'); }}>
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setThumbnailDoc(doc);
                                                        }}
                                                        className="text-violet-400"
                                                    >
                                                        <ImageIcon className="w-4 h-4 mr-2" />
                                                        {doc.thumbnail ? 'Change Thumbnail' : 'Add Thumbnail'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        onClick={(e) => { 
                                                            e.stopPropagation();
                                                            handleReplaceContent(doc);
                                                        }}
                                                        className="text-cyan-400"
                                                    >
                                                        <RefreshCw className="w-4 h-4 mr-2" />
                                                        Replace Content
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            handleDelete(doc.id); 
                                                        }}
                                                        className="text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <h3 className="font-semibold text-white mb-1 line-clamp-2">{doc.title}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                            {(doc.content || '').slice(0, 100)}...
                                        </p>
                                        <p className="text-xs text-muted-foreground/50">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Document Preview/Reader */}
            {previewDoc && (
                <DocumentReader
                    document={previewDoc as any} // Type compatibility
                    onClose={() => setPreviewDoc(null)}
                    onDownloadPDF={() => handleDownload(previewDoc, 'pdf')}
                    onDownloadMarkdown={() => handleDownload(previewDoc, 'markdown')}
                />
            )}

            {/* Import from Linked Entities Modal */}
            <ImportLinkedDocsModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                projectId={projectId}
                projectName={projectName}
                onImport={handleImportDocuments}
                importedSourceIds={importedSourceIds}
            />

            {/* Thumbnail Management Modal */}
            {thumbnailDoc && (
                <DocumentThumbnailModal
                    isOpen={!!thumbnailDoc}
                    onClose={() => setThumbnailDoc(null)}
                    onSave={handleThumbnailSave}
                    currentThumbnail={thumbnailDoc.thumbnail}
                    documentTitle={thumbnailDoc.title}
                />
            )}
        </div>
    );
}
