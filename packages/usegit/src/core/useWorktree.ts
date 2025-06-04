import useGit from '../useGit';

export interface Worktree {
    path: string;
    head?: string;
    branch?: string;
}

export function useGitWorktree() {
    let worktrees: Worktree[] = [];
    let loading = false;
    let error: Error | null = null;

    const listWorktrees = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout = "" } = await git.execute(["worktree", "list", "--porcelain"]);

            worktrees = [];
            let currentWorktree: Worktree | null = null;

            for (const line of stdout.split("\n")) {
                if (!line) continue;

                if (line.startsWith("worktree ")) {
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

            if (currentWorktree) {
                worktrees.push(currentWorktree);
            }

            return worktrees;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const addWorktree = async (cwd: string, path: string, branch: string, createBranch = false) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const args = ["worktree", "add"];
            if (createBranch) args.push("-b", branch);
            args.push(path, branch);

            await git.execute(args);
            return { path, branch };
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const removeWorktree = async (cwd: string, path: string, force = false) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const args = ["worktree", "remove"];
            if (force) args.push("--force");
            args.push(path);

            await git.execute(args);
            worktrees = worktrees.filter(w => w.path !== path);
            return true;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        worktrees,
        loading,
        error,
        listWorktrees,
        addWorktree,
        removeWorktree
    };
}