import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character } from '@/types/character';
import { World } from '@/types/world';
import { Project } from '@/types/project';
import { ChatSession } from '@/types/chat';
import { CharacterDocument, ProjectDocument } from '@/types/document';
import { ModePreset } from '@/types/mode-preset';
import { ChatMode } from '@/lib/mode-registry';
import { UserAsset } from '@/types/user-asset';

interface TrashItem {
    id: string;
    type: 'character' | 'world' | 'project' | 'character_document' | 'project_document' | 'chat_session';
    data: any; // The full item data
    deletedAt: Date;
}

// NEW: Development queue item for tracking stub entities
interface DevelopmentQueueItem {
    entityId: string;
    entityType: 'character' | 'world' | 'project';
    createdAt: Date;
}

interface GlobalState {
    characters: Character[];
    worlds: World[];
    projects: Project[];
    chatSessions: ChatSession[];
    characterDocuments: CharacterDocument[];
    projectDocuments: ProjectDocument[];
    modePresets: ModePreset[];
    trash: TrashItem[];
    developmentQueue: DevelopmentQueueItem[]; // NEW: Phase 1
    userAssets: UserAsset[]; // NEW: User uploaded files for AI context

    activeCharacterId: string | null;
    activeWorldId: string | null;
    activeProjectId: string | null;

    // UI State
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;

    // Character Actions
    addCharacter: (character: Character) => void;
    updateCharacter: (id: string, updates: Partial<Character>) => void;
    deleteCharacter: (id: string) => void;
    setActiveCharacter: (id: string | null) => void;
    getCharacter: (id: string) => Character | undefined;

    // World Actions
    addWorld: (world: World) => void;
    updateWorld: (id: string, updates: Partial<World>) => void;
    deleteWorld: (id: string) => void;
    setActiveWorld: (id: string | null) => void;
    getWorld: (id: string) => World | undefined;

    // Project Actions
    addProject: (project: Project) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    updateProjectGenre: (id: string, newGenre: string) => void;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;
    getProject: (id: string) => Project | undefined;

    // Chat Session Actions
    addChatSession: (session: ChatSession) => void;
    updateChatSession: (id: string, updates: Partial<ChatSession>) => void;
    deleteChatSession: (id: string) => void;
    getChatSession: (id: string) => ChatSession | undefined;
    forkSession: (originalSessionId: string, startMessageId: string, newTitle?: string) => string | null;

    // Project Linking Actions
    addCharacterToProject: (characterId: string, projectId: string) => void;
    removeCharacterFromProject: (characterId: string, projectId: string) => void;
    addWorldToProject: (worldId: string, projectId: string) => void;
    removeWorldFromProject: (worldId: string, projectId: string) => void;
    duplicateCharacter: (characterId: string) => string | null;
    duplicateWorld: (worldId: string) => string | null;
    getProjectForCharacter: (characterId: string) => Project | undefined;
    getProjectForWorld: (worldId: string) => Project | undefined;

    // Character-to-World Linking Actions
    linkCharacterToWorld: (characterId: string, worldId: string) => void;
    unlinkCharacterFromWorld: (characterId: string) => void;
    getWorldForCharacter: (characterId: string) => World | undefined;
    getCharactersForWorld: (worldId: string) => Character[];

    // Document Actions
    addCharacterDocument: (document: CharacterDocument) => void;
    updateCharacterDocument: (id: string, updates: Partial<CharacterDocument>) => void;
    deleteCharacterDocument: (id: string) => void;
    getCharacterDocuments: (characterId: string) => CharacterDocument[];
    getCharacterDocument: (id: string) => CharacterDocument | undefined;

    // Project Document Actions
    addProjectDocument: (document: ProjectDocument) => void;
    updateProjectDocument: (id: string, updates: Partial<ProjectDocument>) => void;
    deleteProjectDocument: (id: string) => void;
    getProjectDocuments: (projectId: string) => ProjectDocument[];
    getProjectDocument: (id: string) => ProjectDocument | undefined;

    // Mode Preset Actions
    addModePreset: (preset: ModePreset) => void;
    updateModePreset: (id: string, updates: Partial<ModePreset>) => void;
    deleteModePreset: (id: string) => void;
    getModePreset: (id: string) => ModePreset | undefined;
    getModePresets: (mode?: ChatMode) => ModePreset[];

    // Trash Actions
    addToTrash: (item: TrashItem) => void;
    restoreFromTrash: (id: string) => void;
    removeFromTrash: (id: string) => void;
    emptyTrash: () => void;
    cleanupOldTrash: () => void; // Remove items older than 30 days

