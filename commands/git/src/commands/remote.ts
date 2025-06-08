import { intro, outro, select, confirm, text, isCancel } from "@clack/prompts";
import pc from "picocolors";
import useGit from "../utils/useGit";
import { tryCatch, handleEither } from "../utils/Error";

// Pure functions
const validateRemoteName = (value: string): string | undefined => {
	if (!value) return "Remote name is required";
	if (value.includes(" ")) return "Name cannot contain spaces";
};

const validateRemoteUrl = (value: string): string | undefined => {
	if (!value) return "Remote URL is required";
};

const validateNewRemoteName = (
	remoteNames: string[],
	value: string,
): string | undefined => {
	if (!value) return "New name is required";
	if (value.includes(" ")) return "Name cannot contain spaces";
	if (remoteNames.includes(value))
		return "A remote with this name already exists";
};

// Action handlers
const handleViewRemote = async (
	git: ReturnType<typeof useGit>,
	name: string,
): Promise<void> => {
	const url = await git.getRemoteUrl(name);
	outro(pc.green(`Remote ${name}: ${url}`));
};

const handleAddRemote = async (
	git: ReturnType<typeof useGit>,
): Promise<void> => {
	const name = await text({
		message: "Enter remote name",
		validate: validateRemoteName,
	});

	if (isCancel(name)) return;

	const url = await text({
		message: "Enter remote URL",
		validate: validateRemoteUrl,
	});

	if (!isCancel(url)) {
		await git.addRemote(name, url);
		outro(pc.green(`Added remote ${name}`));
	}
};

const handleRemoveRemote = async (
	git: ReturnType<typeof useGit>,
	name: string,
): Promise<void> => {
	const confirmed = await confirm({
		message: `Are you sure you want to remove remote ${name}?`,
	});

	if (confirmed) {
		await git.removeRemote(name);
		outro(pc.green(`Removed remote ${name}`));
	}
};

const handleRenameRemote = async (
	git: ReturnType<typeof useGit>,
	name: string,
	remoteNames: string[],
): Promise<void> => {
	const newName = await text({
		message: `Enter new name for ${name}`,
		validate: (value) => validateNewRemoteName(remoteNames, value),
	});

	if (!isCancel(newName)) {
		await git.renameRemote(name, newName);
		outro(pc.green(`Renamed remote from ${name} to ${newName}`));
	}
};

const handlePush = async (
	git: ReturnType<typeof useGit>,
	remoteNames: string[],
): Promise<void> => {
	const remote = await select({
		message: "Select remote to push to",
		options: remoteNames.map((r) => ({ value: r, label: r })),
	});

	if (!isCancel(remote)) {
		const currentBranch = await git.getCurrentBranch();
		await git.push(remote, currentBranch, false);
		outro(pc.green(`Pushed ${currentBranch} to ${remote}`));
	}
};

const handlePull = async (
	git: ReturnType<typeof useGit>,
	remoteNames: string[],
): Promise<void> => {
	const remote = await select({
		message: "Select remote to pull from",
		options: remoteNames.map((r) => ({ value: r, label: r })),
	});

	if (!isCancel(remote)) {
		const currentBranch = await git.getCurrentBranch();
		await git.pull(remote, currentBranch);
		outro(pc.green(`Pulled from ${remote}/${currentBranch}`));
	}
};

const handleFetch = async (
	git: ReturnType<typeof useGit>,
	remoteNames: string[],
): Promise<void> => {
	const remote = await select({
		message: "Select remote to fetch from",
		options: remoteNames.map((r) => ({ value: r, label: r })),
	});

	if (!isCancel(remote)) {
		await git.fetchRemote(remote);
		outro(pc.green(`Fetched from ${remote}`));
	}
};

const handleClone = async (git: ReturnType<typeof useGit>): Promise<void> => {
	const url = await text({
		message: "Enter repository URL to clone",
		validate: validateRemoteUrl,
	});

	if (!isCancel(url)) {
		const directory = await text({
			message: "Enter directory name (optional)",
			validate: (value) => {
				if (value?.includes(" ")) return "Directory name cannot contain spaces";
			},
		});

		if (!isCancel(directory)) {
			const args = ["clone", url];
			if (directory) args.push(directory);

			await git.execute(args, { stdio: "inherit" });
			outro(pc.green(`Cloned repository from ${url}`));
		}
	}
};

// Main function
async function remote(): Promise<void> {
	const git = useGit();
	intro(pc.bgBlue(pc.white(" Remote Management ")));

	await handleEither(
		tryCatch(async () => {
			const remotes = await git.getRemotes();

			if (remotes.length === 0) {
				outro(pc.yellow("No remotes configured"));
				return;
			}

			const remoteNames = Array.from(
				new Set(remotes.map((r) => r.split("\t")[0]).filter(Boolean)),
			);

			// Show all remote details immediately
			for (const name of remoteNames) {
				await handleViewRemote(git, name);
			}

			const options = [
				{ value: "add", label: "Add new remote" },
				{ value: "remove", label: "Remove remote" },
				{ value: "rename", label: "Rename remote" },
				{ value: "push", label: "Push to remote" },
				{ value: "pull", label: "Pull from remote" },
				{ value: "fetch", label: "Fetch from remote" },
				{ value: "clone", label: "Clone repository" },
			];

			const action = await select({
				message: "Remote Operations",
				options,
			});

			if (isCancel(action)) {
				outro("Operation cancelled");
				return;
			}

			if (action === "add") {
				await handleAddRemote(git);
			} else if (action === "clone") {
				await handleClone(git);
			} else if (action === "push") {
				await handlePush(git, remoteNames);
			} else if (action === "pull") {
				await handlePull(git, remoteNames);
			} else if (action === "fetch") {
				await handleFetch(git, remoteNames);
			} else {
				const name = await select({
					message: "Select remote",
					options: remoteNames.map((r) => ({ value: r, label: r })),
				});

				if (!isCancel(name)) {
					if (action === "remove") {
						await handleRemoveRemote(git, name);
					} else if (action === "rename") {
						await handleRenameRemote(git, name, remoteNames);
					}
				}
			}
		}, { code: 'GIT_ERROR' })
	);
}

export { remote };
