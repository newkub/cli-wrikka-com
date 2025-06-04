import { spinner } from "@clack/prompts";
import { registry } from "@utils/useGithubRegistry";

export async function sync() {
  try {
    const s = spinner();
    s.start("Syncing registry...");
    
    const result = await registry.sync();
    
    s.stop('✅ Registry sync completed');
    
    if (result.added.length > 0) {
      console.log("\n📥 Added entries:");
      for (const entry of result.added) {
        console.log(`  - ${entry.name} (${entry.path})`);
      }
    }
    
    if (result.removed.length > 0) {
      console.log("\n🗑️  Removed entries:");
      for (const entry of result.removed) {
        console.log(`  - ${entry.name} (${entry.path})`);
      }
    }
    
    if (result.updated.length > 0) {
      console.log("\n🔄 Updated entries:");
      for (const { oldEntry, newEntry } of result.updated) {
        console.log(`  - ${oldEntry.name} (${oldEntry.path} → ${newEntry.path})`);
      }
    }
    
    if (result.added.length === 0 && result.removed.length === 0 && result.updated.length === 0) {
      console.log("\n✅ Registry is already in sync. No changes were made.");
    }
    
  } catch (error) {
    console.error("❌ Failed to sync registry:", error);
    throw error;
  }
}
