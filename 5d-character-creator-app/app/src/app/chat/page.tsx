'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Search, Send, Menu, Sparkles, User, Globe, Folder, FileText, ChevronRight, X, Command, RefreshCw, Trash2, MoreVertical, AlertCircle, Save, Settings, Copy, RotateCcw, Check, Link2, Unlink, GitFork } from 'lucide-react';
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
import { ChoiceChips, type Choice } from '@/components/chat/ChoiceModal';
import { CommandTutorialModal } from '@/components/chat/CommandTutorialModal';
import { useStore } from '@/lib/store';

import { ChatSession, Message, AppliedUpdate } from '@/types/chat';
import { PendingUpdateCard } from '@/components/chat/PendingUpdateCard';
import { ReloadModal } from '@/components/chat/ReloadModal';
import { UpdateHistorySidebar } from '@/components/chat/UpdateHistorySidebar';
import { History } from 'lucide-react';

// Parse choices from AI response
function parseChoices(content: string): { cleanContent: string; choices: Choice[] } {
    const choices: Choice[] = [];
    let cleanContent = content;

    // Check for [OPTIONS: ...] or [CHOICES: ...] format
    const optionsMatch = content.match(/\[(OPTIONS|CHOICES):\s*(.+?)\]/i);
    if (optionsMatch) {
        const options = optionsMatch[2].split('|').map(s => s.trim());
        options.forEach((opt, idx) => {
            choices.push({
                id: `choice-${idx}`,
                label: opt,
            });
        });
        cleanContent = content.replace(optionsMatch[0], '').trim();
    }

    // Fallback: Check for numbered list patterns if no explicit options found
    const numberedPattern = /(?:Choose one|Select|Pick).*?:\s*\n((?:\d+\.\s*.+\n?)+)/i;
    const numberedMatch = content.match(numberedPattern);
    if (numberedMatch && !choices.length) {
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
    }

    return { cleanContent, choices };
}


