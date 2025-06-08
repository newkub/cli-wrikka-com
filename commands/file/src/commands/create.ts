import { text, isCancel } from "@clack/prompts";
import { writeFileSync } from "fs";

export async function Create() {
	const filePath = await text({
		message: "Enter new file path",
		validate: (value) => {
			if (!value) return "File path is required";
		},
	});

	if (isCancel(filePath)) return;

	try {
		writeFileSync(filePath, "");
		console.log(`File created: ${filePath}`);
	} catch (error) {
		console.error("Error creating file:", error);
	}
}
