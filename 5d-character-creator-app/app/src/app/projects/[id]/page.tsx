'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CharacterCard } from '@/components/character';
import { WorldCard } from '@/components/world';
import { ProjectSettingsModal, LinkItemModal, StoryEventModal } from '@/components/project';
import { ProjectDocs } from '@/components/project/ProjectDocs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectChatModeSelector } from '@/components/chat';
import { TimelineEvent } from '@/types/project';
import {
    ArrowLeft,
    Share2,
    Download,
    Settings,
    Plus,
    Folder,
    Tag,
    Link as LinkIcon,
    Sparkles,
    Calendar,
    BookOpen,
    Pencil,
    Trash2,
    MoreVertical,
    RefreshCw
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Project } from '@/types/project';
import { EntityContextNav } from '@/components/navigation/EntityContextNav';

export default function ProjectProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    React.use(paramsPromise);
    const params = useParams();
    const router = useRouter();
    const [decodedId, setDecodedId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'worlds' | 'documents'>('overview');
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Linking State
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkType, setLinkType] = useState<'character' | 'world'>('character');

    // Event Modal State
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);
    const [regeneratingEventId, setRegeneratingEventId] = useState<string | null>(null);

    useEffect(() => {
        if (params?.id) {
            setDecodedId(decodeURIComponent(params.id as string));
        }
    }, [params]);

    const { getProject, updateProject, updateProjectGenre, characters, worlds, deleteProject, updateCharacter, updateWorld } = useStore();

    if (!decodedId) return null;

    const project = getProject(decodedId);

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
                <Button onClick={() => router.push('/projects')} variant="outline">
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    const projectCharacters = characters.filter(c => c.projectId === project.id);
    const projectWorlds = worlds.filter(w => w.projectId === project.id);

    const handleSaveSettings = (updates: Partial<Project>) => {
        if (updates.genre && updates.genre !== project.genre) {
            updateProjectGenre(project.id, updates.genre);
            // If other fields are updated simultaneously
            const { genre, ...otherUpdates } = updates;
            if (Object.keys(otherUpdates).length > 0) {
                updateProject(project.id, otherUpdates);
            }
        } else {
            updateProject(project.id, updates);
        }
    };

    const handleLinkItems = (itemIds: string[]) => {
        if (linkType === 'character') {
            itemIds.forEach(id => updateCharacter(id, { projectId: project.id }));
        } else {
            itemIds.forEach(id => updateWorld(id, { projectId: project.id }));
        }
    };

    const openLinkModal = (type: 'character' | 'world') => {
        setLinkType(type);
        setLinkModalOpen(true);
    };

    const itemsForLinking = linkType === 'character'
        ? characters.filter(c => c.projectId !== project.id)
        : worlds.filter(w => w.projectId !== project.id);

    const handleSaveEvent = (eventData: Omit<TimelineEvent, 'id' | 'order'>) => {
        if (editingEvent) {
            // Edit existing event
            const updatedTimeline = (project.timeline || []).map(event =>
                event.id === editingEvent.id
                    ? { ...event, ...eventData }
                    : event
            );
            updateProject(project.id, { timeline: updatedTimeline });
            setEditingEvent(null);
        } else {
            // Create new event
            const newEvent: TimelineEvent = {
                ...eventData,
                id: Date.now().toString(),
                order: (project.timeline?.length || 0) + 1
            };
            const newTimeline = [...(project.timeline || []), newEvent];
            updateProject(project.id, { timeline: newTimeline });
        }
    };

    const handleEditEvent = (event: TimelineEvent) => {
        setEditingEvent(event);
        setEventModalOpen(true);
    };

    const handleDeleteEventClick = (event: TimelineEvent) => {
        setEventToDelete(event);
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteEvent = () => {
        if (!eventToDelete) return;
        const updatedTimeline = (project.timeline || []).filter(event => event.id !== eventToDelete.id);
        // Re-order remaining events
        const reorderedTimeline = updatedTimeline.map((event, index) => ({
            ...event,
            order: index + 1
        }));
        updateProject(project.id, { timeline: reorderedTimeline });
        setEventToDelete(null);
    };

    const handleRegenerateEvent = async (event: TimelineEvent) => {
        setRegeneratingEventId(event.id);

        // Get API Key from localStorage
        const savedConfig = localStorage.getItem('5d-api-config');
        let apiKey = '';
        let provider = 'anthropic';

        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                provider = config.provider || 'anthropic';
                apiKey = provider === 'openai' ? config.openaiKey : config.anthropicKey;
            } catch (e) {
                console.error("Failed to parse API config", e);
            }
        }

        if (!apiKey) {
            alert("API Key not found. Please configure it in Settings.");
            setRegeneratingEventId(null);
            return;
        }

        try {
            const prompt = `Context: Project "${project.name}" - ${project.summary || 'A story project'}
Current Event: "${event.title}" (${event.chapter || 'No chapter specified'})
Current Description: "${event.description}"

Task: Rewrite this story event description with a fresh perspective. Keep the same general plot point but make it more vivid and engaging.
Return ONLY the new description text (1-3 sentences), no JSON or formatting.`;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }],
                    provider,
                    apiKey,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate response from API");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let resultText = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    resultText += decoder.decode(value, { stream: true });
                }
            }

            // Update the event with regenerated description
            const updatedTimeline = (project.timeline || []).map(e =>
                e.id === event.id ? { ...e, description: resultText.trim() } : e
            );
            updateProject(project.id, { timeline: updatedTimeline });
        } catch (err) {
            console.error("Regeneration Error", err);
            alert("Failed to regenerate event. Please try again.");
        } finally {
            setRegeneratingEventId(null);
        }
    };

    return (
        <>
            <EntityContextNav entityId={project.id} type="project" />
            <div className="min-h-screen p-8 lg:p-12 pb-32">
                {/* Navigation */}
                <div className="mb-8 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                    </button>

                    <div className="flex gap-3">
                        <ProjectChatModeSelector
                            projectId={project.id}
                            projectName={project.name}
                        />
                        <Button variant="outline" className="glass h-9 text-xs">
                            <Share2 className="h-3.5 w-3.5 mr-2" />
                            Share
                        </Button>
                        <Button variant="outline" className="glass h-9 text-xs" onClick={() => setSettingsOpen(true)}>
                            <Settings className="h-3.5 w-3.5 mr-2" />
                            Settings
                        </Button>
                    </div>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row gap-8 mb-12">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Folder className="h-12 w-12 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider border border-cyan-500/20">
                                {project.genre}
                            </span>
                            <span className="text-sm text-muted-foreground">Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <h1 className="text-4xl font-bold mb-3 text-white">{project.name}</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                            {project.summary}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-white/5 mb-8">
                    {(['overview', 'characters', 'worlds', 'documents'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "pb-4 text-sm font-medium capitalize transition-colors relative",
                                activeTab === tab ? "text-cyan-400" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* About Project Section */}
                            {project.description && (
                                <div className="glass-card rounded-2xl p-6 border-cyan-500/10">
                                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-cyan-400" />
                                        About Project
                                    </h3>
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {project.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Stats Card */}
                                <div className="glass-card rounded-2xl p-6 border-cyan-500/10">
                                    <h3 className="text-lg font-medium mb-4">Project Stats</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-white/[0.03]">
                                            <span className="text-2xl font-bold text-white block mb-1">{projectCharacters.length}</span>
                                            <span className="text-sm text-muted-foreground">Characters</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/[0.03]">
                                            <span className="text-2xl font-bold text-white block mb-1">{projectWorlds.length}</span>
                                            <span className="text-sm text-muted-foreground">Worlds</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/[0.03]">
                                            <span className="text-2xl font-bold text-cyan-400 block mb-1">{project.progress}%</span>
                                            <span className="text-sm text-muted-foreground">Completion</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Story Timeline */}
                                <div className="glass-card rounded-2xl p-6 border-cyan-500/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium">Story Timeline</h3>
                                    <Button
                                        onClick={() => setEventModalOpen(true)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs text-muted-foreground hover:text-cyan-400"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Event
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {project.timeline && project.timeline.length > 0 ? (
                                        project.timeline.sort((a, b) => a.order - b.order).map((event, index) => (
                                            <div key={event.id} className="relative pl-6 border-l-2 border-white/10 pb-4 last:pb-0 group">
                                                <div className={cn(
                                                    "absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-black",
                                                    index === 0 ? "bg-cyan-500" : "bg-white/20"
                                                )} />
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-xs text-cyan-400 font-mono mb-1 block">
                                                            {event.chapter || `Event ${index + 1}`}
                                                        </span>
                                                        <h4 className="text-sm font-medium text-white">{event.title}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {event.description}
                                                        </p>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-32 bg-black/95 border-white/10 backdrop-blur-xl">
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditEvent(event)}
                                                                className="cursor-pointer text-xs"
                                                            >
                                                                <Pencil className="w-3 h-3 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleRegenerateEvent(event)}
                                                                disabled={regeneratingEventId === event.id}
                                                                className="cursor-pointer text-xs text-violet-400 focus:text-violet-400"
                                                            >
                                                                <RefreshCw className={cn("w-3 h-3 mr-2", regeneratingEventId === event.id && "animate-spin")} />
                                                                {regeneratingEventId === event.id ? 'Regenerating...' : 'Regenerate'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteEventClick(event)}
                                                                className="cursor-pointer text-xs text-red-400 focus:text-red-400"
                                                            >
                                                                <Trash2 className="w-3 h-3 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-muted-foreground text-sm">
                                            No events yet. Start planning your story!
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'characters' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Cast of Characters</h3>
                                <div className="flex gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="premium-button h-8 text-xs">
                                                <Plus className="h-3.5 w-3.5 mr-2" />
                                                Add Character
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-black/95 border-white/10 backdrop-blur-xl">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/chat?mode=character&projectId=${project.id}`} className="flex items-center cursor-pointer">
                                                    <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
                                                    <span>Create with AI</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openLinkModal('character')} className="cursor-pointer">
                                                <LinkIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                                <span>Link Existing</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {projectCharacters.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {projectCharacters.map(char => (
                                        <CharacterCard
                                            key={char.id}
                                            character={char}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground glass-card rounded-2xl">
                                    No characters assigned to this project yet.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'worlds' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Worlds & Settings</h3>
                                <div className="flex gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs shadow-lg shadow-violet-500/20">
                                                <Plus className="h-3.5 w-3.5 mr-2" />
                                                Add World
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-black/95 border-white/10 backdrop-blur-xl">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/chat?mode=world&projectId=${project.id}`} className="flex items-center cursor-pointer">
                                                    <Sparkles className="w-4 h-4 mr-2 text-violet-400" />
                                                    <span>Create with AI</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openLinkModal('world')} className="cursor-pointer">
                                                <LinkIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                                <span>Link Existing</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {projectWorlds.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {projectWorlds.map(world => (
                                        <WorldCard
                                            key={world.id}
                                            world={world}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground glass-card rounded-2xl">
                                    No worlds assigned to this project yet.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <ProjectDocs 
                            projectId={project.id} 
                            projectName={project.name} 
                        />
                    )}
                </div>
            </div>

            {/* Project Settings Modal */}
            <ProjectSettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                project={project}
                onSave={handleSaveSettings}
            />
            <LinkItemModal
                isOpen={linkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onLink={handleLinkItems}
                items={itemsForLinking}
                type={linkType}
            />
            <StoryEventModal
                isOpen={eventModalOpen}
                onClose={() => {
                    setEventModalOpen(false);
                    setEditingEvent(null);
                }}
                onSave={handleSaveEvent}
                projectContext={project.name}
                editingEvent={editingEvent}
            />
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Delete Event"
                description={`Are you sure you want to delete "${eventToDelete?.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={confirmDeleteEvent}
            />
        </>
    );
}
