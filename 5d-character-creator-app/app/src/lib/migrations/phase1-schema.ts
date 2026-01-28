/**
 * Phase 1 Schema Migration
 *
 * Migrates existing localStorage data to include new Phase 1 fields:
 * - voiceProfile: VoiceProfile | undefined
 * - canonicalFacts: CanonicalFact[] | undefined
 * - aliases: string[] | undefined
 *
 * This migration is safe to run multiple times (idempotent).
 */

import type { Character, VoiceProfile, CanonicalFact } from '@/types/character';
import type { World } from '@/types/world';
import type { Project } from '@/types/project';

interface MigrationResult {
  success: boolean;
  charactersUpdated: number;
  worldsUpdated: number;
  projectsUpdated: number;
  errors: string[];
}

export interface StoreData {
  characters?: Character[];
  worlds?: World[];
  projects?: Project[];
  [key: string]: any;
}

/**
 * Check if a character needs migration
 */
function characterNeedsMigration(character: Character): boolean {
  return (
    character.voiceProfile === undefined ||
    character.canonicalFacts === undefined ||
    character.aliases === undefined
  );
}

/**
 * Check if a world needs migration
 */
function worldNeedsMigration(world: World): boolean {
  return (
    world.canonicalFacts === undefined ||
    world.aliases === undefined
  );
}

/**
 * Check if a project needs migration
 */
function projectNeedsMigration(project: Project): boolean {
  return project.aliases === undefined;
}

/**
 * Migrate a single character
 */
function migrateCharacter(character: Character): Character {
  const migrated = { ...character };

  // Add voiceProfile if missing
  if (migrated.voiceProfile === undefined) {
    migrated.voiceProfile = undefined; // Explicitly set to undefined (will be populated later)
  }

  // Add canonicalFacts if missing
  if (migrated.canonicalFacts === undefined) {
    migrated.canonicalFacts = []; // Default to empty array
  }

  // Add aliases if missing
  if (migrated.aliases === undefined) {
    migrated.aliases = []; // Default to empty array
  }

  return migrated;
}

/**
 * Migrate a single world
 */
function migrateWorld(world: World): World {
  const migrated = { ...world };

  // Add canonicalFacts if missing
  if (migrated.canonicalFacts === undefined) {
    migrated.canonicalFacts = []; // Default to empty array
  }

  // Add aliases if missing
  if (migrated.aliases === undefined) {
    migrated.aliases = []; // Default to empty array
  }

  return migrated;
}

/**
 * Migrate a single project
 */
function migrateProject(project: Project): Project {
  const migrated = { ...project };

  // Add aliases if missing
  if (migrated.aliases === undefined) {
    migrated.aliases = []; // Default to empty array
  }

  return migrated;
}

/**
 * Main migration function
 *
 * @param storeData - The current store data from localStorage
 * @returns Migration result with stats and errors
 */
export function runPhase1Migration(storeData: StoreData): MigrationResult {
  const result: MigrationResult = {
    success: true,
    charactersUpdated: 0,
    worldsUpdated: 0,
    projectsUpdated: 0,
    errors: [],
  };

  try {
    // Migrate characters
    if (storeData.characters && Array.isArray(storeData.characters)) {
      storeData.characters = storeData.characters.map((character) => {
        if (characterNeedsMigration(character)) {
          result.charactersUpdated++;
          return migrateCharacter(character);
        }
        return character;
      });
    }

    // Migrate worlds
    if (storeData.worlds && Array.isArray(storeData.worlds)) {
      storeData.worlds = storeData.worlds.map((world) => {
        if (worldNeedsMigration(world)) {
          result.worldsUpdated++;
          return migrateWorld(world);
        }
        return world;
      });
    }

    // Migrate projects
    if (storeData.projects && Array.isArray(storeData.projects)) {
      storeData.projects = storeData.projects.map((project) => {
        if (projectNeedsMigration(project)) {
          result.projectsUpdated++;
          return migrateProject(project);
        }
        return project;
      });
    }

  } catch (error) {
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown migration error'
    );
  }

  return result;
}

/**
 * Check if migration is needed
 *
 * @param storeData - The current store data from localStorage
 * @returns true if any entities need migration
 */
export function needsPhase1Migration(storeData: StoreData): boolean {
  if (storeData.characters && Array.isArray(storeData.characters)) {
    if (storeData.characters.some(characterNeedsMigration)) {
      return true;
    }
  }

  if (storeData.worlds && Array.isArray(storeData.worlds)) {
    if (storeData.worlds.some(worldNeedsMigration)) {
      return true;
    }
  }

  if (storeData.projects && Array.isArray(storeData.projects)) {
    if (storeData.projects.some(projectNeedsMigration)) {
      return true;
    }
  }

  return false;
}

/**
 * Backup store data to localStorage with timestamp
 *
 * @param storeData - The store data to backup
 * @returns Backup key for recovery
 */
export function backupStoreData(storeData: StoreData): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupKey = `5d-storage-backup-${timestamp}`;

  try {
    localStorage.setItem(backupKey, JSON.stringify(storeData));
    return backupKey;
  } catch (error) {
    console.error('Failed to create backup:', error);
    throw new Error('Backup creation failed');
  }
}

/**
 * Restore store data from backup
 *
 * @param backupKey - The backup key to restore from
 * @returns Restored store data
 */
export function restoreFromBackup(backupKey: string): StoreData | null {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      return null;
    }
    return JSON.parse(backupData) as StoreData;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return null;
  }
}

/**
 * List all available backups
 *
 * @returns Array of backup keys with timestamps
 */
export function listBackups(): Array<{ key: string; timestamp: string }> {
  const backups: Array<{ key: string; timestamp: string }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('5d-storage-backup-')) {
      const timestamp = key.replace('5d-storage-backup-', '').replace(/-/g, ':');
      backups.push({ key, timestamp });
    }
  }

  return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Delete old backups (keep only the 5 most recent)
 */
export function cleanupOldBackups(): void {
  const backups = listBackups();

  // Keep only the 5 most recent backups
  if (backups.length > 5) {
    const toDelete = backups.slice(5);
    toDelete.forEach(({ key }) => {
      localStorage.removeItem(key);
    });
  }
}
