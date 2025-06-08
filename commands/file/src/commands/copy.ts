import { text, isCancel } from "@clack/prompts";
import { copyFileSync } from "fs";

export async function Copy() {
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
		copyFileSync(source, target);
		console.log(`File copied to: ${target}`);
	} catch (error) {
		console.error("Error copying file:", error);
	}
}
