import { confirm, isCancel, select } from "@clack/prompts";
import { registry } from "@utils/useGithubRegistry";

export async function remove() {
  try {
    const entries = await registry.list();

    if (entries.length === 0) {
      console.log("No registry entries found.");
      return;
    }

    const entryToRemove = await select({
      message: "Select an entry to remove:",
      options: entries.map((entry) => ({
        value: entry.name,
        label: `${entry.name} (${entry.path})`,
      })),
    });

    if (isCancel(entryToRemove)) {
      return;
    }

    const shouldDelete = await confirm({
      message: `Are you sure you want to remove "${entryToRemove}"?`,
    });

    if (isCancel(shouldDelete) || !shouldDelete) {
      console.log("Operation cancelled.");
      return;
    }

    await registry.remove(entryToRemove);
    console.log(`✅ Removed registry entry: ${entryToRemove}`);
  } catch (error) {
    console.error("❌ Failed to remove registry entry:", error);
    throw error;
  }
}
