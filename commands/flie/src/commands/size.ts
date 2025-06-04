import { text, isCancel } from "@clack/prompts";
import { statSync, readdirSync } from "fs";
import { join } from "path";

function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

function getFileSizeSync(filePath: string): number {
	const stats = statSync(filePath);
	return stats.size;
}

function getDirectorySizeSync(dirPath: string): number {
	const files = readdirSync(dirPath, { withFileTypes: true });
	let totalSize = 0;

	for (const file of files) {
		const fullPath = join(dirPath, file.name);
		if (file.isDirectory()) {
			totalSize += getDirectorySizeSync(fullPath);
		} else {
			totalSize += getFileSizeSync(fullPath);
		}
	}

	return totalSize;
}

export async function Size() {
	try {
		const path = await text({
			message: "Enter file or directory path to check size",
			validate: (value) => {
				if (!value) return "Path is required";
			},
		});

		if (isCancel(path)) return;

		const stats = statSync(path);
		const isDirectory = stats.isDirectory();

		let sizeInBytes: number;
		if (isDirectory) {
			sizeInBytes = getDirectorySizeSync(path);
			console.log(`\nDirectory: ${path}`);
		} else {
			sizeInBytes = stats.size;
			console.log(`\nFile: ${path}`);
		}

		const formattedSize = formatBytes(sizeInBytes);
		console.log(`Size: ${formattedSize} (${sizeInBytes} bytes)`);
	} catch (error) {
		console.error("Error checking size:", error);
	}
}
