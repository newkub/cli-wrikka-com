import { ref, readonly } from 'vue';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface RegistryEntry {
  name: string;
  path: string;
  updatedAt?: Date;
}

export interface SyncResult {
  added: RegistryEntry[];
  removed: RegistryEntry[];
  updated: Array<{
    oldEntry: RegistryEntry;
    newEntry: RegistryEntry;
  }>;
}

export function useGithubRegistry() {
  const entries = ref<RegistryEntry[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  
  // Private state
  let registryPath = '';

  const init = () => {
    try {
      const homeDir = process.env.HOME || process.env.USERPROFILE || __dirname;
      const configDir = join(homeDir, '.config', 'wrikka');
      
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      
      registryPath = join(configDir, 'registry.json');
      load();
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to initialize registry');
    }
  };

  const load = () => {
    try {
      if (existsSync(registryPath)) {
        const data = readFileSync(registryPath, 'utf-8');
        entries.value = JSON.parse(data);
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to load registry');
      entries.value = [];
    }
  };

  const save = () => {
    try {
      const data = JSON.stringify(entries.value, null, 2);
      writeFileSync(registryPath, data, 'utf-8');
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to save registry');
      throw error.value;
    }
  };

  const addEntry = async (entry: Omit<RegistryEntry, 'updatedAt'>): Promise<void> => {
    isLoading.value = true;
    try {
      const existingIndex = entries.value.findIndex(e => e.name === entry.name);
      
      if (existingIndex >= 0) {
        throw new Error(`Entry with name '${entry.name}' already exists`);
      }

      entries.value.push({
        ...entry,
        updatedAt: new Date()
      });
      
      save();
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to add entry');
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  const removeEntry = async (name: string): Promise<boolean> => {
    isLoading.value = true;
    try {
      const initialLength = entries.value.length;
      entries.value = entries.value.filter(entry => entry.name !== name);
      
      if (entries.value.length < initialLength) {
        save();
        return true;
      }
      
      return false;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to remove entry');
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  const updateEntry = async (name: string, updates: Partial<Omit<RegistryEntry, 'updatedAt'>>): Promise<boolean> => {
    isLoading.value = true;
    try {
      const entryIndex = entries.value.findIndex(e => e.name === name);
      
      if (entryIndex === -1) {
        return false;
      }

      const updatedEntry = {
        ...entries.value[entryIndex],
        ...updates,
        updatedAt: new Date()
      };

      entries.value[entryIndex] = updatedEntry;
      save();
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to update entry');
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  const listEntries = async (): Promise<RegistryEntry[]> => {
    return [...entries.value];
  };

  const syncEntries = async (): Promise<SyncResult> => {
    isLoading.value = true;
    try {
      // This is a placeholder. Implement actual sync logic here.
      const result: SyncResult = {
        added: [],
        removed: [],
        updated: []
      };
      
      // Add your sync logic here
      
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to sync entries');
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  // Initialize the registry when the composable is first used
  init();

  return {
    // State
    entries: readonly(entries),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Methods
    add: addEntry,
    remove: removeEntry,
    update: updateEntry,
    list: listEntries,
    sync: syncEntries,
    
    // Aliases for better semantics
    addEntry,
    removeEntry,
    updateEntry,
    listEntries,
    syncEntries,
  };
}

// Export a singleton instance for convenience
export const registry = useGithubRegistry();