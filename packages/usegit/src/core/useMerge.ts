import useGit from '../useGit';

export interface MergeOptions {
    noFastForward?: boolean;
    message?: string;
}

export type MergeStatus = 'clean' | 'conflict' | null;

export function useGitMerge() {
    let mergeStatus: MergeStatus = null;
    let loading = false;
    let error: Error | null = null;

    const mergeBranch = async (cwd: string, branchName: string, options: MergeOptions = {}) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const args = ["merge"];

            if (options.noFastForward) args.push("--no-ff");
            if (options.message) args.push("-m", options.message);

            args.push(branchName);
            await git.execute(args);
            mergeStatus = 'clean';
        } catch (err) {
            error = err as Error;
            mergeStatus = 'conflict';
            throw err;
        } finally {
            loading = false;
        }
    };

    const abortMerge = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["merge", "--abort"]);
            mergeStatus = null;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const getMergeStatus = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout } = await git.execute(["merge", "--no-commit", "--no-ff", "--quiet", "--no-progress", "--no-stat", "--no-verify"]);
            mergeStatus = stdout.includes('Automatic merge failed') ? 'conflict' : 'clean';
            return mergeStatus;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        mergeStatus,
        loading,
        error,
        mergeBranch,
        abortMerge,
        getMergeStatus
    };
}