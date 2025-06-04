import { isCancel, select, text } from "@clack/prompts";
import { registry } from "@utils/useGithubRegistry";

export async function edit() {
  try {
    const entries = await registry.list();

    if (entries.length === 0) {
      console.log("No registry entries found to edit.");
      return;
    }

    const entryToEdit = await select({
      message: "Select an entry to edit:",
      options: entries.map((entry) => ({
        value: entry.name,
        label: `${entry.name} (${entry.path})`,
      })),
    });

    if (isCancel(entryToEdit)) {
      return;
    }

    const currentEntry = entries.find((entry) => entry.name === entryToEdit);
    if (!currentEntry) {
      console.error("Entry not found");
      return;
    }

    const newName = await text({
      message: `Edit name (${currentEntry.name}):`,
      defaultValue: currentEntry.name,
      validate: (value) => {
        if (!value) return "Name cannot be empty";
        return undefined;
      },
    });

    if (isCancel(newName)) {
      return;
    }

    const newPath = await text({
      message: `Edit path (${currentEntry.path}):`,
      defaultValue: currentEntry.path,
      validate: (value) => {
        if (!value) return "Path cannot be empty";
        return undefined;
      },
    });

    if (isCancel(newPath)) {
      return;
    }

    // Update the entry with the new values
    await registry.update(entryToEdit, {
      path: newPath,
      name: newName,
    });

    console.log(`✅ Updated registry entry: ${newName}`);
  } catch (error) {
    console.error("❌ Failed to edit registry entry:", error);
    throw error;
  }
}
