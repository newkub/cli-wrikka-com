import { text, select, isCancel } from "@clack/prompts";
import { readdir, stat } from "fs/promises";
import { join, resolve } from "path";

type SearchType = "file" | "directory" | "all";
type SizeUnit = "B" | "KB" | "MB" | "GB";

interface SearchOptions {
	name?: string;
	type?: SearchType;
	minSize?: { value: number; unit: SizeUnit };
	maxSize?: { value: number; unit: SizeUnit };
	modifiedAfter?: Date;
}

async function* walkDir(
	dir: string,
	options: SearchOptions = {},
): AsyncGenerator<string> {
	const files = await readdir(dir, { withFileTypes: true });

	for (const file of files) {
		const fullPath = join(dir, file.name);
		const stats = await stat(fullPath);
		let matches = true;

		// Filter by name
		if (options.name && !file.name.includes(options.name)) {
			matches = false;
		}

		// Filter by type
		if (options.type === "file" && !file.isFile()) {
			matches = false;
		} else if (options.type === "directory" && !file.isDirectory()) {
			matches = false;
		}

		// Filter by size
		if ((options.minSize || options.maxSize) && file.isFile()) {
			if (options.minSize) {
				const minBytes = convertToBytes(
					options.minSize.value,
					options.minSize.unit,
				);
				if (stats.size < minBytes) matches = false;
			}

			if (options.maxSize) {
				const maxBytes = convertToBytes(
					options.maxSize.value,
					options.maxSize.unit,
				);
				if (stats.size > maxBytes) matches = false;
			}
		}

		// Filter by modification time
		if (
			options.modifiedAfter &&
			stats.mtimeMs < options.modifiedAfter.getTime()
		) {
			matches = false;
		}

		if (matches) {
			yield fullPath;
		}

		if (file.isDirectory()) {
			yield* walkDir(fullPath, options);
		}
	}
}

function convertToBytes(size: number, unit: SizeUnit): number {
	const units = { B: 0, KB: 1, MB: 2, GB: 3 } as const;
	return size * 1024 ** units[unit];
}

export async function Find() {
	try {
		const searchDir = await text({
			message: "Enter directory to search in",
			placeholder: process.cwd(),
			defaultValue: process.cwd(),
		});

		if (isCancel(searchDir)) return;

		const searchName = await text({
			message: "Search for files containing (leave empty to match all)",
			placeholder: "example",
		});

		if (isCancel(searchName)) return;

		const searchType = (await select({
			message: "Search for",
			options: [
				{ value: "all", label: "Files and directories" },
				{ value: "file", label: "Files only" },
				{ value: "directory", label: "Directories only" },
			],
		})) as SearchType;

		if (isCancel(searchType)) return;

		const options: SearchOptions = {
			name: searchName || undefined,
			type: searchType === "all" ? undefined : searchType,
		};

		console.log("\nSearching...\n");
		let count = 0;

		for await (const file of walkDir(resolve(searchDir), options)) {
			console.log(file);
			count++;
		}

		console.log(`\nFound ${count} ${count === 1 ? "result" : "results"}`);
	} catch (error) {
		console.error("Error during search:", error);
	}
}
