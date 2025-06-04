import { join } from 'path';
import useGit from '../useGit';

interface GitHooksResult {
    hooksList: string[];
    loading: boolean;
    error: Error | null;
    listHooks: (cwd: string) => Promise<string[]>;
    runHook: (cwd: string, hookName: string) => Promise<void>;
    installHook: (cwd: string, hookName: string, script: string) => Promise<void>;
    removeHook: (cwd: string, hookName: string) => Promise<void>;
}

export function useGitHooks(): GitHooksResult {
    let hooksList: string[] = [];
    let loading = false;
    let error: Error | null = null;

    const listHooks = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout: hooksPath = '.git/hooks' } = await git.execute(["config", "--get", "core.hooksPath"]);
            const fullPath = join(cwd, hooksPath.trim());

            const { stdout = "" } = await git.execute(["ls", "-l", fullPath]);
            hooksList = stdout.split('\n').filter(line => line.trim() && !line.endsWith('.sample'));
            return hooksList;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const runHook = async (cwd: string, hookName: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout: hooksPath = '.git/hooks' } = await git.execute(["config", "--get", "core.hooksPath"]);
            const fullPath = join(cwd, hooksPath.trim(), hookName);
            await git.execute(["sh", fullPath]);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const installHook = async (cwd: string, hookName: string, script: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout: hooksPath = '.git/hooks' } = await git.execute(["config", "--get", "core.hooksPath"]);
            const fullPath = join(cwd, hooksPath.trim(), hookName);
            await git.execute(["sh", "-c", `echo '${script}' > ${fullPath} && chmod +x ${fullPath}`]);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const removeHook = async (cwd: string, hookName: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            const { stdout: hooksPath = '.git/hooks' } = await git.execute(["config", "--get", "core.hooksPath"]);
            const fullPath = join(cwd, hooksPath.trim(), hookName);
            await git.execute(["rm", "-f", fullPath]);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        hooksList,
        loading,
        error,
        listHooks,
        runHook,
        installHook,
        removeHook
    };
}