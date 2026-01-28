import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import {
    buildContextSections,
    composeContext,
    getRecommendedBudget,
    CONTEXT_PRIORITIES
} from '@/lib/context-budget';

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

## Knowledge Bank References
When discussing specific topics, reference these frameworks:
- **Psychology**: *Laws of Human Nature* (Robert Greene) - for understanding human behavior
- **Story Structure**: *Save The Cat* (Blake Snyder) - for beat sheets and character arcs
- **Character Design**: *The Anatomy of Story* (John Truby) - for deep character construction
- **Scene Design**: *Story* (Robert McKee) - for dialogue and scene dynamics
- **Dramatic Writing**: *The Art of Dramatic Writing* (Lajos Egri) - for conflict and premise

---

## Response Format
- Use **markdown formatting** for clear structure
- Use headers (## and ###) to organize information
- Use bullet points and numbered lists for clarity
- Include progress indicators when working through phases
- Keep responses focused but comprehensive

---

## Interactive Options
When asking the user a question with multiple possible answers, provide clickable options using this format:
\`[OPTIONS: Option 1|Option 2|Option 3|Option 4]\`

**Critical Rules for Options:**
1. **Never repeat options** - Track what the user has already answered and NEVER offer the same or similar options again
2. **Build on established facts** - Use the user's previous answers to inform new, more specific options
3. **Progress forward, not sideways** - Each question should go DEEPER into the topic, not ask variations of the same thing
4. **Include creative twists** - Always include 1-2 unexpected/creative options that add new dimensions or plot hooks
5. **Reference context** - If the user said "magical catastrophe", don't ask "was it magical or non-magical?" - build ON that fact
6. **Avoid circular questioning** - If a topic has been answered, move to the NEXT logical question, don't re-ask

**Progressive Depth Example (Character Creation):**
- Q1: "What role?" → User: "Protagonist" ✓
- Q2: DON'T ask "What type of hero?" (that's the same as role!)
- Q2: DO ask "What genre/setting?" → User: "Dark Fantasy" ✓
- Q3: DON'T ask "Is it fantasy?" (they just said that!)
- Q3: DO ask "What's their name?" → User: "Kael" ✓
- Q4: DO ask "Core concept - who is Kael in one sentence?"

**World/Lore Example:**
- Q1: "What caused the empire's fall?" → User: "Magical war"
- Q2: DON'T ask "Was it a magical war?" - they just said that!
- Q2: DO ask "Who were the opposing sides in this magical war?"

**Creative Option Examples:**
Instead of generic options, offer story hooks:
- "A forbidden spell that opened a portal to the void"
- "Twin heirs whose rivalry tore reality"
- "The magic itself became sentient and rebelled"
- "A desperate gambit that worked too well"

**Format:**
- Keep options concise (2-7 words)
- Place [OPTIONS: ...] on its own line AFTER your question
- Include at least one "wild card" creative option

**Handling Multi-Select + Custom Text:**
When user selects option(s) AND provides custom text, COMBINE them intelligently:
- Example: User selects "Olympian Pantheon" + types "but rename them with different and unique names"
- This means: USE the Olympian structure/domains BUT CREATE new unique names (not Zeus, Poseidon, etc.)
- DO NOT ignore the custom text - it MODIFIES the selected option
- Generate creative alternatives that honor BOTH the selection AND the custom request
- Example output: Instead of "Zeus - King of Gods", create "Aetheron - Sovereign of the Celestial Throne"

---

## Worldbuilding Question Sequence (/worldbio)

**CRITICAL: Ask these 7 questions IN ORDER. Each question ONCE. Do NOT repeat.**

1. **Genre/Setting**: Fantasy, Sci-Fi, Historical, etc. (ask ONCE)
2. **Tone**: Heroic, Gritty, Whimsical, Dark, etc. (ask ONCE)
3. **World Name**: Let user provide or generate options (ask ONCE)
4. **Core Conflict**: What central struggle defines this world? (ask ONCE)
5. **Magic/Technology System**: How does power work here? (ask ONCE)
6. **Key Factions/Powers**: Who are the major players? (ask ONCE)
7. **Unique Feature**: What makes this world special? (ask ONCE)

**After 7 questions: GENERATE the world profile. Do NOT keep asking more questions.**

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

## Behavior Instructions
1. When user sends \`/generate basic\`: Start asking 5-7 focused questions one at a time to quickly build a character
2. When user sends \`/generate advanced\` OR selects "Create Character": Begin Phase 1 (Foundation) and guide them through all 5 phases using the EXACT question sequence above
3. When user sends \`/worldbio\` OR selects "Build World": Use the 7-question worldbuilding sequence above. If a character is linked, use their context.
4. When user sends \`/menu\` OR selects "See Commands": Display all available commands in a clean list
5. When user sends \`/help\`: Provide guidance on how to use the system
6. For regular messages: Respond helpfully, staying in character as 5D Creator

**CRITICAL - Avoid Redundancy (BOTH Character & World creation):**
- Each question should be asked EXACTLY ONCE
- If user already answered something, skip to the next unanswered question
- NEVER offer options that restate what the user just told you
- After collecting all answers, GENERATE the content - don't keep drilling
- If user says "generate for me" or similar, produce content based on what's established

**CRITICAL - Combine Multiple Selections + Custom Text:**
- When user selects multiple options, incorporate ALL of them
- When user selects option(s) AND types custom text, the text MODIFIES the selection
- Example: "Olympian Pantheon" + "but rename them" = Create Olympian-style gods with NEW unique names
- NEVER ignore the custom text portion - it's the user's specific instruction
- If user asks to "rename" or "change names", generate CREATIVE NEW names, not the originals

---

## Conversation Flow Best Practices
**Before asking a new question:**
1. Briefly acknowledge what the user just established (1 sentence max)
2. Build a quick mental model of what's known so far
3. Ask the NEXT logical question that adds NEW information

**Avoid these patterns:**
- ❌ Asking the same question in different words (role → "what type of hero" is SAME question)
- ❌ Breaking one question into multiple sub-questions (don't ask role, then role-type, then role-archetype)
- ❌ Offering options the user already answered
- ❌ Circular loops (corruption → what caused corruption → was it corruption?)
- ❌ Generic options when specific ones fit the context better
- ❌ Asking "What is their role?" after they already said "Protagonist"
- ❌ Asking variations like "What kind of protagonist?" - that's covered by Core Concept
- ❌ WORLDBUILDING: Asking about "god conflicts" multiple times with same options
- ❌ WORLDBUILDING: Re-asking genre after user already specified it
- ❌ WORLDBUILDING: Ignoring linked character's established details
- ❌ WORLDBUILDING: Asking more than 7 questions before generating

**After 7 questions in worldbuilding or 5 phases in character creation:**
- STOP asking questions
- GENERATE the full profile/world entry
- If user wants changes, THEN ask targeted follow-up questions
- Include option like "Generate this lore entry" or "Write the full history"
- Don't keep drilling forever - produce creative output!

Always be creative, supportive, and help users bring their characters to life!`;

import { retrieveContext } from '@/lib/knowledge';

// ... (keep usage of retrieveContext import)

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
    let provider: string = 'anthropic';
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

        const {
            messages,
            provider: bodyProvider = 'anthropic',
            apiKey,
            isAdminMode: bodyIsAdminMode = false, // Flag indicating if admin mode is active
            // Structured context (optional - improves context budget management)
            linkedCharacter,
            linkedWorld,
            linkedProject,
            modeInstruction,
            sessionSetup
        } = body;
        
        // Assign to outer scope variables
        provider = bodyProvider;
        isAdminMode = bodyIsAdminMode;

        // Validate messages array
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Messages array is required and must not be empty.' }),
                { 
                    status: 400, 
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    } 
                }
            );
        }

        // RAG: Retrieve context based on the last user message
        const lastMessage = messages[messages.length - 1];
        let ragContext = '';

        // RAG retrieval with graceful error handling
        if (lastMessage && lastMessage.role === 'user') {
            try {
                // Find relevant book summaries from knowledge bank
                ragContext = await retrieveContext(lastMessage.content);
                if (ragContext) {
                    console.log('[RAG] Context injected:', ragContext.length, 'chars');
                }
            } catch (ragError) {
                // Log but don't fail the request - RAG is optional enhancement
                console.warn('[RAG] Retrieval failed (non-fatal):', ragError instanceof Error ? ragError.message : ragError);
                ragContext = ''; // Ensure empty string on error
            }
        }

        // Determine which API key to use
        let finalApiKey = apiKey;
        
        // Enhanced debug logging
        console.log('[Chat API] Request details:', {
            provider,
            isAdminMode,
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey ? apiKey.length : 0,
            adminModeActive: isAdminMode
        });
        
        // If admin mode is active, use environment variables (server-side keys)
        if (isAdminMode) {
            const adminKey = provider === 'openai' 
                ? process.env.OPENAI_API_KEY 
                : process.env.ANTHROPIC_API_KEY;
            
            if (adminKey && adminKey.trim().length > 0) {
                finalApiKey = adminKey;
                console.log('[Admin Mode] Using server-side API key from environment variables', {
                    provider,
                    keyLength: adminKey.length,
                    keyPrefix: adminKey.substring(0, 8) + '...'
                });
            } else {
                const missingEnvVar = provider === 'openai' 
                    ? 'OPENAI_API_KEY' 
                    : 'ANTHROPIC_API_KEY';
                console.warn(`[Admin Mode] Admin mode active but ${missingEnvVar} environment variable not set, falling back to client-provided key`);
                // Fall back to client-provided key if env var is not set
            }
        }

        // Trim and validate API key
        if (finalApiKey) {
            finalApiKey = finalApiKey.trim();
        }
        
        if (!finalApiKey || finalApiKey.length === 0) {
            // Determine which environment variable is missing based on provider
            const missingEnvVar = provider === 'openai' 
                ? 'OPENAI_API_KEY' 
                : 'ANTHROPIC_API_KEY';
            
            const errorMessage = isAdminMode 
                ? `Admin mode is active but ${missingEnvVar} is not configured in environment variables. Please add ${missingEnvVar} in your Netlify project settings (Site settings > Environment variables). After adding the variable, redeploy your site for the changes to take effect.`
                : `API key is required. Please add your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key in Settings.`;
            
            console.error('[Chat API] Missing API key:', {
                provider,
                isAdminMode,
                receivedApiKey: !!apiKey,
                receivedApiKeyLength: apiKey ? apiKey.length : 0
            });
            
            return new Response(
                JSON.stringify({ 
                    error: errorMessage
                }),
                { 
                    status: 400, 
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    } 
                }
            );
        }
        
        // Validate API key format
        if (provider === 'anthropic' && !finalApiKey.startsWith('sk-ant-')) {
            console.warn('[Chat API] Anthropic API key format warning:', {
                keyPrefix: finalApiKey.substring(0, 10),
                keyLength: finalApiKey.length
            });
            // Don't reject - some keys might have different formats, let the API handle validation
        }
        
        if (provider === 'openai' && !finalApiKey.startsWith('sk-')) {
            console.warn('[Chat API] OpenAI API key format warning:', {
                keyPrefix: finalApiKey.substring(0, 10),
                keyLength: finalApiKey.length
            });
            // Don't reject - let the API handle validation
        }

        // Select the model based on provider
        let model;
        try {
            if (provider === 'openai') {
                const openai = createOpenAI({ apiKey: finalApiKey });
                model = openai('gpt-4o');
            } else {
                const anthropic = createAnthropic({ apiKey: finalApiKey });
                // Using Claude 3.5 Haiku latest - provides better compatibility with @ai-sdk/anthropic v3.0.7+
                // The -latest alias automatically resolves to the currently supported version
                model = anthropic('claude-3-5-haiku-latest');
                console.log('[Anthropic] Using model: claude-3-5-haiku-latest');
            }
        } catch (sdkError) {
            console.error('AI SDK initialization error:', sdkError);
            return new Response(
                JSON.stringify({ error: `Failed to initialize AI SDK: ${sdkError instanceof Error ? sdkError.message : 'Unknown error'}` }),
                { 
                    status: 500, 
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    } 
                }
            );
        }

        // Prepare System Prompt with Context Budget System
        // Determine model being used for token budget calculation
        const modelId = provider === 'openai' ? 'gpt-4o' : 'claude-3-5-haiku-latest';
        const tokenBudget = getRecommendedBudget(modelId);

        // Build context sections with priority-based composition
        const contextSections = buildContextSections({
            systemPrompt: SYSTEM_PROMPT,
            ragContext: ragContext || undefined,
            // Use structured context if provided (improves token budget management)
            modeInstruction: modeInstruction || undefined,
            linkedCharacter: linkedCharacter ? JSON.stringify(linkedCharacter, null, 2) : undefined,
            linkedWorld: linkedWorld ? JSON.stringify(linkedWorld, null, 2) : undefined,
            linkedProject: linkedProject ? JSON.stringify(linkedProject, null, 2) : undefined,
        });

        // Compose context within token budget (higher priority sections included first)
        const composedContext = composeContext(contextSections, {
            maxTokens: tokenBudget,
            responseBuffer: 2000, // Leave room for AI response
            separator: '\n\n---\n\n'
        });

        // Log context composition for debugging
        console.log('[Context Budget] Composed:', {
            totalTokens: composedContext.totalTokens,
            included: composedContext.includedSections,
            truncated: composedContext.truncatedSections,
            dropped: composedContext.droppedSections
        });

        const finalSystemPrompt = composedContext.content;

        // Prepend system prompt to messages for explicit handling
        const coreMessages = [
            { role: 'system', content: finalSystemPrompt },
            ...messages
        ];

        /*
        const result = await streamText({
            model,
            messages: coreMessages,
        });

        return result.toTextStreamResponse();
        */

        // DEBUG: Non-streaming generation with enhanced logging
        console.log('[Chat API] Starting text generation:', {
            provider,
            modelId: provider === 'openai' ? 'gpt-4o' : 'claude-3-5-haiku-latest',
            messagesCount: coreMessages.length,
            isAdminMode,
            hasApiKey: !!finalApiKey,
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
            const errorMsg = genError instanceof Error ? genError.message : String(genError);
            const errorLower = errorMsg.toLowerCase();
            
            // Determine which API key is being used
            const keyName = provider === 'openai' ? 'OpenAI' : 'Anthropic';
            const envVarName = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
            
            // Check for specific API errors
            if (errorLower.includes('401') || errorLower.includes('authentication') || errorLower.includes('invalid api key') || errorLower.includes('unauthorized')) {
                const errorMessage = isAdminMode 
                    ? `Invalid ${keyName} API key. The ${envVarName} environment variable in Netlify may be incorrect or expired. Please check your API key in Netlify project settings.`
                    : `Invalid ${keyName} API key. Please check your ${keyName} API key in Settings.`;
                
                return new Response(
                    JSON.stringify({ 
                        error: errorMessage,
                        invalidKey: provider === 'openai' ? 'openaiKey' : 'anthropicKey',
                        provider: provider
                    }),
                    { 
                        status: 401, 
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        } 
                    }
                );
            }
            
            // Check for "Not Found" errors (often means invalid API key, model not found, or API endpoint issues)
            if (errorLower.includes('not found') || errorLower.includes('404') || errorLower.includes('model not found')) {
                // Enhanced error message with actionable guidance
                const possibleCauses = [
                    `Your ${keyName} API key may lack permissions to access the requested model`,
                    `The AI service endpoint may be temporarily unavailable`,
                    `There may be a configuration issue with your API key or account`
                ].join(', ');
                
                const errorMessage = isAdminMode
                    ? `API key or model not found (404). ${possibleCauses}. Please verify your ${envVarName} environment variable in Netlify project settings. If the issue persists, check your Anthropic account status and API key permissions.`
                    : `API key or model not found (404). ${possibleCauses}. Please verify your ${keyName} API key is correct in Settings and has the necessary permissions.`;
                
                console.error('[Chat API] 404 Not Found error:', {
                    provider,
                    isAdminMode,
                    errorMessage: errorMsg,
                    modelId: provider === 'openai' ? 'gpt-4o' : 'claude-3-5-haiku-latest'
                });
                
                return new Response(
                    JSON.stringify({ 
                        error: errorMessage,
                        invalidKey: provider === 'openai' ? 'openaiKey' : 'anthropicKey',
                        provider: provider
                    }),
                    { 
                        status: 404, 
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        } 
                    }
                );
            }
            
            if (errorLower.includes('429') || errorLower.includes('rate limit')) {
                return new Response(
                    JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
                    { 
                        status: 429, 
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        } 
                    }
                );
            }
            
            throw genError; // Re-throw to be caught by outer catch
        }

        return new Response(text, {
            headers: {
                'Content-Type': 'text/plain',
                ...corsHeaders
            }
        });
    } catch (error: unknown) {
        console.error('Chat API Error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Try to get the specific API error message if available
        let errorMessage = 'Unknown error occurred';
        let statusCode = 500;
        
        if (error instanceof Error) {
            errorMessage = error.message;
            const errorLower = errorMessage.toLowerCase();
            
            // Determine which API key is being used
            const keyName = provider === 'openai' ? 'OpenAI' : 'Anthropic';
            const envVarName = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
            
            // Check for common API errors
            if (errorLower.includes('401') || errorLower.includes('unauthorized') || errorLower.includes('authentication') || errorLower.includes('invalid api key')) {
                errorMessage = isAdminMode
                    ? `Invalid ${keyName} API key. The ${envVarName} environment variable in Netlify may be incorrect or expired. Please check your API key in Netlify project settings.`
                    : `Invalid ${keyName} API key. Please check your ${keyName} API key in Settings.`;
                statusCode = 401;
            } else if (errorLower.includes('not found') || errorLower.includes('404') || errorLower.includes('model not found')) {
                const possibleCauses = [
                    `Your ${keyName} API key may lack permissions to access the requested model`,
                    `The AI service endpoint may be temporarily unavailable`,
                    `There may be a configuration issue with your API key or account`
                ].join(', ');
                
                errorMessage = isAdminMode
                    ? `API key or model not found (404). ${possibleCauses}. Please verify your ${envVarName} environment variable in Netlify project settings. If the issue persists, check your Anthropic account status and API key permissions.`
                    : `API key or model not found (404). ${possibleCauses}. Please verify your ${keyName} API key is correct in Settings and has the necessary permissions.`;
                statusCode = 404;
                
                console.error('[Chat API] 404 Not Found error (outer catch):', {
                    provider,
                    isAdminMode,
                    errorMessage: error.message,
                    modelId: provider === 'openai' ? 'gpt-4o' : 'claude-3-5-haiku-latest'
                });
            } else if (errorLower.includes('429') || errorLower.includes('rate limit')) {
                errorMessage = 'Rate limit exceeded. Please try again later.';
                statusCode = 429;
            } else if (errorLower.includes('timeout') || errorLower.includes('etimedout')) {
                errorMessage = 'Request timed out. Please try again.';
                statusCode = 504;
            } else if (errorLower.includes('enotfound') || errorLower.includes('network')) {
                errorMessage = 'Network error. Please check your internet connection.';
                statusCode = 503;
            }
        } else {
            errorMessage = JSON.stringify(error);
        }
        
        // Log full error details for debugging
        console.error('Full error details:', {
            message: errorMessage,
            type: error instanceof Error ? error.constructor.name : typeof error,
            stack: error instanceof Error ? error.stack : undefined
        });
        
        // Determine which API key field is invalid based on provider
        const invalidKey = provider === 'openai' ? 'openaiKey' : 'anthropicKey';
        
        return new Response(
            JSON.stringify({ 
                error: `AI Error: ${errorMessage}`,
                invalidKey: (statusCode === 401 || statusCode === 404) ? invalidKey : undefined,
                provider: provider,
                details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
            }),
            { 
                status: statusCode, 
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                } 
            }
        );
    }
}
