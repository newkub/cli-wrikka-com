import { text, isCancel, select } from "@clack/prompts";
import { readdir } from "fs/promises";
import { join, resolve } from "path";
import { createInterface } from "readline";
import { createReadStream } from "fs";

// Search options interface is used internally

async function* findFiles(
	dir: string,
	filePattern?: string,
): AsyncGenerator<string> {
	const files = await readdir(dir, { withFileTypes: true });

	for (const file of files) {
		const fullPath = join(dir, file.name);

		if (file.isDirectory()) {
			yield* findFiles(fullPath, filePattern);
		} else if (!filePattern || new RegExp(filePattern).test(file.name)) {
			yield fullPath;
		}
	}
}

async function searchInFile(
	filePath: string,
	pattern: RegExp,
	_includeLineNumbers: boolean,
): Promise<{ file: string; lineNumber: number; line: string }[]> {
	const results: { file: string; lineNumber: number; line: string }[] = [];
	const fileStream = createReadStream(filePath, { encoding: "utf8" });
	const rl = createInterface({
		input: fileStream,
		crlfDelay: Number.POSITIVE_INFINITY,
	});

	let lineNumber = 0;

	for await (const line of rl) {
		lineNumber++;
		if (pattern.test(line)) {
			results.push({
				file: filePath,
				lineNumber,
				line: line.trim(),
			});
		}
	}

	return results;
}

export async function Grep() {
	try {
		const searchTerm = await text({
			message: "Enter search term (supports regex)",
			validate: (value) =>
				value.trim() ? undefined : "Search term is required",
		});

		if (isCancel(searchTerm)) return;

		const searchDir = await text({
			message: "Search directory",
			defaultValue: process.cwd(),
		});

		if (isCancel(searchDir)) return;

		const filePattern = await text({
			message: "File pattern (e.g., .ts$, .js$, leave empty for all files)",
			defaultValue: "",
		});

		if (isCancel(filePattern)) return;

		const caseInsensitive = (await select({
			// @ts-ignore - select is from @clack/prompts
			message: "Case sensitive?",
			options: [
				{ value: false, label: "Yes" },
				{ value: true, label: "No (case insensitive)" },
			],
		})) as boolean;

		if (isCancel(caseInsensitive)) return;

		const includeLineNumbers = (await select({
			// @ts-ignore - select is from @clack/prompts
			message: "Show line numbers?",
			options: [
				{ value: true, label: "Yes" },
				{ value: false, label: "No" },
			],
		})) as boolean;

		if (isCancel(includeLineNumbers)) return;

		console.log("\nSearching...\n");

		const pattern = new RegExp(searchTerm, caseInsensitive ? "i" : "");

		let totalMatches = 0;
		let filesSearched = 0;
		const startTime = Date.now();

		for await (const file of findFiles(
			resolve(searchDir),
			filePattern || undefined,
		)) {
			try {
				const results = await searchInFile(file, pattern, includeLineNumbers);
				filesSearched++;

				if (results.length > 0) {
					console.log(`\n${file}:`);
					for (const result of results) {
						const lineInfo = includeLineNumbers ? `${result.lineNumber}: ` : "";
						console.log(`  ${lineInfo}${result.line}`);
					}
					totalMatches += results.length;
				}
			} catch (error) {
				// Skip files that can't be read (like binary files)
				console.debug(`Skipping ${file}:`, error);
				return;
			}
		}

		const searchTime = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(
			`\nSearch complete. Found ${totalMatches} matches in ${filesSearched} files (${searchTime}s)`,
		);
	} catch (error) {
		console.error("Error during search:", error);
	}
}
