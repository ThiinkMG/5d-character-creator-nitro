import { NextResponse } from 'next/server';
import { refreshKnowledgeIndex } from '@/lib/knowledge';

export async function POST() {
    try {
        console.log('Starting Knowledge Indexing...');
        const index = await refreshKnowledgeIndex();
        console.log('Indexing complete. Items:', index.length);
        return NextResponse.json({ success: true, count: index.length, items: index });
    } catch (error) {
        console.error('Indexing failed:', error);
        return NextResponse.json({ error: 'Failed to index knowledge bank' }, { status: 500 });
    }
}
