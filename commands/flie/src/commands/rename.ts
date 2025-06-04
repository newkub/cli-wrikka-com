import { text, isCancel } from "@clack/prompts";
import { renameSync } from "fs";

export async function Rename() {
	const source = await text({
		message: "Enter source file path",
		validate: (value) => {
			if (!value) return "Path is required";
		},
	});

	if (isCancel(source)) return;

	const target = await text({
		message: "Enter new file name",
		validate: (value) => {
			if (!value) return "New name is required";
		},
	});

	if (isCancel(target)) return;

	try {
		renameSync(source, target);
		console.log(`File renamed to: ${target}`);
	} catch (error) {
		console.error("Error renaming file:", error);
	}
}
