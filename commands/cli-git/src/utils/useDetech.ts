import { execa } from "execa";
import pc from "picocolors";

export async function detectAndOpenInIDE(
	filePath: string,
	lineNumber?: number,
) {
	// Try to detect VS Code first
	try {
		await execa("code", ["--version"]);
		const args = ["--goto", `${filePath}:${lineNumber || 1}`];
		await execa("code", args);
		return "vscode";
	} catch {
		// Not VS Code
	}

	// Add detection for other IDEs here
	// WebStorm, IntelliJ, etc.

	console.log(pc.yellow("Could not detect your IDE. Please open manually:"));
	console.log(pc.blue(filePath));
	return null;
}

export default function useDetech() {
	return {
		detectAndOpenInIDE,
	};
}
