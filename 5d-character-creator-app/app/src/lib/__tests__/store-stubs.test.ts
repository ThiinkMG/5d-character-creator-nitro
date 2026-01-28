/**
 * Tests for Store Stub Actions
 *
 * Tests createCharacterStub, createWorldStub, createProjectStub,
 * and development queue management
 */

import { useStore } from '../store';
import type { Character } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';

describe('Entity Stub Creation', () => {
  beforeEach(() => {
    // Reset store state before each test
    const state = useStore.getState();
    state.characters = [];
    state.worlds = [];
    state.projects = [];
    state.developmentQueue = [];
  });

  describe('createCharacterStub', () => {
    test('creates character stub with correct ID format', () => {
      const id = useStore.getState().createCharacterStub('Kira');

      expect(id).toMatch(/^#KIRA_\d{3}$/);
    });

    test('creates character stub with name', () => {
      const id = useStore.getState().createCharacterStub('Kira');
      const character = useStore.getState().characters.find(c => c.id === id);

      expect(character).toBeDefined();
      expect(character?.name).toBe('Kira');
    });

    test('handles multi-word names', () => {
      const id = useStore.getState().createCharacterStub('Elara Moonwhisper');

      expect(id).toMatch(/^#ELARA_MOONWHISPER_\d{3}$/);
      const character = useStore.getState().characters.find(c => c.id === id);
      expect(character?.name).toBe('Elara Moonwhisper');
    });

    test('converts name to uppercase in ID', () => {
      const id = useStore.getState().createCharacterStub('kira');

      expect(id).toMatch(/^#KIRA_\d{3}$/);
    });

    test('replaces spaces with underscores in ID', () => {
      const id = useStore.getState().createCharacterStub('Marcus Steel');

      expect(id).toContain('MARCUS_STEEL');
    });

    test('generates 3-digit random suffix', () => {
      const id = useStore.getState().createCharacterStub('Test');
      const suffix = id.split('_').pop();

      expect(suffix).toMatch(/^\d{3}$/);
    });

    test('sets stub tags', () => {
      const id = useStore.getState().createCharacterStub('Kira');
      const character = useStore.getState().characters.find(c => c.id === id);

      expect(character?.tags).toContain('stub');
      expect(character?.tags).toContain('needs-development');
    });

    test('sets placeholder coreConcept', () => {
      const id = useStore.getState().createCharacterStub('Kira');
      const character = useStore.getState().characters.find(c => c.id === id);

      expect(character?.coreConcept).toContain('Auto-created from @mention');
    });

    test('sets default values for character fields', () => {
      const id = useStore.getState().createCharacterStub('Kira');
      const character = useStore.getState().characters.find(c => c.id === id);

      expect(character?.role).toBe('supporting');
      expect(character?.phase).toBe('Foundation');
      expect(character?.progress).toBe(5);
      expect(character?.genre).toBe('');
      expect(character?.aliases).toEqual([]);
    });

    test('sets createdAt and updatedAt timestamps', () => {
      const before = new Date();
      const id = useStore.getState().createCharacterStub('Kira');
      const after = new Date();
      const character = useStore.getState().characters.find(c => c.id === id);

      expect(character?.createdAt).toBeDefined();
      expect(character?.updatedAt).toBeDefined();
      expect(character!.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(character!.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    test('adds stub to characters array', () => {
      const initialCount = useStore.getState().characters.length;
      useStore.getState().createCharacterStub('Kira');

      expect(useStore.getState().characters.length).toBe(initialCount + 1);
    });

    test('adds stub to development queue', () => {
      const id = useStore.getState().createCharacterStub('Kira');
      const queueItem = useStore.getState().developmentQueue.find(
        item => item.entityId === id
      );

      expect(queueItem).toBeDefined();
      expect(queueItem?.entityType).toBe('character');
    });

    test('returns created character ID', () => {
      const id = useStore.getState().createCharacterStub('Kira');

      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      expect(id.startsWith('#')).toBe(true);
    });

    test('handles special characters in name', () => {
      const id = useStore.getState().createCharacterStub("O'Brien");

      expect(id).toBeTruthy();
      const character = useStore.getState().characters.find(c => c.id === id);
      expect(character?.name).toBe("O'Brien");
    });

    test('handles empty spaces in name', () => {
      const id = useStore.getState().createCharacterStub('Test  Name');

      // Multiple spaces should be collapsed
      expect(id).toMatch(/^#TEST_NAME_\d{3}$/);
    });
  });

  describe('createWorldStub', () => {
    test('creates world stub with correct ID format', () => {
      const id = useStore.getState().createWorldStub('Meridian');

      expect(id).toMatch(/^@MERIDIAN_\d{3}$/);
    });

    test('creates world stub with name', () => {
      const id = useStore.getState().createWorldStub('Meridian');
      const world = useStore.getState().worlds.find(w => w.id === id);

      expect(world).toBeDefined();
      expect(world?.name).toBe('Meridian');
    });

    test('handles multi-word names', () => {
      const id = useStore.getState().createWorldStub('The Northern War');

      expect(id).toMatch(/^@THE_NORTHERN_WAR_\d{3}$/);
      const world = useStore.getState().worlds.find(w => w.id === id);
      expect(world?.name).toBe('The Northern War');
    });

    test('sets stub tags', () => {
      const id = useStore.getState().createWorldStub('Meridian');
      const world = useStore.getState().worlds.find(w => w.id === id);

      expect(world?.tags).toContain('stub');
      expect(world?.tags).toContain('needs-development');
    });

    test('sets placeholder description', () => {
      const id = useStore.getState().createWorldStub('Meridian');
      const world = useStore.getState().worlds.find(w => w.id === id);

      expect(world?.description).toContain('Auto-created from @mention');
    });

    test('sets default values for world fields', () => {
      const id = useStore.getState().createWorldStub('Meridian');
      const world = useStore.getState().worlds.find(w => w.id === id);

      expect(world?.genre).toBe('');
      expect(world?.aliases).toEqual([]);
      expect(world?.rules).toEqual([]);
      expect(world?.keyLocations).toEqual([]);
      expect(world?.culturalElements).toEqual([]);
      expect(world?.characterIds).toEqual([]);
      expect(world?.history).toBe('');
    });

    test('adds stub to worlds array', () => {
      const initialCount = useStore.getState().worlds.length;
      useStore.getState().createWorldStub('Meridian');

      expect(useStore.getState().worlds.length).toBe(initialCount + 1);
    });

    test('adds stub to development queue', () => {
      const id = useStore.getState().createWorldStub('Meridian');
      const queueItem = useStore.getState().developmentQueue.find(
        item => item.entityId === id
      );

      expect(queueItem).toBeDefined();
      expect(queueItem?.entityType).toBe('world');
    });

    test('returns created world ID', () => {
      const id = useStore.getState().createWorldStub('Meridian');

      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      expect(id.startsWith('@')).toBe(true);
    });
  });

  describe('createProjectStub', () => {
    test('creates project stub with correct ID format', () => {
      const id = useStore.getState().createProjectStub('Chronicles');

      expect(id).toMatch(/^\$CHRONICLES_\d{3}$/);
    });

    test('creates project stub with name', () => {
      const id = useStore.getState().createProjectStub('Chronicles');
      const project = useStore.getState().projects.find(p => p.id === id);

      expect(project).toBeDefined();
      expect(project?.name).toBe('Chronicles');
    });

    test('handles multi-word names', () => {
      const id = useStore.getState().createProjectStub('The Shadow Chronicles');

      expect(id).toMatch(/^\$THE_SHADOW_CHRONICLES_\d{3}$/);
      const project = useStore.getState().projects.find(p => p.id === id);
      expect(project?.name).toBe('The Shadow Chronicles');
    });

    test('sets stub tags', () => {
      const id = useStore.getState().createProjectStub('Chronicles');
      const project = useStore.getState().projects.find(p => p.id === id);

      expect(project?.tags).toContain('stub');
      expect(project?.tags).toContain('needs-development');
    });

    test('sets placeholder description', () => {
      const id = useStore.getState().createProjectStub('Chronicles');
      const project = useStore.getState().projects.find(p => p.id === id);

      expect(project?.description).toContain('Auto-created from @mention');
    });

    test('sets default values for project fields', () => {
      const id = useStore.getState().createProjectStub('Chronicles');
      const project = useStore.getState().projects.find(p => p.id === id);

      expect(project?.genre).toBe('');
      expect(project?.aliases).toEqual([]);
      expect(project?.characterIds).toEqual([]);
      expect(project?.worldIds).toEqual([]);
    });

    test('adds stub to projects array', () => {
      const initialCount = useStore.getState().projects.length;
      useStore.getState().createProjectStub('Chronicles');

      expect(useStore.getState().projects.length).toBe(initialCount + 1);
    });

    test('adds stub to development queue', () => {
      const id = useStore.getState().createProjectStub('Chronicles');
      const queueItem = useStore.getState().developmentQueue.find(
        item => item.entityId === id
      );

      expect(queueItem).toBeDefined();
      expect(queueItem?.entityType).toBe('project');
    });

    test('returns created project ID', () => {
      const id = useStore.getState().createProjectStub('Chronicles');

      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      expect(id.startsWith('$')).toBe(true);
    });
  });

  describe('Development Queue Management', () => {
    describe('addToDevelopmentQueue', () => {
      test('adds item to development queue', () => {
        const initialCount = useStore.getState().developmentQueue.length;
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');

        expect(useStore.getState().developmentQueue.length).toBe(initialCount + 1);
      });

      test('stores correct entity ID', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        const item = useStore.getState().developmentQueue.find(
          i => i.entityId === '#TEST_001'
        );

        expect(item).toBeDefined();
      });

      test('stores correct entity type', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        const item = useStore.getState().developmentQueue.find(
          i => i.entityId === '#TEST_001'
        );

        expect(item?.entityType).toBe('character');
      });

      test('stores createdAt timestamp', () => {
        const before = new Date();
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        const after = new Date();
        const item = useStore.getState().developmentQueue.find(
          i => i.entityId === '#TEST_001'
        );

        expect(item?.createdAt).toBeDefined();
        expect(item!.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(item!.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      test('prevents duplicate entries', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        const countBefore = useStore.getState().developmentQueue.length;

        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        const countAfter = useStore.getState().developmentQueue.length;

        expect(countAfter).toBe(countBefore);
      });

      test('allows different entity types with same ID structure', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        useStore.getState().addToDevelopmentQueue('@TEST_001', 'world');

        expect(useStore.getState().developmentQueue.length).toBe(2);
      });
    });

    describe('removeFromDevelopmentQueue', () => {
      test('removes item from queue', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        const countBefore = useStore.getState().developmentQueue.length;

        useStore.getState().removeFromDevelopmentQueue('#TEST_001');
        const countAfter = useStore.getState().developmentQueue.length;

        expect(countAfter).toBe(countBefore - 1);
      });

      test('removes correct item', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        useStore.getState().addToDevelopmentQueue('#TEST_002', 'character');

        useStore.getState().removeFromDevelopmentQueue('#TEST_001');

        const item1 = useStore.getState().developmentQueue.find(
          i => i.entityId === '#TEST_001'
        );
        const item2 = useStore.getState().developmentQueue.find(
          i => i.entityId === '#TEST_002'
        );

        expect(item1).toBeUndefined();
        expect(item2).toBeDefined();
      });

      test('handles removing non-existent item gracefully', () => {
        const countBefore = useStore.getState().developmentQueue.length;
        useStore.getState().removeFromDevelopmentQueue('#NONEXISTENT');
        const countAfter = useStore.getState().developmentQueue.length;

        expect(countAfter).toBe(countBefore);
      });
    });

    describe('getDevelopmentQueue', () => {
      test('returns current development queue', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        useStore.getState().addToDevelopmentQueue('#TEST_002', 'character');

        const queue = useStore.getState().getDevelopmentQueue();
        expect(queue.length).toBe(2);
      });

      test('returns empty array when queue is empty', () => {
        const queue = useStore.getState().getDevelopmentQueue();
        expect(queue).toEqual([]);
      });

      test('returns all queue items with correct structure', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        const queue = useStore.getState().getDevelopmentQueue();

        expect(queue[0]).toHaveProperty('entityId');
        expect(queue[0]).toHaveProperty('entityType');
        expect(queue[0]).toHaveProperty('createdAt');
      });
    });

    describe('isInDevelopmentQueue', () => {
      test('returns true for item in queue', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');

        expect(useStore.getState().isInDevelopmentQueue('#TEST_001')).toBe(true);
      });

      test('returns false for item not in queue', () => {
        expect(useStore.getState().isInDevelopmentQueue('#NONEXISTENT')).toBe(false);
      });

      test('returns false after item is removed', () => {
        useStore.getState().addToDevelopmentQueue('#TEST_001', 'character');
        useStore.getState().removeFromDevelopmentQueue('#TEST_001');

        expect(useStore.getState().isInDevelopmentQueue('#TEST_001')).toBe(false);
      });
    });

    test('stub creation automatically adds to queue', () => {
      const id = useStore.getState().createCharacterStub('Kira');

      expect(useStore.getState().isInDevelopmentQueue(id)).toBe(true);
    });

    test('queue contains items from all stub types', () => {
      const charId = useStore.getState().createCharacterStub('Kira');
      const worldId = useStore.getState().createWorldStub('Meridian');
      const projId = useStore.getState().createProjectStub('Chronicles');

      const queue = useStore.getState().getDevelopmentQueue();

      expect(queue.some(i => i.entityId === charId && i.entityType === 'character')).toBe(true);
      expect(queue.some(i => i.entityId === worldId && i.entityType === 'world')).toBe(true);
      expect(queue.some(i => i.entityId === projId && i.entityType === 'project')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles very long names', () => {
      const longName = 'A'.repeat(100);
      const id = useStore.getState().createCharacterStub(longName);

      expect(id).toBeTruthy();
      const character = useStore.getState().characters.find(c => c.id === id);
      expect(character?.name).toBe(longName);
    });

    test('handles names with only spaces', () => {
      const id = useStore.getState().createCharacterStub('   ');

      expect(id).toBeTruthy();
    });

    test('handles names with unicode characters', () => {
      const id = useStore.getState().createCharacterStub('Café');

      expect(id).toBeTruthy();
      const character = useStore.getState().characters.find(c => c.id === id);
      expect(character?.name).toBe('Café');
    });

    test('handles names with numbers', () => {
      const id = useStore.getState().createCharacterStub('Agent 007');

      expect(id).toMatch(/^#AGENT_007_\d{3}$/);
    });

    test('creates multiple stubs without ID collision', () => {
      const ids = new Set();

      for (let i = 0; i < 10; i++) {
        const id = useStore.getState().createCharacterStub('Test');
        ids.add(id);
      }

      expect(ids.size).toBe(10); // All IDs should be unique
    });

    test('handles rapid stub creation', () => {
      const ids: string[] = [];

      for (let i = 0; i < 5; i++) {
        ids.push(useStore.getState().createCharacterStub(`Test${i}`));
      }

      expect(ids.length).toBe(5);
      expect(useStore.getState().characters.length).toBe(5);
      expect(useStore.getState().developmentQueue.length).toBe(5);
    });
  });
});