const AVAILABLE_COMMANDS = [
    { id: 'generate-basic', label: '/generate basic', description: 'Quick 5-7 question character', icon: User },
    { id: 'generate-advanced', label: '/generate advanced', description: 'Full 5-phase development', icon: User },
    { id: 'worldbio', label: '/worldbio', description: 'Create a world setting', icon: Globe },
    { id: 'menu', label: '/menu', description: 'See all commands', icon: Command },
    { id: 'help', label: '/help', description: 'Get usage details', icon: AlertCircle },
    { id: 'simulate', label: '/simulate', description: 'Stress-test in scenarios', icon: Sparkles },
    { id: 'analyze', label: '/analyze', description: 'Expert framework review', icon: Search },
];

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
        forkSession
    } = useStore();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');
    const promptParam = searchParams.get('prompt');
    const sessionIdParam = searchParams.get('sessionId');
    const targetIdParam = searchParams.get('id'); // ID if editing/workshop
    const parentWorldIdParam = searchParams.get('parentWorldId'); // For new characters



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
    const [showGenerateOptions, setShowGenerateOptions] = useState(false); // New state for options toggle

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

    // Context Switch / Link Handler
    const handleSetLinkedEntity = (entity: { type: 'character' | 'world' | 'project'; id: string; name: string } | null) => {
        if (!entity) {
            setLinkedEntity(null);
            if (activeSessionId) {
                updateChatSession(activeSessionId, { relatedId: undefined });
            }
            return;
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

    // Load API config from localStorage
    useEffect(() => {
        const savedConfig = localStorage.getItem('5d-api-config');
        if (savedConfig) {
            try {
                setApiConfig(JSON.parse(savedConfig));
            } catch (e) {
                console.error('Failed to parse config:', e);
            }
        }
    }, []);

    const currentApiKey = apiConfig?.provider === 'openai'
        ? apiConfig?.openaiKey
        : apiConfig?.anthropicKey;

    const hasApiKey = !!currentApiKey;

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
    }, [sessionIdParam, chatSessions, activeSessionId, characters, worlds]);

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
    const parseSaveBlock = (content: string): { type: 'character' | 'world' | 'project'; data: any } | null => {
        // Match ```json:save:TYPE ... ``` blocks
        const saveBlockPattern = /```json:save:(character|world|project)\s*\n([\s\S]*?)\n```/i;
        const match = content.match(saveBlockPattern);

        if (!match) return null;

        const [, type, jsonStr] = match;

        try {
            const data = JSON.parse(jsonStr);
            return {
                type: type as 'character' | 'world' | 'project',
                data
            };
        } catch (e) {
            console.error('Failed to parse save block JSON:', e);
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

        const systemInstruction = `
        You are the 5D Character Creator AI.
        
        CRITICAL: To update the Character or World, output a JSON block.
        Format:
        \`\`\`json:save:character
        {
          "name": "Updated Name",
          "role": "Protagonist",
          "coreConcept": "A brief summary...",
          "personalityProse": "Detailed description of personality...",
          "backstoryProse": "Narrative backstory...",
          "relationshipsProse": "Notes on key relationships...",
          "customSections": [
             { "id": "sect-1", "title": "Secrets", "content": "..." }
          ]
        }
        \`\`\`
        
        Rules:
        1. PREFER the "Prose" fields (personalityProse, backstoryProse) for rich text content over arrays.
        2. For arrays (motivations, flaws, etc), provide the COMPLETE list if you change it.
        3. For customSections, provide the COMPLETE list.
        4. Do NOT output this block until the content is finalized.
        
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

        let effectiveInstruction = activePersona || systemInstruction;

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
        if (linkedEntity) {
            if (linkedEntity.type === 'character') {
                const char = characters.find(c => c.id === linkedEntity.id);
                if (char) {
                    effectiveInstruction += `\n\n[LINKED CHARACTER - FULL CONTEXT]\nYou are actively working on this character. Here is their complete profile:\n${JSON.stringify(char, null, 2)}`;
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
            effectiveInstruction += "\n\nIMPORTANT: For every question you ask, OR if I ask for options, provide recommended answers in the standard options format: [OPTIONS: choice1 | choice2 ...].\nCRITICAL: Even if you just generated a JSON Save Block or applied updates, YOU MUST still provide options for the next step/question at the very end of your response.";
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

                addChatSession({
                    id: newId,
                    title,
                    lastMessage: cleanContentFinal.slice(0, 100),
                    messages: [...messages, userMessage, { ...assistantMessage, content: fullContent }], // Approximation, ideally use functional state update result
                    createdAt: now,
                    updatedAt: now,
                    mode: (mode as any) || 'chat',
                    relatedId: activeCharacterId || activeWorldId || activeProjectId || undefined
                });
            } else {
                updateChatSession(activeSessionId, {
                    lastMessage: cleanContentFinal.slice(0, 100),
                    messages: [...messages, userMessage, { ...assistantMessage, content: fullContent }],
                    updatedAt: now
                });
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

                // Set Persona Context
                const persona = `
                [SYSTEM: ACT AS CHARACTER]
                You are now embodying the character "${char.name}".
                
                PROFILE:
                - Role: ${char.role}
                - Archetype: ${char.archetype}
                - Concept: ${char.coreConcept}
                - Motivations: ${char.motivations?.join(', ')}
                - Flaws: ${char.flaws?.join(', ')}
                - Voice/Tone: Stay in character. Use their vocabulary. Reflect their worldview.
                
                SCENARIO:
                The user is talking to you directly. Do not break character unless asked to [Generate Scene].
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

        if (mode) {
            let command = '';
            switch (mode) {
                case 'character': command = '/generate basic'; break;
                case 'world': command = '/worldbio'; break;
                case 'scene': command = 'Help me write a scene involving my characters.'; break;
                case 'lore': command = 'I want to explore the history and lore of my world.'; break;
            }

            if (command) {
                autoStartRef.current = true;
                sendMessage(command);
            }
        }
    }, [mode, promptParam, hasApiKey, characters]);

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

    const parseSaveData = (content: string) => {
        // Regex to find [SAVE:TYPE {JSON}]
        // Simplified: Search for a code block with a header like "Save Character" or specific tag
        // Actually, let's use a specific custom block: ```json:save:character

        const saveRegex = /```json:save:(character|world)\n([\s\S]*?)\n```/;
        const match = content.match(saveRegex);

        if (match) {
            try {
                const type = match[1] as 'character' | 'world';
                const data = JSON.parse(match[2]);
                return { type, data, cleanContent: content.replace(match[0], '').trim() };
            } catch (e) {
                console.error("Failed to parse save block", e);
            }
        }
        return null;
    };

    const handleSaveEntity = (type: 'character' | 'world' | 'project', data: any, messageId?: string) => {
        console.log('=== handleSaveEntity called ===');
        console.log('Type:', type);
        console.log('Data:', data);
        console.log('LinkedEntity:', linkedEntity);
        console.log('targetIdParam:', targetIdParam);

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
                updateCharacter(charToUpdate.id, {
                    ...data,
                    motivations: Array.isArray(data.motivations) ? data.motivations : charToUpdate.motivations,
                    flaws: Array.isArray(data.flaws) ? data.flaws : charToUpdate.flaws,
                    allies: Array.isArray(data.allies) ? data.allies : charToUpdate.allies,
                    enemies: Array.isArray(data.enemies) ? data.enemies : charToUpdate.enemies,
                    customSections: Array.isArray(data.customSections) ? data.customSections : charToUpdate.customSections,
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
                updateWorld(worldToUpdate.id, {
                    ...data,
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
                addWorld({
                    id,
                    name,
                    genre: 'General',
                    tone: 'Neutral',
                    ...data,
                    updatedAt: new Date(),
                    createdAt: new Date()
                });
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

                // RECORD HISTORY
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

                // RECORD HISTORY
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

    const handleChoiceSelect = (choice: Choice | Choice[]) => {
        // Send choice as user message
        if (Array.isArray(choice)) {
            sendMessage(choice.map(c => c.label).join(', '));
        } else {
            sendMessage(choice.label);
        }
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
        const saveData = parseSaveData(content);
        const displayContent = saveData ? saveData.cleanContent : content;

        const lines = displayContent.split('\n');
        const isApplied = appliedUpdates.has(message.id);

        // Get original data for diff
        let originalData = null;
        if (saveData) {
            if (saveData.type === 'character') {
                originalData = characters.find(c => c.id === targetIdParam) || null;
            } else {
                originalData = worlds.find(w => w.id === targetIdParam) || null;
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
                    <PendingUpdateCard
                        type={saveData.type}
                        data={saveData.data}
                        originalData={originalData}
                        onConfirm={() => handleSaveEntity(saveData.type, saveData.data, message.id)}
                        onCancel={() => {
                            // If we had a reject handler to just hide the card, we could use it.
                            // For now, let's just mark it as applied (ignored) or add a specific state 'rejected'
                            setAppliedUpdates(prev => new Set(prev).add(message.id));
                        }}
                    />
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
                        <div className={cn("w-2 h-2 rounded-full", hasApiKey ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                        <span className="font-medium text-sm">{hasApiKey ? 'Connected' : 'Setup Required'}</span>
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
                    {/* Entity Linking Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "gap-2 text-xs",
                                    linkedEntity
                                        ? "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {linkedEntity ? (
                                    <>
                                        <Link2 className="h-3.5 w-3.5" />
                                        <span className="hidden md:inline max-w-[100px] truncate">{linkedEntity.name}</span>
                                        <span className="hidden md:inline text-[10px] opacity-60">
                                            ({linkedEntity.type === 'character' ? 'ðŸ‘¤' : 'ðŸŒ'})
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Unlink className="h-3.5 w-3.5" />
                                        <span className="hidden md:inline">Link Entity</span>
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-black/90 border-white/10 backdrop-blur-xl max-h-80 overflow-y-auto">
                            {linkedEntity && (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => handleSetLinkedEntity(null)}
                                        className="text-xs cursor-pointer focus:bg-red-500/10 focus:text-red-400 text-red-400"
                                    >
                                        <Unlink className="mr-2 h-3.5 w-3.5" />
                                        Unlink "{linkedEntity.name}"
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                </>
                            )}
                            {characters.length > 0 && (
                                <>
                                    <div className="px-2 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                        Characters
                                    </div>
                                    {characters.map(char => (
                                        <DropdownMenuItem
                                            key={char.id}
                                            onClick={() => handleSetLinkedEntity({ type: 'character', id: char.id, name: char.name })}
                                            className={cn(
                                                "text-xs cursor-pointer",
                                                linkedEntity?.id === char.id
                                                    ? "bg-violet-500/10 text-violet-400"
                                                    : "focus:bg-white/10 focus:text-white"
                                            )}
                                        >
                                            <User className="mr-2 h-3.5 w-3.5 text-emerald-400" />
                                            <span className="truncate">{char.name}</span>
                                            {linkedEntity?.id === char.id && <Check className="ml-auto h-3.5 w-3.5" />}
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}
                            {worlds.length > 0 && (
                                <>
                                    {characters.length > 0 && <DropdownMenuSeparator className="bg-white/10" />}
                                    <div className="px-2 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                        Worlds
                                    </div>
                                    {worlds.map(world => (
                                        <DropdownMenuItem
                                            key={world.id}
                                            onClick={() => handleSetLinkedEntity({ type: 'world', id: world.id, name: world.name })}
                                            className={cn(
                                                "text-xs cursor-pointer",
                                                linkedEntity?.id === world.id
                                                    ? "bg-violet-500/10 text-violet-400"
                                                    : "focus:bg-white/10 focus:text-white"
                                            )}
                                        >
                                            <Globe className="mr-2 h-3.5 w-3.5 text-blue-400" />
                                            <span className="truncate">{world.name}</span>
                                            {linkedEntity?.id === world.id && <Check className="ml-auto h-3.5 w-3.5" />}
                                        </DropdownMenuItem>
                                    ))}

                                    {projects.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <div className="px-2 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                Projects_
                                            </div>
                                            {projects.map(project => (
                                                <DropdownMenuItem
                                                    key={project.id}
                                                    onClick={() => handleSetLinkedEntity({ type: 'project', id: project.id, name: project.name })}
                                                    className={cn(
                                                        "text-xs cursor-pointer",
                                                        linkedEntity?.id === project.id
                                                            ? "bg-cyan-500/10 text-cyan-400"
                                                            : "focus:bg-white/10 focus:text-white"
                                                    )}
                                                >
                                                    <Folder className="mr-2 h-3.5 w-3.5 text-orange-400" />
                                                    <span className="truncate">{project.name}</span>
                                                    {linkedEntity?.id === project.id && <Check className="ml-auto h-3.5 w-3.5" />}
                                                </DropdownMenuItem>
                                            ))}
                                        </>
                                    )}
                                </>
                            )}
                            {characters.length === 0 && worlds.length === 0 && (
                                <div className="px-2 py-3 text-xs text-muted-foreground italic text-center">
                                    No entities yet. Create one to link!
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                !hasApiKey && (
                    <div className="mx-6 mt-4 p-4 rounded-xl glass-card border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground mb-1">API Key Required</p>
                                <p className="text-xs text-muted-foreground mb-3">Add your API key in Settings to start chatting with AI.</p>
                                <Link href="/settings">
                                    <Button size="sm" variant="outline" className="h-8 text-xs">
                                        <Settings className="h-3.5 w-3.5 mr-1.5" /> Open Settings
                                    </Button>
                                </Link>
                            </div>
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
                                {message.role === 'assistant' && message.choices && message.choices.length > 0 && <ChoiceChips choices={message.choices} onSelect={handleChoiceSelect} />}
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
                        <button
                            type="button"
                            onClick={() => setShowGenerateOptions(!showGenerateOptions)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 min-w-[3.5rem] px-1 rounded-xl transition-all border border-transparent h-[50px]",
                                showGenerateOptions
                                    ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                            )}
                            title="Toggle AI Options Generation"
                        >
                            <div className={cn("w-8 h-4 rounded-full border relative transition-colors", showGenerateOptions ? "bg-violet-500 border-violet-500" : "bg-transparent border-muted-foreground")}>
                                <div className={cn("absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all", showGenerateOptions ? "left-[18px]" : "left-0.5")} />
                            </div>
                            <span className="text-[9px] font-medium">Options</span>
                        </button>

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
