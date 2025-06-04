import { select, confirm, text, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { handleEither, tryCatch } from '../utils/Error';
import { execa } from 'execa';

type GitHubAction = () => Promise<void>;
type GitHubActions = Record<string, GitHubAction>;

// Pure functions
const validateRequired = (
	value: string | undefined,
	field: string,
): string | undefined => (!value?.trim() ? `${field} is required` : undefined);

const displayInfo = (info: Record<string, string>) => {
	console.log(pc.blue(`\n${info.title}...`));
	for (const [key, value] of Object.entries(info)) {
		if (key !== "title") console.log(pc.blue(`${key}: ${value}`));
	}
};

// Higher-order functions
const withGitHubErrorHandling =
	(fn: GitHubAction): GitHubAction =>
	async () => {
		await handleEither(
			tryCatch(fn, {
				code: 'GIT_ERROR',
				metadata: { action: fn.name }
			})
		);
	};

const withGitCheck =
	(fn: (git: ReturnType<typeof useGit>) => Promise<void>): GitHubAction =>
	async () => {
		const git = useGit();
		await git.execute(["rev-parse", "--is-inside-work-tree"]);
		return fn(git);
	};

// Action handlers
const createPullRequest = withGitHubErrorHandling(
	withGitCheck(async (git) => {
		const title = await text({
			message: "PR Title:",
			placeholder: "Enter pull request title",
			validate: (value) => validateRequired(value, "Title"),
		});
		if (isCancel(title)) return;

		const body = await text({
			message: "PR Description (optional):",
			placeholder: "Enter pull request description",
		});
		if (isCancel(body)) return;

		const [currentBranch, remoteUrl] = await Promise.all([
			git.getCurrentBranch(),
			git.getRemoteUrl("origin"),
		]);

		displayInfo({
			title: `Creating PR for ${currentBranch}`,
			Repository: remoteUrl,
			Title: title,
			...(body && { Description: body }),
		});

		const confirmCreate = await confirm({
			message: "Create this pull request?",
			initialValue: true,
		});

		if (confirmCreate) {
			console.log(pc.green("\n✅ Pull request created successfully!"));
			console.log(pc.blue("Note: This would create a PR using GitHub API."));
		}
	}),
);

const listPullRequests = withGitHubErrorHandling(async () => {
	console.log(pc.blue("\nFetching open pull requests..."));
	console.log(pc.blue("Note: This would list PRs using GitHub API."));
});

const createIssue = withGitHubErrorHandling(async () => {
	const title = await text({
		message: "Issue Title:",
		placeholder: "Enter issue title",
		validate: (value) => validateRequired(value, "Title"),
	});
	if (isCancel(title)) return;

	const body = await text({
		message: "Issue Description (optional):",
		placeholder: "Enter issue description",
	});
	if (isCancel(body)) return;

	displayInfo({
		title: "Creating issue",
		Title: title,
		...(body && { Description: body }),
	});
	console.log(pc.blue("Note: This would create an issue using GitHub API."));
});

const listIssues = withGitHubErrorHandling(async () => {
	console.log(pc.blue("\nFetching open issues..."));
	console.log(pc.blue("Note: This would list issues using GitHub API."));
});

const forkRepository = withGitHubErrorHandling(
	withGitCheck(async (git) => {
		const remoteUrl = await git.getRemoteUrl("origin");

		const confirmFork = await confirm({
			message: `Fork repository: ${remoteUrl}?`,
			initialValue: true,
		});

		if (confirmFork) {
			displayInfo({
				title: "Forking repository",
				Repository: remoteUrl,
			});
			console.log(
				pc.blue("Note: This would fork the repository using GitHub API."),
			);
		}
	}),
);

const cloneRepository = withGitHubErrorHandling(async () => {
	const repoUrl = await text({
		message: "Repository URL or owner/repo:",
		placeholder: "e.g., https://github.com/owner/repo or owner/repo",
		validate: (value) => validateRequired(value, "Repository URL"),
	});
	if (isCancel(repoUrl)) return;

	const directory = await text({
		message: "Directory (optional, leave empty to use repo name):",
		placeholder: "Enter directory name",
	});
	if (isCancel(directory)) return;

	displayInfo({
		title: "Cloning repository",
		Repository: repoUrl,
		...(directory && { Directory: directory }),
	});
	console.log(
		pc.blue("Note: This would clone the repository in a real implementation."),
	);
});

// Main function
const github = withGitHubErrorHandling(async () => {
	const actions: GitHubActions = {
		pr: createPullRequest,
		"pr-list": listPullRequests,
		issue: createIssue,
		"issue-list": listIssues,
		fork: forkRepository,
		clone: cloneRepository,
	};

	const action = await select({
		message: "GitHub Actions",
		options: Object.entries(actions).map(([key]) => ({
			value: key,
			label: key,
		})),
	});

	if (!isCancel(action) && actions[action]) {
		await actions[action]();
	}
});

function useGit() {
	return {
		execute: (commands: string[]) => execa("git", commands),
		getCurrentBranch: () => execa("git", ["rev-parse", "--abbrev-ref", "HEAD"]).then(res => res.stdout),
		getRemoteUrl: (remote: string) => execa("git", ["remote", "get-url", remote]).then(res => res.stdout),
		getTags: () => execa("git", ["tag", "--list"]).then(res => res.stdout.split('\n').filter(Boolean)),
		createTag: (name: string, message?: string) => 
			execa("git", message ? ["tag", "-a", name, "-m", message] : ["tag", name]).then(res => res.stdout),
		pushTag: (name: string) => execa("git", ["push", "origin", name]),
		deleteTag: (name: string) => execa("git", ["tag", "-d", name])
	};
}

export { github };
