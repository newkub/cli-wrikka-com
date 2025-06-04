import useGit from '../useGit';

export interface GitTag {
    name: string;
    ref: string;
    message?: string;
}

export interface GitTagsResult {
    tags: GitTag[];
    loading: boolean;
    error: Error | null;
    listTags: (cwd: string) => Promise<GitTag[]>;
    createTag: (cwd: string, tagName: string, message?: string) => Promise<GitTag>;
    deleteTag: (cwd: string, tagName: string) => Promise<void>;
    pushTag: (cwd: string, tagName: string, remote?: string) => Promise<{ tagName: string; remote: string }>;
}

export function useGitTags(): GitTagsResult {
    let tags: GitTag[] = [];
    let loading = false;
    let error: Error | null = null;

    const listTags = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout } = await git.execute(["tag", "-l", "--format='%(refname:short)|%(objectname)|%(contents:subject)'"]);
            tags = stdout.split('\n')
                .filter(Boolean)
                .map(line => {
                    const [name, ref, message] = line.replace(/^'|'$/g, '').split('|');
                    return { name, ref, message };
                });
            return tags;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const createTag = async (cwd: string, tagName: string, message?: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const args = ["tag", "-a", tagName];
            if (message) args.push("-m", message);
            else args.push("-m", tagName);
            await git.execute(args);
            const newTag: GitTag = { name: tagName, ref: '', message: message || tagName };
            tags.push(newTag);
            return newTag;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const deleteTag = async (cwd: string, tagName: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["tag", "-d", tagName]);
            tags = tags.filter(t => t.name !== tagName);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const pushTag = async (cwd: string, tagName: string, remote = "origin") => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["push", remote, tagName]);
            return { tagName, remote };
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        tags,
        loading,
        error,
        listTags,
        createTag,
        deleteTag,
        pushTag
    };
}