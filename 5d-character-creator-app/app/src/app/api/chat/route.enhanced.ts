/**
 * Enhanced Chat API Route - Phase 1 Integration
 *
 * This is the enhanced version with:
 * - Pinned entities support
 * - @ mention parsing
 * - Context injection integration
 * - Rate limiting
 * - Enhanced error handling
 * - Request validation
 * - Response enrichment
 *
 * To deploy: Rename this to route.ts
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import {
    buildContextSections,
    composeContext,
    getRecommendedBudget,
    CONTEXT_PRIORITIES
} from '@/lib/context-budget';
import { retrieveContext } from '@/lib/knowledge';
import { validateChatRequest, validateRequestSize, parseEntityMentions } from '@/lib/apiValidation';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleApiError, createErrorResponse, type ProviderType } from '@/lib/apiErrorHandler';
import {
    combineEntityIds,
    formatMultipleEntitiesContext,
    logMissingEntities,
    createContextSummary,
    serializeEntityForContext
} from '@/lib/contextEntityHelpers';
import {
    extractEntityReferences,
    enrichResponseWithLinks,
    detectCanonicalFactUpdates,
    formatEntityReferencesSummary,
    type Entity
} from '@/lib/apiResponseHelpers';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Full V6 System Prompt from Master_Workflow_Core.md
const SYSTEM_PROMPT = `# 5D Character Creator - V6 (Master)
**Version:** V6 (Master)
**Theme:** "Ember Noir"
**Engine:** Hybrid Narrative-Trigger System

You are **5D Creator**, an AI-powered character development assistant. You help writers, game designers, and storytellers create deep, psychologically rich characters using frameworks from *Save The Cat*, *The Anatomy of Story*, *Laws of Human Nature*, and other creative writing resources.

---

## Your Personality
- Warm, encouraging, and creatively enthusiastic
- Expert in psychology, narrative structure, and character development
- You celebrate user creativity and provide constructive guidance
- Use emojis sparingly for warmth (🎭 ✨ 📖 ⚔️)

---

## Operational Modes
Use \`/switchmode [name]\` to change.

| Mode | Purpose | Trigger |
| :--- | :--- | :--- |
| **Basic** | Quick NPCs (5-7 questions) | \`/generate basic\` |
| **Advanced** | Full protagonists (5-phase) | \`/generate advanced\` |
| **Simulation** | Stress-test in scenarios | \`/simulate [scenario]\` |
| **Analysis** | Expert framework review | \`/analyze [#CID]\` |
| **Worldbuilding** | Universe creation | \`/worldbio\`, \`/magic\`, \`/lore\` |
| **Export** | Save & customize | \`/export [format]\` |

---

## Core Commands
| Command | Action |
| :--- | :--- |
| \`/generate basic\` | Start quick 5-7 question character |
| \`/generate advanced\` | Start full 5-phase character development |
| \`/worldbio\` | Create a new world/setting |
| \`/resume [#CID]\` | Load and continue a character |
| \`/save\` | Save current progress |
| \`/workshop [section]\` | Deep-dive into specific section (personality, backstory, relationships, arc) |
| \`/expand [field]\` | Expand a specific field with rich details |
| \`/revise [field]\` | Revise and improve existing content |
| \`/simulate [scenario]\` | Stress-test character in scenarios |
| \`/analyze [#CID]\` | Expert framework review |
| \`/progress\` | View Character Dashboard |
| \`/menu\` | Show all available commands |
| \`/help [command]\` | Get usage details |
| \`/tie [element] to [#CID]\` | Link world elements to characters |

---

## ID System
When creating entities, assign IDs in this format:
- **#CID** (Character): \`#ELARA_902\`, \`#KAEL_105\`
- **@WID** (World): \`@VIRELITH_501\`, \`@ASTORIA_203\`
- **$SID** (Story Project): \`$OBSIDIAN_01\`

Hierarchy: \`$SID\` > \`@WID\` > \`#CID\`

---

## 5-Phase Character Development (Advanced Mode)

**CRITICAL: Each phase has SPECIFIC questions. Ask them IN ORDER. Do NOT repeat or rephrase questions.**

### Phase 1: Foundation (0-20%) - Ask these 4 questions ONCE each:
1. **Story Role**: Protagonist, Antagonist, Sidekick, Mentor, etc. (ask ONCE)
2. **Genre/Setting**: Fantasy, Sci-Fi, Historical, Modern, etc.
3. **Name**: Let user provide or generate options based on genre
4. **Core Concept**: One-sentence summary of who they are (e.g., "A disgraced knight seeking redemption")

### Phase 2: Personality (20-40%) - Ask these 3 questions ONCE each:
1. **Primary Motivation**: What drives them? (revenge, love, power, freedom, etc.)
2. **Fatal Flaw**: What weakness will cause problems? (pride, addiction, distrust, etc.)
3. **Shadow Self**: What dark aspect do they hide or suppress?

### Phase 3: Backstory (40-60%) - Ask these 3 questions ONCE each:
1. **Ghost/Wound**: What past trauma shaped them?
2. **Origin**: Where do they come from? What was their life before the story?
3. **Inciting Incident**: What event set them on their current path?

### Phase 4: Relationships (60-80%) - Ask these 3 questions ONCE each:
1. **Key Ally**: Who supports them? What's their dynamic?
2. **Key Enemy/Rival**: Who opposes them? Why?
3. **Emotional Connection**: Love interest, family member, or close bond?

### Phase 5: Arc (80-100%) - Ask these 3 questions ONCE each:
1. **Want vs Need**: What do they want? What do they actually need?
2. **Growth**: How will they change by the end?
3. **Climax/Test**: What ultimate challenge will they face?

**After completing a phase, show progress:**
\`\`\`
[████████░░░░░░░░░░░░] 40% - Phase 2: Personality
\`\`\`

---

## Using Linked Character Context

**When user mentions @CharacterName or links a character:**
1. IMMEDIATELY reference what you know about that character
2. Tailor world questions to FIT that character's established details
3. If character has genre "Historical Greek", DON'T ask about genre - it's already known
4. Pull from character's backstory, motivations, and setting to inform world details
5. Example: If @Maximus Rex is a mercenary in ancient Greece, START with that context

**Context Awareness:**
- Read the character's profile information provided in the context
- Skip questions that are already answered by the character's details
- Build the world to complement the character, not from scratch

---

Always be creative, supportive, and help users bring their characters to life!`;

// CORS headers for Netlify
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

export async function POST(req: Request) {
    // Extract provider and isAdminMode early so they're available in catch block
    let provider: ProviderType = 'anthropic';
    let isAdminMode: boolean = false;

    try {
        // Parse request body with error handling
        let body;
        try {
            body = await req.json();
        } catch (parseError) {
            console.error('Failed to parse request body:', parseError);
            return new Response(
                JSON.stringify({ error: 'Invalid request format. Please check your request body.' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                }
            );
        }

        // Phase 1: Validate request size
        const sizeCheck = validateRequestSize(body);
        if (!sizeCheck.valid) {
            return new Response(
                JSON.stringify({ error: sizeCheck.error }),
                { status: 413, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
        }

        // Phase 1: Validate and sanitize request
        const validation = validateChatRequest(body);
        if (!validation.valid) {
            return new Response(
                JSON.stringify({ error: validation.errors.join(', ') }),
                { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
        }

        // Use sanitized body
        const sanitizedBody = validation.sanitized!;

        // Phase 1: Rate limiting check
        const sessionId = body.sessionId || req.headers.get('x-session-id') || req.headers.get('x-forwarded-for') || 'anonymous';
        const rateLimit = checkRateLimit(sessionId);
        if (!rateLimit.allowed) {
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                        'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
                        ...corsHeaders
                    }
                }
            );
        }

        const {
            messages,
            provider: bodyProvider = 'anthropic',
            apiKey,
            isAdminMode: bodyIsAdminMode = false,
            pinnedEntityIds = [],
            mentionedEntityIds = [],
            // Legacy structured context (maintain backward compatibility)
            linkedCharacter,
            linkedWorld,
            linkedProject,
            modeInstruction,
            sessionSetup,
            mode
        } = sanitizedBody;

        // Assign to outer scope variables
        provider = bodyProvider;
        isAdminMode = bodyIsAdminMode;

        // Phase 1: Parse @ mentions from last message
        const lastMessage = messages[messages.length - 1];
        let parsedMentions: string[] = [];
        if (lastMessage && lastMessage.role === 'user') {
            const mentions = parseEntityMentions(lastMessage.content);
            parsedMentions = mentions.filter(m => m.id).map(m => m.id!);
            console.log('[Context] Parsed @ mentions:', mentions);
        }

        // Phase 1: Combine pinned + mentioned entities
        const allEntityIds = combineEntityIds(
            pinnedEntityIds,
            [...mentionedEntityIds, ...parsedMentions]
        );

        console.log('[Context] Entity IDs for injection:', {
            pinned: pinnedEntityIds,
            mentioned: mentionedEntityIds,
            parsed: parsedMentions,
            combined: allEntityIds
        });

        // TODO Phase 1: Fetch entities from store
        // NOTE: Since this is a server-side API route, we can't directly access Zustand store
        // Client must send entity data in request, or we implement a server-side entity cache
        // For now, we'll rely on client sending full entity data in request

        // Phase 1: Extract entity context from request
        let entityContext = '';
        if (body.entities && Array.isArray(body.entities) && body.entities.length > 0) {
            // Client sent full entity data
            const entities = body.entities as Entity[];

            // Filter to only requested entities
            const requestedEntities = allEntityIds.length > 0
                ? entities.filter(e => allEntityIds.includes(e.id))
                : entities;

            if (requestedEntities.length > 0) {
                entityContext = formatMultipleEntitiesContext(requestedEntities, mode);
                console.log('[Context] Injected entities:', createContextSummary({
                    characters: requestedEntities.filter(e => e.id.startsWith('#')) as any[],
                    worlds: requestedEntities.filter(e => e.id.startsWith('@')) as any[],
                    projects: requestedEntities.filter(e => e.id.startsWith('$')) as any[],
                    all: requestedEntities,
                    missing: []
                }));
            }

            // Log missing entities
            const foundIds = new Set(requestedEntities.map(e => e.id));
            const missing = allEntityIds.filter(id => !foundIds.has(id));
            if (missing.length > 0) {
                logMissingEntities(missing);
            }
        }

        // RAG: Retrieve context based on the last user message
        let ragContext = '';
        let ragDebugInfo: any = null;

        if (lastMessage && lastMessage.role === 'user') {
            try {
                let embeddingApiKey: string | undefined;
                if (isAdminMode) {
                    embeddingApiKey = process.env.OPENAI_API_KEY;
                } else {
                    embeddingApiKey = provider === 'openai' ? apiKey : undefined;
                }

                const retrievalResult = await retrieveContext(lastMessage.content, embeddingApiKey);
                ragContext = retrievalResult.context;
                ragDebugInfo = retrievalResult.debugInfo;

                if (ragContext) {
                    console.log('[RAG] Context injected:', ragContext.length, 'chars', {
                        method: ragDebugInfo?.method,
                        resultsCount: ragDebugInfo?.results?.length || 0,
                    });
                }
            } catch (ragError) {
                console.warn('[RAG] Retrieval failed (non-fatal):', ragError instanceof Error ? ragError.message : ragError);
                ragContext = '';
            }
        }

        // Determine which API key to use
        let finalApiKey = apiKey;

        console.log('[Chat API] Request details:', {
            provider,
            isAdminMode,
            hasApiKey: !!apiKey,
            entityCount: allEntityIds.length
        });

        if (isAdminMode) {
            const adminKey = provider === 'openai'
                ? process.env.OPENAI_API_KEY
                : process.env.ANTHROPIC_API_KEY;

            if (adminKey && adminKey.trim().length > 0) {
                finalApiKey = adminKey;
                console.log('[Admin Mode] Using server-side API key');
            }
        }

        if (!finalApiKey || finalApiKey.length === 0) {
            const missingEnvVar = provider === 'openai'
                ? 'OPENAI_API_KEY'
                : 'ANTHROPIC_API_KEY';

            const errorMessage = isAdminMode
                ? `Admin mode is active but ${missingEnvVar} is not configured.`
                : `API key is required. Please add your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key in Settings.`;

            return new Response(
                JSON.stringify({ error: errorMessage }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                }
            );
        }

        // Select the model based on provider
        let model;
        try {
            if (provider === 'openai') {
                const openai = createOpenAI({ apiKey: finalApiKey });
                model = openai('gpt-4o');
            } else {
                const anthropic = createAnthropic({ apiKey: finalApiKey });
                model = anthropic('claude-3-5-haiku-20241022');
                console.log('[Anthropic] Using model: claude-3-5-haiku-20241022');
            }
        } catch (sdkError) {
            console.error('AI SDK initialization error:', sdkError);
            const apiError = handleApiError(sdkError, provider, isAdminMode);
            return createErrorResponse(apiError, corsHeaders);
        }

        // Prepare System Prompt with Context Budget System
        const modelId = provider === 'openai' ? 'gpt-4o' : 'claude-3-5-haiku-20241022';
        const tokenBudget = getRecommendedBudget(modelId);

        // Build context sections with priority-based composition
        const contextSections = buildContextSections({
            systemPrompt: SYSTEM_PROMPT,
            ragContext: ragContext || undefined,
            modeInstruction: modeInstruction || undefined,
            linkedCharacter: linkedCharacter ? JSON.stringify(linkedCharacter, null, 2) : undefined,
            linkedWorld: linkedWorld ? JSON.stringify(linkedWorld, null, 2) : undefined,
            linkedProject: linkedProject ? JSON.stringify(linkedProject, null, 2) : undefined,
        });

        // Phase 1: Add entity context section if present
        if (entityContext) {
            contextSections.push({
                id: 'pinned-entities',
                content: entityContext,
                priority: CONTEXT_PRIORITIES.LINKED_ENTITY,
                label: 'Pinned/Mentioned Entities',
                truncatable: true,
                minTokens: 300
            });
        }

        // Compose context within token budget
        const composedContext = composeContext(contextSections, {
            maxTokens: tokenBudget,
            responseBuffer: 2000,
            separator: '\n\n---\n\n'
        });

        console.log('[Context Budget] Composed:', {
            totalTokens: composedContext.totalTokens,
            included: composedContext.includedSections,
            truncated: composedContext.truncatedSections,
            dropped: composedContext.droppedSections
        });

        const finalSystemPrompt = composedContext.content;

        // Prepend system prompt to messages
        const coreMessages = [
            { role: 'system', content: finalSystemPrompt },
            ...messages
        ];

        // Generate text (non-streaming for Phase 1)
        console.log('[Chat API] Starting text generation:', {
            provider,
            modelId,
            messagesCount: coreMessages.length,
            isAdminMode,
            tokenBudget
        });

        let text;
        try {
            const result = await generateText({
                model,
                messages: coreMessages,
            });
            text = result.text;
            console.log('Generation complete, length:', text.length);
        } catch (genError) {
            console.error('Text generation error:', genError);
            const apiError = handleApiError(genError, provider, isAdminMode);
            return createErrorResponse(apiError, corsHeaders);
        }

        // Phase 1: Enrich response with entity references
        let enrichedText = text;
        let entityReferences = [];
        let detectedFacts = [];

        if (body.entities && Array.isArray(body.entities)) {
            const entities = body.entities as Entity[];

            // Extract entity references from AI response
            entityReferences = extractEntityReferences(text, entities);
            console.log('[Response] Entity references:', formatEntityReferencesSummary(entityReferences));

            // Enrich with links (optional, can be done client-side)
            // enrichedText = enrichResponseWithLinks(text, entities);

            // Detect canonical facts (for future auto-tracking)
            detectedFacts = detectCanonicalFactUpdates(text, { entities, mode });
            if (detectedFacts.length > 0) {
                console.log('[Response] Detected facts:', detectedFacts.length);
            }
        }

        // Include debug info in response if admin mode is active
        const responseData: any = { text: enrichedText };

        if (isAdminMode) {
            responseData.debug = {
                rag: ragDebugInfo,
                context: {
                    totalTokens: composedContext.totalTokens,
                    includedSections: composedContext.includedSections,
                    truncatedSections: composedContext.truncatedSections,
                    droppedSections: composedContext.droppedSections,
                    tokenBudget,
                    modelId,
                },
                entities: {
                    total: allEntityIds.length,
                    pinned: pinnedEntityIds.length,
                    mentioned: mentionedEntityIds.length + parsedMentions.length,
                    references: entityReferences.length,
                    facts: detectedFacts.length
                },
                provider,
                modelId,
                rateLimit: {
                    remaining: rateLimit.remaining,
                    resetAt: rateLimit.resetAt
                }
            };
        }

        // Phase 1: Include metadata for client processing
        if (entityReferences.length > 0) {
            responseData.entityReferences = entityReferences;
        }

        if (detectedFacts.length > 0) {
            responseData.detectedFacts = detectedFacts;
        }

        return new Response(
            isAdminMode || entityReferences.length > 0 || detectedFacts.length > 0
                ? JSON.stringify(responseData)
                : text,
            {
                headers: {
                    'Content-Type': isAdminMode || entityReferences.length > 0 || detectedFacts.length > 0
                        ? 'application/json'
                        : 'text/plain',
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                    'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
                    ...corsHeaders
                }
            }
        );
    } catch (error: unknown) {
        console.error('Chat API Error:', error);
        const apiError = handleApiError(error, provider, isAdminMode);
        return createErrorResponse(apiError, corsHeaders);
    }
}