    // NEW: Phase 1 - Entity Stub Actions (@ Mention System)
    createCharacterStub: (name: string) => string; // Returns character ID
    createWorldStub: (name: string) => string; // Returns world ID
    createProjectStub: (name: string) => string; // Returns project ID

    // NEW: Phase 1 - Development Queue Actions
    addToDevelopmentQueue: (entityId: string, entityType: 'character' | 'world' | 'project') => void;
    removeFromDevelopmentQueue: (entityId: string) => void;
    getDevelopmentQueue: () => DevelopmentQueueItem[];
    isInDevelopmentQueue: (entityId: string) => boolean;

    // NEW: User Asset Actions (File Uploads)
    addUserAsset: (asset: UserAsset) => void;
    updateUserAsset: (id: string, updates: Partial<UserAsset>) => void;
    deleteUserAsset: (id: string) => void;
    getUserAsset: (id: string) => UserAsset | undefined;
    getUserAssets: (type?: UserAsset['type']) => UserAsset[];
    attachAssetToChat: (chatSessionId: string, assetId: string) => void;
    detachAssetFromChat: (chatSessionId: string, assetId: string) => void;
    updateUserAssetVisionAnalysis: (id: string, visionAnalysis: UserAsset['visionAnalysis'], provider?: 'claude' | 'openai') => void;
}

