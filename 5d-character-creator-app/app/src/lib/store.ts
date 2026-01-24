import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character } from '@/types/character';
import { World } from '@/types/world';
import { Project } from '@/types/project';
import { ChatSession } from '@/types/chat';

interface GlobalState {
    characters: Character[];
    worlds: World[];
    projects: Project[];
    chatSessions: ChatSession[];

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
}

export const useStore = create<GlobalState>()(
    persist(
        (set, get) => ({
            characters: [],
            worlds: [],
            projects: [],
            chatSessions: [],

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
                set((state) => ({
                    characters: state.characters.filter((char) => char.id !== id),
                    activeCharacterId: state.activeCharacterId === id ? null : state.activeCharacterId,
                })),

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
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                    activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
                })),

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
        }),
        {
            name: '5d-storage',
            partialize: (state) => ({
                characters: state.characters,
                worlds: state.worlds,
                projects: state.projects,
                chatSessions: state.chatSessions,
                isSidebarCollapsed: state.isSidebarCollapsed
            }),
        }
    )
);

// Alias for backward compatibility
export const useCharacterStore = useStore;
