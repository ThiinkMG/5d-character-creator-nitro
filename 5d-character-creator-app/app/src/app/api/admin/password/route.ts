import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
    try {
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

        return NextResponse.json({ password: adminPassword });
    } catch (error) {
        console.error('Error reading password:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
