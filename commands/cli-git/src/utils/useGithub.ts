import { Octokit } from "octokit";
import { execa } from "execa";

type PullRequest = {
	html_url: string;
	number: number;
	title: string;
	body: string | null;
};

export interface GithubConfig {
	token?: string;
	owner?: string;
	repo?: string;
}

export function useGithub(config: GithubConfig = {}): {
	createPullRequest: (options: {
		title: string;
		body: string;
		base?: string;
		head?: string;
	}) => Promise<PullRequest>;
	getPullRequests: () => Promise<PullRequest[]>;
} {
	const octokit = config.token ? new Octokit({ auth: config.token }) : null;

	async function getCurrentBranch(): Promise<string> {
		const { stdout = "" } = await execa("git", ["branch", "--show-current"]);
		return stdout.trim();
	}

	async function createPullRequest(options: {
		title: string;
		body: string;
		base?: string;
		head?: string;
	}): Promise<PullRequest> {
		if (!octokit || !config.owner || !config.repo) {
			throw new Error("GitHub configuration incomplete");
		}

		const base = options.base || "main";
		const head = options.head || (await getCurrentBranch());

		const response = await octokit.rest.pulls.create({
			owner: config.owner,
			repo: config.repo,
			title: options.title,
			body: options.body,
			base,
			head,
		});

		return response.data;
	}

	async function getPullRequests(): Promise<PullRequest[]> {
		if (!octokit || !config.owner || !config.repo) {
			throw new Error("GitHub configuration incomplete");
		}

		const response = await octokit.rest.pulls.list({
			owner: config.owner,
			repo: config.repo,
			state: "open",
		});

		return response.data;
	}

	return {
		createPullRequest,
		getPullRequests,
	};
}
