/**
 * Migration System Entry Point
 *
 * Manages schema migrations for the 5D Character Creator.
 * Automatically runs necessary migrations on app initialization.
 */

import {
  runPhase1Migration,
  needsPhase1Migration,
  backupStoreData,
  restoreFromBackup,
  listBackups,
  cleanupOldBackups,
  type StoreData,
} from './phase1-schema';

export interface MigrationConfig {
  autoBackup: boolean;
  cleanupOldBackups: boolean;
  maxBackups: number;
}

const DEFAULT_CONFIG: MigrationConfig = {
  autoBackup: true,
  cleanupOldBackups: true,
  maxBackups: 5,
};

/**
 * Run all necessary migrations
 *
 * @param storeData - The current store data
 * @param config - Migration configuration
 * @returns Updated store data after migrations
 */
export function runMigrations(
  storeData: StoreData,
  config: Partial<MigrationConfig> = {}
): StoreData {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let migrated = { ...storeData };
  let backupKey: string | null = null;

  try {
    // Check if Phase 1 migration is needed
    if (needsPhase1Migration(migrated)) {
      console.log('[Migration] Phase 1 migration needed');

      // Create backup if configured
      if (finalConfig.autoBackup) {
        backupKey = backupStoreData(migrated);
        console.log(`[Migration] Backup created: ${backupKey}`);
      }

      // Run Phase 1 migration
      const result = runPhase1Migration(migrated);

      if (result.success) {
        console.log('[Migration] Phase 1 migration completed successfully');
        console.log(`[Migration] Updated: ${result.charactersUpdated} characters, ${result.worldsUpdated} worlds, ${result.projectsUpdated} projects`);

        // Cleanup old backups if configured
        if (finalConfig.cleanupOldBackups) {
          cleanupOldBackups();
        }
      } else {
        console.error('[Migration] Phase 1 migration failed:', result.errors);
        // Restore from backup if available
        if (backupKey) {
          const restored = restoreFromBackup(backupKey);
          if (restored) {
            console.log('[Migration] Restored from backup after failure');
            return restored;
          }
        }
        throw new Error(`Migration failed: ${result.errors.join(', ')}`);
      }
    } else {
      console.log('[Migration] No migrations needed');
    }

    return migrated;
  } catch (error) {
    console.error('[Migration] Migration system error:', error);
    // Attempt to restore from backup
    if (backupKey) {
      const restored = restoreFromBackup(backupKey);
      if (restored) {
        console.log('[Migration] Restored from backup after error');
        return restored;
      }
    }
    // Return original data if restoration fails
    return storeData;
  }
}

/**
 * Check if any migrations are pending
 *
 * @param storeData - The current store data
 * @returns true if migrations are needed
 */
export function hasPendingMigrations(storeData: StoreData): boolean {
  return needsPhase1Migration(storeData);
}

/**
 * Get migration status
 *
 * @param storeData - The current store data
 * @returns Object with migration status details
 */
export function getMigrationStatus(storeData: StoreData) {
  return {
    phase1Needed: needsPhase1Migration(storeData),
    availableBackups: listBackups().length,
    latestBackup: listBackups()[0]?.timestamp || null,
  };
}

// Export migration utilities
export {
  runPhase1Migration,
  needsPhase1Migration,
  backupStoreData,
  restoreFromBackup,
  listBackups,
  cleanupOldBackups,
};

export type { StoreData } from './phase1-schema';
