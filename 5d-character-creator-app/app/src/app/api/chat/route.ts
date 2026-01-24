import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';

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
1. **Foundation** (0-20%): Name, Role, Genre, Core Concept
2. **Personality** (20-40%): Motivations, Flaws, Shadow Self, Desires
3. **Backstory** (40-60%): Ghost (past trauma), Formative Events, Origin
4. **Relationships** (60-80%): Allies, Enemies, Love Interests, Dynamics
5. **Arc** (80-100%): Character Growth, Theme, Climax, Resolution

Track progress visually:
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

**Rules for options:**
- Provide 3-5 relevant options based on the question context
- Keep each option concise (2-5 words)
- Place the [OPTIONS: ...] tag on its own line AFTER your question
- The user can click an option OR type a custom answer in the chat

**Example:**
"What genre is your world?"
[OPTIONS: High Fantasy|Sci-Fi|Post-Apocalyptic|Urban Fantasy|Steampunk]

---

## Behavior Instructions
1. When user sends \`/generate basic\`: Start asking 5-7 focused questions one at a time to quickly build a character
2. When user sends \`/generate advanced\`: Begin Phase 1 (Foundation) and guide them through all 5 phases
3. When user sends \`/worldbio\`: Start an interactive world-building session. Ask 5-7 focused questions ONE AT A TIME to build the world (name, genre, tone, key locations, magic/tech systems, societal rules, atmosphere). Wait for user responses before proceeding to the next question. Only generate the final world profile after gathering all information
4. When user sends \`/menu\`: Display all available commands in a clean list
5. When user sends \`/help\`: Provide guidance on how to use the system
6. For regular messages: Respond helpfully, staying in character as 5D Creator

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

        const { messages, provider = 'anthropic', apiKey } = body;

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

        /* TEMPORARILY DISABLED FOR DEBUGGING
        if (lastMessage && lastMessage.role === 'user') {
            try {
                // Find relevant book summaries
                ragContext = await retrieveContext(lastMessage.content);
                if (ragContext) {
                    console.log('RAG Context Injected:', ragContext.length, 'chars');
                }
            } catch (e) {
                console.error('RAG Retrieval Failed:', e);
            }
        }
        */

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'API key is required. Please add your API key in Settings.' }),
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
                const openai = createOpenAI({ apiKey });
                model = openai('gpt-4o');
            } else {
                const anthropic = createAnthropic({ apiKey });
                // Using Sonnet for better quality, fallback to Haiku if needed
                model = anthropic('claude-3-5-sonnet-20241022');
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

        // Prepare System Prompt with optional RAG Context
        const finalSystemPrompt = ragContext
            ? `${SYSTEM_PROMPT}\n\n### RELEVANT KNOWLEDGE BANK EXTRACTS\nThe following reference material was retrieved from your library. Use it if relevant to the request:\n${ragContext}`
            : SYSTEM_PROMPT;

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

        // DEBUG: Non-streaming generation
        console.log('Generating text (non-stream)...');
        console.log('Provider:', provider);
        console.log('Messages count:', coreMessages.length);
        
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
            
            // Check for specific API errors
            if (errorMsg.includes('401') || errorMsg.includes('authentication') || errorMsg.includes('Invalid API key')) {
                return new Response(
                    JSON.stringify({ error: 'Invalid API key. Please check your API key in Settings.' }),
                    { 
                        status: 401, 
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        } 
                    }
                );
            }
            
            if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
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
            
            // Check for common API errors
            if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('authentication') || errorMessage.includes('Invalid API key')) {
                errorMessage = 'Invalid API key. Please check your API key in Settings.';
                statusCode = 401;
            } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                errorMessage = 'Rate limit exceeded. Please try again later.';
                statusCode = 429;
            } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
                errorMessage = 'Request timed out. Please try again.';
                statusCode = 504;
            } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
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
        
        return new Response(
            JSON.stringify({ 
                error: `AI Error: ${errorMessage}`,
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
