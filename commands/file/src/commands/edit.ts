import { text, isCancel } from "@clack/prompts";
import { execa } from "execa";

export async function Edit() {
	const filePath = await text({
		message: "Enter file path to edit",
		validate: (value) => {
			if (!value) return "File path is required";
		},
	});

	if (isCancel(filePath)) return;

	const editor =
		process.env.EDITOR ||
		process.env.VISUAL ||
		(process.platform === "win32" ? "notepad" : "nano");

	try {
		await execa(editor, [filePath], { stdio: "inherit" });
	} catch (error) {
		console.error("Error opening editor:", error);
	}
}
