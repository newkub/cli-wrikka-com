import { text, isCancel } from "@clack/prompts";
import { stat, access, constants, readlink } from "fs/promises";
import { basename, extname } from "path";

export async function Info() {
	try {
		const filePath = await text({
			message: "Enter file or directory path",
			placeholder: "./file.txt",
		});

		if (isCancel(filePath)) return;

		const stats = await stat(filePath);
		const fileName = basename(filePath);
		const fileExt = extname(filePath);
		const fileType = stats.isDirectory()
			? "Directory"
			: stats.isFile()
				? "File"
				: stats.isSymbolicLink()
					? "Symbolic Link"
					: "Unknown";

		// Check permissions
		let readable = false;
		let writable = false;
		let executable = false;

		try {
			await access(filePath, constants.R_OK);
			readable = true;
			await access(filePath, constants.W_OK);
			writable = true;
			await access(filePath, constants.X_OK);
			executable = true;
		} catch (error: unknown) {
			// Ignore errors as we're just checking permissions
			console.debug("Permission check failed:", error);
		}

		// Get target if it's a symlink
		let symlinkTarget = "";
		if (stats.isSymbolicLink()) {
			try {
				symlinkTarget = await readlink(filePath);
			} catch (error: unknown) {
				console.debug("Failed to read symlink target:", error);
				symlinkTarget = "Unable to read symlink target";
			}
		}

		console.log("\nFile Information");
		console.log("=".repeat(50));
		console.log(`Name:            ${fileName}`);
		console.log(`Path:            ${filePath}`);
		if (symlinkTarget) {
			console.log(`Target:          ${symlinkTarget}`);
		}
		console.log(`Type:            ${fileType}`);
		if (fileExt) {
			console.log(`Extension:       ${fileExt}`);
		}
		console.log(`Size:            ${formatFileSize(stats.size)}`);
		console.log(`Created:         ${stats.birthtime.toLocaleString()}`);
		console.log(`Modified:        ${stats.mtime.toLocaleString()}`);
		console.log(`Accessed:        ${stats.atime.toLocaleString()}`);
		console.log("\nPermissions:");
		console.log(`  Read:          ${readable ? "✓" : "✗"}`);
		console.log(`  Write:         ${writable ? "✓" : "✗"}`);
		console.log(`  Execute:       ${executable ? "✓" : "✗"}`);
		console.log(`  Mode:          ${stats.mode.toString(8).padStart(4, "0")}`);
		console.log("=".repeat(50));
	} catch (error) {
		console.error("Error getting file info:", error);
	}
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
