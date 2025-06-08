import { text, isCancel } from "@clack/prompts";
import { renameSync } from "fs";

export async function Move() {
	const source = await text({
		message: "Enter source file path",
		validate: (value) => {
			if (!value) return "Path is required";
		},
	});

	if (isCancel(source)) return;

	const target = await text({
		message: "Enter destination path",
		validate: (value) => {
			if (!value) return "Destination is required";
		},
	});

	if (isCancel(target)) return;

	try {
		renameSync(source, target);
		console.log(`File moved from ${source} to ${target}`);
	} catch (error) {
		console.error("Error moving file:", error);
	}
}
