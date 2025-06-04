import { text, isCancel } from "@clack/prompts";
import { registry } from "@utils/useGithubRegistry";

export async function add() {
  try {
    const name = await text({
      message: "Enter the name of the registry entry:",
      validate: (value) => {
        if (!value) return "Name is required";
        return undefined;
      },
    });

    if (isCancel(name)) {
      return;
    }

    const path = await text({
      message: "Enter the path to the registry entry:",
      validate: (value) => {
        if (!value) return "Path is required";
        return undefined;
      },
    });

    if (isCancel(path)) {
      return;
    }

    await registry.add({ name, path });
    console.log(`✅ Added registry entry: ${name}`);
  } catch (error) {
    console.error("❌ Failed to add registry entry:", error);
    throw error;
  }
}
