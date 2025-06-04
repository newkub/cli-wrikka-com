import useGit from '../useGit';

export interface RevertOptions {
    cwd: string;
    commitHash: string;
    noCommit?: boolean;
}

export function useGitRevert() {
    let loading = false;
    let error: Error | null = null;

    const revertCommit = async ({ cwd, commitHash, noCommit = false }: RevertOptions) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const args = ["revert"];
            if (noCommit) args.push("--no-commit");
            args.push(commitHash);

            await git.execute(args);
            return commitHash;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        loading,
        error,
        revertCommit
    };
}