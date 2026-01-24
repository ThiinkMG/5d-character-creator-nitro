import fs from 'fs';
import path from 'path';
// pdf-parse removed to prevent crashes on large files
// import pdf from 'pdf-parse';

// Define the Knowledge Item structure
export interface KnowledgeItem {
    id: string; // Filename
    title: string;
    type: 'pdf' | 'txt' | 'other';
    summary: string; // The "Cheat Sheet" summary
    tags: string[];
    path: string;
    lastIndexed: string;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), '../knowledge-bank');
const INDEX_FILE = path.join(KNOWLEDGE_DIR, 'knowledge-index.json');

// Helper to determine title from filename
const cleanTitle = (filename: string) => {
    return filename
        .replace(/\(Z-Library\)/g, '')
        .replace(/\.pdf|\.txt/g, '')
        .replace(/_/g, ' ')
        .trim();
};

export async function getKnowledgeIndex(): Promise<KnowledgeItem[]> {
    try {
        if (fs.existsSync(INDEX_FILE)) {
            const data = fs.readFileSync(INDEX_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to read knowledge index:', e);
    }
    return [];
}

export async function refreshKnowledgeIndex(): Promise<KnowledgeItem[]> {
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
        return [];
    }

    const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f !== 'knowledge-index.json' && !f.startsWith('.'));
    const existingIndex = await getKnowledgeIndex();
    const newIndex: KnowledgeItem[] = [];

    for (const file of files) {
        const filePath = path.join(KNOWLEDGE_DIR, file);
        const stats = fs.statSync(filePath);

        // Check if already indexed and not modified
        const existing = existingIndex.find(i => i.id === file);
        if (existing && new Date(existing.lastIndexed).getTime() >= stats.mtime.getTime()) {
            newIndex.push(existing);
            continue;
        }

        // New or Updated File
        let summary = "No summary available.";
        let type: 'pdf' | 'txt' | 'other' = 'other';

        try {
            if (file.endsWith('.txt')) {
                type = 'txt';
                const content = fs.readFileSync(filePath, 'utf-8');
                // Use a larger chunk for TXT as they are typically lighter 
                summary = content.slice(0, 2000) + '... (Full text available in local library)';
            } else if (file.endsWith('.pdf')) {
                type = 'pdf';
                // Safe Fallback: Derive summary from known titles (AI Knowledge)
                // Parsing 100MB+ PDFs causes memory issues in this environment.
                const title = cleanTitle(file);

                if (title.includes('DSM-5')) summary = "The Diagnostic and Statistical Manual of Mental Disorders, Fifth Edition. The standard classification of mental disorders used by mental health professionals.";
                else if (title.includes('Behave')) summary = "Behave: The Biology of Humans at Our Best and Worst by Robert Sapolsky. Explores neurobiology, hormones, and evolutionary conceptualizations of human behavior.";
                else if (title.includes('Kaplan')) summary = "Kaplan & Sadock's Synopsis of Psychiatry. A comprehensive overview of psychiatry for clinicians, residents, residents, and students.";
                else if (title.includes('Social Psychology')) summary = "Social Psychology. The scientific study of how people's thoughts, feelings, and behaviors are influenced by the actual, imagined or implied presence of others.";
                else summary = `PDF Document: ${title}. (Content not indexed locally due to format/size. AI will use general knowledge of this title.)`;
            }

            newIndex.push({
                id: file,
                title: cleanTitle(file),
                type,
                summary,
                tags: ['book', 'reference'],
                path: filePath,
                lastIndexed: new Date().toISOString()
            });

        } catch (err) {
            console.error(`Failed to process file ${file}:`, err);
            // Push existing if valid, or a placeholder
            if (existing) newIndex.push(existing);
        }
    }

    // Write back to file
    try {
        fs.writeFileSync(INDEX_FILE, JSON.stringify(newIndex, null, 2));
    } catch (e) {
        console.error('Failed to write index file:', e);
    }

    return newIndex;
}

export async function retrieveContext(query: string): Promise<string> {
    const index = await getKnowledgeIndex();
    if (index.length === 0) return '';

    // Simple keyword matching for now (RAG v1)
    // In a real production system, we'd use vector embeddings (Pinecone/pgvector) here.
    const lowerQuery = query.toLowerCase();

    // Score items
    const scored = index.map(item => {
        let score = 0;
        if (lowerQuery.includes(item.title.toLowerCase())) score += 10;
        if (item.summary.toLowerCase().includes(lowerQuery)) score += 5;
        // Basic keywords
        ['character', 'story', 'plot', 'theme', 'structure'].forEach(k => {
            if (lowerQuery.includes(k) && item.summary.toLowerCase().includes(k)) score += 1;
        });
        return { item, score };
    });

    const topResults = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Top 3 relevant books

    if (topResults.length === 0) return '';

    return topResults.map(r => `
---
SOURCE: ${r.item.title}
SUMMARY: ${r.item.summary}
---
`).join('\n');
}
