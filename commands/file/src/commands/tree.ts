import { text, isCancel, select } from "@clack/prompts";
import { readdir } from "fs/promises";
import { join, resolve } from "path";

interface TreeOptions {
	level: number;
	isLast: boolean;
	prefix: string;
	maxDepth: number;
	showHidden: boolean;
}

async function* walkDir(
	dir: string,
	options: TreeOptions,
): AsyncGenerator<{
	path: string;
	name: string;
	isDirectory: boolean;
	options: TreeOptions;
}> {
	const { level, maxDepth } = options;

	if (level >= maxDepth) return;

	const items = await readdir(dir, { withFileTypes: true });
	const filteredItems = options.showHidden
		? items
		: items.filter((item) => !item.name.startsWith("."));

	for (let i = 0; i < filteredItems.length; i++) {
		const item = filteredItems[i];
		const isLast = i === filteredItems.length - 1;
		const fullPath = join(dir, item.name);

		yield {
			path: fullPath,
			name: item.name,
			isDirectory: item.isDirectory(),
			options: {
				...options,
				level: level + 1,
				isLast,
				prefix: options.prefix + (isLast ? "    " : "│   "),
			},
		};

		if (item.isDirectory()) {
			yield* walkDir(fullPath, {
				...options,
				level: level + 1,
				isLast,
				prefix: options.prefix + (isLast ? "    " : "│   "),
			});
		}
	}
}

function getTreePrefix(level: number, isLast: boolean, prefix: string): string {
	if (level === 0) return "";
	return prefix + (isLast ? "└── " : "├── ");
}

export async function Tree() {
	try {
		const dir = await text({
			message: "Enter directory path",
			defaultValue: process.cwd(),
		});

		if (isCancel(dir)) return;

		const maxDepth = await text({
			message: "Maximum depth (press Enter for unlimited)",
			defaultValue: "3",
			validate: (value: string) => {
				if (value && Number.isNaN(Number.parseInt(value))) {
					return "Please enter a valid number";
				}
			},
		});

		if (isCancel(maxDepth)) return;

		const showHidden = (await select({
			message: "Show hidden files/folders?",
			options: [
				{ value: false, label: "No" },
				{ value: true, label: "Yes" },
			],
		})) as boolean;

		if (isCancel(showHidden)) return;

		const resolvedDir = resolve(dir);
		console.log(`\n${resolvedDir}`);

		const options: TreeOptions = {
			level: 0,
			isLast: true,
			prefix: "",
			maxDepth: maxDepth ? Number.parseInt(maxDepth) : Number.POSITIVE_INFINITY,
			showHidden,
		};

		for await (const item of walkDir(resolvedDir, options)) {
			const { name, isDirectory, options: itemOptions } = item;
			const prefix = getTreePrefix(
				itemOptions.level,
				itemOptions.isLast,
				itemOptions.prefix,
			);

			console.log(`${prefix}${isDirectory ? "📁 " : "📄 "}${name}`);
		}
	} catch (error) {
		console.error("Error generating directory tree:", error);
	}
}
