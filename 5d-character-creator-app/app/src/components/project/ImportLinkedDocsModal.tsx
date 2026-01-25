'use client';

import React, { useState, useMemo } from 'react';
import { X, FileText, Check, Users, User, ChevronRight, Import, Globe, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { CharacterDocument, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLORS, ProjectDocument } from '@/types/document';
import { World } from '@/types/world';

interface ImportLinkedDocsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
    onImport: (documents: ImportableItem[]) => void;
    importedSourceIds?: Set<string>; // IDs of items already imported to this project
}

type EntityTab = 'characters' | 'worlds';

// Unified importable item type
export interface ImportableItem {
    id: string;
    type: 'character-doc' | 'world-section';
    sourceEntityId: string;
    sourceEntityName: string;
    title: string;
    content: string;
    originalType: string; // e.g., 'script', 'roleplay', 'overview', 'history'
    thumbnail?: string;
    image?: string;
    imageSource?: 'ai-generated' | 'uploaded' | 'preset';
}

// World section definition
interface WorldSection {
    id: string;
    title: string;
    content: string;
    type: 'prose' | 'custom';
}

const WORLD_PROSE_SECTIONS = [
    { key: 'description', title: 'Description', type: 'prose' as const },
    { key: 'overviewProse', title: 'Overview', type: 'prose' as const },
    { key: 'historyProse', title: 'History', type: 'prose' as const },
    { key: 'factionsProse', title: 'Factions', type: 'prose' as const },
    { key: 'geographyProse', title: 'Geography', type: 'prose' as const },
    { key: 'magicSystem', title: 'Magic System', type: 'prose' as const },
    { key: 'technology', title: 'Technology', type: 'prose' as const },
];

function getWorldSections(world: World): WorldSection[] {
    const sections: WorldSection[] = [];

    // Add prose sections
    WORLD_PROSE_SECTIONS.forEach(({ key, title, type }) => {
        const content = world[key as keyof World] as string | undefined;
        if (content && typeof content === 'string' && content.trim()) {
            sections.push({
                id: `${world.id}-${key}`,
                title: `${title} - ${world.name}`,
                content: content.trim(),
                type,
            });
        }
    });

    // Add custom sections
    if (world.customSections && Array.isArray(world.customSections)) {
        world.customSections.forEach(section => {
            if (section.content && typeof section.content === 'string' && section.content.trim()) {
                sections.push({
                    id: `${world.id}-custom-${section.id}`,
                    title: `${section.title} - ${world.name}`,
                    content: section.content.trim(),
                    type: 'custom',
                });
            }
        });
    }

    return sections;
}

