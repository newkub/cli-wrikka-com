import useGit from '../useGit';

export function useGitRemote() {
    let remotes = '';
    let loading = false;
    let error: Error | null = null;

    const getRemotes = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout = "" } = await git.execute(["remote", "-v"]);
            remotes = stdout;
            return remotes;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const addRemote = async (cwd: string, name: string, url: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["remote", "add", name, url]);
            return { name, url };
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const removeRemote = async (cwd: string, name: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["remote", "remove", name]);
            return name;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const getRemoteUrl = async (cwd: string, remote = "origin") => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout = "" } = await git.execute(["remote", "get-url", remote]);
            return stdout.trim();
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const renameRemote = async (cwd: string, oldName: string, newName: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["remote", "rename", oldName, newName]);
            return { oldName, newName };
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        remotes,
        loading,
        error,
        getRemotes,
        getRemoteUrl,
        addRemote,
        removeRemote,
        renameRemote
    };
}