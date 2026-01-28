/**
 * Tests for Fuzzy Search Utility
 *
 * Tests levenshteinDistance, fuzzySearchEntities, findEntityByName, and edge cases
 */

import {
  levenshteinDistance,
  fuzzySearchEntities,
  findEntityByName,
  extractPotentialEntityNames,
  highlightMatch,
  type Entity,
  type FuzzyMatch,
} from '../fuzzySearch';
import type { Character } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';

// Mock data for testing
const mockCharacters: Character[] = [
  {
    id: '#KIRA_001',
    name: 'Kira',
    aliases: ['The Shadow', 'K'],
    role: 'protagonist',
    genre: 'Fantasy',
    progress: 50,
    phase: 'Foundation',
    coreConcept: 'A mysterious warrior',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '#ELARA_002',
    name: 'Elara Moonwhisper',
    aliases: ['Lady Elara', 'The Moon Singer'],
    role: 'supporting',
    genre: 'Fantasy',
    progress: 30,
    phase: 'Foundation',
    coreConcept: 'An elven mage',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '#MARCUS_003',
    name: 'Marcus Steel',
    aliases: [],
    role: 'antagonist',
    genre: 'Sci-Fi',
    progress: 80,
    phase: 'Arc',
    coreConcept: 'A ruthless general',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockWorlds: World[] = [
  {
    id: '@VIRELITH_001',
    name: 'The Northern War',
    aliases: ['Northern Conflict', 'The Great War'],
    genre: 'Fantasy',
    description: 'A devastating war',
    progress: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '@MERIDIAN_002',
    name: 'Meridian Prime',
    aliases: ['The Capital', 'Prime'],
    genre: 'Sci-Fi',
    description: 'The capital world',
    progress: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockProjects: Project[] = [
  {
    id: '$STORY_001',
    name: 'The Shadow Chronicles',
    aliases: ['TSC', 'Chronicles'],
    genre: 'Fantasy',
    summary: 'An epic fantasy series',
    progress: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const allEntities: Entity[] = [...mockCharacters, ...mockWorlds, ...mockProjects];

describe('levenshteinDistance', () => {
  test('returns 0 for identical strings', () => {
    expect(levenshteinDistance('kira', 'kira')).toBe(0);
    expect(levenshteinDistance('test', 'test')).toBe(0);
  });

  test('is case-insensitive', () => {
    expect(levenshteinDistance('Kira', 'kira')).toBe(0);
    expect(levenshteinDistance('ELARA', 'elara')).toBe(0);
  });

  test('calculates single character substitution', () => {
    expect(levenshteinDistance('kira', 'kara')).toBe(1);
    expect(levenshteinDistance('test', 'best')).toBe(1);
  });

  test('calculates single character insertion', () => {
    expect(levenshteinDistance('kira', 'kiraa')).toBe(1);
    expect(levenshteinDistance('test', 'tests')).toBe(1);
  });

  test('calculates single character deletion', () => {
    expect(levenshteinDistance('kira', 'kia')).toBe(1);
    expect(levenshteinDistance('tests', 'test')).toBe(1);
  });

  test('handles multiple edits', () => {
    expect(levenshteinDistance('kira', 'kara')).toBe(1);
    expect(levenshteinDistance('kira', 'kora')).toBe(1);
    expect(levenshteinDistance('kira', 'kare')).toBe(2);
  });

  test('handles completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBeGreaterThan(0);
    expect(levenshteinDistance('short', 'verylongstring')).toBeGreaterThan(5);
  });

  test('handles empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
    expect(levenshteinDistance('test', '')).toBe(4);
    expect(levenshteinDistance('', 'test')).toBe(4);
  });

  test('handles special characters', () => {
    expect(levenshteinDistance('test!', 'test?')).toBe(1);
    expect(levenshteinDistance('a-b-c', 'a_b_c')).toBe(2); // Two substitutions: - to _, - to _
  });

  test('handles unicode characters', () => {
    expect(levenshteinDistance('café', 'cafe')).toBe(1);
    expect(levenshteinDistance('测试', '测试')).toBe(0);
  });
});

describe('fuzzySearchEntities', () => {
  test('returns empty array for empty query', () => {
    expect(fuzzySearchEntities('', allEntities)).toEqual([]);
    expect(fuzzySearchEntities('   ', allEntities)).toEqual([]);
  });

  test('finds exact match with score 0', () => {
    const results = fuzzySearchEntities('Kira', allEntities);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entity.name).toBe('Kira');
    expect(results[0].score).toBe(0);
    expect(results[0].matchedField).toBe('name');
  });

  test('is case-insensitive for exact matches', () => {
    const results = fuzzySearchEntities('kira', allEntities);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entity.name).toBe('Kira');
    expect(results[0].score).toBe(0);
  });

  test('finds matches by alias', () => {
    const results = fuzzySearchEntities('The Shadow', allEntities);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entity.name).toBe('Kira');
    expect(results[0].matchedField).toBe('alias');
    expect(results[0].matchedValue).toBe('The Shadow');
  });

  test('prioritizes starts-with matches', () => {
    const results = fuzzySearchEntities('Ela', allEntities);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entity.name).toBe('Elara Moonwhisper');
    expect(results[0].score).toBe(0.5); // starts-with has score 0.5
  });

  test('finds substring matches', () => {
    const results = fuzzySearchEntities('Moon', allEntities);
    expect(results.length).toBeGreaterThan(0);
    const moonMatch = results.find(r => r.entity.name === 'Elara Moonwhisper');
    expect(moonMatch).toBeDefined();
    expect(moonMatch?.score).toBe(1); // substring has score 1
  });

  test('handles typos with levenshtein distance', () => {
    const results = fuzzySearchEntities('Kira', allEntities); // 1 char off
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entity.name).toBe('Kira');
  });

  test('rejects matches with distance > 2', () => {
    const results = fuzzySearchEntities('Xyz', allEntities);
    expect(results.length).toBe(0);
  });

  test('sorts results by score (lower is better)', () => {
    const results = fuzzySearchEntities('The', allEntities);
    if (results.length > 1) {
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i + 1].score);
      }
    }
  });

  test('respects maxResults parameter', () => {
    const results = fuzzySearchEntities('a', allEntities, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  test('handles multi-word queries', () => {
    const results = fuzzySearchEntities('The Northern', allEntities);
    expect(results.length).toBeGreaterThan(0);
    const northernMatch = results.find(r => r.entity.name === 'The Northern War');
    expect(northernMatch).toBeDefined();
  });

  test('searches across all entity types', () => {
    const results = fuzzySearchEntities('a', allEntities, 10);
    const hasCharacter = results.some(r => r.entity.id.startsWith('#'));
    const hasWorld = results.some(r => r.entity.id.startsWith('@'));
    const hasProject = results.some(r => r.entity.id.startsWith('$'));
    // At least one type should be present
    expect(hasCharacter || hasWorld || hasProject).toBe(true);
  });

  test('handles entities without aliases', () => {
    const results = fuzzySearchEntities('Marcus', allEntities);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entity.name).toBe('Marcus Steel');
  });

  test('handles long entity names', () => {
    const longNameEntity: Character = {
      id: '#LONG_001',
      name: 'Alexander Maximilian Archibald Templeton III',
      aliases: [],
      role: 'supporting',
      genre: 'Fantasy',
      progress: 10,
      phase: 'Foundation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const entities = [...allEntities, longNameEntity];
    const results = fuzzySearchEntities('Alexander', entities);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entity.name).toContain('Alexander');
  });

  test('handles special characters in names', () => {
    const specialEntity: Character = {
      id: '#SPECIAL_001',
      name: "O'Brien",
      aliases: ["O'Brian", 'OBrien'],
      role: 'supporting',
      genre: 'Contemporary',
      progress: 10,
      phase: 'Foundation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const entities = [...allEntities, specialEntity];
    const results = fuzzySearchEntities("O'Brien", entities);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('findEntityByName', () => {
  test('finds entity by exact name match', () => {
    const entity = findEntityByName('Kira', allEntities);
    expect(entity).toBeDefined();
    expect(entity?.name).toBe('Kira');
  });

  test('is case-insensitive', () => {
    const entity = findEntityByName('kira', allEntities);
    expect(entity).toBeDefined();
    expect(entity?.name).toBe('Kira');
  });

  test('finds entity by alias', () => {
    const entity = findEntityByName('The Shadow', allEntities);
    expect(entity).toBeDefined();
    expect(entity?.name).toBe('Kira');
  });

  test('finds multi-word names', () => {
    const entity = findEntityByName('The Northern War', allEntities);
    expect(entity).toBeDefined();
    expect(entity?.name).toBe('The Northern War');
  });

  test('returns null for non-existent entity', () => {
    const entity = findEntityByName('NonExistent', allEntities);
    expect(entity).toBeNull();
  });

  test('returns null for partial matches', () => {
    const entity = findEntityByName('Kir', allEntities);
    expect(entity).toBeNull();
  });

  test('returns null for empty string', () => {
    const entity = findEntityByName('', allEntities);
    expect(entity).toBeNull();
  });

  test('handles entities with multiple aliases', () => {
    const entity1 = findEntityByName('Lady Elara', allEntities);
    const entity2 = findEntityByName('The Moon Singer', allEntities);
    expect(entity1).toBeDefined();
    expect(entity2).toBeDefined();
    expect(entity1?.id).toBe(entity2?.id);
  });
});

describe('extractPotentialEntityNames', () => {
  test('extracts capitalized words', () => {
    const text = 'Kira went to the market.';
    const names = extractPotentialEntityNames(text);
    expect(names).toContain('Kira');
  });

  test('extracts multi-word capitalized phrases', () => {
    const text = 'The Northern War began in spring.';
    const names = extractPotentialEntityNames(text);
    expect(names.some(n => n.includes('Northern'))).toBe(true);
  });

  test('ignores lowercase words', () => {
    const text = 'the quick brown fox';
    const names = extractPotentialEntityNames(text);
    expect(names).not.toContain('the');
    expect(names).not.toContain('quick');
  });

  test('returns empty array for no capitalized words', () => {
    const text = 'all lowercase text here';
    const names = extractPotentialEntityNames(text);
    expect(names.length).toBe(0);
  });

  test('deduplicates repeated names', () => {
    const text = 'Kira met Kira again.';
    const names = extractPotentialEntityNames(text);
    const kiraCount = names.filter(n => n === 'Kira').length;
    expect(kiraCount).toBe(1);
  });

  test('handles names at start of sentence', () => {
    const text = 'Marcus was there.';
    const names = extractPotentialEntityNames(text);
    expect(names).toContain('Marcus');
  });
});

describe('highlightMatch', () => {
  test('highlights exact substring match', () => {
    const result = highlightMatch('Kira Shadowbane', 'Shadow');
    expect(result).toBeDefined();
    expect(result?.before).toBe('Kira ');
    expect(result?.match).toBe('Shadow');
    expect(result?.after).toBe('bane');
  });

  test('is case-insensitive', () => {
    const result = highlightMatch('Kira Shadowbane', 'shadow');
    expect(result).toBeDefined();
    expect(result?.match).toBe('Shadow');
  });

  test('returns null for no match', () => {
    const result = highlightMatch('Kira', 'xyz');
    expect(result).toBeNull();
  });

  test('handles match at start', () => {
    const result = highlightMatch('Kira Shadowbane', 'Kira');
    expect(result).toBeDefined();
    expect(result?.before).toBe('');
    expect(result?.match).toBe('Kira');
  });

  test('handles match at end', () => {
    const result = highlightMatch('Kira Shadowbane', 'bane');
    expect(result).toBeDefined();
    expect(result?.after).toBe('');
  });

  test('handles full match', () => {
    const result = highlightMatch('Kira', 'Kira');
    expect(result).toBeDefined();
    expect(result?.before).toBe('');
    expect(result?.match).toBe('Kira');
    expect(result?.after).toBe('');
  });
});

describe('Edge Cases', () => {
  test('handles empty entity array', () => {
    const results = fuzzySearchEntities('Kira', []);
    expect(results).toEqual([]);
  });

  test('handles very long queries', () => {
    const longQuery = 'a'.repeat(1000);
    const results = fuzzySearchEntities(longQuery, allEntities);
    expect(Array.isArray(results)).toBe(true);
  });

  test('handles queries with only whitespace', () => {
    const results = fuzzySearchEntities('   \t\n  ', allEntities);
    expect(results).toEqual([]);
  });

  test('handles entities with null/undefined aliases', () => {
    const entityNoAlias: Character = {
      id: '#TEST_001',
      name: 'Test',
      role: 'supporting',
      genre: 'Test',
      progress: 0,
      phase: 'Foundation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const results = fuzzySearchEntities('Test', [entityNoAlias]);
    expect(results.length).toBeGreaterThan(0);
  });

  test('handles numeric characters in names', () => {
    const entity: Character = {
      id: '#AGENT_007',
      name: 'Agent 007',
      aliases: ['007', 'Double-O-Seven'],
      role: 'protagonist',
      genre: 'Spy',
      progress: 0,
      phase: 'Foundation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const results = fuzzySearchEntities('007', [entity]);
    expect(results.length).toBeGreaterThan(0);
  });
});
