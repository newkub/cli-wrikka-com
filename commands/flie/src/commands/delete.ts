import { text, confirm, isCancel } from "@clack/prompts";
import { unlinkSync } from "fs";

export async function Delete() {
	const filePath = await text({
		message: "Enter file path to delete",
		validate: (value) => {
			if (!value) return "File path is required";
		},
	});

	if (isCancel(filePath)) return;

	const confirmDelete = await confirm({
		message: `Are you sure you want to delete ${filePath}?`,
	});

	if (isCancel(confirmDelete) || !confirmDelete) {
		console.log("Deletion cancelled");
		return;
	}

	try {
		unlinkSync(filePath);
		console.log(`File deleted: ${filePath}`);
	} catch (error) {
		console.error("Error deleting file:", error);
	}
}
