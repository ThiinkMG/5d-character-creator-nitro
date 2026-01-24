'use client';

import React, { useState } from 'react';
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
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function TrashPage() {
    const router = useRouter();
    const { worlds, updateWorld } = useStore();
    const { characters, updateCharacter } = useCharacterStore();
    const [activeTab, setActiveTab] = useState<'all' | 'characters' | 'worlds'>('all');

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

        return items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    };

    const trashedItems = getTrashedItems();

    const filteredItems = trashedItems.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'characters') return item.parentType === 'character';
        if (activeTab === 'worlds') return item.parentType === 'world';
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
        }
    };

    const handleEmptyTrash = () => {
        if (confirm("Are you sure you want to delete ALL items in the trash? This cannot be undone.")) {
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
                            Restore deleted sections or remove them permanently. Items are automatically deleted after 30 days.
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
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
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
                                ? "bg-violet-500/20 text-violet-300"
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
                                ? "bg-blue-500/20 text-blue-300"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Worlds
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
                                    item.parentType === 'character'
                                        ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                                        : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                )}>
                                    {item.parentType === 'character' ? <User className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                                </div>

                                {/* Content Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-base font-semibold text-white truncate">
                                            {item.title || "Untitled Section"}
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white/50">
                                            {item.parentType}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-white/40">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            From: <span className="text-white/60">{item.parentName}</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                                        </span>
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
