import useGit from '../useGit';

export interface GitSubmoduleInfo {
    name: string;
    path: string;
    url: string;
    commit: string;
}

export function useGitSubmodules() {
    let submodules: GitSubmoduleInfo[] = [];
    let loading = false;
    let error: Error | null = null;

    const listSubmodules = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout } = await git.execute(["submodule", "status"]);
            submodules = stdout
                .split('\n')
                .filter(Boolean)
                .map((line) => {
                    const match = line.trim().match(/^[+\-U ]?([a-f0-9]+)\s+([^\s]+)(?:\s+\(([^)]+)\))?$/);
                    if (!match) return null;

                    const [, commit, path, branch] = match;
                    return {
                        name: path.split('/').pop() || path,
                        path,
                        url: "", // Would need separate call to get URL
                        commit: commit.trim(),
                    };
                })
                .filter((item): item is GitSubmoduleInfo => item !== null);
            return submodules;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const updateSubmodules = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["submodule", "update", "--init", "--recursive"]);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        submodules,
        loading,
        error,
        listSubmodules,
        updateSubmodules
    };
}