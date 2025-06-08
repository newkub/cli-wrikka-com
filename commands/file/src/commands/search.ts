import { text, isCancel } from "@clack/prompts";
import { readdirSync } from "fs";
import { join, resolve } from "path";
import { minimatch } from "minimatch";

export async function Search() {
	const pattern = await text({
		message: "Enter search pattern",
		validate: (value) => {
			if (!value) return "Pattern is required";
		},
	});

	if (isCancel(pattern)) return;

	try {
		const searchFiles = (dir: string, pattern: string): string[] => {
			const files = readdirSync(dir, { withFileTypes: true });
			let results: string[] = [];

			for (const file of files) {
				const fullPath = join(dir, file.name);
				if (file.isDirectory()) {
					results = results.concat(searchFiles(fullPath, pattern));
				} else if (minimatch(file.name, pattern)) {
					results.push(fullPath);
				}
			}
			return results;
		};

		const results = searchFiles(resolve("."), pattern);
		console.log("\nSearch results:");
		console.log(results.join("\n"));
	} catch (error) {
		console.error("Error searching files:", error);
	}
}
