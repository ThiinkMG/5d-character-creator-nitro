import { analyzeImageWithVision, compressImageDataUrl, shouldCompressImage } from '@/lib/vision-analysis';
import { getChatApiKey, getApiConfig } from '@/lib/api-keys';

// Allow up to 60 seconds for vision analysis
export const maxDuration = 60;

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
        const body = await req.json();
        const { imageDataUrl, assetId, provider, customPrompt, apiKey, isAdminMode } = body;

        // Validate input
        if (!imageDataUrl && !assetId) {
            return new Response(
                JSON.stringify({ error: 'Either imageDataUrl or assetId is required' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            );
        }

        // Determine provider (default to claude)
        const visionProvider = (provider || 'claude') as 'claude' | 'openai';

        // Get API key
        let finalApiKey = apiKey;
        if (isAdminMode) {
            // Use server-side API key from environment
            const adminKey =
                visionProvider === 'openai'
                    ? process.env.OPENAI_API_KEY
                    : process.env.ANTHROPIC_API_KEY;

            if (adminKey && adminKey.trim().length > 0) {
                finalApiKey = adminKey;
            } else {
                return new Response(
                    JSON.stringify({
                        error: `Admin mode requires ${visionProvider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'} environment variable`,
                    }),
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders,
                        },
                    }
                );
            }
        }

        if (!finalApiKey) {
            return new Response(
                JSON.stringify({
                    error: `API key required for ${visionProvider === 'openai' ? 'OpenAI' : 'Anthropic'}`,
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            );
        }

        // If assetId is provided, we'd need to fetch from store
        // For now, require imageDataUrl to be provided
        let imageToAnalyze = imageDataUrl;

        // Compress image if needed (before sending to API)
        if (imageToAnalyze && shouldCompressImage(imageToAnalyze)) {
            try {
                // Note: compressImageDataUrl requires browser APIs, so this should be done client-side
                // For server-side, we'll just proceed with the original (API will handle size limits)
                console.warn('[Vision API] Large image detected, consider compressing client-side');
            } catch (compressError) {
                console.warn('[Vision API] Compression failed, proceeding with original:', compressError);
            }
        }

        // Perform vision analysis
        try {
            const analysis = await analyzeImageWithVision(
                imageToAnalyze,
                finalApiKey,
                visionProvider,
                customPrompt
            );

            return new Response(JSON.stringify({ analysis }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        } catch (analysisError) {
            console.error('[Vision API] Analysis failed:', analysisError);
            const errorMsg =
                analysisError instanceof Error ? analysisError.message : 'Unknown error';

            // Check for specific API errors
            if (
                errorMsg.includes('401') ||
                errorMsg.includes('authentication') ||
                errorMsg.includes('invalid api key') ||
                errorMsg.includes('unauthorized')
            ) {
                return new Response(
                    JSON.stringify({
                        error: `Invalid ${visionProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`,
                    }),
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders,
                        },
                    }
                );
            }

            return new Response(
                JSON.stringify({
                    error: `Vision analysis failed: ${errorMsg}`,
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            );
        }
    } catch (error) {
        console.error('[Vision API] Request error:', error);
        return new Response(
            JSON.stringify({
                error: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            }
        );
    }
}
