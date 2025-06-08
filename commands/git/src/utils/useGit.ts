import { execa, execaSync } from "execa";
import { join } from 'path';

export interface GitSubmoduleInfo {
	name: string;
	path: string;
	url: string;
	commit: string;
}

export interface GitStashInfo {
	ref: string;
	message: string;
	date: string;
	author: string;
}

export interface GitStatusEntry {
	status: string;
	file: string;
}

export interface GitFileInfo {
	file: string;
	ext: string;
	size: number;
}

export interface FilesByTypeInfo {
	[ext: string]: {
		count: number;
		size: number;
		files: string[];
	};
}

// Helper function to format bytes for display
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function getGitRoot(): string {
  try {
    const root = execaSync('git', ['rev-parse', '--show-toplevel']).stdout.trim();
    return join(process.cwd(), root);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error finding git root:', error.message);
    }
    return process.cwd();
  }
}

export async function executeGitCommand(args: string[]): Promise<string> {
  try {
    const { stdout } = await execa('git', args);
    return stdout;
  } catch (error) {
    throw new Error(`Git command failed: ${error}`);
  }
}

export async function getStashList(): Promise<GitStashInfo[]> {
  const result = await executeGitCommand(['stash', 'list', '--pretty=format:%H - %s - %an - %ad']);
  return result.split('\n').map(line => {
    const [ref, message, author, date] = line.split(' - ');
    return { ref, message, author, date };
  });
}

export async function getBranches(): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['branch', '--format=%(refname:short)']);
    return stdout.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error getting branches:', error);
    return [];
  }
}

