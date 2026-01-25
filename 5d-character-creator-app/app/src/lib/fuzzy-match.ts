/**
 * Fuzzy string matching utilities for entity linking
 */

export interface FuzzyMatchResult<T> {
    item: T;
    score: number;
    matchedFields: string[];
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
}

/**
 * Calculate similarity score between 0 and 1
 */
function similarityScore(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return 1 - distance / maxLen;
}

/**
 * Check if query is a substring of the target (case-insensitive)
 */
function isSubstring(query: string, target: string): boolean {
    return target.toLowerCase().includes(query.toLowerCase());
}

/**
 * Check if words from query appear in target
 */
function wordMatch(query: string, target: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const targetLower = target.toLowerCase();
    let matches = 0;
    
    queryWords.forEach(word => {
        if (targetLower.includes(word)) {
            matches++;
        }
    });
    
    return queryWords.length > 0 ? matches / queryWords.length : 0;
}

/**
 * Fuzzy match items by name with multiple scoring strategies
 */
export function fuzzyMatchByName<T extends { name: string; id?: string }>(
    items: T[],
    query: string,
    options: {
        minScore?: number;
        maxResults?: number;
        includeFields?: (keyof T)[];
    } = {}
): FuzzyMatchResult<T>[] {
    const { minScore = 0.3, maxResults = 10, includeFields = [] } = options;
    
    if (!query || query.trim().length === 0) {
        return items.slice(0, maxResults).map(item => ({
            item,
            score: 1,
            matchedFields: ['name']
        }));
    }

    const queryLower = query.toLowerCase().trim();
    const results: FuzzyMatchResult<T>[] = [];

    items.forEach(item => {
        const name = item.name || '';
        const nameLower = name.toLowerCase();
        
        let score = 0;
        const matchedFields: string[] = [];

        // Exact match (highest priority)
        if (nameLower === queryLower) {
            score = 1.0;
            matchedFields.push('name');
        }
        // Starts with query
        else if (nameLower.startsWith(queryLower)) {
            score = 0.9;
            matchedFields.push('name');
        }
        // Contains query as substring
        else if (isSubstring(query, name)) {
            score = 0.7;
            matchedFields.push('name');
        }
        // Word matching
        else {
            const wordScore = wordMatch(query, name);
            if (wordScore > 0) {
                score = 0.5 + wordScore * 0.2;
                matchedFields.push('name');
            }
            // Similarity score (Levenshtein)
            else {
                const simScore = similarityScore(query, name);
                if (simScore > minScore) {
                    score = simScore * 0.6;
                    matchedFields.push('name');
                }
            }
        }

        // Check additional fields if provided
        includeFields.forEach(field => {
            if (field === 'name' || field === 'id') return;
            const fieldValue = String(item[field] || '').toLowerCase();
            if (fieldValue.includes(queryLower)) {
                score = Math.max(score, 0.4);
                if (!matchedFields.includes(String(field))) {
                    matchedFields.push(String(field));
                }
            }
        });

        if (score >= minScore) {
            results.push({ item, score, matchedFields });
        }
    });

    // Sort by score (descending) and limit results
    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
}

/**
 * Find best match for a query string
 */
export function findBestMatch<T extends { name: string; id?: string }>(
    items: T[],
    query: string,
    minScore: number = 0.5
): T | null {
    const results = fuzzyMatchByName(items, query, { minScore, maxResults: 1 });
    return results.length > 0 ? results[0].item : null;
}
