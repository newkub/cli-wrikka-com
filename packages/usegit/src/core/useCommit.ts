import useGit from '../useGit';

export interface GitCommitState {
    lastCommitMessage: string | null;
    loading: boolean;
    error: Error | null;
}

export interface GitCommitActions {
    createCommit: (cwd: string, message: string) => Promise<void>;
    amendCommit: (cwd: string, message?: string) => Promise<void>;
    getLastCommitMessage: (cwd: string) => Promise<string>;
}

export function useGitCommit(): GitCommitState & GitCommitActions {
    let lastCommitMessage: string | null = null;
    let loading = false;
    let error: Error | null = null;

    const createCommit = async (cwd: string, message: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["commit", "-m", message]);
            lastCommitMessage = message;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const amendCommit = async (cwd: string, message?: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const args = ["commit", "--amend"];
            if (message) args.push("-m", message);
            await git.execute(args);
            if (message) lastCommitMessage = message;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const getLastCommitMessage = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout } = await git.execute(["log", "-1", "--pretty=%B"]);
            lastCommitMessage = stdout.trim();
            return lastCommitMessage;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        lastCommitMessage,
        loading,
        error,
        createCommit,
        amendCommit,
        getLastCommitMessage
    };
}