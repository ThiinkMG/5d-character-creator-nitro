'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Search, Send, Menu, Sparkles, User, Globe, Folder, FileText, ChevronRight, X, Command, RefreshCw, Trash2, MoreVertical, AlertCircle, Save, Settings, Copy, RotateCcw, Check, Link2, Unlink, GitFork } from 'lucide-react';
import { EntityLinker } from '@/components/chat/EntityLinker';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChoiceChips, type Choice, type ChoiceContext } from '@/components/chat/ChoiceModal';
import { CommandTutorialModal } from '@/components/chat/CommandTutorialModal';
import { useStore } from '@/lib/store';
import { getChatApiKey, getApiConfig } from '@/lib/api-keys';

import { ChatSession, Message, AppliedUpdate } from '@/types/chat';
import { PendingUpdateCard } from '@/components/chat/PendingUpdateCard';
import { ReloadModal } from '@/components/chat/ReloadModal';
import { UpdateHistorySidebar } from '@/components/chat/UpdateHistorySidebar';
import { ModeSwitcher, type ChatMode } from '@/components/chat/ModeSwitcher';
import { ModePresetManager } from '@/components/chat/ModePresetManager';
import { getModeInstruction as getModeInstructionFromRegistry } from '@/lib/mode-registry';
import { ManualSaveModal } from '@/components/chat/ManualSaveModal';
import { SessionSetupModal, type SessionSetupConfig } from '@/components/chat/SessionSetupModal';
import { SaveDocumentModal } from '@/components/chat/SaveDocumentModal';
import { SaveDocumentOptionModal } from '@/components/chat/SaveDocumentOptionModal';
import { SaveProjectDocumentModal } from '@/components/project/SaveProjectDocumentModal';
import { ProjectDocumentType } from '@/types/document';
import { fuzzyMatchByName, findBestMatch } from '@/lib/fuzzy-match';
import { createDocumentFromSession, sessionToDocumentContent, generateDocumentTitle } from '@/lib/document-utils';
import { History } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// Parse choices from AI response
function parseChoices(content: string): { cleanContent: string; choices: Choice[] } {
    const choices: Choice[] = [];
    let cleanContent = content;

    // Check for [OPTIONS: ...] or [CHOICES: ...] format (more flexible regex)
    // Match can be on same line or new line, with or without spaces
    const optionsPatterns = [
        /\[(OPTIONS|CHOICES):\s*([^\]]+)\]/i,  // Standard format
        /\[(OPTIONS|CHOICES):\s*\n([^\]]+)\]/i, // With newline
        /\[(OPTIONS|CHOICES):\s*([^|\]]+(?:\s*\|\s*[^|\]]+)+)\]/i, // With pipes
    ];
    
    let optionsMatch = null;
    for (const pattern of optionsPatterns) {
        optionsMatch = content.match(pattern);
        if (optionsMatch) break;
    }
    
    if (optionsMatch) {
        const optionsStr = optionsMatch[2] || optionsMatch[3] || '';
        // Split by | and clean up
        const options = optionsStr.split('|').map(s => s.trim()).filter(s => s.length > 0);
        options.forEach((opt, idx) => {
            // Remove any trailing punctuation that might have been included
            const cleanOpt = opt.replace(/[.,;:!?]+$/, '').trim();
            if (cleanOpt) {
                choices.push({
                    id: `choice-${idx}`,
                    label: cleanOpt,
                });
            }
        });
        // Remove the options tag from content but preserve the rest
        cleanContent = content.replace(optionsMatch[0], '').trim();
    }

    // Fallback: Check for numbered list patterns if no explicit options found
    if (!choices.length) {
        const numberedPattern = /(?:Choose one|Select|Pick|Options?|What would you like).*?:\s*\n((?:\d+\.\s*.+\n?)+)/i;
        const numberedMatch = content.match(numberedPattern);
        if (numberedMatch) {
            const lines = numberedMatch[1].split('\n').filter(l => /^\d+\./.test(l.trim()));
            lines.forEach((line, idx) => {
                const text = line.replace(/^\d+\.\s*/, '').trim();
                if (text) {
                    choices.push({
                        id: `choice-${idx}`,
                        label: text,
                    });
                }
            });
            if (choices.length > 0) {
                cleanContent = content.replace(numberedMatch[0], '').trim();
            }
        }
    }

    return { cleanContent, choices };
}


const AVAILABLE_COMMANDS = [
    { id: 'generate-basic', label: '/generate basic', description: 'Quick 5-7 question character', icon: User },
    { id: 'generate-advanced', label: '/generate advanced', description: 'Full 5-phase development', icon: User },
    { id: 'worldbio', label: '/worldbio', description: 'Create a world setting', icon: Globe },
    { id: 'simulate', label: '/simulate [scenario]', description: 'Stress-test character in scenarios', icon: Sparkles },
    { id: 'analyze', label: '/analyze [#CID]', description: 'Expert framework review', icon: Search },
    { id: 'workshop', label: '/workshop [section]', description: 'Deep-dive into specific section', icon: FileText },
    { id: 'expand', label: '/expand [field]', description: 'Expand a specific field with details', icon: ChevronRight },
    { id: 'revise', label: '/revise [field]', description: 'Revise and improve existing content', icon: RotateCcw },
    { id: 'menu', label: '/menu', description: 'See all commands', icon: Command },
    { id: 'help', label: '/help [command]', description: 'Get usage details', icon: AlertCircle },
];

// Map output types to project document types
const OUTPUT_TYPE_TO_DOC_TYPE: Record<string, ProjectDocumentType> = {
    pitch_movie: 'movie-pitch',
    pitch_tv: 'tv-series-pitch',
    pitch_book: 'book-pitch',
    treatment: 'treatment',
    synopsis: 'synopsis',
    story_bible: 'story-bible',
};

// Output type instructions for project document generation
const OUTPUT_TYPE_INSTRUCTIONS: Record<string, { label: string; instruction: string }> = {
    pitch_movie: {
        label: 'Movie Pitch',
        instruction: `[OUTPUT MODE: MOVIE PITCH DECK]
You are generating a professional FILM PITCH for this project.

## Structure to Generate:
1. **Logline** (1-2 sentences capturing the hook)
2. **Genre & Tone** (e.g., "Sci-fi thriller with noir elements")
3. **Synopsis** (3-5 paragraphs - setup, conflict, resolution)
4. **Main Characters** (brief descriptions with actor comparisons if relevant)
5. **Visual Style** (cinematography, color palette, reference films)
6. **Target Audience** (demographics, comparable films' box office)
7. **Unique Selling Points** (what makes this stand out)

## Format:
- Write in present tense, active voice
- Use industry-standard terminology
- Keep it compelling and cinematic
- Total length: 2-3 pages

Generate the pitch deck now based on the project data provided.`
    },
    pitch_tv: {
        label: 'TV Series Pitch',
        instruction: `[OUTPUT MODE: TV SERIES PITCH BIBLE]
You are generating a professional TV SERIES PITCH BIBLE for this project.

## Structure to Generate:
1. **Series Logline** (1-2 sentences)
2. **Series Overview** (tone, genre, episode format)
3. **Pilot Episode Synopsis** (detailed A/B story breakdown)
4. **Season Arc** (major plot points for Season 1)
5. **Character Breakdowns** (main cast with arcs)
6. **Episode Ideas** (5-6 episode concepts)
7. **World/Setting** (rules, visual style)
8. **Comparable Shows** (tone and audience references)
9. **Why Now?** (cultural relevance, market fit)

## Format:
- Write for streaming/network executives
- Include episodic potential and "engine" of the show
- Emphasize character growth and season-long arcs
- Total length: 4-6 pages

Generate the TV pitch bible now based on the project data provided.`
    },
    pitch_book: {
        label: 'Book Proposal',
        instruction: `[OUTPUT MODE: BOOK PROPOSAL]
You are generating a professional BOOK PROPOSAL for this project.

## Structure to Generate:
1. **Title & Subtitle**
2. **Genre & Category** (with comp titles)
3. **Hook** (the compelling question/premise)
4. **Synopsis** (complete plot summary, 2-3 pages)
5. **Chapter Outline** (brief description of each chapter/section)
6. **Character Profiles** (main characters)
7. **Author Platform** (placeholder for author bio)
8. **Target Audience** (reader demographics)
9. **Market Analysis** (comparable titles, market positioning)
10. **Sample Chapter** (offer to generate if requested)

## Format:
- Write for literary agents and publishers
- Use third person for synopsis
- Include word count estimate
- Total length: 3-5 pages

Generate the book proposal now based on the project data provided.`
    },
    treatment: {
        label: 'Treatment',
        instruction: `[OUTPUT MODE: STORY TREATMENT]
You are generating a professional TREATMENT for this project.

## Structure to Generate:
1. **Title & Genre**
2. **Logline**
3. **Detailed Narrative** (the full story written in prose)
   - Act 1: Setup (characters, world, inciting incident)
   - Act 2: Confrontation (rising action, complications, midpoint)
   - Act 3: Resolution (climax, falling action, ending)

## Format:
- Write in present tense, third person
- Include all major scenes and plot points
- Show character emotions and motivations
- Describe key visual moments
- Total length: 5-10 pages

Generate the treatment now based on the project data provided.`
    },
    synopsis: {
        label: 'Synopsis',
        instruction: `[OUTPUT MODE: SYNOPSIS]
You are generating a concise SYNOPSIS for this project.

## Structure to Generate:
1. **Opening Hook** (1 sentence)
2. **Setup** (introduce protagonist, world, status quo)
3. **Inciting Incident** (what disrupts the status quo)
4. **Rising Action** (key conflicts and complications)
5. **Climax** (the decisive moment)
6. **Resolution** (how it ends, character transformation)

## Format:
- Write in present tense, third person
- Cover beginning, middle, and end (including spoilers)
- Focus on protagonist's journey
- Total length: 1-2 pages

Generate the synopsis now based on the project data provided.`
    },
    story_bible: {
        label: 'Story Bible',
        instruction: `[OUTPUT MODE: STORY BIBLE]
You are generating a comprehensive STORY BIBLE for this project.

## Structure to Generate:
1. **Series/Project Overview**
   - Logline, genre, tone, themes
2. **World Building**
   - Setting, time period, rules, history
   - Maps/locations (descriptions)
   - Technology/magic systems
3. **Character Bible**
   - Full profiles for all major characters
   - Relationships and dynamics
   - Character arcs
4. **Plot Structure**
   - Overall story arc
   - Key plot points and timeline
   - Subplots
5. **Themes & Motifs**
   - Central themes
   - Recurring symbols
   - Philosophical questions
6. **Style Guide**
   - Tone of voice
   - Visual aesthetic
   - Reference works
7. **Appendices**
   - Glossary of terms
   - Timeline of events
   - FAQ

## Format:
- Comprehensive reference document
- Use headers and bullet points for easy navigation
- Include cross-references between sections
- Total length: 10-20 pages

Generate the story bible now based on the project data provided.`
    }
};

// Enhanced welcome message builder
interface WelcomeMessageOptions {
    entityName: string;
    entityType: 'character' | 'world' | 'project';
    progress?: number;
    linkedWorld?: { id: string; name: string } | null;
    linkedProject?: { id: string; name: string } | null;
    linkedCharacters?: Array<{ id: string; name: string }>;
    linkedWorlds?: Array<{ id: string; name: string }>;
    missingFields?: string[];
}

function buildEnhancedWelcomeMessage(options: WelcomeMessageOptions): { content: string; choices: Choice[] } {
    const { entityName, entityType, progress, linkedWorld, linkedProject, linkedCharacters, linkedWorlds, missingFields } = options;

    let content = `Welcome! I'm here to help you develop **${entityName}**.`;

    // Add progress indicator
    if (progress !== undefined) {
        const progressEmoji = progress >= 80 ? '🌟' : progress >= 50 ? '📈' : progress >= 25 ? '🔧' : '🌱';
        content += `\n\n${progressEmoji} **Progress: ${progress}%**`;
        if (progress < 100 && missingFields && missingFields.length > 0) {
            content += ` — Consider filling in: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`;
        } else if (progress >= 80) {
            content += ` — Great progress! Your ${entityType} is well-developed.`;
        }
    }

    // Add linked entities info
    if (entityType === 'character') {
        if (linkedWorld) {
            content += `\n\n🌐 **World:** [${linkedWorld.name}](/worlds/${linkedWorld.id})`;
        }
        if (linkedProject) {
            content += `\n📁 **Project:** [${linkedProject.name}](/projects/${linkedProject.id})`;
        }
        if (!linkedWorld && !linkedProject) {
            content += `\n\n💡 *Tip: Link this character to a world or project for richer context.*`;
        }
    } else if (entityType === 'world') {
        if (linkedProject) {
            content += `\n\n📁 **Project:** [${linkedProject.name}](/projects/${linkedProject.id})`;
        }
        if (linkedCharacters && linkedCharacters.length > 0) {
            const charNames = linkedCharacters.slice(0, 3).map(c => c.name).join(', ');
            content += `\n👥 **Characters:** ${charNames}${linkedCharacters.length > 3 ? ` (+${linkedCharacters.length - 3} more)` : ''}`;
        }
    } else if (entityType === 'project') {
        if (linkedCharacters && linkedCharacters.length > 0) {
            content += `\n\n👥 **Characters:** ${linkedCharacters.length}`;
        }
        if (linkedWorlds && linkedWorlds.length > 0) {
            content += `\n🌐 **Worlds:** ${linkedWorlds.length}`;
        }
    }

    // Add what I can help with section
    content += `\n\n**What would you like to do?**`;

    // Build choices based on entity type and progress
    let choices: Choice[] = [];

    if (entityType === 'character') {
        choices = [
            { id: 'personality', label: '🧠 Refine Personality', description: 'Develop character traits' },
            { id: 'backstory', label: '📜 Expand Backstory', description: 'Add more history' },
            { id: 'arc', label: '📈 Develop Arc', description: 'Character growth journey' },
        ];
        if (progress && progress >= 50) {
            choices.push({ id: 'scene', label: '🎬 Create Scene', description: 'Write a scene' });
        } else {
            choices.push({ id: 'suggestions', label: '💡 Get Suggestions', description: 'AI recommendations' });
        }
    } else if (entityType === 'world') {
        choices = [
            { id: 'expand', label: '📖 Expand Lore', description: 'Add more world details' },
            { id: 'factions', label: '⚔️ Develop Factions', description: 'Create or refine factions' },
            { id: 'locations', label: '🗺️ Add Locations', description: 'Create new places' },
            { id: 'suggestions', label: '💡 Get Suggestions', description: 'AI recommendations' }
        ];
    } else if (entityType === 'project') {
        choices = [
            { id: 'plot', label: '📖 Develop Plot', description: 'Build story structure' },
            { id: 'timeline', label: '📅 Add Events', description: 'Create timeline entries' },
            { id: 'integrate', label: '🔗 Integrate Elements', description: 'Link characters/worlds' },
            { id: 'suggestions', label: '💡 Get Suggestions', description: 'AI recommendations' }
        ];
    }

    return { content, choices };
}

