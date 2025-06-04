import useGit from '../useGit';

interface StashInfo {
    ref: string;
    message: string;
    date: string;
    author: string;
}

export interface GitStashResult {
    stashes: StashInfo[];
    loading: boolean;
    error: Error | null;
    listStashes: (cwd: string) => Promise<StashInfo[]>;
    createStash: (cwd: string, message?: string, includeUntracked?: boolean) => Promise<void>;
    applyStash: (cwd: string, stashRef?: string) => Promise<void>;
    popStash: (cwd: string, stashRef?: string) => Promise<void>;
    dropStash: (cwd: string, stashRef?: string) => Promise<void>;
}

export function useGitStash(): GitStashResult {
    let stashes: StashInfo[] = [];
    let loading = false;
    let error: Error | null = null;

    const listStashes = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout } = await git.execute([
                "stash",
                "list",
                "--pretty=format:%gd:%s:%ad:%an"
            ]);

            stashes = stdout.split('\n')
                .filter(Boolean)
                .map(line => {
                    const [ref, message, date, author] = line.split(":");
                    return {
                        ref: ref.trim(),
                        message: message.trim(),
                        date: date.trim(),
                        author: author.trim(),
                    };
                });

            return stashes;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const createStash = async (cwd: string, message?: string, includeUntracked = false) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const args = ["stash", "push"];
            if (message) args.push("-m", message);
            if (includeUntracked) args.push("--include-untracked");
            await git.execute(args);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const applyStash = async (cwd: string, stashRef = "stash@{0}") => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["stash", "apply", stashRef]);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const popStash = async (cwd: string, stashRef = "stash@{0}") => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["stash", "pop", stashRef]);
            stashes = stashes.filter(s => s.ref !== stashRef);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const dropStash = async (cwd: string, stashRef = "stash@{0}") => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["stash", "drop", stashRef]);
            stashes = stashes.filter(s => s.ref !== stashRef);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        stashes,
        loading,
        error,
        listStashes,
        createStash,
        applyStash,
        popStash,
        dropStash
    };
}