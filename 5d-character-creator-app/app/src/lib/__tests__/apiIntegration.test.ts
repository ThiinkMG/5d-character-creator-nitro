/**
 * API Integration Tests - Phase 1
 *
 * Tests for enhanced chat API route with:
 * - Request validation
 * - Rate limiting
 * - Entity context injection
 * - Error handling
 * - Response enrichment
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    validateChatRequest,
    validateRequestSize,
    parseEntityMentions
} from '../apiValidation';
import {
    checkRateLimit,
    resetRateLimit,
    clearAllRateLimits
} from '../rateLimiter';
import {
    handleApiError,
    toErrorResponse,
    isRetryableError,
    calculateRetryDelay
} from '../apiErrorHandler';
import {
    combineEntityIds,
    fetchEntitiesByIds,
    serializeEntityForContext,
    isEntityStub
} from '../contextEntityHelpers';
import {
    extractEntityReferences,
    enrichResponseWithLinks,
    detectCanonicalFactUpdates
} from '../apiResponseHelpers';
import type { Character } from '@/types/character';

describe('API Validation', () => {
    describe('validateChatRequest', () => {
        it('should validate a correct request', () => {
            const body = {
                messages: [
                    { role: 'user', content: 'Hello' }
                ],
                provider: 'anthropic',
                apiKey: 'sk-ant-test123'
            };

            const result = validateChatRequest(body);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should reject empty messages array', () => {
            const body = {
                messages: [],
                provider: 'anthropic'
            };

            const result = validateChatRequest(body);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Messages array must not be empty');
        });

        it('should reject invalid provider', () => {
            const body = {
                messages: [{ role: 'user', content: 'Test' }],
                provider: 'invalid'
            };

            const result = validateChatRequest(body);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Provider'))).toBe(true);
        });

        it('should validate entity IDs', () => {
            const body = {
                messages: [{ role: 'user', content: 'Test' }],
                pinnedEntityIds: ['#CHAR_123', '@WORLD_456'],
                mentionedEntityIds: ['$PROJECT_789']
            };

            const result = validateChatRequest(body);
            expect(result.valid).toBe(true);
        });

        it('should reject invalid entity ID format', () => {
            const body = {
                messages: [{ role: 'user', content: 'Test' }],
                pinnedEntityIds: ['invalid-id']
            };

            const result = validateChatRequest(body);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Invalid entity ID'))).toBe(true);
        });
    });

    describe('validateRequestSize', () => {
        it('should accept small requests', () => {
            const body = {
                messages: [{ role: 'user', content: 'Test' }]
            };

            const result = validateRequestSize(body);
            expect(result.valid).toBe(true);
        });

        it('should reject oversized requests', () => {
            const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
            const body = {
                messages: [{ role: 'user', content: largeContent }]
            };

            const result = validateRequestSize(body);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('exceeds maximum');
        });
    });

    describe('parseEntityMentions', () => {
        it('should parse markdown-style mentions', () => {
            const content = 'Talk to [@Elara](character:#ELARA_902) about the quest.';
            const mentions = parseEntityMentions(content);

            expect(mentions).toHaveLength(1);
            expect(mentions[0]).toEqual({
                name: 'Elara',
                type: 'character',
                id: '#ELARA_902'
            });
        });

        it('should parse plain @ mentions', () => {
            const content = 'What if @NewCharacter joined the party?';
            const mentions = parseEntityMentions(content);

            expect(mentions).toHaveLength(1);
            expect(mentions[0]).toEqual({
                name: 'NewCharacter'
            });
        });

        it('should parse multiple mentions', () => {
            const content = '[@Hero](character:#HERO_1) travels to [@World](world:@WORLD_1)';
            const mentions = parseEntityMentions(content);

            expect(mentions).toHaveLength(2);
        });
    });
});

describe('Rate Limiting', () => {
    beforeEach(() => {
        clearAllRateLimits();
    });

    it('should allow requests within limit', () => {
        const identifier = 'test-user';

        const result1 = checkRateLimit(identifier);
        expect(result1.allowed).toBe(true);
        expect(result1.remaining).toBeGreaterThan(0);

        const result2 = checkRateLimit(identifier);
        expect(result2.allowed).toBe(true);
        expect(result2.remaining).toBeLessThan(result1.remaining);
    });

    it('should block requests exceeding limit', () => {
        const identifier = 'test-user';

        // Exhaust the limit (default 20 requests)
        for (let i = 0; i < 20; i++) {
            checkRateLimit(identifier);
        }

        const blocked = checkRateLimit(identifier);
        expect(blocked.allowed).toBe(false);
        expect(blocked.remaining).toBe(0);
    });

    it('should reset limit after resetting', () => {
        const identifier = 'test-user';

        checkRateLimit(identifier);
        resetRateLimit(identifier);

        const result = checkRateLimit(identifier);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeGreaterThan(15); // Should be near max
    });
});

describe('Error Handling', () => {
    it('should handle 401 authentication errors', () => {
        const error = new Error('401 Unauthorized: Invalid API key');
        const result = handleApiError(error, 'anthropic', false);

        expect(result.status).toBe(401);
        expect(result.code).toBe('INVALID_API_KEY');
        expect(result.invalidKey).toBe('anthropicKey');
        expect(result.retryable).toBe(false);
    });

    it('should handle 429 rate limit errors', () => {
        const error = new Error('429 Rate limit exceeded. Retry after 60 seconds');
        const result = handleApiError(error, 'openai', false);

        expect(result.status).toBe(429);
        expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(result.retryable).toBe(true);
    });

    it('should handle timeout errors', () => {
        const error = new Error('Request timeout');
        const result = handleApiError(error, 'anthropic', false);

        expect(result.status).toBe(504);
        expect(result.code).toBe('TIMEOUT');
        expect(result.retryable).toBe(true);
    });

    it('should convert to error response', () => {
        const apiError = {
            status: 401,
            message: 'Invalid API key',
            code: 'INVALID_API_KEY',
            provider: 'anthropic' as const,
            invalidKey: 'anthropicKey' as const,
            retryable: false
        };

        const response = toErrorResponse(apiError);
        expect(response.error).toBe('Invalid API key');
        expect(response.code).toBe('INVALID_API_KEY');
        expect(response.invalidKey).toBe('anthropicKey');
    });

    it('should identify retryable errors', () => {
        const retryable = {
            status: 429,
            message: 'Rate limit',
            retryable: true
        };

        const nonRetryable = {
            status: 401,
            message: 'Invalid key',
            retryable: false
        };

        expect(isRetryableError(retryable as any)).toBe(true);
        expect(isRetryableError(nonRetryable as any)).toBe(false);
    });

    it('should calculate retry delays with exponential backoff', () => {
        const delay1 = calculateRetryDelay(1, 1000);
        const delay2 = calculateRetryDelay(2, 1000);
        const delay3 = calculateRetryDelay(3, 1000);

        expect(delay1).toBeGreaterThanOrEqual(1000);
        expect(delay1).toBeLessThan(2000);

        expect(delay2).toBeGreaterThanOrEqual(2000);
        expect(delay2).toBeLessThan(5000);

        expect(delay3).toBeGreaterThanOrEqual(4000);
        expect(delay3).toBeLessThan(9000);
    });
});

describe('Entity Context Helpers', () => {
    const mockStore = {
        characters: [
            { id: '#HERO_1', name: 'Hero', role: 'protagonist', genre: 'fantasy' } as Character
        ],
        worlds: [
            { id: '@WORLD_1', name: 'Fantasy World', genre: 'fantasy', description: 'A magical realm' } as any
        ],
        projects: [
            { id: '$PROJECT_1', name: 'Epic Quest', genre: 'fantasy', description: 'An adventure' } as any
        ],
        getCharacter: (id: string) => mockStore.characters.find(c => c.id === id),
        getWorld: (id: string) => mockStore.worlds.find(w => w.id === id),
        getProject: (id: string) => mockStore.projects.find(p => p.id === id)
    };

    describe('combineEntityIds', () => {
        it('should combine and deduplicate entity IDs', () => {
            const pinned = ['#HERO_1', '@WORLD_1'];
            const mentioned = ['@WORLD_1', '$PROJECT_1'];

            const combined = combineEntityIds(pinned, mentioned);

            expect(combined).toHaveLength(3);
            expect(combined).toContain('#HERO_1');
            expect(combined).toContain('@WORLD_1');
            expect(combined).toContain('$PROJECT_1');
        });
    });

    describe('fetchEntitiesByIds', () => {
        it('should fetch entities by IDs', () => {
            const ids = ['#HERO_1', '@WORLD_1', '$PROJECT_1'];
            const result = fetchEntitiesByIds(ids, mockStore);

            expect(result.characters).toHaveLength(1);
            expect(result.worlds).toHaveLength(1);
            expect(result.projects).toHaveLength(1);
            expect(result.missing).toHaveLength(0);
        });

        it('should track missing entities', () => {
            const ids = ['#MISSING_1', '@WORLD_1'];
            const result = fetchEntitiesByIds(ids, mockStore);

            expect(result.all).toHaveLength(1);
            expect(result.missing).toHaveLength(1);
            expect(result.missing[0]).toBe('#MISSING_1');
        });
    });

    describe('isEntityStub', () => {
        it('should identify stub entities', () => {
            const stub = {
                id: '#STUB_1',
                name: 'Stub',
                tags: ['stub', 'needs-development']
            } as any;

            const complete = {
                id: '#COMPLETE_1',
                name: 'Complete',
                tags: []
            } as any;

            expect(isEntityStub(stub)).toBe(true);
            expect(isEntityStub(complete)).toBe(false);
        });
    });
});

describe('Response Helpers', () => {
    const mockCharacter: Character = {
        id: '#ELARA_902',
        name: 'Elara',
        aliases: ['El', 'The Shadow'],
        role: 'protagonist',
        genre: 'fantasy',
        progress: 50,
        phase: 'Personality',
        coreConcept: 'A rogue seeking redemption',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    describe('extractEntityReferences', () => {
        it('should extract entity mentions from text', () => {
            const text = 'Elara met with her ally and discussed the mission.';
            const entities = [mockCharacter];

            const references = extractEntityReferences(text, entities);

            expect(references).toHaveLength(1);
            expect(references[0].name).toBe('Elara');
            expect(references[0].id).toBe('#ELARA_902');
        });

        it('should detect alias mentions', () => {
            const text = 'The Shadow moved silently through the night.';
            const entities = [mockCharacter];

            const references = extractEntityReferences(text, entities);

            expect(references).toHaveLength(1);
            expect(references[0].name).toBe('Elara'); // Canonical name
        });
    });

    describe('enrichResponseWithLinks', () => {
        it('should add markdown links to entity names', () => {
            const text = 'Elara traveled to the city.';
            const entities = [mockCharacter];

            const enriched = enrichResponseWithLinks(text, entities);

            expect(enriched).toContain('[@Elara](character:#ELARA_902)');
        });

        it('should not double-link already linked text', () => {
            const text = '[@Elara](character:#ELARA_902) was there.';
            const entities = [mockCharacter];

            const enriched = enrichResponseWithLinks(text, entities);

            // Should only have one link, not nested
            const linkCount = (enriched.match(/\[@Elara\]/g) || []).length;
            expect(linkCount).toBe(1);
        });
    });

    describe('detectCanonicalFactUpdates', () => {
        it('should detect physical descriptions', () => {
            const text = 'Elara has blue eyes and dark hair.';
            const facts = detectCanonicalFactUpdates(text, { entities: [mockCharacter] });

            expect(facts.length).toBeGreaterThan(0);
            expect(facts.some(f => f.category === 'physical')).toBe(true);
        });

        it('should categorize facts correctly', () => {
            const text = 'Elara was born in the northern mountains and trained as a warrior.';
            const facts = detectCanonicalFactUpdates(text, { entities: [mockCharacter] });

            expect(facts.some(f => f.category === 'history')).toBe(true);
        });
    });
});

describe('End-to-End Integration', () => {
    it('should handle a complete request flow', () => {
        // 1. Validate request
        const requestBody = {
            messages: [
                { role: 'user', content: 'Tell me about [@Elara](character:#ELARA_902)' }
            ],
            provider: 'anthropic',
            pinnedEntityIds: ['#ELARA_902'],
            entities: [
                {
                    id: '#ELARA_902',
                    name: 'Elara',
                    role: 'protagonist',
                    genre: 'fantasy'
                }
            ]
        };

        const validation = validateChatRequest(requestBody);
        expect(validation.valid).toBe(true);

        // 2. Check rate limit
        const rateLimit = checkRateLimit('test-integration');
        expect(rateLimit.allowed).toBe(true);

        // 3. Parse mentions
        const mentions = parseEntityMentions(requestBody.messages[0].content);
        expect(mentions).toHaveLength(1);

        // 4. Combine entity IDs
        const entityIds = combineEntityIds(
            requestBody.pinnedEntityIds,
            mentions.map(m => m.id!).filter(Boolean)
        );
        expect(entityIds).toHaveLength(1);

        // 5. Extract references (simulated AI response)
        const mockResponse = 'Elara is a skilled rogue with a tragic past.';
        const references = extractEntityReferences(mockResponse, requestBody.entities as any);
        expect(references.length).toBeGreaterThan(0);

        console.log('✓ End-to-end integration test passed');
    });
});