export default function useGit(cwd?: string) {
	// Core execution method
	const execute = async (
		args: string[],
		options?: {
			stdio?: "pipe" | "inherit" | "ignore";
		},
	) => {
		return execa("git", args, {
			stdio: options?.stdio || "pipe",
			cwd,
			reject: false,
		});
	};

	// Repository Information
	const isGitRepo = async () => {
		const { exitCode } = await execute(["rev-parse", "--is-inside-work-tree"]);
		return exitCode === 0;
	};

	const getCurrentBranch = async () => {
		const { stdout = "" } = await execute(["branch", "--show-current"]);
		return stdout.trim();
	};

	const getRootDir = async () => {
		const { stdout = "" } = await execute(["rev-parse", "--show-toplevel"]);
		return stdout.trim();
	};

	// Branch Operations
	const getBranches = async () => {
		const [currentBranch, allBranches] = await Promise.all([
			getCurrentBranch(),
			(async () => {
				const { stdout = "" } = await execute(["branch", "-a"]);
				return stdout
					.split("\n")
					.map((b) => b.trim().replace(/^\*\s+/, ""))
					.filter(Boolean);
			})(),
		]);

		return {
			currentBranch,
			branches: allBranches,
		};
	};

	const createBranch = async (name: string) => {
		await execute(["checkout", "-b", name]);
		return name;
	};

	const deleteBranch = async (branch: string, force = false) => {
		await execute(["branch", force ? "-D" : "-d", branch]);
		return branch;
	};

	const checkoutBranch = async (branch: string) => {
		await execute(["checkout", branch]);
		return branch;
	};

	// Commit Operations
	const commit = async (message: string, options?: { amend?: boolean }) => {
		const args = ["commit", "-m", message];
		if (options?.amend) args.push("--amend");
		await execute(args);
		return message;
	};

	const showCommit = async (hash: string) => {
		const { stdout = "" } = await execute(["show", "--pretty=medium", hash]);
		return stdout;
	};

	const checkoutCommit = async (hash: string) => {
		await execute(["checkout", hash]);
		return hash;
	};

	const createBranchAtCommit = async (
		branchName: string,
		commitHash: string,
	) => {
		await execute(["checkout", "-b", branchName, commitHash]);
		return { branchName, commitHash };
	};

	// Diff Operations
	const getDiff = async () => {
		const { stdout = "" } = await execute(["diff", "--cached"]);
		return stdout;
	};

	// Hooks Operations
	const listHooks = async () => {
		const { stdout = "" } = await execute([
			"config",
			"--get-all",
			"core.hooksPath",
		]);
		return stdout.split("\n").filter(Boolean);
	};

	// Log Operations
	const getLogs = async (limit = 10) => {
		const { stdout = "" } = await execute([
			"log",
			`-n ${limit}`,
			"--pretty=format:%h - %s (%an, %ar)",
		]);
		return stdout.split("\n").filter(Boolean);
	};

	const getCommitDetails = async (hash: string) => {
		const { stdout = "" } = await execute(["show", "--pretty=fuller", hash]);
		return stdout;
	};

	const getLastCommitMessage = async () => {
		const { stdout = "" } = await execute(["log", "-1", "--pretty=%s"]);
		return stdout.trim();
	};

	// Merge Operations
	const merge = async (branch: string, options?: { noff?: boolean }) => {
		const args = ["merge"];
		if (options?.noff) args.push("--no-ff");
		args.push(branch);
		await execute(args);
		return branch;
	};

	// Remote Operations
	const getRemotes = async () => {
		const { stdout = "" } = await execute(["remote", "-v"]);
		return stdout.split("\n").filter((l) => l.trim());
	};

	const getRemoteUrl = async (remote = "origin") => {
		const { stdout = "" } = await execute(["remote", "get-url", remote]);
		return stdout.trim();
	};

	const addRemote = async (name: string, url: string) => {
		await execute(["remote", "add", name, url]);
		return { name, url };
	};

	const removeRemote = async (name: string) => {
		await execute(["remote", "remove", name]);
		return name;
	};

	const renameRemote = async (oldName: string, newName: string) => {
		await execute(["remote", "rename", oldName, newName]);
		return { oldName, newName };
	};

	// Stage Operations
	const stageFiles = async (files: string[]) => {
		await execute(["add", ...files]);
		return files;
	};

	const getStagedFiles = async () => {
		const { stdout = "" } = await execute(["diff", "--name-only", "--cached"]);
		return stdout.split("\n").filter(Boolean);
	};

	const unstageFiles = async (files: string[]) => {
		await execute(["restore", "--staged", ...files]);
		return files;
	};

	// Submodule Operations
	const getSubmodules = async (): Promise<GitSubmoduleInfo[]> => {
		const { stdout = "" } = await execute(["submodule", "status"]);
		return stdout
			.split("\n")
			.filter(Boolean)
			.map((line) => {
				// Example line: "+a5b2c3f...0000000 submodule/path (heads/main)"
				const match = line
					.trim()
					.match(/^[+\-U ]?([a-f0-9]+)\s+([^\s]+)\s+\([^)]+\)$/);
				if (!match) return null;

				const [, commit, path] = match;
				return {
					name: path.split("/").pop() || path,
					path,
					url: "", // This would need to be fetched separately
					commit,
				};
			})
			.filter(Boolean) as GitSubmoduleInfo[];
	};

	const addSubmodule = async (
		url: string,
		path: string,
	): Promise<GitSubmoduleInfo> => {
		await execute(["submodule", "add", url, path]);
		// After adding, get the commit hash
		const { stdout: commit = "" } = await execute([
			"rev-parse",
			`HEAD:./${path}`,
		]);
		return {
			name: path.split("/").pop() || path,
			path,
			url,
			commit: commit.trim(),
		};
	};

	const updateSubmodules = async (): Promise<boolean> => {
		await execute(["submodule", "update", "--remote", "--recursive"]);
		return true;
	};

	const removeSubmodule = async (path: string): Promise<boolean> => {
		// Stage the removal of the submodule
		await execute(["rm", path]);
		// Remove the submodule entry from .git/config
		await execute(["config", "--remove-section", `submodule.${path}`]);
		// Remove the submodule directory from .git/modules
		const { stdout: gitDir } = await execute(["rev-parse", "--git-dir"]);
		await execute(["rm", "-rf", `${gitDir}/modules/${path}`]);
		return true;
	};

	// Stash Operations
	const stashSave = async (message?: string, includeUntracked = false) => {
		const args = ["stash", "push"];
		if (message) args.push("-m", message);
		if (includeUntracked) args.push("--include-untracked");
		await execute(args);
		return message || "WIP";
	};

	const listStashes = async (): Promise<GitStashInfo[]> => {
		const { stdout = "" } = await execute([
			"stash",
			"list",
			"--pretty=format:%gd:%s:%ad:%an",
		]);
		if (!stdout) return [];

		return stdout.split("\n").map((line) => {
			const [ref, message, date, author] = line.split(":");
			return {
				ref: ref.trim(),
				message: message.trim(),
				date: date.trim(),
				author: author.trim(),
			};
		});
	};

	const stashApply = async (stashRef: string) => {
		await execute(["stash", "apply", stashRef]);
		return stashRef;
	};

	const stashPop = async (stashRef: string) => {
		await execute(["stash", "pop", stashRef]);
		return stashRef;
	};

	const stashDrop = async (stashRef: string) => {
		await execute(["stash", "drop", stashRef]);
		return stashRef;
	};

	// Tag Operations
	const getTags = async () => {
		const { stdout = "" } = await execute(["tag", "-l"]);
		return stdout.split("\n").filter(Boolean);
	};

	const createTag = async (name: string, message?: string) => {
		const args = ["tag", "-a", name];
		if (message) args.push("-m", message);
		else args.push("-m", name);

		await execute(args);
		return name;
	};

	const deleteTag = async (name: string) => {
		await execute(["tag", "-d", name]);
		return name;
	};

	const pushTag = async (tagName: string, remote = "origin") => {
		await execute(["push", remote, tagName]);
		return { tagName, remote };
	};

	// Reset Operations
	const resetSoft = async (commit = "HEAD^") => {
		await execute(["reset", "--soft", commit]);
		return commit;
	};

	const resetHard = async (commit = "HEAD^") => {
		await execute(["reset", "--hard", commit]);
		return commit;
	};

	const resetMixed = async (commit = "HEAD^") => {
		await execute(["reset", commit]);
		return commit;
	};

	// Rebase Operations
	const rebase = async (branch: string, interactive = false) => {
		const args = ["rebase"];
		if (interactive) args.push("-i");
		args.push(branch);

		await execute(args);
		return branch;
	};

	const continueRebase = async () => {
		await execute(["rebase", "--continue"]);
		return true;
	};

	const abortRebase = async () => {
		await execute(["rebase", "--abort"]);
		return true;
	};

	// Pull Request (using git commands that might be relevant)
	const fetchRemote = async (remote = "origin") => {
		await execute(["fetch", remote]);
		return remote;
	};

	// Checkout Operations (more comprehensive)
	const checkoutNewBranch = async (name: string, startPoint?: string) => {
		const args = ["checkout", "-b", name];
		if (startPoint) args.push(startPoint);
		await execute(args);
		return name;
	};

	const checkoutFile = async (file: string) => {
		await execute(["checkout", "--", file]);
		return file;
	};

	// Worktree Operations
	const listWorktrees = async () => {
		const { stdout = "" } = await execute(["worktree", "list", "--porcelain"]);
		const worktrees: Array<{ path: string; head?: string; branch?: string }> =
			[];
		let currentWorktree: {
			path: string;
			head?: string;
			branch?: string;
		} | null = null;

		for (const line of stdout.split("\n")) {
			if (!line) continue;

			if (line.startsWith("worktree ")) {
				// Start of a new worktree entry
				if (currentWorktree) {
					worktrees.push(currentWorktree);
				}
				currentWorktree = { path: line.substring("worktree ".length) };
			} else if (line.startsWith("HEAD ") && currentWorktree) {
				currentWorktree.head = line.substring("HEAD ".length);
			} else if (line.startsWith("branch ") && currentWorktree) {
				currentWorktree.branch = line.substring("branch ".length);
			}
		}

		// Add the last worktree
		if (currentWorktree) {
			worktrees.push(currentWorktree);
		}

		return worktrees;
	};

	const addWorktree = async (
		path: string,
		branch: string,
		createBranch = false,
	) => {
		const args = ["worktree", "add"];
		if (createBranch) args.push("-b", branch);
		args.push(path, branch);

		await execute(args);
		return { path, branch };
	};

	const removeWorktree = async (path: string, force = false) => {
		const args = ["worktree", "remove"];
		if (force) args.push("--force");
		args.push(path);

		await execute(args);
		return path;
	};

	// Pull Operations
	const pull = async (remote = "origin", branch?: string) => {
		const args = ["pull", remote];
		if (branch) args.push(branch);

		await execute(args);
		return { remote, branch };
	};

	// Push Operations
	const push = async (remote = "origin", branch?: string, force = false) => {
		const args = ["push"];
		if (force) args.push("--force");
		args.push(remote);
		if (branch) args.push(branch);

		await execute(args);
		return { remote, branch };
	};

	// Status Operations
	const status = async () => {
		const { stdout = "" } = await execute(["status", "--porcelain"]);
		return stdout
			.split("\n")
			.filter(Boolean)
			.map((line) => {
				const status = line.substring(0, 2);
				const file = line.substring(3);
				return { status, file };
			});
	};

	// Get all unstaged files with more comprehensive filtering
	const getUnstagedFiles = async () => {
		const statusOutput = await status();
		return statusOutput
			.filter(
				(entry) =>
					entry.status[1] === "M" ||
					entry.status === "??" ||
					entry.status[1] === "D",
			)
			.map((entry) => entry.file);
	};

	// Alternative implementation that works directly with git status
	const getUnstagedFilesRaw = async (): Promise<string[]> => {
		const statusResult = await execute(["status", "--porcelain"]);
		if (!statusResult.stdout) return [];

		return statusResult.stdout
			.split("\n")
			.filter(Boolean)
			.filter((line) => {
				// Only include unstaged changes (lines that don't start with a space)
				const status = line.trim().split(" ")[0];
				return status !== "" && status !== "??" && status[0] !== " ";
			})
			.map((line) => line.trim().split(" ").pop() || "")
			.filter(Boolean);
	};

	// Get file information with extensions and sizes
	const getFilesInfo = async (files: string[]): Promise<GitFileInfo[]> => {
		if (files.length === 0) return [];

		// Get file information using git ls-files
		const result = await execute([
			"ls-files",
			"--stage",
			"--format=%(path)",
			"--",
			...files,
		]);

		// Handle case where stdout might be undefined
		const fileStats = result.stdout || "";

		return fileStats
			.split("\n")
			.filter(Boolean)
			.map((line) => {
				const [file] = line.trim().split("\t");
				const ext = file.split(".").pop()?.toLowerCase() || "other";
				// For now, we'll use a placeholder size since we can't get actual sizes easily
				// In a real implementation, you might want to use fs.statSync for this
				const size = 0;
				return { file, ext, size };
			});
	};

	// Group files by extension type
	const groupFilesByType = (
		fileDetails: GitFileInfo[],
	): { totalSize: number; filesByType: FilesByTypeInfo } => {
		const filesByType: FilesByTypeInfo = {};
		let totalSize = 0;

		for (const { file, ext, size } of fileDetails) {
			if (!filesByType[ext]) {
				filesByType[ext] = { count: 0, size: 0, files: [] };
			}
			filesByType[ext].count++;
			filesByType[ext].size += size;
			filesByType[ext].files.push(file);
			totalSize += size;
		}

		return { totalSize, filesByType };
	};

	// Get comprehensive info about staged files
	const getStagedFilesInfo = async () => {
		const stagedFiles = await getStagedFiles();
		if (stagedFiles.length === 0)
			return { stagedFiles, fileDetails: [], totalSize: 0, filesByType: {} };

		const fileDetails = await getFilesInfo(stagedFiles);
		const { totalSize, filesByType } = groupFilesByType(fileDetails);

		return { stagedFiles, fileDetails, totalSize, filesByType };
	};

	// Get comprehensive info about unstaged files
	const getUnstagedFilesInfo = async () => {
		const unstagedFiles = await getUnstagedFiles();
		if (unstagedFiles.length === 0)
			return { unstagedFiles, fileDetails: [], totalSize: 0, filesByType: {} };

		const fileDetails = await getFilesInfo(unstagedFiles);
		const { totalSize, filesByType } = groupFilesByType(fileDetails);

		return { unstagedFiles, fileDetails, totalSize, filesByType };
	};

	return {
		// Core
		execute,

		// Repository Info
		isGitRepo,
		getCurrentBranch,
		getRootDir,
		status,

		// Branches
		getBranches,
		createBranch,
		deleteBranch,
		checkoutBranch,
		checkoutNewBranch,
		checkoutFile,

		// Commits
		commit,
		showCommit,
		checkoutCommit,
		createBranchAtCommit,

		// Diff
		getDiff,

		// Hooks
		listHooks,

		// Logs
		getLogs,
		getCommitDetails,
		getLastCommitMessage,

		// Merge
		merge,

		// Remotes
		getRemotes,
		getRemoteUrl,
		addRemote,
		removeRemote,
		renameRemote,
		fetchRemote,

		// Stage
		stageFiles,
		getStagedFiles,
		unstageFiles,
		getUnstagedFiles,
		getUnstagedFilesRaw,
		getFilesInfo,
		groupFilesByType,
		getStagedFilesInfo,
		getUnstagedFilesInfo,

		// Stash
		stashSave,
		listStashes,
		stashApply,
		stashPop,
		stashDrop,

		// Tags
		getTags,
		createTag,
		deleteTag,
		pushTag,

		// Reset
		resetSoft,
		resetHard,
		resetMixed,

		// Rebase
		rebase,
		continueRebase,
		abortRebase,

		// Pull/Push
		pull,
		push,

		// Worktree
		listWorktrees,
		addWorktree,
		removeWorktree,

		// Submodules
		getSubmodules,
		addSubmodule,
		updateSubmodules,
		removeSubmodule,
	};
}
