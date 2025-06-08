import { text, isCancel } from "@clack/prompts";
import { createReadStream, createWriteStream, statSync, readdirSync } from "fs";
import type { Stats } from "fs";
import { join, basename } from "path";
import { createGzip } from "zlib";
import { promisify } from "util";
import { pipeline } from "stream";

const pipelineAsync = promisify(pipeline);

interface FileEntry {
	path: string;
	stats: Stats;
}

async function collectFiles(
	dirPath: string,
	baseDir = "",
): Promise<FileEntry[]> {
	const entries = [];
	const items = readdirSync(dirPath, { withFileTypes: true });

	for (const item of items) {
		const fullPath = join(dirPath, item.name);
		const relativePath = baseDir ? `${baseDir}${item.name}` : item.name;
		const stats = statSync(fullPath);

		if (item.isDirectory()) {
			const subEntries = await collectFiles(fullPath, relativePath);
			entries.push(...subEntries);
		} else {
			entries.push({ path: relativePath, stats });
		}
	}

	return entries;
}

export async function Zip() {
	try {
		const source = await text({
			message: "Enter source file or directory path to zip",
			validate: (value) => {
				if (!value) return "Source path is required";
			},
		});

		if (isCancel(source)) return;

		let outputPath = await text({
			message: "Enter output zip file path (default: source.zip)",
			defaultValue: `${source}.zip`,
		});

		if (isCancel(outputPath)) return;

		// Ensure output path ends with .zip
		if (!outputPath.endsWith(".zip")) {
			outputPath = `${outputPath}.zip`;
		}

		const stats = statSync(source);
		const isDirectory = stats.isDirectory();
		const files: FileEntry[] = [];

		if (isDirectory) {
			const dirFiles = await collectFiles(source);
			files.push(...dirFiles);
		} else {
			files.push({
				path: basename(source),
				stats,
			});
		}

		const output = createWriteStream(outputPath);
		const gzip = createGzip({ level: 9 });

		// Simple TAR-like format for demonstration
		// Note: This is a simplified implementation and may not  all edge cases
		for (const file of files) {
			const header = Buffer.alloc(512);
			const nameBuffer = Buffer.from(file.path, "utf8");
			const size = file.stats.size.toString(8).padStart(11, "0");

			// Write file header
			header.write(nameBuffer.toString("hex"), 0, "hex");
			header.write("00000000", 100, "hex"); // File mode
			header.write("00000000", 108, "hex"); // UID
			header.write("00000000", 116, "hex"); // GID
			header.write(size, 124, "utf8"); // File size
			header.write("00000000000", 136, "utf8"); // Modification time
			header.write("        ", 148, "utf8"); // Checksum placeholder
			header.write("0", 156, "utf8"); // Type flag
			header.write("", 157, "utf8"); // Link name

			// Calculate checksum
			const checksum =
				header.slice(0, 148).reduce((sum, byte) => sum + byte, 0) +
				" ".charCodeAt(0) * 8; // Add checksum field as spaces

			// Write checksum
			header.write(`${checksum.toString(8).padStart(6, "0")}\0 `, 148, "utf8");

			// Write header
			await new Promise((resolve, reject) => {
				output.write(header, (error: Error | null | undefined) =>
					error ? reject(error) : resolve(undefined),
				);
			});

			// Write file content
			if (file.stats.size > 0) {
				const readStream = createReadStream(
					join(isDirectory ? source : ".", file.path),
				);
				await pipelineAsync(readStream, gzip, output, { end: false });
			}

			// Pad to 512-byte blocks
			const padding = (512 - (file.stats.size % 512)) % 512;
			if (padding > 0) {
				await new Promise((resolve, reject) => {
					output.write(
						Buffer.alloc(padding),
						(error: Error | null | undefined) =>
							error ? reject(error) : resolve(undefined),
					);
				});
			}
		}

		// Write end of archive
		await new Promise<void>((resolve) => {
			output.end(Buffer.alloc(1024), resolve);
		});

		console.log(`Successfully created zip archive at: ${outputPath}`);
		const finalStats = statSync(outputPath);
		console.log(`Total bytes: ${finalStats.size}`);
	} catch (error) {
		console.error("Error creating zip archive:", error);
	}
}
