'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useCharacterStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
    Trash2,
    RotateCcw,
    X,
    ArrowLeft,
    Calendar,
    FileText,
    Globe,
    User,
    AlertTriangle,
    Folder,
    MessageSquare,
    Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function TrashPage() {
    const router = useRouter();
    const { 
        worlds, 
        updateWorld, 
        characters, 
        updateCharacter,
        projects,
        chatSessions,
        characterDocuments,
        projectDocuments,
        trash,
        restoreFromTrash,
        removeFromTrash,
        emptyTrash,
        cleanupOldTrash,
        addCharacter,
        addWorld,
        addProject,
        addChatSession,
        addCharacterDocument,
        addProjectDocument
    } = useStore();
    const [activeTab, setActiveTab] = useState<'all' | 'characters' | 'worlds' | 'projects' | 'documents' | 'chats'>('all');

    // Auto-delete items older than 30 days
    useEffect(() => {
        const cleanupOldTrash = () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            let hasChanges = false;

            // Clean up character trashed sections
            characters.forEach(char => {
                if (char.trashedSections && char.trashedSections.length > 0) {
                    const oldSections = char.trashedSections.filter(section => {
                        const deletedDate = new Date(section.deletedAt);
                        return deletedDate < thirtyDaysAgo;
                    });

                    if (oldSections.length > 0) {
                        const remainingSections = char.trashedSections.filter(section => {
                            const deletedDate = new Date(section.deletedAt);
                            return deletedDate >= thirtyDaysAgo;
                        });
                        updateCharacter(char.id, { trashedSections: remainingSections });
                        hasChanges = true;
                    }
                }
            });

            // Clean up world trashed sections
            worlds.forEach(world => {
                if (world.trashedSections && world.trashedSections.length > 0) {
                    const oldSections = world.trashedSections.filter(section => {
                        const deletedDate = new Date(section.deletedAt);
                        return deletedDate < thirtyDaysAgo;
                    });

                    if (oldSections.length > 0) {
                        const remainingSections = world.trashedSections.filter(section => {
                            const deletedDate = new Date(section.deletedAt);
                            return deletedDate >= thirtyDaysAgo;
                        });
                        updateWorld(world.id, { trashedSections: remainingSections });
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                console.log('Auto-deleted trash items older than 30 days');
            }
        };

        // Run cleanup on mount and set up interval to check daily
        cleanupOldTrash();
        const interval = setInterval(cleanupOldTrash, 24 * 60 * 60 * 1000); // Check every 24 hours

        return () => clearInterval(interval);
    }, [characters, worlds, updateCharacter, updateWorld]);

    // Aggregate all trashed items
    const getTrashedItems = () => {
        const items: any[] = [];

        // Character Sections
        characters.forEach(char => {
            if (char.trashedSections) {
                char.trashedSections.forEach(section => {
                    items.push({
                        ...section,
                        type: 'character_section',
                        parentName: char.name,
                        parentId: char.id,
                        parentType: 'character'
                    });
                });
            }
        });

        // World Sections
        worlds.forEach(world => {
            if (world.trashedSections) {
                world.trashedSections.forEach(section => {
                    items.push({
                        ...section,
                        type: 'world_section',
                        parentName: world.name,
                        parentId: world.id,
                        parentType: 'world'
                    });
                });
            }
        });

        return items.sort((a, b) => {
            const dateA = a.deletedAt instanceof Date ? a.deletedAt : new Date(a.deletedAt);
            const dateB = b.deletedAt instanceof Date ? b.deletedAt : new Date(b.deletedAt);
            return dateB.getTime() - dateA.getTime();
        });
    };

    const trashedItems = getTrashedItems();

    const filteredItems = trashedItems.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'characters') return item.type === 'character' || item.parentType === 'character' || item.type === 'character_section';
        if (activeTab === 'worlds') return item.type === 'world' || item.parentType === 'world' || item.type === 'world_section';
        if (activeTab === 'projects') return item.type === 'project';
        if (activeTab === 'documents') return item.type === 'character_document' || item.type === 'project_document';
        if (activeTab === 'chats') return item.type === 'chat_session';
        return true;
    });

    const handleRestore = (item: any) => {
        if (item.parentType === 'character') {
            const char = characters.find(c => c.id === item.parentId);
            if (char) {
                // Remove from trash
                const newTrash = char.trashedSections?.filter(s => s.id !== item.id) || [];
                // Add back to active sections
                // Remove deletedAt/sourceEntityId fields before restoring
                const { deletedAt, sourceEntityId, type: ignoredType, parentName, parentId, parentType, ...restoredSection } = item;
                const newSections = [...(char.customSections || []), restoredSection];

                updateCharacter(char.id, {
                    trashedSections: newTrash,
                    customSections: newSections,
                    updatedAt: new Date()
                });
            }
        } else if (item.parentType === 'world') {
            const world = worlds.find(w => w.id === item.parentId);
            if (world) {
                const newTrash = world.trashedSections?.filter(s => s.id !== item.id) || [];
                const { deletedAt, sourceEntityId, type: ignoredType, parentName, parentId, parentType, ...restoredSection } = item;
                const newSections = [...(world.customSections || []), restoredSection];

                updateWorld(world.id, {
                    trashedSections: newTrash,
                    customSections: newSections,
                    updatedAt: new Date()
                });
            }
        }
    };

    const handleDeleteForever = (item: any) => {
        if (confirm("Are you sure you want to permanently delete this item? This cannot be undone.")) {
            // Handle legacy sections
            if (item.type === 'character_section' || item.type === 'world_section') {
                if (item.parentType === 'character') {
                    const char = characters.find(c => c.id === item.parentId);
                    if (char) {
                        const newTrash = char.trashedSections?.filter(s => s.id !== item.id) || [];
                        updateCharacter(char.id, { trashedSections: newTrash });
                    }
                } else if (item.parentType === 'world') {
                    const world = worlds.find(w => w.id === item.parentId);
                    if (world) {
                        const newTrash = world.trashedSections?.filter(s => s.id !== item.id) || [];
                        updateWorld(world.id, { trashedSections: newTrash });
                    }
                }
            } else {
                // Remove from global trash
                removeFromTrash(item.id);
            }
        }
    };

    const handleEmptyTrash = () => {
        if (confirm("Are you sure you want to delete ALL items in the trash? This cannot be undone.")) {
            // Clear global trash
            emptyTrash();
            
            // Clear legacy sections
            characters.forEach(char => {
                if (char.trashedSections?.length) {
                    updateCharacter(char.id, { trashedSections: [] });
                }
            });
            worlds.forEach(world => {
                if (world.trashedSections?.length) {
                    updateWorld(world.id, { trashedSections: [] });
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#08080c] text-white p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-white/40 hover:text-white transition-colors mb-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Trash2 className="w-8 h-8 text-red-400" />
                            Trash Bin
                        </h1>
                        <p className="text-white/60">
                            Restore deleted items or remove them permanently. Items are automatically deleted after 30 days.
                        </p>
                    </div>

                    {trashedItems.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleEmptyTrash}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Empty Trash
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-4 flex-wrap">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'all'
                                ? "bg-white/10 text-white"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        All Items
                    </button>
                    <button
                        onClick={() => setActiveTab('characters')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'characters'
                                ? "bg-primary/20 text-primary"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Characters
                    </button>
                    <button
                        onClick={() => setActiveTab('worlds')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'worlds'
                                ? "bg-violet-500/20 text-violet-300"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Worlds
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'projects'
                                ? "bg-cyan-500/20 text-cyan-300"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'documents'
                                ? "bg-blue-500/20 text-blue-300"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Documents
                    </button>
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'chats'
                                ? "bg-amber-500/20 text-amber-300"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Chat Sessions
                    </button>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                            <Trash2 className="w-12 h-12 text-white/20 mb-4" />
                            <h3 className="text-lg font-medium text-white mb-1">Trash is Empty</h3>
                            <p className="text-white/40 max-w-sm">
                                {activeTab === 'all'
                                    ? "No items have been deleted recently."
                                    : `No ${activeTab} items found in trash.`}
                            </p>
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div
                                key={`${item.id}-${item.deletedAt}`}
                                className="group flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.07]"
                            >
                                {/* Icon & Context */}
                                <div className={cn(
                                    "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border",
                                    item.type === 'character' || item.type === 'character_section' || item.parentType === 'character'
                                        ? "bg-primary/10 border-primary/20 text-primary"
                                        : item.type === 'world' || item.type === 'world_section' || item.parentType === 'world'
                                        ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                                        : item.type === 'project'
                                        ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                                        : item.type === 'character_document' || item.type === 'project_document'
                                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                        : item.type === 'chat_session'
                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                        : "bg-white/10 border-white/20 text-white/40"
                                )}>
                                    {item.type === 'character' || item.type === 'character_section' || item.parentType === 'character' ? <User className="w-6 h-6" /> :
                                        item.type === 'world' || item.type === 'world_section' || item.parentType === 'world' ? <Globe className="w-6 h-6" /> :
                                        item.type === 'project' ? <Folder className="w-6 h-6" /> :
                                        item.type === 'character_document' || item.type === 'project_document' ? <FileText className="w-6 h-6" /> :
                                        item.type === 'chat_session' ? <MessageSquare className="w-6 h-6" /> :
                                        <FileText className="w-6 h-6" />}
                                </div>

                                {/* Content Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="text-base font-semibold text-white truncate">
                                            {item.name || item.title || "Untitled"}
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white/50">
                                            {item.type === 'character_section' ? 'Section' :
                                                item.type === 'world_section' ? 'Section' :
                                                item.type === 'character_document' ? 'Document' :
                                                item.type === 'project_document' ? 'Document' :
                                                item.type === 'chat_session' ? 'Chat' :
                                                item.type}
                                        </span>
                                        {(item.role || item.archetype || item.genre || item.tone) && (
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/60">
                                                {item.role || item.archetype || item.genre || item.tone}
                                            </span>
                                        )}
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-white/60 line-clamp-1 mb-2">
                                            {item.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
                                        {(item.parentName || item.characterId || item.projectId) && (
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                {item.parentName ? `From: ${item.parentName}` :
                                                    item.characterId ? `Character: ${characters.find(c => c.id === item.characterId)?.name || item.characterId}` :
                                                    item.projectId ? `Project: ${projects.find(p => p.id === item.projectId)?.name || item.projectId}` :
                                                    ''}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Deleted: {(item.deletedAt instanceof Date ? item.deletedAt : new Date(item.deletedAt)).toLocaleDateString()}
                                        </span>
                                        {(() => {
                                            const deletedDate = item.deletedAt instanceof Date ? item.deletedAt : new Date(item.deletedAt);
                                            const thirtyDaysAgo = new Date();
                                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                            const daysUntilDeletion = Math.ceil((thirtyDaysAgo.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
                                            const daysRemaining = 30 - daysUntilDeletion;
                                            
                                            if (daysRemaining <= 0) {
                                                return (
                                                    <span className="flex items-center gap-1 text-red-400">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Will be deleted soon
                                                    </span>
                                                );
                                            }
                                            return (
                                                <span className="flex items-center gap-1 text-white/50">
                                                    <Calendar className="w-3 h-3" />
                                                    {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRestore(item)}
                                        className="h-9 px-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Restore
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteForever(item)}
                                        className="h-9 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Delete Forever
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
