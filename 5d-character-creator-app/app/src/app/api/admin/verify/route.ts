import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
    try {
        const { password } = await req.json();

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        // Read admin password from file
        // Password file is in project root
        // process.cwd() in Next.js API routes is 5d-character-creator-app/app/
        // admin-password.txt is in project root, so go up 2 levels
        const passwordPath = join(process.cwd(), '..', '..', 'admin-password.txt');
        let adminPassword: string;
        
        try {
            adminPassword = readFileSync(passwordPath, 'utf-8').trim();
        } catch (error) {
            // If file doesn't exist, use default
            adminPassword = 'Moose2026';
        }

        if (password === adminPassword) {
            // Return environment variables (API keys)
            const envKeys = {
                anthropicKey: process.env.ANTHROPIC_API_KEY || '',
                openaiKey: process.env.OPENAI_API_KEY || '',
                geminiKey: process.env.GEMINI_API_KEY || '',
            };

            // Check if any API keys are configured
            const hasAnyKeys = envKeys.anthropicKey || envKeys.openaiKey || envKeys.geminiKey;
            
            if (!hasAnyKeys) {
                return NextResponse.json({ 
                    error: 'API keys are not configured in environment variables. Please add ANTHROPIC_API_KEY, OPENAI_API_KEY, and/or GEMINI_API_KEY in your Netlify project settings (Site settings > Environment variables).',
                    keys: envKeys,
                    availableKeys: {
                        anthropic: !!envKeys.anthropicKey,
                        openai: !!envKeys.openaiKey,
                        gemini: !!envKeys.geminiKey,
                    }
                }, { status: 200 }); // Return 200 but with error message so frontend can handle it
            }

            return NextResponse.json({ 
                success: true,
                keys: envKeys,
                availableKeys: {
                    anthropic: !!envKeys.anthropicKey,
                    openai: !!envKeys.openaiKey,
                    gemini: !!envKeys.geminiKey,
                }
            });
        } else {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
    } catch (error) {
        console.error('Admin verification error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
