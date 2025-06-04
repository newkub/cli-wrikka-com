import useGit from '../useGit';

export interface GitDiffResult {
  diffOutput: string;
  stagedDiffOutput: string;
  unstagedDiffOutput: string;
  commitDiffOutput: string;
  loading: boolean;
  error: Error | null;
  getDiff: (cwd: string, args?: string[]) => Promise<string>;
  getStagedDiff: (cwd: string) => Promise<string>;
  getUnstagedDiff: (cwd: string) => Promise<string>;
  getCommitDiff: (cwd: string, commitHash: string) => Promise<string>;
}

export function useGitDiff(): GitDiffResult {
  let diffOutput = '';
  let stagedDiffOutput = '';
  let unstagedDiffOutput = '';
  let commitDiffOutput = '';
  let loading = false;
  let error: Error | null = null;

  const getDiff = async (cwd: string, args: string[] = []) => {
    loading = true;
    try {
      const git = useGit(cwd);
      const { stdout } = await git.execute(["diff", ...args]);
      diffOutput = stdout;
      return diffOutput;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      loading = false;
    }
  };

  const getStagedDiff = async (cwd: string) => {
    loading = true;
    try {
      const git = useGit(cwd);
      const { stdout } = await git.execute(["diff", "--staged"]);
      stagedDiffOutput = stdout;
      return stagedDiffOutput;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      loading = false;
    }
  };

  const getUnstagedDiff = async (cwd: string) => {
    loading = true;
    try {
      const git = useGit(cwd);
      const { stdout } = await git.execute(["diff"]);
      unstagedDiffOutput = stdout;
      return unstagedDiffOutput;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      loading = false;
    }
  };

  const getCommitDiff = async (cwd: string, commitHash: string) => {
    loading = true;
    try {
      const git = useGit(cwd);
      const { stdout } = await git.execute(["show", commitHash]);
      commitDiffOutput = stdout;
      return commitDiffOutput;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      loading = false;
    }
  };

  return {
    diffOutput,
    stagedDiffOutput,
    unstagedDiffOutput,
    commitDiffOutput,
    loading,
    error,
    getDiff,
    getStagedDiff,
    getUnstagedDiff,
    getCommitDiff
  };
}