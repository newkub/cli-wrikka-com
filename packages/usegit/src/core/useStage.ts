import useGit from '../useGit';

export interface GitStatusEntry {
    status: string;
    file: string;
}

export interface GitFileInfo {
    file: string;
    ext: string;
    size: number;
}

export interface FilesByTypeInfo {
    [ext: string]: {
        count: number;
        size: number;
        files: string[];
    };
}

export interface GitStageState {
    stagedFiles: string[];
    loading: boolean;
    error: Error | null;
}

export interface GitStageOperations {
    stageFiles: (cwd: string, files: string[]) => Promise<void>;
    unstageFiles: (cwd: string, files: string[]) => Promise<void>;
    stageAll: (cwd: string) => Promise<void>;
    getStagedFiles: (cwd: string) => Promise<string[]>;
    getUnstagedFiles: (cwd: string) => Promise<string[]>;
    getUnstagedFilesRaw: (cwd: string) => Promise<string>;
    getFilesInfo: (cwd: string) => Promise<string[]>;
}

export function useGitStage(): GitStageState & GitStageOperations {
    let stagedFiles: string[] = [];
    let loading = false;
    let error: Error | null = null;

    const stageFiles = async (cwd: string, files: string[]) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["add", ...files]);
            stagedFiles = files;
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const unstageFiles = async (cwd: string, files: string[]) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["reset", ...files]);
            stagedFiles = stagedFiles.filter(f => !files.includes(f));
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const stageAll = async (cwd: string) => {
        loading = true;
        try {
            const git = useGit(cwd);
            await git.execute(["add", "--all"]);
            stagedFiles = await getStagedFiles(cwd);
        } catch (err) {
            error = err as Error;
            throw err;
        } finally {
            loading = false;
        }
    };

    const getStagedFiles = async (cwd: string) => {
        const git = useGit(cwd);
        const { stdout } = await git.execute(["diff", "--name-only", "--cached"]);
        return stdout.split("\n").filter(Boolean);
    };

    const getUnstagedFiles = async (cwd: string) => {
        const git = useGit(cwd);
        const { stdout } = await git.execute(["diff", "--name-only"]);
        return stdout.split("\n").filter(Boolean);
    };

    const getUnstagedFilesRaw = async (cwd: string) => {
        const git = useGit(cwd);
        const { stdout } = await git.execute(["diff"]);
        return stdout;
    };

    const getFilesInfo = async (cwd: string) => {
        const git = useGit(cwd);
        const { stdout } = await git.execute(["status", "-s"]);
        return stdout.split("\n").filter(Boolean);
    };

    return {
        stagedFiles,
        loading,
        error,
        stageFiles,
        unstageFiles,
        stageAll,
        getStagedFiles,
        getUnstagedFiles,
        getUnstagedFilesRaw,
        getFilesInfo
    };
}