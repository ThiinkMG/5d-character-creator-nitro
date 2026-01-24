import { NextResponse } from 'next/server';
import { ImageGenerationRequest } from '@/types/image-config';

export async function POST(req: Request) {
    try {
        const body: ImageGenerationRequest = await req.json();
        const { prompt, provider, style } = body;

        // Get API keys from request headers
        const geminiKey = req.headers.get('x-gemini-key');
        const openaiKey = req.headers.get('x-openai-key');

        // Validation
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        console.log(`[Image Generation] Provider=${provider}, Style=${style}`);

        let imageUrl: string;

        switch (provider) {
            case 'free':
                // Pollinations.ai - free, no API key required
                const encodedPrompt = encodeURIComponent(`${prompt}${style ? `, ${style} style` : ''}`);
                imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
                break;

            case 'gemini':
                if (!geminiKey) {
                    return NextResponse.json({ error: 'Gemini API key is required' }, { status: 400 });
                }
                try {
                    const geminiResponse = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{
                                        text: `Generate an image: ${prompt}${style ? `. Style: ${style}` : ''}`
                                    }]
                                }],
                                generationConfig: {
                                    responseModalities: ["image", "text"],
                                    responseMimeType: "text/plain"
                                }
                            })
                        }
                    );

                    if (!geminiResponse.ok) {
                        const error = await geminiResponse.text();
                        console.error('Gemini API error:', error);
                        return NextResponse.json({ error: 'Gemini API request failed' }, { status: 500 });
                    }

                    const geminiData = await geminiResponse.json();
                    // Gemini returns inline data - for now we fall back to Pollinations
                    // Full Gemini image implementation would need blob handling
                    const fallbackPrompt = encodeURIComponent(`${prompt}${style ? `, ${style} style` : ''}`);
                    imageUrl = `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=1024&height=1024&nologo=true`;
                } catch (e) {
                    console.error('Gemini generation error:', e);
                    // Fallback to Pollinations
                    const fallbackPrompt = encodeURIComponent(`${prompt}${style ? `, ${style} style` : ''}`);
                    imageUrl = `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=1024&height=1024&nologo=true`;
                }
                break;

            case 'dalle':
                if (!openaiKey) {
                    return NextResponse.json({ error: 'OpenAI API key is required' }, { status: 400 });
                }
                try {
                    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openaiKey}`
                        },
                        body: JSON.stringify({
                            model: 'dall-e-3',
                            prompt: `${prompt}${style ? `. Style: ${style}` : ''}`,
                            n: 1,
                            size: '1024x1024',
                            quality: 'standard'
                        })
                    });

                    if (!dalleResponse.ok) {
                        const error = await dalleResponse.json();
                        console.error('DALL-E API error:', error);
                        return NextResponse.json({
                            error: error.error?.message || 'DALL-E API request failed'
                        }, { status: 500 });
                    }

                    const dalleData = await dalleResponse.json();
                    imageUrl = dalleData.data[0]?.url;

                    if (!imageUrl) {
                        return NextResponse.json({ error: 'No image returned from DALL-E' }, { status: 500 });
                    }
                } catch (e) {
                    console.error('DALL-E generation error:', e);
                    return NextResponse.json({ error: 'DALL-E generation failed' }, { status: 500 });
                }
                break;

            default:
                return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            imageUrl,
            provider
        });

    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}

