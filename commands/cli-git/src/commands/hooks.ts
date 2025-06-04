import { select, isCancel, outro } from "@clack/prompts";
import pc from "picocolors";
import useGit from "../utils/useGit";

const installHooks = async (_git: ReturnType<typeof useGit>) => {
	// implement install hooks logic
};

const removeHooks = async (_git: ReturnType<typeof useGit>) => {
	// implement remove hooks logic
};

async function hooks(): Promise<void> {
	const git = useGit();

	try {
		await git.execute(["rev-parse", "--is-inside-work-tree"]);
	} catch (error) {
		const msg = error instanceof Error ? error.message : 'Not a git repository';
		outro(pc.red(msg));
		process.exit(1);
	}

	const action = await select({
		message: "Git Hooks",
		options: [
			{ value: "install", label: "Install hooks" },
			{ value: "remove", label: "Remove hooks" },
		],
	});

	if (isCancel(action)) {
		outro("Operation cancelled");
		return;
	}

	if (action === "install") {
		await installHooks(git);
	} else {
		await removeHooks(git);
	}
}

export { hooks };
