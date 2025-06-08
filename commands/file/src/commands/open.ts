import { text, isCancel } from "@clack/prompts";
import { execa } from "execa";
import { platform } from "os";

export async function Open() {
	const filePath = await text({
		message: "Enter file path to open",
		validate: (value) => {
			if (!value) return "File path is required";
		},
	});

	if (isCancel(filePath)) return;

	try {
		const osPlatform = platform();

		if (osPlatform === "win32") {
			// On Windows, use 'start' command
			await execa("cmd", ["/c", "start", "", filePath], { stdio: "inherit" });
		} else if (osPlatform === "darwin") {
			// On macOS, use 'open' command
			await execa("open", [filePath], { stdio: "inherit" });
		} else {
			// On Linux, use 'xdg-open'
			await execa("xdg-open", [filePath], { stdio: "inherit" });
		}

		console.log(`Opened: ${filePath}`);
	} catch (error) {
		console.error("Error opening file:", error);
	}
}
