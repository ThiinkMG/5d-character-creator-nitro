import fs from 'fs';
import path from 'path';
import { createOpenAI } from '@ai-sdk/openai';
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
    embedding?: number[]; // Vector embedding for semantic search
}

// Debug info for dev mode
export interface RetrievalDebugInfo {
    query: string;
    method: 'keyword' | 'semantic' | 'hybrid';
    results: Array<{
        item: KnowledgeItem;
        score: number;
        matchType: 'title' | 'summary' | 'semantic';
    }>;
    embeddingGenerated: boolean;
    fallbackToKeyword: boolean;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), '../knowledge-bank');
const INDEX_FILE = path.join(KNOWLEDGE_DIR, 'knowledge-index.json');
const EMBEDDINGS_CACHE_FILE = path.join(KNOWLEDGE_DIR, '.embeddings-cache.json');

// Cache for embeddings to avoid regenerating
interface EmbeddingsCache {
    [itemId: string]: {
        embedding: number[];
        generatedAt: string;
    };
}

let embeddingsCache: EmbeddingsCache | null = null;

function loadEmbeddingsCache(): EmbeddingsCache {
    if (embeddingsCache) return embeddingsCache;
    
    try {
        if (fs.existsSync(EMBEDDINGS_CACHE_FILE)) {
            const data = fs.readFileSync(EMBEDDINGS_CACHE_FILE, 'utf-8');
            embeddingsCache = JSON.parse(data);
            return embeddingsCache || {};
        }
    } catch (e) {
        console.error('Failed to load embeddings cache:', e);
    }
    embeddingsCache = {};
    return {};
}

function saveEmbeddingsCache(cache: EmbeddingsCache) {
    try {
        fs.writeFileSync(EMBEDDINGS_CACHE_FILE, JSON.stringify(cache, null, 2));
        embeddingsCache = cache;
    } catch (e) {
        console.error('Failed to save embeddings cache:', e);
    }
}

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
    if (!apiKey) {
        throw new Error('OpenAI API key required for embeddings');
    }

    try {
        const openai = createOpenAI({ apiKey });
        // Using text-embedding-3-small for cost efficiency
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: text.slice(0, 8000), // Limit input length
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    } catch (error) {
        console.error('Failed to generate embedding:', error);
        throw error;
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

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

/**
 * Retrieve context with semantic search using vector embeddings
 * Falls back to keyword matching if embeddings unavailable
 */
export async function retrieveContext(
    query: string,
    apiKey?: string,
    debugInfo?: { method: 'keyword' | 'semantic' | 'hybrid'; results: any[]; embeddingGenerated: boolean; fallbackToKeyword: boolean }
): Promise<{ context: string; debugInfo?: RetrievalDebugInfo }> {
    const index = await getKnowledgeIndex();
    if (index.length === 0) {
        return { context: '', debugInfo: { query, method: 'keyword', results: [], embeddingGenerated: false, fallbackToKeyword: false } };
    }

    const lowerQuery = query.toLowerCase();
    let queryEmbedding: number[] | null = null;
    let useSemantic = false;
    let embeddingGenerated = false;
    let fallbackToKeyword = false;

    // Try semantic search if API key available
    if (apiKey) {
        try {
            queryEmbedding = await generateEmbedding(query, apiKey);
            embeddingGenerated = true;
            useSemantic = true;
        } catch (error) {
            console.warn('[RAG] Failed to generate query embedding, falling back to keyword search:', error);
            fallbackToKeyword = true;
            useSemantic = false;
        }
    }

    // Load embeddings cache and ensure items have embeddings
    const cache = loadEmbeddingsCache();
    const itemsWithEmbeddings: Array<KnowledgeItem & { embedding: number[] }> = [];

    if (useSemantic && queryEmbedding) {
        // Generate embeddings for items that don't have them cached
        for (const item of index) {
            let embedding = item.embedding;
            
            if (!embedding) {
                const cached = cache[item.id];
                if (cached) {
                    embedding = cached.embedding;
                    item.embedding = embedding;
                } else if (apiKey) {
                    try {
                        // Generate embedding for the item's searchable text (title + summary)
                        const searchableText = `${item.title}\n${item.summary}`;
                        embedding = await generateEmbedding(searchableText, apiKey);
                        
                        // Cache it
                        cache[item.id] = {
                            embedding,
                            generatedAt: new Date().toISOString(),
                        };
                        saveEmbeddingsCache(cache);
                        item.embedding = embedding;
                    } catch (error) {
                        console.warn(`[RAG] Failed to generate embedding for ${item.id}, skipping semantic search for this item`);
                        continue;
                    }
                }
            }

            if (embedding) {
                itemsWithEmbeddings.push(item as KnowledgeItem & { embedding: number[] });
            }
        }
    }

    // Score items using semantic similarity or keyword matching
    const scored: Array<{ item: KnowledgeItem; score: number; matchType: 'title' | 'summary' | 'semantic' }> = [];

    if (useSemantic && queryEmbedding && itemsWithEmbeddings.length > 0) {
        // Semantic search: calculate cosine similarity
        for (const item of itemsWithEmbeddings) {
            const similarity = cosineSimilarity(queryEmbedding, item.embedding);
            scored.push({
                item,
                score: similarity,
                matchType: 'semantic',
            });
        }
    } else {
        // Keyword matching fallback
        for (const item of index) {
            let score = 0;
            let matchType: 'title' | 'summary' = 'summary';

            if (lowerQuery.includes(item.title.toLowerCase())) {
                score += 10;
                matchType = 'title';
            }
            if (item.summary.toLowerCase().includes(lowerQuery)) {
                score += 5;
            }
            // Basic keywords
            ['character', 'story', 'plot', 'theme', 'structure', 'arc', 'protagonist', 'conflict'].forEach(k => {
                if (lowerQuery.includes(k) && item.summary.toLowerCase().includes(k)) {
                    score += 1;
                }
            });
            
            if (score > 0) {
                scored.push({ item, score, matchType });
            }
        }
    }

    // Sort and get top results
    const topResults = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Top 3 relevant books

    if (topResults.length === 0) {
        return {
            context: '',
            debugInfo: {
                query,
                method: useSemantic ? 'semantic' : 'keyword',
                results: [],
                embeddingGenerated,
                fallbackToKeyword,
            },
        };
    }

    const context = topResults.map(r => `
---
SOURCE: ${r.item.title}
SUMMARY: ${r.item.summary}
---
`).join('\n');

    return {
        context,
        debugInfo: {
            query,
            method: useSemantic ? 'semantic' : 'keyword',
            results: topResults.map(r => ({
                item: r.item,
                score: r.score,
                matchType: r.matchType,
            })),
            embeddingGenerated,
            fallbackToKeyword,
        },
    };
}
