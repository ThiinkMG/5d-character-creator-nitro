import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ 
        status: 'ok', 
        message: 'API route is working',
        timestamp: new Date().toISOString()
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        return NextResponse.json({ 
            status: 'ok', 
            message: 'POST request received',
            received: body,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({ 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