export const useStore = create<GlobalState>()(
    persist(
        (set, get) => ({
            characters: [],
            worlds: [],
            projects: [],
            chatSessions: [],
            characterDocuments: [],
            projectDocuments: [],
            modePresets: [],
            trash: [],
            developmentQueue: [], // Phase 1: @ Mention System
            userAssets: [], // User uploaded files

            activeCharacterId: null,
            activeWorldId: null,
            activeProjectId: null,

            // UI Implementation
            isSidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

            // Character Implementation
            addCharacter: (character) =>
                set((state) => ({
                    characters: [...state.characters, character],
                    activeCharacterId: character.id
                })),

            updateCharacter: (id, updates) =>
                set((state) => ({
                    characters: state.characters.map((char) =>
                        char.id === id
                            ? { ...char, ...updates, updatedAt: new Date() }
                            : char
                    ),
                })),

            deleteCharacter: (id) =>
                set((state) => {
                    const character = state.characters.find((char) => char.id === id);
                    if (character) {
                        // Move to trash instead of hard delete
                        const trashItem: TrashItem = {
                            id: character.id,
                            type: 'character',
                            data: character,
                            deletedAt: new Date()
                        };
                        return {
                            characters: state.characters.filter((char) => char.id !== id),
                            activeCharacterId: state.activeCharacterId === id ? null : state.activeCharacterId,
                            trash: [...state.trash, trashItem]
                        };
                    }
                    return state;
                }),

            setActiveCharacter: (id) => set({ activeCharacterId: id }),
            getCharacter: (id) => get().characters.find((c) => c.id === id),

            // World Implementation
            addWorld: (world) =>
                set((state) => ({
                    worlds: [...state.worlds, world],
                    activeWorldId: world.id
                })),

            updateWorld: (id, updates) =>
                set((state) => ({
                    worlds: state.worlds.map((w) =>
                        w.id === id
                            ? { ...w, ...updates, updatedAt: new Date() }
                            : w
                    ),
                })),

            deleteWorld: (id) =>
                set((state) => ({
                    worlds: state.worlds.filter((w) => w.id !== id),
                    activeWorldId: state.activeWorldId === id ? null : state.activeWorldId,
                })),

            setActiveWorld: (id) => set({ activeWorldId: id }),
            getWorld: (id) => get().worlds.find((w) => w.id === id),

            // Project Implementation
            addProject: (project) =>
                set((state) => ({
                    projects: [...state.projects, project],
                    activeProjectId: project.id
                })),

            updateProject: (id, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id
                            ? { ...p, ...updates, updatedAt: new Date() }
                            : p
                    ),
                })),

            updateProjectGenre: (id, newGenre) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id
                            ? { ...p, genre: newGenre, updatedAt: new Date() }
                            : p
                    ),
                    // Cascading update to all linked characters
                    characters: state.characters.map((c) =>
                        c.projectId === id
                            ? { ...c, genre: newGenre, updatedAt: new Date() }
                            : c
                    ),
                    // Cascading update to all linked worlds
                    worlds: state.worlds.map((w) =>
                        w.projectId === id
                            ? { ...w, genre: newGenre, updatedAt: new Date() }
                            : w
                    ),
                })),

            deleteProject: (id) =>
                set((state) => {
                    const project = state.projects.find((p) => p.id === id);
                    if (project) {
                        // Move to trash instead of hard delete
                        const trashItem: TrashItem = {
                            id: project.id,
                            type: 'project',
                            data: project,
                            deletedAt: new Date()
                        };
                        return {
                            projects: state.projects.filter((p) => p.id !== id),
                            activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
                            trash: [...state.trash, trashItem]
                        };
                    }
                    return state;
                }),

            setActiveProject: (id) => set({ activeProjectId: id }),
            getProject: (id) => get().projects.find((p) => p.id === id),

            // Chat Session Implementation
            addChatSession: (session) =>
                set((state) => ({
                    chatSessions: [session, ...state.chatSessions] // Newest first
                })),

            updateChatSession: (id, updates) =>
                set((state) => ({
                    chatSessions: state.chatSessions.map((s) =>
                        s.id === id
                            ? { ...s, ...updates, updatedAt: new Date() }
                            : s
                    ),
                })),

            deleteChatSession: (id) =>
                set((state) => ({
                    chatSessions: state.chatSessions.filter((s) => s.id !== id),
                })),

            getChatSession: (id) => get().chatSessions.find((s) => s.id === id),

            forkSession: (originalSessionId, startMessageId, newTitle) => {
                const originalSession = get().chatSessions.find(s => s.id === originalSessionId);
                if (!originalSession) return null;

                const messageIndex = originalSession.messages.findIndex(m => m.id === startMessageId);
                if (messageIndex === -1) return null;

                // Slice messages up to and including the target message
                const newMessages = originalSession.messages.slice(0, messageIndex + 1);
                const newId = Date.now().toString();
                const now = new Date();

                const newSession: ChatSession = {
                    ...originalSession,
                    id: newId,
                    title: newTitle || `${originalSession.title} (Branch)`,
                    messages: newMessages,
                    lastMessage: newMessages[newMessages.length - 1].content,
                    createdAt: now,
                    updatedAt: now,
                    branchParentId: originalSessionId,
                    branchPointMessageId: startMessageId,
                    // Reset analysis fields for new branch
                    insights: undefined,
                    aiGeneratedTitle: false
                };

                set(state => ({
                    chatSessions: [newSession, ...state.chatSessions]
                }));

                return newId;
            },

            // Project Linking Implementation
            addCharacterToProject: (characterId, projectId) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                characterIds: [...(p.characterIds || []), characterId],
                                updatedAt: new Date()
                            }
                            : p
                    ),
                    characters: state.characters.map((c) =>
                        c.id === characterId
                            ? { ...c, projectId, updatedAt: new Date() }
                            : c
                    ),
                })),

            removeCharacterFromProject: (characterId, projectId) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                characterIds: (p.characterIds || []).filter(id => id !== characterId),
                                updatedAt: new Date()
                            }
                            : p
                    ),
                    characters: state.characters.map((c) =>
                        c.id === characterId && c.projectId === projectId
                            ? { ...c, projectId: undefined, updatedAt: new Date() }
                            : c
                    ),
                })),

            addWorldToProject: (worldId, projectId) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                worldIds: [...(p.worldIds || []), worldId],
                                updatedAt: new Date()
                            }
                            : p
                    ),
                    worlds: state.worlds.map((w) =>
                        w.id === worldId
                            ? { ...w, projectId, updatedAt: new Date() }
                            : w
                    ),
                })),

            removeWorldFromProject: (worldId, projectId) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                worldIds: (p.worldIds || []).filter(id => id !== worldId),
                                updatedAt: new Date()
                            }
                            : p
                    ),
                    worlds: state.worlds.map((w) =>
                        w.id === worldId && w.projectId === projectId
                            ? { ...w, projectId: undefined, updatedAt: new Date() }
                            : w
                    ),
                })),

            duplicateCharacter: (characterId) => {
                const character = get().characters.find(c => c.id === characterId);
                if (!character) return null;

                const newId = `${character.name.split(' ')[0].toUpperCase()}_${Date.now().toString().slice(-6)}`;
                const duplicate: Character = {
                    ...character,
                    id: newId,
                    name: `${character.name} (Copy)`,
                    projectId: undefined,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                set((state) => ({
                    characters: [...state.characters, duplicate]
                }));

                return newId;
            },

            duplicateWorld: (worldId) => {
                const world = get().worlds.find(w => w.id === worldId);
                if (!world) return null;

                const newId = `${world.name.split(' ')[0].toUpperCase()}_${Date.now().toString().slice(-6)}`;
                const duplicate: World = {
                    ...world,
                    id: newId,
                    name: `${world.name} (Copy)`,
                    projectId: undefined,
                    characterIds: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                set((state) => ({
                    worlds: [...state.worlds, duplicate]
                }));

                return newId;
            },

            getProjectForCharacter: (characterId) => {
                const character = get().characters.find(c => c.id === characterId);
                if (!character?.projectId) return undefined;
                return get().projects.find(p => p.id === character.projectId);
            },

            getProjectForWorld: (worldId) => {
                const world = get().worlds.find(w => w.id === worldId);
                if (!world?.projectId) return undefined;
                return get().projects.find(p => p.id === world.projectId);
            },

            // Character-to-World Linking Implementation
            linkCharacterToWorld: (characterId, worldId) =>
                set((state) => ({
                    characters: state.characters.map((c) =>
                        c.id === characterId
                            ? { ...c, worldId, updatedAt: new Date() }
                            : c
                    ),
                    worlds: state.worlds.map((w) =>
                        w.id === worldId
                            ? {
                                ...w,
                                characterIds: [...new Set([...(w.characterIds || []), characterId])],
                                updatedAt: new Date()
                              }
                            : w
                    ),
                })),

            unlinkCharacterFromWorld: (characterId) =>
                set((state) => {
                    const char = state.characters.find(c => c.id === characterId);
                    const worldId = char?.worldId;
                    return {
                        characters: state.characters.map((c) =>
                            c.id === characterId
                                ? { ...c, worldId: undefined, updatedAt: new Date() }
                                : c
                        ),
                        worlds: worldId ? state.worlds.map((w) =>
                            w.id === worldId
                                ? {
                                    ...w,
                                    characterIds: (w.characterIds || []).filter(id => id !== characterId),
                                    updatedAt: new Date()
                                  }
                                : w
                        ) : state.worlds,
                    };
                }),

            getWorldForCharacter: (characterId) => {
                const char = get().characters.find(c => c.id === characterId);
                if (!char?.worldId) return undefined;
                return get().worlds.find(w => w.id === char.worldId);
            },

            getCharactersForWorld: (worldId) =>
                get().characters.filter(c => c.worldId === worldId),

            // Document Implementation
            addCharacterDocument: (document) =>
                set((state) => ({
                    characterDocuments: [document, ...state.characterDocuments]
                })),

            updateCharacterDocument: (id, updates) =>
                set((state) => ({
                    characterDocuments: state.characterDocuments.map((doc) =>
                        doc.id === id
                            ? { ...doc, ...updates, updatedAt: new Date() }
                            : doc
                    ),
                })),

            deleteCharacterDocument: (id) =>
                set((state) => {
                    const doc = state.characterDocuments.find((d) => d.id === id);
                    if (doc) {
                        // Move to trash instead of hard delete
                        const trashItem: TrashItem = {
                            id: doc.id,
                            type: 'character_document',
                            data: doc,
                            deletedAt: new Date()
                        };
                        return {
                            characterDocuments: state.characterDocuments.filter((doc) => doc.id !== id),
                            trash: [...state.trash, trashItem]
                        };
                    }
                    return state;
                }),

            getCharacterDocuments: (characterId) =>
                get().characterDocuments.filter((doc) => doc.characterId === characterId),

            getCharacterDocument: (id) => get().characterDocuments.find((doc) => doc.id === id),

            // Project Document Implementation
            addProjectDocument: (document) =>
                set((state) => ({
                    projectDocuments: [document, ...state.projectDocuments]
                })),

            updateProjectDocument: (id, updates) =>
                set((state) => ({
                    projectDocuments: state.projectDocuments.map((doc) =>
                        doc.id === id
                            ? { ...doc, ...updates, updatedAt: new Date() }
                            : doc
                    ),
                })),

            deleteProjectDocument: (id) =>
                set((state) => {
                    const doc = state.projectDocuments.find((d) => d.id === id);
                    if (doc) {
                        // Move to trash instead of hard delete
                        const trashItem: TrashItem = {
                            id: doc.id,
                            type: 'project_document',
                            data: doc,
                            deletedAt: new Date()
                        };
                        return {
                            projectDocuments: state.projectDocuments.filter((doc) => doc.id !== id),
                            trash: [...state.trash, trashItem]
                        };
                    }
                    return state;
                }),

            getProjectDocuments: (projectId) =>
                get().projectDocuments.filter((doc) => doc.projectId === projectId),

            getProjectDocument: (id) => get().projectDocuments.find((doc) => doc.id === id),

            // Mode Preset Implementation
            addModePreset: (preset) =>
                set((state) => ({
                    modePresets: [preset, ...state.modePresets]
                })),

            updateModePreset: (id, updates) =>
                set((state) => ({
                    modePresets: state.modePresets.map((preset) =>
                        preset.id === id
                            ? { ...preset, ...updates, updatedAt: new Date() }
                            : preset
                    ),
                })),

            deleteModePreset: (id) =>
                set((state) => ({
                    modePresets: state.modePresets.filter((preset) => preset.id !== id),
                })),

            getModePreset: (id) => get().modePresets.find((preset) => preset.id === id),

            getModePresets: (mode) => {
                const presets = get().modePresets;
                if (!mode) return presets;
                return presets.filter((preset) => preset.mode === mode);
            },

            // Trash Implementation
            addToTrash: (item) =>
                set((state) => ({
                    trash: [...state.trash, item]
                })),

            restoreFromTrash: (id) =>
                set((state) => {
                    const trashItem = state.trash.find((item) => item.id === id);
                    if (!trashItem) return state;

                    const newState: any = {
                        trash: state.trash.filter((item) => item.id !== id)
                    };

                    // Restore based on type
                    switch (trashItem.type) {
                        case 'character':
                            newState.characters = [...state.characters, trashItem.data];
                            break;
                        case 'world':
                            newState.worlds = [...state.worlds, trashItem.data];
                            break;
                        case 'project':
                            newState.projects = [...state.projects, trashItem.data];
                            break;
                        case 'chat_session':
                            newState.chatSessions = [...state.chatSessions, trashItem.data];
                            break;
                        case 'character_document':
                            newState.characterDocuments = [...state.characterDocuments, trashItem.data];
                            break;
                        case 'project_document':
                            newState.projectDocuments = [...state.projectDocuments, trashItem.data];
                            break;
                    }

                    return newState;
                }),

            removeFromTrash: (id) =>
                set((state) => ({
                    trash: state.trash.filter((item) => item.id !== id)
                })),

            emptyTrash: () =>
                set({ trash: [] }),

            cleanupOldTrash: () =>
                set((state) => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return {
                        trash: state.trash.filter((item) => {
                            const deletedDate = new Date(item.deletedAt);
                            return deletedDate >= thirtyDaysAgo;
                        })
                    };
                }),

            // Phase 1: Entity Stub Creation (@ Mention System)
            createCharacterStub: (name: string) => {
                const id = `#${name.toUpperCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                const now = new Date();
                const character: Character = {
                    id,
                    name,
                    aliases: [],
                    role: 'supporting',
                    genre: '',
                    progress: 5,
                    phase: 'Foundation',
                    coreConcept: '[Auto-created from @mention. Flesh out later.]',
                    motivation: '',
                    internalConflict: '',
                    externalConflict: '',
                    characterArc: '',
                    createdAt: now,
                    updatedAt: now,
                    tags: ['stub', 'needs-development']
                };

                set((state) => ({
                    characters: [...state.characters, character],
                    developmentQueue: [...state.developmentQueue, {
                        entityId: id,
                        entityType: 'character',
                        createdAt: now
                    }]
                }));

                return id;
            },

            createWorldStub: (name: string) => {
                const id = `@${name.toUpperCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                const now = new Date();
                const world: World = {
                    id,
                    name,
                    aliases: [],
                    genre: '',
                    progress: 0,
                    description: '[Auto-created from @mention. Flesh out later.]',
                    rules: [],
                    keyLocations: [],
                    culturalElements: [],
                    history: '',
                    characterIds: [],
                    createdAt: now,
                    updatedAt: now,
                    tags: ['stub', 'needs-development']
                };

                set((state) => ({
                    worlds: [...state.worlds, world],
                    developmentQueue: [...state.developmentQueue, {
                        entityId: id,
                        entityType: 'world',
                        createdAt: now
                    }]
                }));

                return id;
            },

            createProjectStub: (name: string) => {
                const id = `$${name.toUpperCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                const now = new Date();
                const project: Project = {
                    id,
                    name,
                    aliases: [],
                    genre: '',
                    summary: '',
                    progress: 0,
                    description: '[Auto-created from @mention. Flesh out later.]',
                    characterIds: [],
                    worldIds: [],
                    createdAt: now,
                    updatedAt: now,
                    tags: ['stub', 'needs-development']
                };

                set((state) => ({
                    projects: [...state.projects, project],
                    developmentQueue: [...state.developmentQueue, {
                        entityId: id,
                        entityType: 'project',
                        createdAt: now
                    }]
                }));

                return id;
            },

            // Phase 1: Development Queue Management
            addToDevelopmentQueue: (entityId, entityType) =>
                set((state) => {
                    // Check if already in queue
                    if (state.developmentQueue.some(item => item.entityId === entityId)) {
                        return state;
                    }
                    return {
                        developmentQueue: [...state.developmentQueue, {
                            entityId,
                            entityType,
                            createdAt: new Date()
                        }]
                    };
                }),

            removeFromDevelopmentQueue: (entityId) =>
                set((state) => ({
                    developmentQueue: state.developmentQueue.filter(item => item.entityId !== entityId)
                })),

            getDevelopmentQueue: () => get().developmentQueue,

            isInDevelopmentQueue: (entityId) =>
                get().developmentQueue.some(item => item.entityId === entityId),

            // User Asset Actions
            addUserAsset: (asset) =>
                set((state) => ({
                    userAssets: [...state.userAssets, asset]
                })),

            updateUserAsset: (id, updates) =>
                set((state) => ({
                    userAssets: state.userAssets.map((asset) =>
                        asset.id === id
                            ? { ...asset, ...updates, updatedAt: new Date() }
                            : asset
                    )
                })),

            deleteUserAsset: (id) =>
                set((state) => ({
                    userAssets: state.userAssets.filter((asset) => asset.id !== id),
                    // Also remove from any chat sessions
                    chatSessions: state.chatSessions.map((session) => ({
                        ...session,
                        attachments: session.attachments?.filter((assetId) => assetId !== id) || []
                    }))
                })),

            getUserAsset: (id) => get().userAssets.find((asset) => asset.id === id),

            getUserAssets: (type) => {
                const assets = get().userAssets;
                return type ? assets.filter((asset) => asset.type === type) : assets;
            },

            attachAssetToChat: (chatSessionId, assetId) =>
                set((state) => ({
                    chatSessions: state.chatSessions.map((session) =>
                        session.id === chatSessionId
                            ? {
                                ...session,
                                attachments: [...(session.attachments || []), assetId].filter(
                                    (id, index, arr) => arr.indexOf(id) === index // Remove duplicates
                                )
                            }
                            : session
                    ),
                    userAssets: state.userAssets.map((asset) =>
                        asset.id === assetId
                            ? {
                                ...asset,
                                usedInChats: [...(asset.usedInChats || []), chatSessionId].filter(
                                    (id, index, arr) => arr.indexOf(id) === index
                                ),
                                lastUsedAt: new Date()
                            }
                            : asset
                    )
                })),

            detachAssetFromChat: (chatSessionId, assetId) =>
                set((state) => ({
                    chatSessions: state.chatSessions.map((session) =>
                        session.id === chatSessionId
                            ? {
                                ...session,
                                attachments: session.attachments?.filter((id) => id !== assetId) || []
                            }
                            : session
                    )
                })),

            updateUserAssetVisionAnalysis: (id, visionAnalysis, provider) =>
                set((state) => ({
                    userAssets: state.userAssets.map((asset) =>
                        asset.id === id
                            ? {
                                ...asset,
                                visionAnalysis,
                                visionAnalysisProvider: provider || visionAnalysis?.provider,
                                visionAnalyzedAt: visionAnalysis ? new Date() : undefined,
                                updatedAt: new Date()
                            }
                            : asset
                    )
                })),
        }),
        {
            name: '5d-storage',
            partialize: (state) => ({
                characters: state.characters,
                worlds: state.worlds,
                projects: state.projects,
                chatSessions: state.chatSessions,
                characterDocuments: state.characterDocuments,
                projectDocuments: state.projectDocuments,
                modePresets: state.modePresets,
                trash: state.trash,
                developmentQueue: state.developmentQueue, // Phase 1
                userAssets: state.userAssets, // User uploaded files
                isSidebarCollapsed: state.isSidebarCollapsed
            }),
        }
    )
);

// Alias for backward compatibility
export const useCharacterStore = useStore;