function ChatContent() {
    const {
        characters,
        worlds,
        projects,
        addChatSession,
        updateChatSession,
        getChatSession,
        chatSessions,
        addCharacter,
        updateCharacter,
        addWorld,
        updateWorld,
        addProject,
        updateProject,
        activeCharacterId,
        activeWorldId,
        activeProjectId,
        forkSession,
        addCharacterDocument,
        updateCharacterDocument,
        characterDocuments,
        addProjectDocument,
        updateProjectDocument,
        projectDocuments
    } = useStore();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');
    const promptParam = searchParams.get('prompt');
    const sessionIdParam = searchParams.get('sessionId');
    const targetIdParam = searchParams.get('id'); // ID if editing/workshop
    const parentWorldIdParam = searchParams.get('parentWorldId'); // For new characters
    const outputTypeParam = searchParams.get('output'); // For project document generation (pitch, treatment, etc.)



    // State
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Welcome to 5D Character Creator! ðŸŽ­

I'm your AI partner for building deep, psychologically rich characters.

**Quick Commands:**
â€¢ \`/generate basic\` â€” Quick 5-7 question character
â€¢ \`/generate advanced\` â€” Full 5-phase development
â€¢ \`/worldbio\` â€” Create a world setting
â€¢ \`/menu\` â€” See all commands

What would you like to create today?`,
            choices: [
                { id: 'basic', label: 'ðŸŽ­ Create Character', description: 'Quick 5-7 questions' },
                { id: 'world', label: 'ðŸŒ Build World', description: 'Create a setting' },
                { id: 'menu', label: 'ðŸ“‹ See Commands', description: 'View all options' },
            ],
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dismissApiKeyBanner, setDismissApiKeyBanner] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [showCommandTutorial, setShowCommandTutorial] = useState(false);
    const [activePersona, setActivePersona] = useState<string | null>(null);

    const [apiConfig, setApiConfig] = useState<{
        provider: string;
        anthropicKey: string;
        openaiKey: string;
    } | null>(null);

    // Mention & Command State
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [commandQuery, setCommandQuery] = useState<string | null>(null);
    const [cursorIndex, setCursorIndex] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const autoStartRef = useRef(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [appliedUpdates, setAppliedUpdates] = useState<Set<string>>(new Set());
    const [showGenerateOptions, setShowGenerateOptions] = useState(true); // New state for options toggle - default enabled

    // Reload State
    const [showReloadModal, setShowReloadModal] = useState(false);
    const [reloadTargetId, setReloadTargetId] = useState<string | null>(null);

    // History Sidebar State
    const [showHistorySidebar, setShowHistorySidebar] = useState(false);

    // Session tagging state

    // Session tagging state
    const [tagInputOpen, setTagInputOpen] = useState(false);
    const [newTag, setNewTag] = useState('');

    // Entity linking state - tracks which character/world/project this chat is editing
    const [linkedEntity, setLinkedEntity] = useState<{ type: 'character' | 'world' | 'project'; id: string; name: string } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

    // Manual save modal state
    const [showManualSaveModal, setShowManualSaveModal] = useState(false);
    const [manualSaveData, setManualSaveData] = useState<{
        type: 'character' | 'world' | 'project';
        data: any;
        originalData?: any;
    } | null>(null);

    // Save document modal state
    const [showSaveDocumentModal, setShowSaveDocumentModal] = useState(false);
    const [showSaveDocumentOptionModal, setShowSaveDocumentOptionModal] = useState(false);
    const [isExtractingContent, setIsExtractingContent] = useState(false);
    const [extractedContent, setExtractedContent] = useState<string | null>(null);
    const [saveDocumentTitle, setSaveDocumentTitle] = useState<string>('');
    const [saveDocumentContent, setSaveDocumentContent] = useState<string>('');

    // Save project document modal state
    const [showSaveProjectDocumentModal, setShowSaveProjectDocumentModal] = useState(false);
    const [saveProjectDocumentTitle, setSaveProjectDocumentTitle] = useState<string>('');
    const [saveProjectDocumentContent, setSaveProjectDocumentContent] = useState<string>('');
    const [selectedProjectDocType, setSelectedProjectDocType] = useState<ProjectDocumentType | null>(null);

    // Session setup modal state
    const [showSessionSetup, setShowSessionSetup] = useState(false);
    const [sessionSetupMode, setSessionSetupMode] = useState<'script' | 'scene' | 'chat_with' | null>(null);
    const [sessionSetupConfig, setSessionSetupConfig] = useState<SessionSetupConfig | null>(null);

    // Context Switch / Link Handler with fuzzy matching support
    const handleSetLinkedEntity = (entity: { type: 'character' | 'world' | 'project'; id: string; name: string } | null, query?: string) => {
        if (!entity) {
            setLinkedEntity(null);
            if (activeSessionId) {
                updateChatSession(activeSessionId, { relatedId: undefined });
            }
            return;
        }

        // If query provided, try fuzzy matching first
        if (query && query.trim()) {
            let matched: { id: string; name: string } | null = null;
            
            if (entity.type === 'character') {
                matched = findBestMatch(characters, query, 0.5);
            } else if (entity.type === 'world') {
                matched = findBestMatch(worlds, query, 0.5);
            } else if (entity.type === 'project') {
                matched = findBestMatch(projects, query, 0.5);
            }
            
            if (matched) {
                entity = { ...entity, id: matched.id, name: matched.name };
                setToast({
                    message: `Found "${matched.name}" (fuzzy match)`,
                    type: 'info'
                });
                setTimeout(() => setToast(null), 3000);
            }
        }

        // Check for context switch
        if (linkedEntity && linkedEntity.type !== entity.type) {
            setToast({
                message: `Switched context to ${entity.type}: ${entity.name}`,
                type: 'warning'
            });
            setTimeout(() => setToast(null), 3000);
        } else if (!linkedEntity) {
            setToast({
                message: `Linked to ${entity.name}`,
                type: 'success'
            });
            setTimeout(() => setToast(null), 3000);
        }

        setLinkedEntity(entity);
        if (activeSessionId) {
            updateChatSession(activeSessionId, { relatedId: entity.id });
        }
    };
    
    // Mode switching handler
    const handleModeChange = (newMode: ChatMode, targetId?: string) => {
        const params = new URLSearchParams();
        params.set('mode', newMode);
        if (targetId) {
            params.set('id', targetId);
        }
        window.location.href = `/chat?${params.toString()}`;
    };

    // Load API config from localStorage
    useEffect(() => {
        const config = getApiConfig();
        setApiConfig(config);
    }, []);

    // Get current API key using utility (checks admin keys first)
    const provider = (apiConfig?.provider === 'openai' || apiConfig?.provider === 'anthropic') ? apiConfig.provider : 'anthropic';
    const currentApiKey = getChatApiKey(provider);
    const hasApiKey = !!currentApiKey;
    
    // Note: hasAdminKeys state removed - we now check directly in render using getChatApiKey()
    // This ensures the status indicator always uses the latest values from localStorage

    // Check if admin mode is active
    useEffect(() => {
        const checkAdminMode = () => {
            setIsAdminMode(typeof window !== 'undefined' && localStorage.getItem('5d-admin-mode') === 'true');
        };
        checkAdminMode();
        // Listen for storage changes (in case admin mode is toggled in another tab)
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', checkAdminMode);
            // Also check periodically in case admin mode is toggled in same tab
            const interval = setInterval(checkAdminMode, 1000);
            return () => {
                window.removeEventListener('storage', checkAdminMode);
                clearInterval(interval);
            };
        }
    }, []);

    // Restore Chat Session
    useEffect(() => {
        if (sessionIdParam) {
            // Check store (reactive to hydration updates)
            const session = chatSessions.find(s => s.id === sessionIdParam);
            if (session) {
                // Determine if we should restore (if messages are different or activeSessionId mismatch)
                if (activeSessionId !== session.id) {
                    // Only restore if we have valid messages, otherwise fallback to welcome is fine (default state)
                    if (session.messages && session.messages.length > 0) {
                        setMessages(session.messages);
                        setActiveSessionId(session.id);

                        // Restore applied updates from session
                        if (session.appliedMessageIds && session.appliedMessageIds.length > 0) {
                            setAppliedUpdates(new Set(session.appliedMessageIds));
                        }

                        // Restore linked entity context if available
                        if (session.relatedId) {
                            const char = characters.find(c => c.id === session.relatedId);
                            const world = worlds.find(w => w.id === session.relatedId);
                            // Entity linking state - tracks which character/world this chat is editing
                            if (char) setLinkedEntity({ type: 'character', id: char.id, name: char.name });
                            else if (world) setLinkedEntity({ type: 'world', id: world.id, name: world.name });
                            else {
                                const project = projects.find(p => p.id === session.relatedId);
                                if (project) setLinkedEntity({ type: 'project', id: project.id, name: project.name });
                            }
                        }
                    }
                }
            }
        }
    }, [sessionIdParam, chatSessions, activeSessionId, characters, worlds, projects]);

    // Auto-link entity when id parameter is present (from character/world page)
    useEffect(() => {
        // Check for both id and characterId params
        const entityIdParam = targetIdParam || searchParams.get('characterId');
        
        if (entityIdParam && !linkedEntity && !autoStartRef.current) {
            // Determine entity type from mode or by checking which store has the ID
            let entity: { type: 'character' | 'world' | 'project'; id: string; name: string } | null = null;
            
            if (mode === 'world' || mode === 'character' || mode === 'project' || mode === 'chat_with' || mode === 'scene' || mode === 'script') {
                if (mode === 'character' || mode === 'chat_with') {
                    const char = characters.find(c => c.id === entityIdParam);
                    if (char) entity = { type: 'character', id: char.id, name: char.name };
                } else if (mode === 'world') {
                    const world = worlds.find(w => w.id === entityIdParam);
                    if (world) entity = { type: 'world', id: world.id, name: world.name };
                } else if (mode === 'project') {
                    const project = projects.find(p => p.id === entityIdParam);
                    if (project) entity = { type: 'project', id: project.id, name: project.name };
                } else if (mode === 'scene' || mode === 'script') {
                    // For scene and script modes, use entityIdParam which already checks both characterId and id
                    const char = characters.find(c => c.id === entityIdParam);
                    if (char) entity = { type: 'character', id: char.id, name: char.name };
                }
            } else {
                // Try to find in any store
                const char = characters.find(c => c.id === targetIdParam);
                const world = worlds.find(w => w.id === targetIdParam);
                const project = projects.find(p => p.id === targetIdParam);
                
                if (char) entity = { type: 'character', id: char.id, name: char.name };
                else if (world) entity = { type: 'world', id: world.id, name: world.name };
                else if (project) entity = { type: 'project', id: project.id, name: project.name };
            }
            
            if (entity) {
                setLinkedEntity(entity);
                // For script, scene, and chat_with modes, show setup modal instead of welcome message
                if ((mode === 'script' || mode === 'scene' || mode === 'chat_with') && entity.type === 'character') {
                    setSessionSetupMode(mode as 'script' | 'scene' | 'chat_with');
                    setShowSessionSetup(true);
                    return; // Don't set messages yet, wait for setup
                }
                // Set contextual welcome message based on entity type and mode
                if (entity.type === 'world') {
                    const world = worlds.find(w => w.id === entity.id);
                    const linkedProject = world?.projectId ? projects.find(p => p.id === world.projectId) : null;
                    const linkedChars = characters.filter(c => c.worldId === entity.id);
                    const { content, choices } = buildEnhancedWelcomeMessage({
                        entityName: entity.name,
                        entityType: 'world',
                        progress: world?.progress,
                        linkedProject: linkedProject ? { id: linkedProject.id, name: linkedProject.name } : null,
                        linkedCharacters: linkedChars.map(c => ({ id: c.id, name: c.name }))
                    });
                    setMessages([{ id: 'welcome', role: 'assistant', content, choices }]);
                } else if (entity.type === 'character') {
                    const char = characters.find(c => c.id === entity.id);
                    const linkedWorld = char?.worldId ? worlds.find(w => w.id === char.worldId) : null;
                    const linkedProject = char?.projectId ? projects.find(p => p.id === char.projectId) : null;
                    const missingFields = char ? [
                        !char.coreConcept && 'core concept',
                        !char.backstoryProse && 'backstory',
                        !char.personalityProse && 'personality',
                        !char.arcProse && 'character arc'
                    ].filter(Boolean) as string[] : [];
                    const { content, choices } = buildEnhancedWelcomeMessage({
                        entityName: entity.name,
                        entityType: 'character',
                        progress: char?.progress,
                        linkedWorld: linkedWorld ? { id: linkedWorld.id, name: linkedWorld.name } : null,
                        linkedProject: linkedProject ? { id: linkedProject.id, name: linkedProject.name } : null,
                        missingFields
                    });
                    setMessages([{ id: 'welcome', role: 'assistant', content, choices }]);
                } else if (entity.type === 'project') {
                    const project = projects.find(p => p.id === entity.id);
                    const linkedChars = characters.filter(c => c.projectId === entity.id);
                    const linkedWorlds = worlds.filter(w => w.projectId === entity.id);

                    // Check if there's an output type for document generation
                    if (outputTypeParam && OUTPUT_TYPE_INSTRUCTIONS[outputTypeParam]) {
                        const outputConfig = OUTPUT_TYPE_INSTRUCTIONS[outputTypeParam];
                        const welcomeContent = `Ready to generate a **${outputConfig.label}** for **${entity.name}**.

**Project Summary:** ${project?.summary || 'No summary available'}
**Genre:** ${project?.genre || 'Not specified'}
**Characters:** ${linkedChars.length > 0 ? linkedChars.map(c => c.name).join(', ') : 'None linked'}
**Worlds:** ${linkedWorlds.length > 0 ? linkedWorlds.map(w => w.name).join(', ') : 'None linked'}

Click **Generate** to create the document, or provide specific instructions for customization.`;

                        setMessages([{
                            id: 'welcome',
                            role: 'assistant',
                            content: welcomeContent,
                            choices: [
                                { id: 'generate', label: `Generate ${outputConfig.label}`, description: 'Create the full document' },
                                { id: 'customize', label: 'Customize First', description: 'Add specific requirements' }
                            ]
                        }]);
                    } else {
                        const { content, choices } = buildEnhancedWelcomeMessage({
                            entityName: entity.name,
                            entityType: 'project',
                            progress: project?.progress,
                            linkedCharacters: linkedChars.map(c => ({ id: c.id, name: c.name })),
                            linkedWorlds: linkedWorlds.map(w => ({ id: w.id, name: w.name }))
                        });
                        setMessages([{ id: 'welcome', role: 'assistant', content, choices }]);
                    }
                }
            }
        }
    }, [targetIdParam, mode, linkedEntity, characters, worlds, projects, searchParams]);

    // Auto-Title Logic
    useEffect(() => {
        if (!activeSessionId || isLoading || !hasApiKey) return;

        const session = chatSessions.find(s => s.id === activeSessionId);
        if (!session) return;

        // Trigger if we have 3+ messages (Welcome + User + Assistant) and no AI title
        if (session.messages.length >= 3 && !session.aiGeneratedTitle && !session.title.includes('(Branch)')) {
            // Mark as generated immediately to prevent loops
            updateChatSession(activeSessionId, { aiGeneratedTitle: true });

            const generateTitle = async () => {
                try {
                    // Extract recent context for titling
                    const context = session.messages.slice(1, 6).map(m => `${m.role}: ${m.content}`).join('\n');

                    // Check if admin mode is active
                    const isAdminModeActive = typeof window !== 'undefined' && localStorage.getItem('5d-admin-mode') === 'true';

                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [
                                { role: 'system', content: 'You are a summarization AI. Generate a short, punchy title (max 6 words) and a 1-sentence summary for this conversation. Format: "Title: [Title] | Summary: [Summary]"' },
                                { role: 'user', content: `Conversation:\n${context}` }
                            ],
                            provider: apiConfig?.provider || 'anthropic',
                            apiKey: currentApiKey,
                            isAdminMode: isAdminModeActive, // Send admin mode flag to API route
                        }),
                    });

                    if (response.ok) {
                        const reader = response.body?.getReader();
                        const decoder = new TextDecoder();
                        let result = '';

                        if (reader) {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                result += decoder.decode(value, { stream: true });
                            }
                        }

                        // Parse "Title: ... | Summary: ..."
                        const titleMatch = result.match(/Title:\s*(.+?)\s*\|/i);
                        const summaryMatch = result.match(/Summary:\s*(.+)/i);

                        const newTitle = titleMatch ? titleMatch[1].trim() : result.split('|')[0].trim().slice(0, 50);
                        const newSummary = summaryMatch ? summaryMatch[1].trim() : result.split('|')[1]?.trim();

                        if (newTitle && newTitle.length > 2) {
                            updateChatSession(activeSessionId, {
                                title: newTitle.replace(/["']/g, ""),
                                summary: newSummary,
                                aiGeneratedTitle: true
                            });
                        }
                    }
                } catch (e) {
                    console.error("Auto-titling failed", e);
                }
            };

            // Run in background
            generateTitle();
        }
    }, [activeSessionId, messages.length, isLoading]); // simplified deps

    const scrollToBottom = (instant = false) => {
        messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    };

    useEffect(() => {
        // If we just loaded a session (messages changed and we have an ID), scroll instantly
        const isSessionLoad = activeSessionId && messages.length > 1;
        scrollToBottom(isSessionLoad ? true : false);
    }, [messages, activeSessionId]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleRestartChat = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: `Welcome to 5D Character Creator! ðŸŽ­

I'm your AI partner for building deep, psychologically rich characters.

**Quick Commands:**
â€¢ \`/generate basic\` â€” Quick 5-7 question character
â€¢ \`/generate advanced\` â€” Full 5-phase development
â€¢ \`/worldbio\` â€” Create a world setting
â€¢ \`/menu\` â€” See all commands

What would you like to create today?`,
                choices: [
                    { id: 'basic', label: 'ðŸŽ­ Create Character', description: 'Quick 5-7 questions' },
                    { id: 'world', label: 'ðŸŒ Build World', description: 'Create a setting' },
                    { id: 'menu', label: 'ðŸ“‹ See Commands', description: 'View all options' },
                ],
            },
        ]);
        setActiveSessionId(null);
        setLinkedEntity(null);
        window.history.pushState({}, '', '/chat');
    };

    const handleDeleteChat = () => {
        handleRestartChat();
    };

    const handleCommandsClick = () => {
        setShowCommandTutorial(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        const newCursorIndex = e.target.selectionStart || 0;
        setInput(value);
        setCursorIndex(newCursorIndex);

        const textBeforeCursor = value.slice(0, newCursorIndex);

        // Detect Commands
        const lastSlash = textBeforeCursor.lastIndexOf('/');
        if (lastSlash !== -1) {
            const isStart = lastSlash === 0;
            const isPrecededBySpace = lastSlash > 0 && textBeforeCursor[lastSlash - 1] === ' ';

            if (isStart || isPrecededBySpace) {
                const query = textBeforeCursor.slice(lastSlash + 1);
                if (!query.includes(' ')) {
                    setCommandQuery(query);
                    setMentionQuery(null);
                    return;
                }
            }
        }
        setCommandQuery(null);

        // Detect Mentions
        const lastAt = textBeforeCursor.lastIndexOf('@');
        if (lastAt !== -1) {
            const isStart = lastAt === 0;
            const isPrecededBySpace = lastAt > 0 && textBeforeCursor[lastAt - 1] === ' ';

            if (isStart || isPrecededBySpace) {
                const query = textBeforeCursor.slice(lastAt + 1);
                if (!query.includes(' ')) {
                    setMentionQuery(query);
                    setCommandQuery(null);
                    return;
                }
            }
        }
        setMentionQuery(null);
    };

    const handleMentionSelect = (item: { id: string; name: string; type: 'Character' | 'World' }) => {
        if (mentionQuery === null) return;

        const textBeforeCursor = input.slice(0, cursorIndex);
        const textAfterCursor = input.slice(cursorIndex);

        const lastAt = textBeforeCursor.lastIndexOf('@');
        const prefix = textBeforeCursor.slice(0, lastAt);

        const newValue = `${prefix}@${item.name} ${textAfterCursor}`;
        setInput(newValue);
        setMentionQuery(null);

        // Focus back
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const getFilteredMentions = () => {
        if (mentionQuery === null) return [];
        const q = mentionQuery.toLowerCase();

        const chars = characters
            .filter(c => c.name.toLowerCase().includes(q))
            .map(c => ({ ...c, type: 'Character' as const }));

        const wrlds = worlds
            .filter(w => w.name.toLowerCase().includes(q))
            .map(w => ({ ...w, type: 'World' as const }));

        return [...chars, ...wrlds].slice(0, 5); // Limit to 5
    };

    const handleCommandSelect = (cmd: typeof AVAILABLE_COMMANDS[0]) => {
        if (commandQuery === null) return;

        const textBeforeCursor = input.slice(0, cursorIndex);
        const textAfterCursor = input.slice(cursorIndex);

        const lastSlash = textBeforeCursor.lastIndexOf('/');
        const prefix = textBeforeCursor.slice(0, lastSlash);

        const newValue = `${prefix}${cmd.label} ${textAfterCursor}`;
        setInput(newValue);
        setCommandQuery(null);

        if (inputRef.current) inputRef.current.focus();
    };

    const getFilteredCommands = () => {
        if (commandQuery === null) return [];
        const q = commandQuery.toLowerCase();
        return AVAILABLE_COMMANDS.filter(c =>
            c.label.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        );
    };

    // Parse save blocks from AI responses
    const parseSaveBlock = (content: string): { type: 'character' | 'world' | 'project'; data: any; targetSection?: string } | null => {
        // Match ```json:save:TYPE[:section] ... ``` blocks (with backticks)
        let saveBlockPattern = /```json:save:(character|world|project)(?::(\w+))?\s*\n([\s\S]*?)\n```/i;
        let match = content.match(saveBlockPattern);
        
        // If no match with backticks, try without backticks (plain text format)
        if (!match) {
            saveBlockPattern = /json:save:(character|world|project)(?::(\w+))?\s*\n([\s\S]*?)(?=\n\n|\n$|$)/i;
            match = content.match(saveBlockPattern);
        }

        if (!match) return null;

        const [, type, targetSection, jsonStr] = match;

        try {
            // Sanitize JSON string by escaping control characters inside string literals
            const sanitizeJsonString = (str: string): string => {
                let result = '';
                let inString = false;
                let escapeNext = false;
                
                for (let i = 0; i < str.length; i++) {
                    const char = str[i];
                    const code = char.charCodeAt(0);
                    
                    // Track if we're inside a string (between unescaped quotes)
                    if (char === '"' && !escapeNext) {
                        inString = !inString;
                        result += char;
                        escapeNext = false;
                        continue;
                    }
                    
                    // Handle escape sequences
                    if (escapeNext) {
                        result += char;
                        escapeNext = false;
                        continue;
                    }
                    
                    if (char === '\\') {
                        escapeNext = true;
                        result += char;
                        continue;
                    }
                    
                    // If we're inside a string, escape control characters
                    if (inString && code >= 0x00 && code <= 0x1F) {
                        // Control characters must be escaped in JSON strings
                        if (char === '\n') {
                            result += '\\n';
                        } else if (char === '\r') {
                            result += '\\r';
                        } else if (char === '\t') {
                            result += '\\t';
                        } else {
                            // Other control characters get Unicode escape
                            result += '\\u' + ('0000' + code.toString(16)).slice(-4);
                        }
                    } else {
                        result += char;
                    }
                }
                
                return result;
            };

            // Try parsing the original string first
            let data;
            try {
                data = JSON.parse(jsonStr);
            } catch (parseError: any) {
                // If parsing fails due to control characters, try sanitizing
                if (parseError.message && parseError.message.includes('control character')) {
                    const sanitized = sanitizeJsonString(jsonStr);
                    try {
                        data = JSON.parse(sanitized);
                    } catch (secondError) {
                        console.error('Failed to parse even after sanitization:', secondError);
                        console.error('Original error:', parseError);
                        throw secondError;
                    }
                } else {
                    // Re-throw if it's a different error
                    throw parseError;
                }
            }

            return {
                type: type as 'character' | 'world' | 'project',
                data,
                targetSection: targetSection || undefined
            };
        } catch (e) {
            console.error('Failed to parse save block JSON:', e);
            console.error('JSON string that failed (first 1000 chars):', jsonStr.substring(0, 1000));
            return null;
        }
    };

    const sendMessage = async (messageContent: string) => {
        if (!messageContent.trim() || isLoading || !hasApiKey) return;

        // Augment message with context if mentions found
        let payloadContent = messageContent;
        const mentionsMatch = messageContent.match(/@(\w+)/g);

        if (mentionsMatch) {
            const mentionedNames = mentionsMatch.map(m => m.slice(1));
            const contextData: any[] = [];

            mentionedNames.forEach(name => {
                const char = characters.find(c => c.name === name);
                if (char) contextData.push({ type: 'Character', ...char });

                const world = worlds.find(w => w.name === name);
                if (world) contextData.push({ type: 'World', ...world });
            });

            if (contextData.length > 0) {
                payloadContent += `\n\n[SYSTEM: The user referenced the following attached data. Use this context to answer.]\n${JSON.stringify(contextData, null, 2)}`;
            }
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageContent.trim(),
        };

        // Mode-specific system instructions (from centralized registry)
        const modeInstruction = getModeInstructionFromRegistry(mode as ChatMode);

        // Output type instruction (for project documents like pitch, treatment, etc.)
        const outputTypeInstruction = outputTypeParam && OUTPUT_TYPE_INSTRUCTIONS[outputTypeParam]
            ? OUTPUT_TYPE_INSTRUCTIONS[outputTypeParam].instruction
            : '';

        // Add session setup config if available
        let setupContext = '';
        if (sessionSetupConfig && (mode === 'script' || mode === 'scene')) {
            setupContext = '\n\n[SESSION SETUP CONFIGURATION - USE THIS DATA TO GENERATE CONTENT]\n';
            
            // Include FULL character data, not just names
            if (sessionSetupConfig.selectedCharacters.length > 0) {
                const selectedChars = sessionSetupConfig.selectedCharacters
                    .map(id => characters.find(c => c.id === id))
                    .filter(Boolean);
                
                setupContext += `\nSELECTED CHARACTERS (${selectedChars.length}):\n`;
                selectedChars.forEach((char, idx) => {
                    if (char) {
                        setupContext += `\nCharacter ${idx + 1}: ${char.name}\n`;
                        setupContext += `FULL CHARACTER DATA:\n${JSON.stringify(char, null, 2)}\n`;
                    }
                });
            }
            
            if (sessionSetupConfig.generateRandomCharacters) {
                setupContext += '\nGenerate Random Characters: Yes\n';
            }
            
            // Include FULL world data, not just names
            if (sessionSetupConfig.selectedWorlds.length > 0) {
                const selectedWorlds = sessionSetupConfig.selectedWorlds
                    .map(id => worlds.find(w => w.id === id))
                    .filter(Boolean);
                
                setupContext += `\nSELECTED WORLDS (${selectedWorlds.length}):\n`;
                selectedWorlds.forEach((world, idx) => {
                    if (world) {
                        setupContext += `\nWorld ${idx + 1}: ${world.name}\n`;
                        setupContext += `FULL WORLD DATA:\n${JSON.stringify(world, null, 2)}\n`;
                    }
                });
            }
            
            if (sessionSetupConfig.generateRandomWorlds) {
                setupContext += '\nGenerate Random World: Yes\n';
            }
            
            if (sessionSetupConfig.sceneType) {
                setupContext += `\nScene Type: ${sessionSetupConfig.sceneType}\n`;
            }
            if (sessionSetupConfig.tone) {
                setupContext += `Tone: ${sessionSetupConfig.tone}\n`;
            }
            if (sessionSetupConfig.length) {
                setupContext += `Length: ${sessionSetupConfig.length}\n`;
            }
            
            setupContext += '\nCRITICAL: You have access to the FULL character and world data above. Use this information to create authentic, detailed content that reflects their personalities, backgrounds, and world settings.';
        }
        
        const systemInstruction = `
        You are the 5D Character Creator AI.

        ${modeInstruction}${setupContext}
        ${outputTypeInstruction}
        
        CRITICAL: To update the Character or World, output a JSON block.
        
        **Standard Format (use triple backticks):**
        \`\`\`json:save:character
        {
          "name": "Updated Name",
          "role": "Protagonist",
          "coreConcept": "A brief summary...",
          "personalityProse": "Detailed description of personality...",
          "backstoryProse": "Narrative backstory...",
          "relationshipsProse": "Notes on key relationships...",
          "arcProse": "Character arc narrative...",
          "customSections": [
             { "id": "sect-1", "title": "Secrets", "content": "...", "order": 10 }
          ]
        }
        \`\`\`
        
        **World Format:**
        \`\`\`json:save:world
        {
          "name": "World Name",
          "genre": "Fantasy",
          "tone": "Dark",
          "description": "World overview...",
          "overviewProse": "Detailed world description...",
          "historyProse": "Historical background...",
          "factionsProse": "Faction details...",
          "geographyProse": "Geographical information...",
          "locations": ["Location 1", "Location 2"],
          "factions": [{ "name": "Faction", "description": "..." }],
          "magicSystem": "Magic system description...",
          "technology": "Technology description...",
          "customSections": [
            { "title": "Custom Section", "content": "...", "order": 10 }
          ]
        }
        \`\`\`
        
        **Section-Specific Format (for targeted updates):**
        \`\`\`json:save:character:personality
        {
          "personalityProse": "Updated personality description..."
        }
        \`\`\`
        
        **Creating New Custom Sections:**
        If the content doesn't fit into standard fields, create custom sections:
        \`\`\`json:save:character
        {
          "customSections": [
            { "title": "Secrets", "content": "Hidden information...", "order": 10 },
            { "title": "Quirks", "content": "Unique traits...", "order": 20 }
          ]
        }
        \`\`\`
        
        Available section targets for characters: personality, backstory, relationships, arc, foundation
        Available section targets for worlds: overview, history, factions, geography
        
        **IMPORTANT:** Always use triple backticks (\`\`\`) around the json:save block!
        
        Rules:
        1. PREFER the "Prose" fields (personalityProse, backstoryProse) for rich text content over arrays.
        2. For arrays (motivations, flaws, etc), provide the COMPLETE list if you change it.
        3. For customSections, you can add new sections or update existing ones by ID.
        4. Use section-specific format when updating only one section (e.g., just personality).
        5. Do NOT output this block until the content is finalized.
        6. When linked to an existing entity, merge intelligently - only include fields you're updating.
        7. If content doesn't fit standard fields, create appropriate custom sections automatically.
        
        For PROJECTS, use this format:
        \`\`\`json:save:project
        {
          "name": "Project Name",
          "genre": "Fantasy",
          "summary": "Brief summary",
          "description": "Longer description",
          "timeline": [
            { "id": "evt-1", "title": "Event Title", "description": "What happens", "chapter": "Ch. 1" }
          ],
          "tags": ["tag1", "tag2"],
          "progress": 0
        }
        \`\`\`
        `;

        // For chat_with mode, combine persona with mode instruction and setup context
        let effectiveInstruction: string;
        if (activePersona && mode === 'chat_with') {
            // Combine persona with mode instruction and setup context
            effectiveInstruction = `${activePersona}\n\n${modeInstruction}${setupContext}${outputTypeInstruction}`;
        } else if (activePersona) {
            // For other personas (workshop mode, etc), use persona but add setup context
            effectiveInstruction = `${activePersona}${setupContext}${outputTypeInstruction}`;
        } else {
            // Normal mode - use system instruction with mode and setup context
            effectiveInstruction = systemInstruction;
        }

        // Inject Session Context/Memory
        if (activeSessionId) {
            const session = chatSessions.find(s => s.id === activeSessionId);
            if (session?.summary) {
                effectiveInstruction += `\n\n[PREVIOUS CONTEXT]\n${session.summary}`;
            }
            if (session?.tags && session.tags.length > 0) {
                effectiveInstruction += `\n\n[SESSION TAGS]\n${session.tags.join(', ')}`;
            }
        }

        // Inject Parent World Context (for new characters)
        if (parentWorldIdParam) {
            const parentWorld = worlds.find(w => w.id === parentWorldIdParam);
            if (parentWorld) {
                effectiveInstruction += `\n\n[PARENT WORLD CONTEXT]\nThis character is being created within the world "${parentWorld.name}".\nID: ${parentWorld.id}\nensure you include "worldId": "${parentWorld.id}" in the save JSON.\n\nWorld Overview:\n${parentWorld.description || parentWorld.overviewProse}`;
            }
        }

        // Inject FULL linked entity context for chat memory
        // For chat_with mode, the persona already includes full character data, but we ensure it's there
        // But don't duplicate if already in session setup config or persona
        if (linkedEntity && (!sessionSetupConfig || 
            (linkedEntity.type === 'character' && !sessionSetupConfig.selectedCharacters.includes(linkedEntity.id)) ||
            (linkedEntity.type === 'world' && !sessionSetupConfig.selectedWorlds.includes(linkedEntity.id)))) {
            if (linkedEntity.type === 'character') {
                const char = characters.find(c => c.id === linkedEntity.id);
                if (char) {
                    // For chat_with mode, persona already has the data, but add it here for other modes
                    if (mode !== 'chat_with' || !activePersona) {
                        effectiveInstruction += `\n\n[LINKED CHARACTER - FULL CONTEXT]\nYou are actively working on this character. Here is their complete profile:\n${JSON.stringify(char, null, 2)}`;
                    }
                }
            } else if (linkedEntity.type === 'world') {
                const world = worlds.find(w => w.id === linkedEntity.id);
                if (world) {
                    effectiveInstruction += `\n\n[LINKED WORLD - FULL CONTEXT]\nYou are actively working on this world. Here is its complete profile:\n${JSON.stringify(world, null, 2)}`;
                }
            } else if (linkedEntity.type === 'project') {
                const project = projects.find(p => p.id === linkedEntity.id);
                if (project) {
                    effectiveInstruction += `\n\n[LINKED PROJECT - FULL CONTEXT]\nYou are working within this project context. Use this to inform your suggestions for characters and plot.\n${JSON.stringify(project, null, 2)}`;
                }
            }
        }

        if (messageContent.trim().toLowerCase() === '/save') {
            effectiveInstruction = systemInstruction + `\n\n[SYSTEM: URGENT] The user wants to save the current progress immediately. Summarize all known details about the character/world into the JSON Save Block defined above. If some fields are missing, make best guesses or leave them as "Undefined". Output the JSON block NOW.`;
        }

        // Inject Options Instruction if enabled
        if (showGenerateOptions) {
            if (mode === 'script') {
                // For script mode, ask questions first, then generate script
                effectiveInstruction += "\n\nIMPORTANT: For SCRIPT CREATION mode, when the user requests to start creating a script:\n1. FIRST ask 3-5 focused questions about the script (genre, central conflict, key scenes, tone, structure, etc.) with options: [OPTIONS: choice1 | choice2 ...]\n2. Wait for the user's answers\n3. THEN generate the full script based on their responses\n4. DO NOT convert to roleplay mode - you are writing a script, not creating interactive roleplay choices\n5. After generating the script, you may ask if they want to refine or expand any scenes with options.";
            } else {
                effectiveInstruction += "\n\nIMPORTANT: For every question you ask, OR if I ask for options, provide recommended answers in the standard options format: [OPTIONS: choice1 | choice2 ...].\nCRITICAL: Even if you just generated a JSON Save Block or applied updates, YOU MUST still provide options for the next step/question at the very end of your response.";
            }
        }

        const userMessageWithContext: Message = {
            ...userMessage,
            content: payloadContent + "\n\n" + effectiveInstruction
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setMentionQuery(null);
        setIsLoading(true);
        setError(null);

        try {
            // Prepare structured context for API context budget system
            const structuredContext: Record<string, any> = {};
            if (linkedEntity) {
                if (linkedEntity.type === 'character') {
                    const char = characters.find(c => c.id === linkedEntity.id);
                    if (char) structuredContext.linkedCharacter = char;
                } else if (linkedEntity.type === 'world') {
                    const world = worlds.find(w => w.id === linkedEntity.id);
                    if (world) structuredContext.linkedWorld = world;
                } else if (linkedEntity.type === 'project') {
                    const project = projects.find(p => p.id === linkedEntity.id);
                    if (project) structuredContext.linkedProject = project;
                }
            }
            if (modeInstruction) {
                structuredContext.modeInstruction = modeInstruction;
            }

            // Check if admin mode is active
            const isAdminModeActive = typeof window !== 'undefined' && localStorage.getItem('5d-admin-mode') === 'true';

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessageWithContext].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    provider: apiConfig?.provider || 'anthropic',
                    apiKey: currentApiKey,
                    isAdminMode: isAdminModeActive, // Send admin mode flag to API route
                    // Pass structured context for API context budget management
                    ...structuredContext
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '',
            };

            setMessages(prev => [...prev, assistantMessage]);

            let fullContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    fullContent += chunk;

                    const { cleanContent, choices } = parseChoices(fullContent);

                    setMessages(prev =>
                        prev.map(m =>
                            m.id === assistantMessage.id
                                ? { ...m, content: cleanContent, choices: choices.length > 0 ? choices : undefined }
                                : m
                        )
                    );
                }
            }

            // Parse final content and choices after streaming completes
            const { cleanContent: finalCleanContent, choices: finalChoices } = parseChoices(fullContent);

            // Check for save blocks and attach pending update
            const saveBlock = parseSaveBlock(fullContent);
            if (saveBlock) {
                const targetEntity = saveBlock.type === 'character'
                    ? characters.find(c => c.id === linkedEntity?.id)
                    : saveBlock.type === 'world'
                        ? worlds.find(w => w.id === linkedEntity?.id)
                        : projects.find(p => p.id === linkedEntity?.id);

                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantMessage.id
                            ? {
                                ...m,
                                content: finalCleanContent,
                                choices: finalChoices.length > 0 ? finalChoices : m.choices,
                                pendingUpdate: {
                                    type: saveBlock.type,
                                    data: saveBlock.data,
                                    targetId: linkedEntity?.id,
                                    targetName: saveBlock.data.name || targetEntity?.name || 'New Entity'
                                }
                            }
                            : m
                    )
                );
            } else {
                // Even if no save block, update with final parsed choices
                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantMessage.id
                            ? { ...m, content: finalCleanContent, choices: finalChoices.length > 0 ? finalChoices : m.choices }
                            : m
                    )
                );
            }

            // Persistence: Update Session
            // Actually, we need to capture the final state of messages. 
            // Since setMessages is async, let's reconstruct it.
            // But wait, the streaming loop updates state. 
            // We should save AFTER the loop or periodically.
            // Let's save at the end of generation.

            const now = new Date();
            const cleanContentFinal = fullContent.replace(/\[CHOICES:.*?\]/i, '').trim(); // Simplified clean for summary

            if (!activeSessionId) {
                const newId = Date.now().toString();
                setActiveSessionId(newId);
                const title = messageContent.slice(0, 40) + (messageContent.length > 40 ? '...' : '');

                const newSession: ChatSession = {
                    id: newId,
                    title,
                    lastMessage: cleanContentFinal.slice(0, 100),
                    messages: [...messages, userMessage, { ...assistantMessage, content: fullContent }], // Approximation, ideally use functional state update result
                    createdAt: now,
                    updatedAt: now,
                    mode: (mode as any) || 'chat',
                    relatedId: activeCharacterId || activeWorldId || activeProjectId || undefined
                };

                addChatSession(newSession);

                // Auto-save document for script/roleplay/chat_with modes with character
                if ((mode === 'script' || mode === 'scene' || mode === 'chat_with') && linkedEntity?.type === 'character') {
                    // Auto-save after a short delay to ensure session is saved
                    setTimeout(() => {
                        const session = chatSessions.find(s => s.id === newId) || newSession;
                        const docType = mode === 'script' ? 'script' : 'roleplay';
                        const doc = createDocumentFromSession(session, linkedEntity.id, docType);
                        addCharacterDocument(doc);
                        setToast({
                            message: `Document "${doc.title}" auto-saved!`,
                            type: 'success'
                        });
                        setTimeout(() => setToast(null), 3000);
                    }, 500);
                }
            } else {
                const updatedSessionData = {
                    lastMessage: cleanContentFinal.slice(0, 100),
                    messages: [...messages, userMessage, { ...assistantMessage, content: fullContent }],
                    updatedAt: now
                };
                updateChatSession(activeSessionId, updatedSessionData);

                // Auto-save document update for script/roleplay/chat_with modes with character
                // Only auto-save if we have at least 2 messages (user + assistant)
                if ((mode === 'script' || mode === 'scene' || mode === 'chat_with') && linkedEntity?.type === 'character') {
                    const finalMessages = [...messages, userMessage, { ...assistantMessage, content: fullContent }];
                    if (finalMessages.length >= 2) {
                        // Check if document already exists for this session
                        const existingDocs = characterDocuments.filter(doc => 
                            doc.metadata?.sessionId === activeSessionId
                        );
                        
                        if (existingDocs.length > 0) {
                            // Update existing document
                            const existingDoc = existingDocs[0];
                            const currentSession = chatSessions.find(s => s.id === activeSessionId);
                            if (currentSession) {
                                const updatedSession = {
                                    ...currentSession,
                                    ...updatedSessionData,
                                    messages: finalMessages
                                };
                                const updatedContent = existingDoc.type === 'script' || existingDoc.type === 'roleplay' 
                                    ? sessionToDocumentContent(updatedSession, existingDoc.type)
                                    : existingDoc.content;
                                updateCharacterDocument(existingDoc.id, {
                                    content: updatedContent,
                                    updatedAt: now
                                });
                            }
                        } else if (finalMessages.length === 2) {
                            // Create new document on first assistant response
                            setTimeout(() => {
                                const session = chatSessions.find(s => s.id === activeSessionId);
                                if (session) {
                                    const docType = mode === 'script' ? 'script' : 'roleplay';
                                    const doc = createDocumentFromSession(session, linkedEntity.id, docType);
                                    addCharacterDocument(doc);
                                    setToast({
                                        message: `Document "${doc.title}" auto-saved!`,
                                        type: 'success'
                                    });
                                    setTimeout(() => setToast(null), 3000);
                                }
                            }, 500);
                        }
                    }
                }
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-start effect
    useEffect(() => {
        if (!hasApiKey || autoStartRef.current || isLoading) return;

        // Don't auto-start if we have a linked entity with contextual message (already set in previous effect)
        if (linkedEntity && messages.length === 1 && messages[0].id === 'welcome' && messages[0].choices) {
            return; // Contextual welcome already set, don't override
        }

        if (promptParam) {
            autoStartRef.current = true;
            sendMessage(decodeURIComponent(promptParam));
            return;
        }

        if (mode === 'chat_with' && searchParams.get('id')) {
            const charId = searchParams.get('id');
            const char = characters.find(c => c.id === charId);
            if (char) {
                autoStartRef.current = true;

                // Auto-link the entity for chat_with mode
                if (!linkedEntity || linkedEntity.id !== char.id) {
                    setLinkedEntity({ type: 'character', id: char.id, name: char.name });
                    if (activeSessionId) {
                        updateChatSession(activeSessionId, { relatedId: char.id });
                    }
                }

                // Set Persona Context with FULL character data
                const persona = `
                [SYSTEM: ACT AS CHARACTER - YOU ARE ${char.name.toUpperCase()}]
                You are now embodying the character "${char.name}". You ARE this character, not an AI assistant.
                
                CRITICAL: Use the FULL CHARACTER DATA provided below to inform every response. Stay in character at all times.
                
                CHARACTER SUMMARY:
                - Name: ${char.name}
                - Role: ${char.role || 'Not specified'}
                - Archetype: ${char.archetype || 'Not specified'}
                - Core Concept: ${char.coreConcept || 'Not specified'}
                - Motivations: ${char.motivations?.join(', ') || 'Not specified'}
                - Flaws: ${char.flaws?.join(', ') || 'Not specified'}
                
                FULL CHARACTER DATA (use this for authentic responses):
                ${JSON.stringify(char, null, 2)}
                
                INSTRUCTIONS:
                - Speak as ${char.name} would speak - use their voice, vocabulary, and speech patterns
                - Reflect their personality, background, and worldview in every response
                - Use their backstory, relationships, and motivations to inform your reactions
                - Stay true to their flaws, fears, and desires
                - The user is talking to you directly as ${char.name}
                - Do NOT break character or acknowledge you're an AI unless explicitly asked
                - Respond naturally and authentically as the character
                `;

                setActivePersona(persona);

                setMessages([{
                    id: 'intro',
                    role: 'assistant',
                    content: `*${char.name} looks at you.* \n\n"Hello. What brings you to me?"`,
                    choices: [
                        { id: 'talk', label: 'ðŸ—£ï¸ Talk Directly', description: 'Interview the character' },
                        { id: 'scene', label: 'ðŸŽ¬ Generate Scene', description: 'Put them in a situation' }
                    ]
                }]);
                return;
            }
        }

        if (mode === 'workshop' && searchParams.get('id') && searchParams.get('focus')) {
            const charId = searchParams.get('id');
            const focus = searchParams.get('focus');
            const char = characters.find(c => c.id === charId);

            if (char) {
                autoStartRef.current = true;

                let focusPrompt = "";
                let subPersona = "";

                switch (focus) {
                    case 'personality':
                        subPersona = "You are a Character Psychologist. Focus on motivations, flaws, and conflicting traits.";
                        focusPrompt = `Let's refine ${char.name}'s personality. What core drive or fear do you want to explore?`;
                        break;
                    case 'backstory':
                        subPersona = "You are a Biographer and Trauma Expert. Focus on childhood events, ghosts, and formative memories.";
                        focusPrompt = `Let's dig into ${char.name}'s past. What is the one memory that haunts them?`;
                        break;
                    case 'relationships':
                        subPersona = "You are a Sociologist. Focus on dynamics, rivalries, and alliances.";
                        focusPrompt = `Let's map out ${char.name}'s web of connections. Who do they trust the least?`;
                        break;
                    case 'arc':
                        subPersona = "You are a Master Storyteller. Focus on change, climax, and resolution.";
                        focusPrompt = `Let's structure ${char.name}'s journey. What is the lie they believe at the start?`;
                        break;
                }

                const persona = `
                [SYSTEM: WORKSHOP MODE]
                Target Character: ${char.name}
                Focus Area: ${focus?.toUpperCase()}
                
                ROLE: ${subPersona}
                
                GOAL: Ask probing questions to help the user flesh out this specific aspect of the character.
                Once the user provides enough info, offer updates in a JSON save block.
                `;

                setActivePersona(persona);

                setMessages([{
                    id: 'intro',
                    role: 'assistant',
                    content: `ðŸ“ **Workshop: ${focus?.charAt(0).toUpperCase() + focus!.slice(1)}**\n\n${focusPrompt}`,
                    choices: [
                        { id: 'brainstorm', label: 'ðŸ§  Brainstorm Ideas', description: 'Generate concepts' },
                        { id: 'critique', label: 'ðŸ” Critique Current', description: 'Analyze existing data' }
                    ]
                }]);
                return;
            }
        }

        // Only auto-start generic mode commands if no entity is linked
        if (mode && !linkedEntity) {
            let command = '';
            switch (mode) {
                case 'character': command = '/generate basic'; break;
                case 'world': command = '/worldbio'; break;
                case 'scene': command = 'Help me write a scene involving my characters.'; break;
                case 'script': command = 'Help me create a script with multiple characters.'; break;
                case 'lore': command = 'I want to explore the history and lore of my world.'; break;
            }

            if (command) {
                autoStartRef.current = true;
                sendMessage(command);
            }
        }
    }, [mode, promptParam, hasApiKey, characters, linkedEntity, messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendMessage(input);
    };


    const handleFork = (messageId: string) => {
        if (!activeSessionId) return;

        const newId = forkSession(activeSessionId, messageId);
        if (newId) {
            setActiveSessionId(newId);
            // The useEffect for sessionIdParam/store subscription will likely handle the message update, 
            // but we can manually force it to be instant
            const newSession = chatSessions.find(s => s.id === newId);
            if (newSession) {
                setMessages(newSession.messages);
                // navigate
                window.history.pushState({}, '', `/chat?sessionId=${newId}`);
            }
        }
    };

    // ... (rest of render helpers)
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Enhanced save handler with intelligent merging and section-specific updates
    const handleSaveEntity = (type: 'character' | 'world' | 'project', data: any, messageId?: string, targetSection?: string) => {
        console.log('=== handleSaveEntity called ===');
        console.log('Type:', type);
        console.log('Data:', data);
        console.log('LinkedEntity:', linkedEntity);
        console.log('targetIdParam:', targetIdParam);
        console.log('TargetSection:', targetSection);

        if (type === 'character') {
            // NORMALIZE DATA: Map legacy/guessed keys to Prose fields
            const normalizedData = { ...data };
            if (normalizedData.personality && typeof normalizedData.personality === 'string' && !normalizedData.personalityProse) {
                normalizedData.personalityProse = normalizedData.personality;
            }
            if (normalizedData.backstory && typeof normalizedData.backstory === 'string' && !normalizedData.backstoryProse) {
                normalizedData.backstoryProse = normalizedData.backstory;
            }
            if (normalizedData.relationships && typeof normalizedData.relationships === 'string' && !normalizedData.relationshipsProse) {
                normalizedData.relationshipsProse = normalizedData.relationships;
            }
            if (normalizedData.arc && typeof normalizedData.arc === 'string' && !normalizedData.arcProse) {
                normalizedData.arcProse = normalizedData.arc;
            }
            // Map 'concept' or 'description' to coreConcept if missing
            if ((normalizedData.concept || normalizedData.description) && !normalizedData.coreConcept) {
                normalizedData.coreConcept = normalizedData.concept || normalizedData.description;
            }

            // Apply normalization
            data = normalizedData;

            // Priority: linkedEntity (if character type) > targetIdParam > data.id match
            let existingId: string | null = null;

            // Check linked entity first
            if (linkedEntity?.type === 'character') {
                existingId = linkedEntity.id;
                console.log('Using linkedEntity id:', existingId);
            } else if (targetIdParam) {
                existingId = targetIdParam;
                console.log('Using targetIdParam:', existingId);
            } else if (data.id) {
                const found = characters.find(c => c.id === data.id);
                if (found) {
                    existingId = found.id;
                    console.log('Found by data.id:', existingId);
                }
            }

            const charToUpdate = existingId ? characters.find(c => c.id === existingId) : null;
            console.log('charToUpdate:', charToUpdate?.name || 'null');

            if (charToUpdate) {
                console.log('UPDATING existing character:', charToUpdate.id);
                
                // Intelligent merging: preserve existing data unless explicitly provided
                const mergedData: any = { ...charToUpdate };
                const customSectionsToAdd: any[] = [];
                
                // If targetSection is specified, only update that section
                if (targetSection) {
                    const sectionFieldMap: Record<string, string> = {
                        'personality': 'personalityProse',
                        'backstory': 'backstoryProse',
                        'relationships': 'relationshipsProse',
                        'arc': 'arcProse',
                        'foundation': 'coreConcept'
                    };
                    const fieldName = sectionFieldMap[targetSection.toLowerCase()] || targetSection;
                    if (data[fieldName] !== undefined) {
                        mergedData[fieldName] = data[fieldName];
                    }
                } else {
                    // Merge all provided fields intelligently
                    Object.keys(data).forEach(key => {
                        if (key === 'id' || key === 'updatedAt' || key === 'createdAt' || key === 'customSections') return;
                        
                        // For prose fields, replace if provided
                        if (key.endsWith('Prose') || key === 'coreConcept') {
                            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                                mergedData[key] = data[key];
                            }
                        }
                        // For arrays, merge intelligently (append new items, preserve existing)
                        else if (Array.isArray(data[key])) {
                            const existing = mergedData[key] || [];
                            const newItems = data[key];
                            // Merge arrays: keep existing items, add new unique ones
                            const merged = [...existing];
                            newItems.forEach((item: any) => {
                                if (typeof item === 'string' && !merged.includes(item)) {
                                    merged.push(item);
                                } else if (typeof item === 'object' && item.id && !merged.find((e: any) => e.id === item.id)) {
                                    merged.push(item);
                                }
                            });
                            mergedData[key] = merged;
                        }
                        // For other fields, replace if provided
                        else if (data[key] !== undefined && data[key] !== null) {
                            mergedData[key] = data[key];
                        }
                    });
                    
                    // Handle customSections - merge intelligently
                    if (data.customSections && Array.isArray(data.customSections)) {
                        const existingSections = mergedData.customSections || [];
                        const newSections = data.customSections;
                        
                        // For each new section, check if it exists (by id or title match)
                        newSections.forEach((newSection: any) => {
                            if (newSection.id) {
                                const existing = existingSections.find((s: any) => s.id === newSection.id);
                                if (existing) {
                                    // Update existing section
                                    Object.assign(existing, newSection);
                                } else {
                                    // New section with ID - add it
                                    customSectionsToAdd.push(newSection);
                                }
                            } else {
                                // New section without ID - create it
                                const sectionWithId = {
                                    ...newSection,
                                    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    order: (existingSections.length + customSectionsToAdd.length) * 10
                                };
                                customSectionsToAdd.push(sectionWithId);
                            }
                        });
                        
                        if (customSectionsToAdd.length > 0) {
                            mergedData.customSections = [...existingSections, ...customSectionsToAdd];
                        }
                    }
                }
                
                updateCharacter(charToUpdate.id, {
                    ...mergedData,
                    updatedAt: new Date()
                });
                // Update linked entity name if it changed
                if (data.name) {
                    const updatedEntity = { type: 'character' as const, id: charToUpdate.id, name: data.name };
                    setLinkedEntity(updatedEntity);
                    if (activeSessionId) updateChatSession(activeSessionId, { relatedId: charToUpdate.id });
                }

                // RECORD HISTORY
                if (activeSessionId) {
                    const changes: Record<string, { old: any; new: any }> = {};
                    Object.keys(data).forEach(key => {
                        if (key === 'id' || key === 'updatedAt' || key === 'createdAt') return;
                        if (JSON.stringify(data[key]) !== JSON.stringify((charToUpdate as any)[key])) {
                            changes[key] = { old: (charToUpdate as any)[key], new: data[key] };
                        }
                    });

                    if (Object.keys(changes).length > 0) {
                        const historyItem: AppliedUpdate = {
                            id: Date.now().toString(),
                            messageId: messageId || 'manual',
                            timestamp: new Date(),
                            type: 'character',
                            targetId: charToUpdate.id,
                            targetName: charToUpdate.name,
                            changes
                        };
                        const session = chatSessions.find(s => s.id === activeSessionId);
                        updateChatSession(activeSessionId, {
                            updateHistory: [historyItem, ...(session?.updateHistory || [])]
                        });
                    }
                }
            } else {
                console.log('CREATING new character');
                // Create new character and auto-link
                const id = Date.now().toString();
                const name = data.name || 'New Character';
                addCharacter({
                    id,
                    name,
                    role: 'Protagonist',
                    genre: 'General',
                    progress: 0,
                    phase: 'Foundation',
                    ...data,
                    updatedAt: new Date(),
                    createdAt: new Date()
                });
                // Auto-link to newly created character
                console.log('Auto-linking to new character:', id, name);
                const newEntity = { type: 'character' as const, id, name };
                setLinkedEntity(newEntity);
                if (activeSessionId) updateChatSession(activeSessionId, { relatedId: id });
            }
        } else if (type === 'world') {
            // NORMALIZE DATA: Flatten nested objects and map to World type
            const normalizedData: any = { ...data };
            
            // Handle nested tone object
            if (normalizedData.tone && typeof normalizedData.tone === 'object') {
                const toneObj = normalizedData.tone;
                if (toneObj.atmosphere || toneObj.mood) {
                    normalizedData.tone = toneObj.atmosphere || toneObj.mood || JSON.stringify(toneObj);
                }
            }
            
            // Handle nested technology object
            if (normalizedData.technology && typeof normalizedData.technology === 'object') {
                const techObj = normalizedData.technology;
                if (techObj.systems && Array.isArray(techObj.systems)) {
                    normalizedData.technology = techObj.systems.join(', ');
                } else if (techObj.control) {
                    normalizedData.technology = JSON.stringify(techObj);
                }
            }
            
            // Handle nested society object
            if (normalizedData.society && typeof normalizedData.society === 'object') {
                const societyObj = normalizedData.society;
                if (societyObj.structure) {
                    normalizedData.societies = normalizedData.societies || [];
                    if (!normalizedData.societies.includes(societyObj.structure)) {
                        normalizedData.societies.push(societyObj.structure);
                    }
                }
                // Store society info in description or overviewProse if needed
                if (societyObj.resistance && !normalizedData.overviewProse) {
                    normalizedData.overviewProse = `Society Structure: ${societyObj.structure || 'Unknown'}\n\nResistance Movements: ${societyObj.resistance || 'None documented'}`;
                }
            }
            
            // Map locations array properly
            if (normalizedData.locations && Array.isArray(normalizedData.locations)) {
                // Keep as is - locations is an array in World type
            }
            
            // Map description to overviewProse if overviewProse is missing
            if (normalizedData.description && !normalizedData.overviewProse) {
                normalizedData.overviewProse = normalizedData.description;
            }
            
            // Apply normalization
            data = normalizedData;
            
            // Priority: linkedEntity (if world type) > targetIdParam > data.id match
            let existingId: string | null = null;

            // Check linked entity first
            if (linkedEntity?.type === 'world') {
                existingId = linkedEntity.id;
                console.log('Using linkedEntity id:', existingId);
            } else if (targetIdParam) {
                existingId = targetIdParam;
                console.log('Using targetIdParam:', existingId);
            } else if (data.id) {
                const found = worlds.find(w => w.id === data.id);
                if (found) {
                    existingId = found.id;
                    console.log('Found by data.id:', existingId);
                }
            }

            const worldToUpdate = existingId ? worlds.find(w => w.id === existingId) : null;
            console.log('worldToUpdate:', worldToUpdate?.name || 'null');

            if (worldToUpdate) {
                console.log('UPDATING existing world:', worldToUpdate.id);
                
                // Intelligent merging for worlds
                const mergedData: any = { ...worldToUpdate };
                const customSectionsToAdd: any[] = [];
                
                // If targetSection is specified, only update that section
                if (targetSection) {
                    const sectionFieldMap: Record<string, string> = {
                        'overview': 'overviewProse',
                        'history': 'historyProse',
                        'factions': 'factionsProse',
                        'geography': 'geographyProse'
                    };
                    const fieldName = sectionFieldMap[targetSection.toLowerCase()] || targetSection;
                    if (data[fieldName] !== undefined) {
                        mergedData[fieldName] = data[fieldName];
                    }
                } else {
                    // Merge all provided fields intelligently
                    Object.keys(data).forEach(key => {
                        if (key === 'id' || key === 'updatedAt' || key === 'createdAt' || key === 'customSections') return;
                        
                        // For prose fields, replace if provided
                        if (key.endsWith('Prose')) {
                            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                                mergedData[key] = data[key];
                            }
                        }
                        // For arrays, merge intelligently
                        else if (Array.isArray(data[key])) {
                            const existing = mergedData[key] || [];
                            const newItems = data[key];
                            const merged = [...existing];
                            newItems.forEach((item: any) => {
                                if (typeof item === 'string' && !merged.includes(item)) {
                                    merged.push(item);
                                } else if (typeof item === 'object' && item.id && !merged.find((e: any) => e.id === item.id)) {
                                    merged.push(item);
                                } else if (typeof item === 'object' && item.name && !merged.find((e: any) => e.name === item.name)) {
                                    merged.push(item);
                                }
                            });
                            mergedData[key] = merged;
                        }
                        // For other fields, replace if provided
                        else if (data[key] !== undefined && data[key] !== null) {
                            mergedData[key] = data[key];
                        }
                    });
                    
                    // Handle customSections - merge intelligently
                    if (data.customSections && Array.isArray(data.customSections)) {
                        const existingSections = mergedData.customSections || [];
                        const newSections = data.customSections;
                        
                        // For each new section, check if it exists (by id or title match)
                        newSections.forEach((newSection: any) => {
                            if (newSection.id) {
                                const existing = existingSections.find((s: any) => s.id === newSection.id);
                                if (existing) {
                                    // Update existing section
                                    Object.assign(existing, newSection);
                                } else {
                                    // New section with ID - add it
                                    customSectionsToAdd.push(newSection);
                                }
                            } else {
                                // New section without ID - create it
                                const sectionWithId = {
                                    ...newSection,
                                    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    order: (existingSections.length + customSectionsToAdd.length) * 10
                                };
                                customSectionsToAdd.push(sectionWithId);
                            }
                        });
                        
                        if (customSectionsToAdd.length > 0) {
                            mergedData.customSections = [...existingSections, ...customSectionsToAdd];
                        }
                    }
                }
                
                updateWorld(worldToUpdate.id, {
                    ...mergedData,
                    updatedAt: new Date()
                });
                // Update linked entity name if it changed
                if (data.name) {
                    const updatedEntity = { type: 'world' as const, id: worldToUpdate.id, name: data.name };
                    setLinkedEntity(updatedEntity);
                    if (activeSessionId) updateChatSession(activeSessionId, { relatedId: worldToUpdate.id });
                }

                // RECORD HISTORY
                if (activeSessionId) {
                    const changes: Record<string, { old: any; new: any }> = {};
                    Object.keys(data).forEach(key => {
                        if (key === 'id' || key === 'updatedAt' || key === 'createdAt') return;
                        if (JSON.stringify(data[key]) !== JSON.stringify((worldToUpdate as any)[key])) {
                            changes[key] = { old: (worldToUpdate as any)[key], new: data[key] };
                        }
                    });

                    if (Object.keys(changes).length > 0) {
                        const historyItem: AppliedUpdate = {
                            id: Date.now().toString(),
                            messageId: messageId || 'manual',
                            timestamp: new Date(),
                            type: 'world',
                            targetId: worldToUpdate.id,
                            targetName: worldToUpdate.name,
                            changes
                        };
                        const session = chatSessions.find(s => s.id === activeSessionId);
                        updateChatSession(activeSessionId, {
                            updateHistory: [historyItem, ...(session?.updateHistory || [])]
                        });
                    }
                }
            } else {
                console.log('CREATING new world');
                // Create new world and auto-link
                const id = Date.now().toString();
                const name = data.name || 'New World';
                
                // Ensure required fields
                const worldData = {
                    id,
                    name,
                    genre: data.genre || 'General',
                    description: data.description || data.overviewProse || '',
                    tone: typeof data.tone === 'string' ? data.tone : 'Neutral',
                    progress: data.progress || 0,
                    ...data,
                    updatedAt: new Date(),
                    createdAt: new Date()
                };
                
                addWorld(worldData);
                // Auto-link to newly created world
                console.log('Auto-linking to new world:', id, name);
                const newEntity = { type: 'world' as const, id, name };
                setLinkedEntity(newEntity);
                if (activeSessionId) updateChatSession(activeSessionId, { relatedId: id });
            }
        } else if (type === 'project') {
            // Priority: linkedEntity (if project type) > targetIdParam > data.id match
            let existingId: string | null = null;

            // Check linked entity first
            if (linkedEntity?.type === 'project') {
                existingId = linkedEntity.id;
                console.log('Using linkedEntity id:', existingId);
            } else if (targetIdParam) {
                existingId = targetIdParam;
                console.log('Using targetIdParam:', existingId);
            } else if (data.id) {
                const found = projects.find(p => p.id === data.id);
                if (found) {
                    existingId = found.id;
                    console.log('Found by data.id:', existingId);
                }
            }

            const projectToUpdate = existingId ? projects.find(p => p.id === existingId) : null;
            console.log('projectToUpdate:', projectToUpdate?.name || 'null');

            if (projectToUpdate) {
                console.log('UPDATING existing project:', projectToUpdate.id);
                updateProject(projectToUpdate.id, {
                    ...data,
                    timeline: Array.isArray(data.timeline) ? data.timeline : projectToUpdate.timeline,
                    characterIds: Array.isArray(data.characterIds) ? data.characterIds : projectToUpdate.characterIds,
                    worldIds: Array.isArray(data.worldIds) ? data.worldIds : projectToUpdate.worldIds,
                    tags: Array.isArray(data.tags) ? data.tags : projectToUpdate.tags,
                    updatedAt: new Date()
                });
                // Update linked entity name if it changed
                if (data.name) {
                    const updatedEntity = { type: 'project' as const, id: projectToUpdate.id, name: data.name };
                    setLinkedEntity(updatedEntity);
                    if (activeSessionId) updateChatSession(activeSessionId, { relatedId: projectToUpdate.id });
                }

                // RECORD HISTORY (removed duplicate)
                if (activeSessionId) {
                    const changes: Record<string, { old: any; new: any }> = {};
                    Object.keys(data).forEach(key => {
                        if (key === 'id' || key === 'updatedAt' || key === 'createdAt') return;
                        if (JSON.stringify(data[key]) !== JSON.stringify((projectToUpdate as any)[key])) {
                            changes[key] = { old: (projectToUpdate as any)[key], new: data[key] };
                        }
                    });

                    if (Object.keys(changes).length > 0) {
                        const historyItem: AppliedUpdate = {
                            id: Date.now().toString(),
                            messageId: messageId || 'manual',
                            timestamp: new Date(),
                            type: 'project',
                            targetId: projectToUpdate.id,
                            targetName: projectToUpdate.name,
                            changes
                        };
                        const session = chatSessions.find(s => s.id === activeSessionId);
                        updateChatSession(activeSessionId, {
                            updateHistory: [historyItem, ...(session?.updateHistory || [])]
                        });
                    }
                }
            } else {
                console.log('CREATING new project');
                // Create new project and auto-link
                const id = Date.now().toString();
                const name = data.name || 'New Project';
                addProject({
                    id,
                    name,
                    genre: data.genre || 'General',
                    summary: data.summary || '',
                    description: data.description || '',
                    timeline: data.timeline || [],
                    characterIds: data.characterIds || [],
                    worldIds: data.worldIds || [],
                    tags: data.tags || [],
                    progress: data.progress || 0,
                    ...data,
                    updatedAt: new Date(),
                    createdAt: new Date()
                });
                // Auto-link to newly created project
                console.log('Auto-linking to new project:', id, name);
                const newEntity = { type: 'project' as const, id, name };
                setLinkedEntity(newEntity);
                if (activeSessionId) updateChatSession(activeSessionId, { relatedId: id });
            }
        }

        if (messageId) {
            setAppliedUpdates(prev => new Set(prev).add(messageId));

            // Persist to store so it survives page refresh/navigation
            if (activeSessionId) {
                const session = chatSessions.find(s => s.id === activeSessionId);
                const existingApplied = session?.appliedMessageIds || [];
                if (!existingApplied.includes(messageId)) {
                    updateChatSession(activeSessionId, {
                        appliedMessageIds: [...existingApplied, messageId]
                    });
                }
            }
        }
    };

    const handleChoiceSelect = (choice: Choice | Choice[], context?: ChoiceContext) => {
        // Build the selection text
        const selectedText = Array.isArray(choice)
            ? choice.map(c => c.label).join(', ')
            : choice.label;

        // Include context about the selection for the AI
        let contextPrefix = '';
        if (context) {
            const parts: string[] = [];
            if (context.questionText) {
                parts.push(`Question: "${context.questionText}"`);
            }
            if (context.allOptions && context.allOptions.length > 0) {
                parts.push(`Available options were: ${context.allOptions.join(' | ')}`);
            }
            if (parts.length > 0) {
                contextPrefix = `[USER SELECTED from options - ${parts.join('. ')}]\n`;
            }
        }

        // Send with context prefix so AI knows this was a selection, not typed text
        sendMessage(contextPrefix + selectedText);
    };

    // New Reload Handler
    const handleReloadClick = (messageId: string) => {
        setReloadTargetId(messageId);
        setShowReloadModal(true);
    };

    const handleReloadWithContext = (context?: string) => {
        if (!reloadTargetId) return;

        const index = messages.findIndex(m => m.id === reloadTargetId);
        if (index === -1) return;

        const priorMessages = messages.slice(0, index);
        const lastUserMessage = priorMessages[priorMessages.length - 1];

        if (!lastUserMessage || lastUserMessage.role !== 'user') {
            console.error("Cannot reload: No preceding user message found");
            return;
        }

        const messagesToKeep = messages.slice(0, index - 1);
        setMessages(messagesToKeep);

        const contentToResend = lastUserMessage.content;
        const cleanContent = contentToResend.split('\n\n[ADDITIONAL CONTEXT]:')[0];
        const newContent = context ? `${cleanContent}\n\n[ADDITIONAL CONTEXT]: ${context}` : cleanContent;
        // Small delay to ensure state update processes (though React batching usually handles this, 
        // we are rendering based on `messages`. `sendMessage` uses functional update so it should be fine)
        setTimeout(() => sendMessage(newContent), 0);
    };

    const handleReload = () => {
        const lastAssistantMessageIndex = messages.findLastIndex(m => m.role === 'assistant');
        if (lastAssistantMessageIndex !== -1) {
            handleReloadClick(messages[lastAssistantMessageIndex].id);
        }
    };

    const renderMessage = (message: Message) => {
        const content = message.content;
        const saveBlock = parseSaveBlock(content);
        // Remove save block from display content (handle both formats)
        const saveBlockRegex = /(?:```)?json:save:(character|world|project)(?::(\w+))?\s*\n([\s\S]*?)(?:\n```|$)/i;
        const saveData = saveBlock ? { 
            type: saveBlock.type, 
            data: saveBlock.data, 
            targetSection: saveBlock.targetSection, 
            cleanContent: content.replace(saveBlockRegex, '').trim() 
        } : null;
        const displayContent = saveData ? saveData.cleanContent : content;

        const lines = displayContent.split('\n');
        const isApplied = appliedUpdates.has(message.id);

        // Get original data for diff - use linkedEntity first, then targetIdParam
        let originalData = null;
        if (saveData) {
            if (saveData.type === 'character') {
                originalData = linkedEntity?.type === 'character' 
                    ? characters.find(c => c.id === linkedEntity.id)
                    : targetIdParam 
                        ? characters.find(c => c.id === targetIdParam)
                        : null;
            } else if (saveData.type === 'world') {
                originalData = linkedEntity?.type === 'world'
                    ? worlds.find(w => w.id === linkedEntity.id)
                    : targetIdParam
                        ? worlds.find(w => w.id === targetIdParam)
                        : null;
            } else if (saveData.type === 'project') {
                originalData = linkedEntity?.type === 'project'
                    ? projects.find(p => p.id === linkedEntity.id)
                    : targetIdParam
                        ? projects.find(p => p.id === targetIdParam)
                        : null;
            }
        }

        return (
            <div>
                {lines.map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-semibold text-foreground mt-4 mb-2">{line.slice(2, -2)}</p>;
                    }
                    if (line.startsWith('## ')) {
                        return <h2 key={i} className="font-semibold text-foreground mt-4 mb-2 text-lg">{line.slice(3)}</h2>;
                    }
                    if (line.startsWith('# ')) {
                        return <h1 key={i} className="font-bold text-foreground mt-4 mb-2 text-xl">{line.slice(2)}</h1>;
                    }
                    if (line.startsWith('â€¢ ') || line.startsWith('- ') || line.startsWith('* ')) {
                        const text = line.slice(2);
                        return (
                            <div key={i} className="flex items-start gap-2 py-1">
                                <span className="text-primary mt-0.5">â€¢</span>
                                <span className="text-muted-foreground">{renderInlineCode(text)}</span>
                            </div>
                        );
                    }
                    if (/^\d+\.\s/.test(line)) {
                        const text = line.replace(/^\d+\.\s/, '');
                        return (
                            <div key={i} className="flex items-start gap-2 py-1">
                                <span className="text-primary mt-0.5 w-4">{line.match(/^\d+/)?.[0]}.</span>
                                <span className="text-muted-foreground">{renderInlineCode(text)}</span>
                            </div>
                        );
                    }
                    if (!line.trim()) return <div key={i} className="h-2" />;
                    return <p key={i} className="text-muted-foreground py-0.5">{renderInlineCode(line)}</p>;
                })}

                {saveData && !isApplied && (
                    <>
                        <PendingUpdateCard
                            type={saveData.type}
                            data={saveData.data}
                            originalData={originalData}
                            onConfirm={() => {
                                // Show manual save modal for field selection
                                setManualSaveData({
                                    type: saveData.type,
                                    data: saveData.data,
                                    originalData: originalData || undefined
                                });
                                setShowManualSaveModal(true);
                            }}
                            onCancel={() => {
                                // If we had a reject handler to just hide the card, we could use it.
                                // For now, let's just mark it as applied (ignored) or add a specific state 'rejected'
                                setAppliedUpdates(prev => new Set(prev).add(message.id));
                            }}
                        />
                    </>
                )}

                {saveData && isApplied && (
                    <div className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Updates Applied
                    </div>
                )}
            </div>
        );
    };

    const renderInlineCode = (text: string) => {
        if (!text.includes('`')) return text;
        const parts = text.split('`');
        return parts.map((part, j) =>
            j % 2 === 1 ? (
                <code key={j} className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-sm font-mono">{part}</code>
            ) : <span key={j}>{part}</span>
        );
    };

    const suggestions = getFilteredMentions();
    const commandSuggestions = getFilteredCommands();

    return (
        <div className="flex flex-col h-screen">
            {/* Header ... */}
            <header className="h-14 border-b border-border px-6 flex items-center justify-between glass-strong shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {(() => {
                            // Check admin mode and keys in real-time using utility function for consistency
                            const adminModeActive = typeof window !== 'undefined' && localStorage.getItem('5d-admin-mode') === 'true';
                            
                            if (adminModeActive) {
                                // Use the same utility function to check for admin keys
                                const adminApiKey = getChatApiKey(provider);
                                const adminHasKeys = !!adminApiKey && adminApiKey.trim().length > 0;
                                
                                if (adminHasKeys) {
                                    return (
                                        <>
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="font-medium text-sm text-emerald-400">Admin Mode</span>
                                        </>
                                    );
                                }
                            }
                            
                            // Fall back to regular connection status
                            if (hasApiKey) {
                                return (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="font-medium text-sm text-emerald-400">Connected</span>
                                    </>
                                );
                            } else {
                                return (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-red-400" />
                                        <span className="font-medium text-sm text-red-400">Setup Required</span>
                                    </>
                                );
                            }
                        })()}
                    </div>
                    <div className="h-4 w-px bg-border" />

                    <button
                        onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                            showHistorySidebar ? "bg-primary/20 text-primary" : "hover:bg-primary/10 text-muted-foreground"
                        )}
                        title="Update History"
                    >
                        <History className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-border" />

                    {/* Model Selector Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors cursor-pointer border border-primary/20">
                                <Sparkles className="w-3 h-3" />
                                {apiConfig?.provider === 'openai' ? 'GPT-4o' : 'Claude 3.5'}
                                <ChevronRight className="w-3 h-3 rotate-90" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 bg-black/95 border-white/10 backdrop-blur-xl">
                            <DropdownMenuItem
                                onClick={() => {
                                    if (apiConfig) {
                                        const newConfig = { ...apiConfig, provider: 'anthropic' };
                                        setApiConfig(newConfig);
                                        localStorage.setItem('5d-api-config', JSON.stringify(newConfig));
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-2 cursor-pointer",
                                    apiConfig?.provider === 'anthropic' && "text-primary"
                                )}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                                <div className="flex-1">
                                    <div className="font-medium">Claude 3.5</div>
                                    <div className="text-[10px] text-muted-foreground">Anthropic Sonnet</div>
                                </div>
                                {apiConfig?.provider === 'anthropic' && <Check className="w-3.5 h-3.5" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    if (apiConfig) {
                                        const newConfig = { ...apiConfig, provider: 'openai' };
                                        setApiConfig(newConfig);
                                        localStorage.setItem('5d-api-config', JSON.stringify(newConfig));
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-2 cursor-pointer",
                                    apiConfig?.provider === 'openai' && "text-primary"
                                )}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <div className="flex-1">
                                    <div className="font-medium">GPT-4o</div>
                                    <div className="text-[10px] text-muted-foreground">OpenAI</div>
                                </div>
                                {apiConfig?.provider === 'openai' && <Check className="w-3.5 h-3.5" />}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                                    <Settings className="w-3.5 h-3.5" />
                                    <span>Manage API Keys</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                    {/* Entity Linking with Fuzzy Search */}
                    <EntityLinker
                        linkedEntity={linkedEntity}
                        onLink={handleSetLinkedEntity}
                        characters={characters.map(c => ({ id: c.id, name: c.name }))}
                        worlds={worlds.map(w => ({ id: w.id, name: w.name }))}
                        projects={projects.map(p => ({ id: p.id, name: p.name }))}
                    />

                    {/* Mode Presets - shown when in session setup mode or has active config */}
                    {(sessionSetupMode || sessionSetupConfig) && (
                        <ModePresetManager
                            currentMode={(sessionSetupMode || mode || 'chat') as ChatMode}
                            currentConfig={sessionSetupConfig}
                            onLoadPreset={(preset) => {
                                // Load preset configuration
                                if (preset.sessionConfig) {
                                    setSessionSetupConfig(preset.sessionConfig as SessionSetupConfig);
                                }
                            }}
                            compact
                        />
                    )}

                    <div className="h-4 w-px bg-border" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-2 mr-1"
                        onClick={() => sendMessage('/save')}
                        title="Save Current Progress"
                    >
                        <Save className="h-4 w-4" />
                        <span className="text-xs hidden md:inline">Save</span>
                    </Button>
                    {/* Save as Document button for script/roleplay/chat_with modes */}
                    {(mode === 'script' || mode === 'scene' || mode === 'chat_with') && linkedEntity?.type === 'character' && activeSessionId && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 gap-2"
                                onClick={() => {
                                    const session = chatSessions.find(s => s.id === activeSessionId);
                                    if (session && linkedEntity) {
                                        setShowSaveDocumentOptionModal(true);
                                    }
                                }}
                                title="Save as Document"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs hidden md:inline">Save Doc</span>
                            </Button>
                            <div className="h-4 w-px bg-border mx-1" />
                        </>
                    )}
                    {/* Save as Project Document button for project mode with output type */}
                    {mode === 'project' && linkedEntity?.type === 'project' && activeSessionId && outputTypeParam && OUTPUT_TYPE_TO_DOC_TYPE[outputTypeParam] && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-2"
                                onClick={() => {
                                    const session = chatSessions.find(s => s.id === activeSessionId);
                                    if (session && linkedEntity) {
                                        const docType = OUTPUT_TYPE_TO_DOC_TYPE[outputTypeParam];
                                        setSelectedProjectDocType(docType);
                                        // Extract content from last assistant message
                                        const lastAssistantMessage = [...session.messages].reverse().find(m => m.role === 'assistant');
                                        const content = lastAssistantMessage?.content || sessionToDocumentContent(session, 'script');
                                        setSaveProjectDocumentContent(content);
                                        setSaveProjectDocumentTitle(`${OUTPUT_TYPE_INSTRUCTIONS[outputTypeParam]?.label || 'Document'} - ${linkedEntity.name}`);
                                        setShowSaveProjectDocumentModal(true);
                                    }
                                }}
                                title="Save as Project Document"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs hidden md:inline">Save Doc</span>
                            </Button>
                            <div className="h-4 w-px bg-border mx-1" />
                        </>
                    )}
                    <div className="h-4 w-px bg-border mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground gap-2"
                        onClick={handleCommandsClick}
                    >
                        <Command className="h-4 w-4" />
                        <span className="text-xs">Commands</span>
                        <kbd className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">/</kbd>
                    </Button>
                    <div className="h-4 w-px bg-border mx-1" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-black/90 border-white/10 backdrop-blur-xl">
                            <DropdownMenuItem onClick={handleRestartChat} className="text-xs cursor-pointer focus:bg-white/10 focus:text-white">
                                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                                Restart Chat
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />

                            {/* Session Tags Section */}
                            <div className="px-2 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                Session Tags
                            </div>
                            {activeSessionId && (
                                <>
                                    <div className="px-2 pb-2 flex flex-wrap gap-1">
                                        {chatSessions.find(s => s.id === activeSessionId)?.tags?.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary border border-primary/20"
                                            >
                                                #{tag}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const session = chatSessions.find(s => s.id === activeSessionId);
                                                        const newTags = session?.tags?.filter(t => t !== tag) || [];
                                                        updateChatSession(activeSessionId, { tags: newTags });
                                                    }}
                                                    className="hover:text-red-400"
                                                >
                                                    Ã—
                                                </button>
                                            </span>
                                        )) || <span className="text-[10px] text-muted-foreground italic">No tags</span>}
                                    </div>
                                    <div className="px-2 pb-2">
                                        <div className="flex gap-1">
                                            <input
                                                type="text"
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newTag.trim()) {
                                                        const session = chatSessions.find(s => s.id === activeSessionId);
                                                        const currentTags = session?.tags || [];
                                                        if (!currentTags.includes(newTag.trim())) {
                                                            updateChatSession(activeSessionId, { tags: [...currentTags, newTag.trim()] });
                                                        }
                                                        setNewTag('');
                                                    }
                                                }}
                                                placeholder="Add tag..."
                                                className="flex-1 px-2 py-1 text-xs rounded bg-white/5 border border-white/10 focus:outline-none focus:border-primary/50"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (newTag.trim()) {
                                                        const session = chatSessions.find(s => s.id === activeSessionId);
                                                        const currentTags = session?.tags || [];
                                                        if (!currentTags.includes(newTag.trim())) {
                                                            updateChatSession(activeSessionId, { tags: [...currentTags, newTag.trim()] });
                                                        }
                                                        setNewTag('');
                                                    }
                                                }}
                                                className="px-2 py-1 text-xs rounded bg-primary/20 text-primary hover:bg-primary/30"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={handleDeleteChat} className="text-xs text-red-400 focus:text-red-400 cursor-pointer focus:bg-red-500/10">
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete Chat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header >

            {/* Warnings ... */}
            {
                !hasApiKey && !dismissApiKeyBanner && typeof window !== 'undefined' && localStorage.getItem('5d-admin-mode') !== 'true' && (
                    <div className="mx-6 mt-4 p-4 rounded-xl glass-card border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground mb-1">API Key Required</p>
                                <p className="text-xs text-muted-foreground mb-3">Add your API key in Settings to start chatting with AI.</p>
                                <div className="flex items-center gap-2">
                                    <Link href="/settings">
                                        <Button size="sm" variant="outline" className="h-8 text-xs">
                                            <Settings className="h-3.5 w-3.5 mr-1.5" /> Open Settings
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <button
                                onClick={() => setDismissApiKeyBanner(true)}
                                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-white/5 transition-colors shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )
            }
            {
                error && (
                    <div className="mx-6 mt-4 p-4 rounded-xl glass-card border-red-500/20 bg-red-500/5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground mb-1">Error</p>
                                <p className="text-xs text-muted-foreground">{error}</p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((message, index) => (
                        <div key={message.id} className={cn("animate-fade-in", message.role === 'user' ? 'flex justify-end' : 'flex justify-start')} style={{ animationDelay: `${index * 50}ms` }}>
                            <div className={cn("max-w-[85%] rounded-2xl px-5 py-4", message.role === 'user' ? "message-user" : "message-assistant")}>
                                {message.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                            <Sparkles className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="text-xs font-medium text-foreground">5D Creator</span>
                                    </div>
                                )}
                                <div className="text-sm leading-relaxed">{renderMessage(message)}</div>
                                {message.role === 'assistant' && message.choices && message.choices.length > 0 && (
                                    <ChoiceChips
                                        choices={message.choices}
                                        onSelect={handleChoiceSelect}
                                        messageContext={{
                                            messageId: message.id,
                                            questionText: message.content.split('\n')[0].substring(0, 200) // First line as question context
                                        }}
                                    />
                                )}
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                    <span className="text-[10px] text-muted-foreground">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {message.role === 'assistant' && message.id !== 'welcome' && (
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => copyToClipboard(message.content)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleFork(message.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title="Fork Conversation from here"><GitFork className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleReloadClick(message.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="message-assistant rounded-2xl px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t border-border glass-strong relative z-20">
                <div className="max-w-3xl mx-auto p-4 relative">
                    {/* Mentions Popup */}
                    {mentionQuery !== null && (
                        <div className="absolute bottom-full left-4 mb-2 w-64 glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-2 fade-in divide-y divide-white/5">
                            <div className="px-3 py-2 bg-white/5 text-xs font-semibold text-muted-foreground">
                                Mention...
                            </div>
                            {suggestions.length > 0 ? (
                                suggestions.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleMentionSelect(item)}
                                        className="w-full text-left px-3 py-2.5 hover:bg-primary/10 transition-colors flex items-center gap-3 text-sm group"
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                            item.type === 'Character' ? "bg-emerald-500/10 text-emerald-500" : "bg-violet-500/10 text-violet-500"
                                        )}>
                                            {item.type === 'Character' ? <User className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1 truncate">
                                            <span className="text-foreground font-medium">{item.name}</span>
                                            <span className="ml-2 text-xs text-muted-foreground opacity-50">{item.type}</span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2.5 text-xs text-muted-foreground italic">
                                    No matches found.
                                </div>
                            )}
                        </div>
                    )}


                    {/* Commands Popup */}
                    {commandQuery !== null && (
                        <div className="absolute bottom-full left-4 mb-2 w-72 glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-2 fade-in divide-y divide-white/5">
                            <div className="px-3 py-2 bg-white/5 text-xs font-semibold text-muted-foreground">Commands...</div>
                            {commandSuggestions.length > 0 ? (
                                commandSuggestions.map(cmd => (
                                    <button key={cmd.id} onClick={() => handleCommandSelect(cmd)} className="w-full text-left px-3 py-2.5 hover:bg-primary/10 transition-colors flex items-center gap-3 text-sm group">
                                        <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                            <cmd.icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 truncate">
                                            <span className="text-foreground font-medium">{cmd.label}</span>
                                            <span className="ml-2 text-xs text-muted-foreground opacity-50 block">{cmd.description}</span>
                                        </div>
                                    </button>
                                ))
                            ) : <div className="px-3 py-2.5 text-xs text-muted-foreground italic">No commands found.</div>}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", showQuickActions ? "max-h-12 opacity-100 mb-3" : "max-h-0 opacity-0 mb-0")}>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-2">Quick Commands:</span>
                            {['/generate basic', '/worldbio', '/menu'].map((cmd) => (
                                <button key={cmd} onClick={() => setInput(cmd)} disabled={!hasApiKey} className="text-[10px] px-3 py-1.5 rounded-lg bg-white/[0.03] text-muted-foreground hover:text-primary hover:bg-primary/10 border border-white/5 hover:border-primary/20 transition-all disabled:opacity-50">
                                    {cmd}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                        <button type="button" onClick={() => setShowQuickActions(!showQuickActions)} className={cn("p-3 rounded-xl transition-all border border-transparent", showQuickActions ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-foreground")} title="Toggle Quick Actions">
                            <Sparkles className="h-5 w-5" />
                        </button>
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e as any);
                                    }
                                }}
                                rows={1}
                                placeholder={hasApiKey ? "Type / for commands, @ to mention..." : "Add API key in Settings first..."}
                                disabled={isLoading || !hasApiKey}
                                className="w-full premium-input pr-12 disabled:opacity-50 min-h-[46px] max-h-[200px] py-3 resize-none scroll-smooth"
                            />
                            <div className="absolute right-4 top-3">
                                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">/</kbd>
                            </div>
                        </div>

                        {/* Generate Options Toggle */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setShowGenerateOptions(!showGenerateOptions)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-0.5 min-w-[3.5rem] px-1 rounded-xl transition-all border border-transparent h-[50px]",
                                        showGenerateOptions
                                            ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                    )}
                                >
                                    <div className={cn("w-8 h-4 rounded-full border relative transition-colors", showGenerateOptions ? "bg-violet-500 border-violet-500" : "bg-transparent border-muted-foreground")}>
                                        <div className={cn("absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all", showGenerateOptions ? "left-[18px]" : "left-0.5")} />
                                    </div>
                                    <span className="text-[9px] font-medium">Options</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-black/90 border-white/10 text-white max-w-xs">
                                <p className="text-xs">
                                    {showGenerateOptions 
                                        ? "AI will provide interactive choice options after each response. Click to disable."
                                        : "Enable AI to automatically generate interactive choice options after each response, making conversations more engaging and easier to navigate."}
                                </p>
                            </TooltipContent>
                        </Tooltip>

                        <button type="submit" disabled={isLoading || !input.trim() || !hasApiKey} className={cn("premium-button flex items-center justify-center translate-y-0 h-[50px] w-[50px]", "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none")}>
                            <Send className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            </div >

            <CommandTutorialModal open={showCommandTutorial} onOpenChange={setShowCommandTutorial} />

            {/* Context Switch / Notification Toast */}
            {
                toast && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl border backdrop-blur-md",
                            toast.type === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-200" :
                                toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" :
                                    "bg-white/10 border-white/10 text-white"
                        )}>
                            {toast.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            <span className="text-xs font-medium">{toast.message}</span>
                        </div>
                    </div>
                )
            }

            <ReloadModal
                open={showReloadModal}
                onOpenChange={setShowReloadModal}
                onReload={handleReloadWithContext}
            />

            <UpdateHistorySidebar
                isOpen={showHistorySidebar}
                onClose={() => setShowHistorySidebar(false)}
                history={activeSessionId ? chatSessions.find(s => s.id === activeSessionId)?.updateHistory || [] : []}
            />

            {/* Session Setup Modal */}
            {sessionSetupMode && (
                <SessionSetupModal
                    isOpen={showSessionSetup}
                    onClose={() => {
                        setShowSessionSetup(false);
                        setSessionSetupMode(null);
                        // Navigate back if user cancels
                        window.history.back();
                    }}
                    onStart={async (config) => {
                        setSessionSetupConfig(config);
                        setShowSessionSetup(false);
                        
                        // Build context message with selected characters and worlds
                        const selectedChars = config.selectedCharacters
                            .map(id => characters.find(c => c.id === id))
                            .filter(Boolean) as Array<{ id: string; name: string }>;
                        const selectedWorlds = config.selectedWorlds
                            .map(id => worlds.find(w => w.id === id))
                            .filter(Boolean) as Array<{ id: string; name: string }>;
                        
                        // Link first character if available
                        if (selectedChars.length > 0) {
                            setLinkedEntity({
                                type: 'character',
                                id: selectedChars[0].id,
                                name: selectedChars[0].name
                            });
                        }
                        
                        // Handle chat_with mode differently - set up persona
                        if (sessionSetupMode === 'chat_with' && selectedChars.length > 0) {
                            const char = characters.find(c => c.id === selectedChars[0].id);
                            if (char) {
                                // Set Persona Context with FULL character data
                                const persona = `
                                [SYSTEM: ACT AS CHARACTER - YOU ARE ${char.name.toUpperCase()}]
                                You are now embodying the character "${char.name}". You ARE this character, not an AI assistant.
                                
                                CRITICAL: Use the FULL CHARACTER DATA provided below to inform every response. Stay in character at all times.
                                
                                CHARACTER SUMMARY:
                                - Name: ${char.name}
                                - Role: ${char.role || 'Not specified'}
                                - Archetype: ${char.archetype || 'Not specified'}
                                - Core Concept: ${char.coreConcept || 'Not specified'}
                                - Motivations: ${char.motivations?.join(', ') || 'Not specified'}
                                - Flaws: ${char.flaws?.join(', ') || 'Not specified'}
                                
                                FULL CHARACTER DATA (use this for authentic responses):
                                ${JSON.stringify(char, null, 2)}
                                
                                INSTRUCTIONS:
                                - Speak as ${char.name} would speak - use their voice, vocabulary, and speech patterns
                                - Reflect their personality, background, and worldview in every response
                                - Use their backstory, relationships, and motivations to inform your reactions
                                - Stay true to their flaws, fears, and desires
                                - The user is talking to you directly as ${char.name}
                                - Do NOT break character or acknowledge you're an AI unless explicitly asked
                                - Respond naturally and authentically as the character
                                `;

                                setActivePersona(persona);

                                // Set initial character introduction message
                                setMessages([{
                                    id: 'intro',
                                    role: 'assistant',
                                    content: `*${char.name} looks at you.* \n\n"Hello. What brings you to me?"`,
                                    choices: [
                                        { id: 'talk', label: '💬 Talk Directly', description: 'Interview the character' },
                                        { id: 'scene', label: '🎬 Generate Scene', description: 'Put them in a situation' }
                                    ]
                                }]);
                                return;
                            }
                        }
                        
                        // Build the initial prompt to start the roleplay/script
                        let startPrompt = '';
                        if (sessionSetupMode === 'script') {
                            if (showGenerateOptions) {
                                // When options are enabled, ask questions first
                                startPrompt = 'I want to create a script. Please ask me questions about the script details first (genre, conflict, key scenes, etc.) before generating it.';
                            } else {
                                // When options are disabled, generate immediately
                                startPrompt = 'Start creating the script';
                                if (config.sceneType) {
                                    startPrompt += ` with a ${config.sceneType} scene`;
                                }
                                if (selectedChars.length > 0) {
                                    startPrompt += ` featuring ${selectedChars.map(c => c.name).join(', ')}`;
                                }
                                if (config.tone) {
                                    startPrompt += ` in a ${config.tone} tone`;
                                }
                                if (config.length) {
                                    startPrompt += ` (${config.length} length)`;
                                }
                                startPrompt += '.';
                            }
                        } else {
                            // Roleplay mode
                            startPrompt = 'Begin the roleplay';
                            if (selectedChars.length > 0) {
                                startPrompt += ` with ${selectedChars.map(c => c.name).join(', ')}`;
                            }
                            if (config.sceneType) {
                                startPrompt += ` in a ${config.sceneType} scenario`;
                            }
                            if (config.tone) {
                                startPrompt += ` with a ${config.tone} tone`;
                            }
                            if (config.length) {
                                startPrompt += ` (${config.length} length)`;
                            }
                            startPrompt += '. Start the scene and let me interact with the characters.';
                        }
                        
                        // Set a welcome message first
                        let contextMessage = '';
                        if (sessionSetupMode === 'script') {
                            contextMessage = `📝 **Script Creation Setup Complete**\n\n`;
                            if (config.generateRandomCharacters) {
                                contextMessage += `• Generating random characters\n`;
                            } else if (selectedChars.length > 0) {
                                contextMessage += `• Characters: ${selectedChars.map(c => c.name).join(', ')}\n`;
                            }
                            if (config.generateRandomWorlds) {
                                contextMessage += `• Generating random world\n`;
                            } else if (selectedWorlds.length > 0) {
                                contextMessage += `• Worlds: ${selectedWorlds.map(w => w.name).join(', ')}\n`;
                            }
                            if (config.sceneType) contextMessage += `• Scene Type: ${config.sceneType}\n`;
                            if (config.tone) contextMessage += `• Tone: ${config.tone}\n`;
                            if (config.length) contextMessage += `• Length: ${config.length}\n`;
                        } else {
                            contextMessage = `✨ **Roleplay Setup Complete**\n\n`;
                            if (config.generateRandomCharacters) {
                                contextMessage += `• Generating random characters\n`;
                            } else if (selectedChars.length > 0) {
                                contextMessage += `• Characters: ${selectedChars.map(c => c.name).join(', ')}\n`;
                            }
                            if (config.generateRandomWorlds) {
                                contextMessage += `• Generating random world\n`;
                            } else if (selectedWorlds.length > 0) {
                                contextMessage += `• Worlds: ${selectedWorlds.map(w => w.name).join(', ')}\n`;
                            }
                            if (config.sceneType) contextMessage += `• Scene Type: ${config.sceneType}\n`;
                            if (config.tone) contextMessage += `• Tone: ${config.tone}\n`;
                            if (config.length) contextMessage += `• Length: ${config.length}\n`;
                        }
                        
                        setMessages([{
                            id: 'setup-complete',
                            role: 'assistant',
                            content: contextMessage,
                            choices: []
                        }]);
                        
                        // Automatically send the start message after a brief delay
                        setTimeout(() => {
                            sendMessage(startPrompt);
                        }, 300);
                    }}
                    mode={sessionSetupMode}
                    characters={characters.map(c => ({ id: c.id, name: c.name }))}
                    worlds={worlds.map(w => ({ id: w.id, name: w.name }))}
                    initialCharacterId={linkedEntity?.type === 'character' ? linkedEntity.id : undefined}
                    initialWorldId={linkedEntity?.type === 'world' ? linkedEntity.id : undefined}
                />
            )}

            {/* Manual Save Modal */}
            {manualSaveData && (
                <ManualSaveModal
                    isOpen={showManualSaveModal}
                    onClose={() => {
                        setShowManualSaveModal(false);
                        setManualSaveData(null);
                    }}
                    type={manualSaveData.type}
                    data={manualSaveData.data}
                    originalData={manualSaveData.originalData}
                    onSave={(selectedFields) => {
                        // Filter data to only include selected fields
                        const filteredData: any = {};
                        selectedFields.forEach(field => {
                            filteredData[field] = manualSaveData.data[field];
                        });
                        
                        // Find the message ID for history tracking
                        const messageId = messages.find(m => 
                            m.pendingUpdate?.type === manualSaveData.type &&
                            JSON.stringify(m.pendingUpdate?.data) === JSON.stringify(manualSaveData.data)
                        )?.id;
                        
                        // Save with filtered data
                        handleSaveEntity(manualSaveData.type, filteredData, messageId);
                        
                        // Close modal
                        setShowManualSaveModal(false);
                        setManualSaveData(null);
                    }}
                />
            )}

            {/* Save Document Option Modal */}
            {showSaveDocumentOptionModal && activeSessionId && linkedEntity?.type === 'character' && (() => {
                const session = chatSessions.find(s => s.id === activeSessionId);
                if (!session) return null;
                
                const docType = mode === 'script' ? 'script' : 'roleplay';
                const character = characters.find(c => c.id === linkedEntity.id);
                
                const handleExtractGeneratedContent = async () => {
                    setIsExtractingContent(true);
                    setShowSaveDocumentOptionModal(false);
                    
                    try {
                        // Build extraction prompt
                        const extractionPrompt = `You are extracting ${docType === 'script' ? 'script' : 'roleplay'} content from a chat conversation.

CRITICAL INSTRUCTIONS:
- Extract ONLY the actual ${docType === 'script' ? 'script content' : 'roleplay content'} generated by the AI
- Remove all setup messages, metadata, user prompts asking for generation, and conversation overhead
- Format the extracted content as a clean, professional ${docType === 'script' ? 'script' : 'roleplay'} document
- ${docType === 'script' ? 'Maintain proper script format with character names, dialogue, and stage directions' : 'Maintain narrative flow and character interactions'}
- Do NOT include messages like "Script Creation Setup Complete" or similar metadata
- Do NOT include user messages that are just requests or setup
- Focus on the actual ${docType === 'script' ? 'script' : 'roleplay'} content that was generated

Here is the conversation:
${session.messages.map((m, idx) => `### ${m.role === 'user' ? 'User' : 'Assistant'} (Message ${idx + 1})\n${m.content}`).join('\n\n')}

Extract and format the ${docType === 'script' ? 'script' : 'roleplay'} content:`;

                        const response = await fetch('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                messages: [
                                    {
                                        role: 'system',
                                        content: `You are a content extraction assistant. Extract only the ${docType === 'script' ? 'script' : 'roleplay'} content from conversations, removing all setup, metadata, and non-content messages. Format it as a clean, professional document.`
                                    },
                                    {
                                        role: 'user',
                                        content: extractionPrompt
                                    }
                                ],
                                provider: apiConfig?.provider || 'anthropic',
                                apiKey: currentApiKey,
                            }),
                        });

                        if (!response.ok) {
                            throw new Error('Failed to extract content');
                        }

                        const reader = response.body?.getReader();
                        const decoder = new TextDecoder();
                        let extracted = '';

                        if (reader) {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                extracted += decoder.decode(value, { stream: true });
                            }
                        }

                        // Clean up the extracted content (remove any markdown code blocks if present)
                        let cleanContent = extracted.trim();
                        if (cleanContent.startsWith('```')) {
                            const lines = cleanContent.split('\n');
                            lines.shift(); // Remove first line (```markdown or similar)
                            if (lines[lines.length - 1].trim() === '```') {
                                lines.pop(); // Remove last line (```)
                            }
                            cleanContent = lines.join('\n').trim();
                        }

                        setExtractedContent(cleanContent);
                        setSaveDocumentTitle(generateDocumentTitle(session, docType));
                        setSaveDocumentContent(cleanContent);
                        setShowSaveDocumentModal(true);
                    } catch (error) {
                        console.error('Failed to extract content:', error);
                        setToast({
                            message: 'Failed to extract content. Saving whole chat instead.',
                            type: 'warning'
                        });
                        setTimeout(() => setToast(null), 3000);
                        // Fallback to whole chat
                        const defaultTitle = generateDocumentTitle(session, docType);
                        const defaultContent = sessionToDocumentContent(session, docType);
                        setSaveDocumentTitle(defaultTitle);
                        setSaveDocumentContent(defaultContent);
                        setShowSaveDocumentModal(true);
                    } finally {
                        setIsExtractingContent(false);
                    }
                };

                const handleCloseOptionModal = () => {
                    setShowSaveDocumentOptionModal(false);
                };

                const handleSelectOption = async (option: 'whole' | 'generated') => {
                    if (option === 'whole') {
                        const defaultTitle = generateDocumentTitle(session, docType);
                        const defaultContent = sessionToDocumentContent(session, docType);
                        setSaveDocumentTitle(defaultTitle);
                        setSaveDocumentContent(defaultContent);
                        setShowSaveDocumentOptionModal(false);
                        setShowSaveDocumentModal(true);
                    } else {
                        await handleExtractGeneratedContent();
                    }
                };

                return (
                    <SaveDocumentOptionModal
                        isOpen={showSaveDocumentOptionModal}
                        onClose={handleCloseOptionModal}
                        onSelectOption={handleSelectOption}
                        documentType={docType}
                        characterName={character?.name || linkedEntity.name}
                        session={session}
                        isProcessing={isExtractingContent}
                    />
                );
            })()}

            {/* Save Document Modal */}
            {showSaveDocumentModal && activeSessionId && linkedEntity?.type === 'character' && (() => {
                const session = chatSessions.find(s => s.id === activeSessionId);
                if (!session) return null;
                
                const docType = mode === 'script' ? 'script' : 'roleplay';
                const character = characters.find(c => c.id === linkedEntity.id);
                
                return (
                    <SaveDocumentModal
                        isOpen={showSaveDocumentModal}
                        onClose={() => {
                            setShowSaveDocumentModal(false);
                            setExtractedContent(null);
                            setSaveDocumentTitle('');
                            setSaveDocumentContent('');
                        }}
                        onSave={(doc) => {
                            // Check if document already exists for this session
                            const existingDocs = characterDocuments.filter(d => 
                                d.metadata?.sessionId === activeSessionId
                            );
                            
                            if (existingDocs.length > 0) {
                                // Update existing document
                                updateCharacterDocument(existingDocs[0].id, doc);
                                setToast({
                                    message: `Document "${doc.title}" updated!`,
                                    type: 'success'
                                });
                            } else {
                                // Create new document
                                addCharacterDocument(doc);
                                setToast({
                                    message: `Document "${doc.title}" saved!`,
                                    type: 'success'
                                });
                            }
                            setTimeout(() => setToast(null), 3000);
                            setExtractedContent(null);
                            setSaveDocumentTitle('');
                            setSaveDocumentContent('');
                        }}
                        defaultTitle={saveDocumentTitle}
                        defaultContent={saveDocumentContent}
                        documentType={docType}
                        characterId={linkedEntity.id}
                        characterName={character?.name || linkedEntity.name}
                    />
                );
            })()}

            {/* Save Project Document Modal */}
            {showSaveProjectDocumentModal && activeSessionId && linkedEntity?.type === 'project' && selectedProjectDocType && (() => {
                const session = chatSessions.find(s => s.id === activeSessionId);
                if (!session) return null;
                
                const project = projects.find(p => p.id === linkedEntity.id);
                
                return (
                    <SaveProjectDocumentModal
                        isOpen={showSaveProjectDocumentModal}
                        onClose={() => {
                            setShowSaveProjectDocumentModal(false);
                            setSaveProjectDocumentTitle('');
                            setSaveProjectDocumentContent('');
                            setSelectedProjectDocType(null);
                        }}
                        onSave={(doc) => {
                            // Check if document already exists for this session
                            const existingDocs = projectDocuments.filter(d => 
                                d.metadata?.sessionId === activeSessionId && d.type === selectedProjectDocType
                            );
                            
                            if (existingDocs.length > 0) {
                                // Update existing document
                                updateProjectDocument(existingDocs[0].id, doc);
                                setToast({
                                    message: `Document "${doc.title}" updated!`,
                                    type: 'success'
                                });
                            } else {
                                // Create new document
                                addProjectDocument(doc);
                                setToast({
                                    message: `Document "${doc.title}" saved!`,
                                    type: 'success'
                                });
                            }
                            setTimeout(() => setToast(null), 3000);
                            setSaveProjectDocumentTitle('');
                            setSaveProjectDocumentContent('');
                            setSelectedProjectDocType(null);
                            setShowSaveProjectDocumentModal(false);
                        }}
                        defaultTitle={saveProjectDocumentTitle}
                        defaultContent={saveProjectDocumentContent}
                        documentType={selectedProjectDocType}
                        projectId={linkedEntity.id}
                        projectName={project?.name || linkedEntity.name}
                    />
                );
            })()}
        </div >
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#08080c] flex items-center justify-center"><Sparkles className="animate-spin w-8 h-8 text-primary" /></div>}>
            <ChatContent />
        </Suspense>
    );
}
