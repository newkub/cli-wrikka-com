import useGit from '../useGit';

export interface RebaseOptions {
    interactive?: boolean;
}

export interface RebaseState {
    status: 'active' | 'inactive' | 'error';
    loading: boolean;
    error: Error | null;
}

export function useGitRebase() {
    const state: RebaseState = {
        status: 'inactive',
        loading: false,
        error: null
    };

    const rebase = async (cwd: string, branch: string, options: RebaseOptions = {}) => {
        state.loading = true;
        try {
            const git = useGit(cwd);
            const args = ["rebase"];
            if (options.interactive) args.push("-i");
            args.push(branch);
            await git.execute(args);
            state.status = 'inactive';
            return branch;
        } catch (err) {
            state.error = err as Error;
            state.status = 'error';
            throw err;
        } finally {
            state.loading = false;
        }
    };

    const continueRebase = async (cwd: string) => {
        state.loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["rebase", "--continue"]);
            state.status = 'inactive';
            return true;
        } catch (err) {
            state.error = err as Error;
            state.status = 'error';
            throw err;
        } finally {
            state.loading = false;
        }
    };

    const abortRebase = async (cwd: string) => {
        state.loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["rebase", "--abort"]);
            state.status = 'inactive';
            return true;
        } catch (err) {
            state.error = err as Error;
            state.status = 'error';
            throw err;
        } finally {
            state.loading = false;
        }
    };

    return {
        get rebaseStatus() { return state.status; },
        get loading() { return state.loading; },
        get error() { return state.error; },
        rebase,
        continueRebase,
        abortRebase
    };
}