import { select, isCancel } from "@clack/prompts";
import { readdir, stat } from "fs/promises";
import { join } from "path";

type FileType = "file" | "directory" | "symbolic-link" | "unknown";

interface FileInfo {
	name: string;
	type: FileType;
	size: number;
	modified: Date;
	mode: string;
}

async function getFiles(dir: string): Promise<FileInfo[]> {
	const files = await readdir(dir, { withFileTypes: true });
	const results: FileInfo[] = [];

	for (const file of files) {
		const filePath = join(dir, file.name);
		const stats = await stat(filePath);

		results.push({
			name: file.name,
			type: file.isDirectory()
				? "directory"
				: file.isSymbolicLink()
					? "symbolic-link"
					: "file",
			size: stats.size,
			modified: stats.mtime,
			mode: stats.mode.toString(8).slice(-3),
		});
	}

	return results;
}

export async function List() {
	try {
		const currentDir = process.cwd();
		const files = await getFiles(currentDir);

		const sortBy = await select({
			message: "Sort by:",
			options: [
				{ value: "name", label: "Name" },
				{ value: "size", label: "Size" },
				{ value: "modified", label: "Last Modified" },
				{ value: "type", label: "Type" },
			],
		});

		if (isCancel(sortBy)) return;

		const sortedFiles = [...files].sort((a, b) => {
			switch (sortBy) {
				case "name":
					return a.name.localeCompare(b.name);
				case "size":
					return a.size - b.size;
				case "modified":
					return a.modified.getTime() - b.modified.getTime();
				case "type":
					return a.type.localeCompare(b.type);
				default:
					return 0;
			}
		});

		console.log("\nCurrent directory:", currentDir);
		console.log("=".repeat(80));
		console.log(
			"Name".padEnd(40),
			"Type".padEnd(15),
			"Size".padEnd(10),
			"Modified".padEnd(20),
			"Mode",
		);
		console.log("-".repeat(80));

		for (const file of sortedFiles) {
			const size =
				file.size > 1024 * 1024
					? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
					: file.size > 1024
						? `${(file.size / 1024).toFixed(1)} KB`
						: `${file.size} B`;

			console.log(
				file.name.padEnd(40),
				file.type.padEnd(15),
				size.padStart(10),
				file.modified.toLocaleString().padEnd(20),
				file.mode,
			);
		}
		console.log("=".repeat(80));
		console.log(`${files.length} items`);
	} catch (error) {
		console.error("Error listing directory:", error);
	}
}