export function ImportLinkedDocsModal({
    isOpen,
    onClose,
    projectId,
    projectName,
    onImport,
    importedSourceIds = new Set(),
}: ImportLinkedDocsModalProps) {
    const { characters, worlds, characterDocuments } = useStore();
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<EntityTab>('characters');

    // Get entities linked to this project
    const linkedCharacters = useMemo(() => {
        return characters.filter(c => c.projectId === projectId);
    }, [characters, projectId]);

    const linkedWorlds = useMemo(() => {
        return worlds.filter(w => w.projectId === projectId);
    }, [worlds, projectId]);

    // Get documents/sections for linked entities
    const documentsPerCharacter = useMemo(() => {
        const map = new Map<string, CharacterDocument[]>();
        linkedCharacters.forEach(char => {
            const docs = characterDocuments.filter(d => d.characterId === char.id);
            if (docs.length > 0) {
                map.set(char.id, docs);
            }
        });
        return map;
    }, [linkedCharacters, characterDocuments]);

    const sectionsPerWorld = useMemo(() => {
        const map = new Map<string, WorldSection[]>();
        linkedWorlds.forEach(world => {
            const sections = getWorldSections(world);
            if (sections.length > 0) {
                map.set(world.id, sections);
            }
        });
        return map;
    }, [linkedWorlds]);

    const totalCharacterDocs = useMemo(() => {
        let count = 0;
        documentsPerCharacter.forEach(docs => count += docs.length);
        return count;
    }, [documentsPerCharacter]);

    const availableCharacterDocs = useMemo(() => {
        let count = 0;
        documentsPerCharacter.forEach(docs => {
            docs.forEach(d => {
                if (!importedSourceIds.has(d.id)) count++;
            });
        });
        return count;
    }, [documentsPerCharacter, importedSourceIds]);

    const totalWorldSections = useMemo(() => {
        let count = 0;
        sectionsPerWorld.forEach(sections => count += sections.length);
        return count;
    }, [sectionsPerWorld]);

    const availableWorldSections = useMemo(() => {
        let count = 0;
        sectionsPerWorld.forEach(sections => {
            sections.forEach(s => {
                if (!importedSourceIds.has(s.id)) count++;
            });
        });
        return count;
    }, [sectionsPerWorld, importedSourceIds]);

    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const toggleEntityExpanded = (entityId: string) => {
        setExpandedEntities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entityId)) {
                newSet.delete(entityId);
            } else {
                newSet.add(entityId);
            }
            return newSet;
        });
    };

    const selectAllFromEntity = (entityId: string, items: { id: string }[]) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            items.forEach(item => {
                // Skip already imported items
                if (!importedSourceIds.has(item.id)) {
                    newSet.add(item.id);
                }
            });
            return newSet;
        });
    };

    const selectAll = () => {
        const allIds = new Set<string>();

        // Add all character documents (except already imported)
        documentsPerCharacter.forEach(docs => {
            docs.forEach(d => {
                if (!importedSourceIds.has(d.id)) {
                    allIds.add(d.id);
                }
            });
        });

        // Add all world sections (except already imported)
        sectionsPerWorld.forEach(sections => {
            sections.forEach(s => {
                if (!importedSourceIds.has(s.id)) {
                    allIds.add(s.id);
                }
            });
        });

        setSelectedItems(allIds);
    };

    const handleImport = () => {
        const importableItems: ImportableItem[] = [];

        // Collect selected character documents
        documentsPerCharacter.forEach((docs, charId) => {
            const char = linkedCharacters.find(c => c.id === charId);
            docs.forEach(doc => {
                if (selectedItems.has(doc.id)) {
                    importableItems.push({
                        id: doc.id,
                        type: 'character-doc',
                        sourceEntityId: charId,
                        sourceEntityName: char?.name || 'Unknown Character',
                        title: doc.title,
                        content: doc.content,
                        originalType: doc.type,
                        thumbnail: doc.thumbnail,
                        image: doc.image,
                        imageSource: doc.imageSource,
                    });
                }
            });
        });

        // Collect selected world sections
        sectionsPerWorld.forEach((sections, worldId) => {
            const world = linkedWorlds.find(w => w.id === worldId);
            sections.forEach(section => {
                if (selectedItems.has(section.id)) {
                    importableItems.push({
                        id: section.id,
                        type: 'world-section',
                        sourceEntityId: worldId,
                        sourceEntityName: world?.name || 'Unknown World',
                        title: section.title,
                        content: section.content,
                        originalType: section.type,
                    });
                }
            });
        });

        onImport(importableItems);
        setSelectedItems(new Set());
        onClose();
    };

    const handleClose = () => {
        setSelectedItems(new Set());
        onClose();
    };

    const hasLinkedEntities = linkedCharacters.length > 0 || linkedWorlds.length > 0;
    const hasContent = totalCharacterDocs > 0 || totalWorldSections > 0;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                showCloseButton={false}
                className="max-w-2xl bg-[#0c0c14] border-white/10"
            >
                <DialogHeader className="relative">
                    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2 pr-8">
                        <Import className="w-5 h-5 text-emerald-400" />
                        Import from Linked Entities
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Import documents and content from characters and worlds linked to {projectName}
                    </DialogDescription>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        className="absolute top-0 right-0 h-8 w-8 p-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </DialogHeader>

                {/* Tabs */}
                {hasLinkedEntities && hasContent && (
                    <div className="flex gap-2 mt-4 border-b border-white/10 pb-3">
                        <button
                            onClick={() => setActiveTab('characters')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                activeTab === 'characters'
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Users className="w-4 h-4" />
                            Characters
                            {totalCharacterDocs > 0 && (
                                <span className="ml-1 text-xs bg-white/10 px-1.5 py-0.5 rounded">
                                    {availableCharacterDocs}/{totalCharacterDocs}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('worlds')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                activeTab === 'worlds'
                                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Globe className="w-4 h-4" />
                            Worlds
                            {totalWorldSections > 0 && (
                                <span className="ml-1 text-xs bg-white/10 px-1.5 py-0.5 rounded">
                                    {availableWorldSections}/{totalWorldSections}
                                </span>
                            )}
                        </button>
                        <div className="flex-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={selectAll}
                            className="text-xs text-cyan-400 hover:text-cyan-300"
                        >
                            <Layers className="w-3 h-3 mr-1" />
                            Select All
                        </Button>
                    </div>
                )}

                <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {!hasLinkedEntities ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground mb-2">No linked entities</p>
                            <p className="text-sm text-muted-foreground/70">
                                Link characters or worlds to this project first to import their content.
                            </p>
                        </div>
                    ) : !hasContent ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground mb-2">No content available</p>
                            <p className="text-sm text-muted-foreground/70">
                                The linked entities don't have any documents or content yet.
                            </p>
                        </div>
                    ) : activeTab === 'characters' ? (
                        // Characters Tab
                        totalCharacterDocs === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <p className="text-muted-foreground mb-2">No character documents</p>
                                <p className="text-sm text-muted-foreground/70">
                                    Linked characters don't have any documents yet.
                                </p>
                            </div>
                        ) : (
                            linkedCharacters.map(char => {
                                const docs = documentsPerCharacter.get(char.id) || [];
                                if (docs.length === 0) return null;

                                const isExpanded = expandedEntities.has(char.id);
                                const selectedCount = docs.filter(d => selectedItems.has(d.id)).length;

                                return (
                                    <div
                                        key={char.id}
                                        className="border border-white/10 rounded-xl overflow-hidden"
                                    >
                                        {/* Character Header */}
                                        <button
                                            onClick={() => toggleEntityExpanded(char.id)}
                                            className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                                                {char.imageUrl ? (
                                                    <img
                                                        src={char.imageUrl}
                                                        alt={char.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-5 h-5 text-emerald-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h4 className="font-medium text-white">{char.name}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {docs.length} document{docs.length !== 1 ? 's' : ''}
                                                    {selectedCount > 0 && (
                                                        <span className="text-emerald-400 ml-2">
                                                            ({selectedCount} selected)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <ChevronRight
                                                className={cn(
                                                    "w-5 h-5 text-muted-foreground transition-transform",
                                                    isExpanded && "rotate-90"
                                                )}
                                            />
                                        </button>

                                        {/* Documents List */}
                                        {isExpanded && (
                                            <div className="p-3 space-y-2 bg-black/20">
                                                <div className="flex justify-end mb-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => selectAllFromEntity(char.id, docs)}
                                                        className="text-xs text-emerald-400 hover:text-emerald-300"
                                                    >
                                                        Select All
                                                    </Button>
                                                </div>
                                                {docs.map(doc => {
                                                    const isSelected = selectedItems.has(doc.id);
                                                    const isAlreadyImported = importedSourceIds.has(doc.id);
                                                    return (
                                                        <button
                                                            key={doc.id}
                                                            onClick={() => !isAlreadyImported && toggleItemSelection(doc.id)}
                                                            disabled={isAlreadyImported}
                                                            className={cn(
                                                                "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                                                                isAlreadyImported
                                                                    ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                                                                    : isSelected
                                                                        ? "bg-emerald-500/10 border-emerald-500/30"
                                                                        : "bg-white/5 border-white/10 hover:border-white/20"
                                                            )}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                                                                    isAlreadyImported
                                                                        ? "bg-white/10 border-white/20"
                                                                        : isSelected
                                                                            ? "bg-emerald-500 border-emerald-500"
                                                                            : "border-white/30"
                                                                )}
                                                            >
                                                                {(isSelected || isAlreadyImported) && (
                                                                    <Check className={cn("w-3 h-3", isAlreadyImported ? "text-white/30" : "text-white")} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span
                                                                        className={cn(
                                                                            "text-xs px-2 py-0.5 rounded-md font-medium",
                                                                            isAlreadyImported ? "bg-white/10 text-white/40" : DOCUMENT_TYPE_COLORS[doc.type]
                                                                        )}
                                                                    >
                                                                        {DOCUMENT_TYPE_LABELS[doc.type]}
                                                                    </span>
                                                                    {isAlreadyImported && (
                                                                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20">
                                                                            Already Imported
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h5 className={cn("font-medium text-sm truncate", isAlreadyImported ? "text-white/50" : "text-white")}>
                                                                    {doc.title}
                                                                </h5>
                                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                                                    {doc.content.slice(0, 100)}...
                                                                </p>
                                                                <p className="text-xs text-muted-foreground/50 mt-1">
                                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )
                    ) : (
                        // Worlds Tab
                        totalWorldSections === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <p className="text-muted-foreground mb-2">No world content</p>
                                <p className="text-sm text-muted-foreground/70">
                                    Linked worlds don't have any prose sections yet.
                                </p>
                            </div>
                        ) : (
                            linkedWorlds.map(world => {
                                const sections = sectionsPerWorld.get(world.id) || [];
                                if (sections.length === 0) return null;

                                const isExpanded = expandedEntities.has(world.id);
                                const selectedCount = sections.filter(s => selectedItems.has(s.id)).length;

                                return (
                                    <div
                                        key={world.id}
                                        className="border border-white/10 rounded-xl overflow-hidden"
                                    >
                                        {/* World Header */}
                                        <button
                                            onClick={() => toggleEntityExpanded(world.id)}
                                            className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center overflow-hidden">
                                                {world.imageUrl ? (
                                                    <img
                                                        src={world.imageUrl}
                                                        alt={world.name}
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <Globe className="w-5 h-5 text-violet-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h4 className="font-medium text-white">{world.name}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {sections.length} section{sections.length !== 1 ? 's' : ''}
                                                    {selectedCount > 0 && (
                                                        <span className="text-violet-400 ml-2">
                                                            ({selectedCount} selected)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <ChevronRight
                                                className={cn(
                                                    "w-5 h-5 text-muted-foreground transition-transform",
                                                    isExpanded && "rotate-90"
                                                )}
                                            />
                                        </button>

                                        {/* Sections List */}
                                        {isExpanded && (
                                            <div className="p-3 space-y-2 bg-black/20">
                                                <div className="flex justify-end mb-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => selectAllFromEntity(world.id, sections)}
                                                        className="text-xs text-violet-400 hover:text-violet-300"
                                                    >
                                                        Select All
                                                    </Button>
                                                </div>
                                                {sections.map(section => {
                                                    const isSelected = selectedItems.has(section.id);
                                                    const isAlreadyImported = importedSourceIds.has(section.id);
                                                    return (
                                                        <button
                                                            key={section.id}
                                                            onClick={() => !isAlreadyImported && toggleItemSelection(section.id)}
                                                            disabled={isAlreadyImported}
                                                            className={cn(
                                                                "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                                                                isAlreadyImported
                                                                    ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                                                                    : isSelected
                                                                        ? "bg-violet-500/10 border-violet-500/30"
                                                                        : "bg-white/5 border-white/10 hover:border-white/20"
                                                            )}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                                                                    isAlreadyImported
                                                                        ? "bg-white/10 border-white/20"
                                                                        : isSelected
                                                                            ? "bg-violet-500 border-violet-500"
                                                                            : "border-white/30"
                                                                )}
                                                            >
                                                                {(isSelected || isAlreadyImported) && (
                                                                    <Check className={cn("w-3 h-3", isAlreadyImported ? "text-white/30" : "text-white")} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span
                                                                        className={cn(
                                                                            "text-xs px-2 py-0.5 rounded-md font-medium",
                                                                            isAlreadyImported
                                                                                ? "bg-white/10 text-white/40"
                                                                                : section.type === 'prose'
                                                                                    ? "bg-violet-500/20 text-violet-400"
                                                                                    : "bg-cyan-500/20 text-cyan-400"
                                                                        )}
                                                                    >
                                                                        {section.type === 'prose' ? 'Prose Section' : 'Custom Section'}
                                                                    </span>
                                                                    {isAlreadyImported && (
                                                                        <span className="text-xs px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400/70 border border-violet-500/20">
                                                                            Already Imported
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h5 className={cn("font-medium text-sm truncate", isAlreadyImported ? "text-white/50" : "text-white")}>
                                                                    {section.title}
                                                                </h5>
                                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                                                    {section.content.slice(0, 100)}...
                                                                </p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )
                    )}
                </div>

                <DialogFooter className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="text-muted-foreground hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={selectedItems.size === 0}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            <Import className="w-4 h-4 mr-2" />
                            Import {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
