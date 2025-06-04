import useGit from '../useGit';

export interface LogOptions {
  limit?: number;
  since?: string;
  until?: string;
}

export interface LogEntry {
  hash: string;
  subject: string;
  author: string;
  date: string;
}

export interface FileHistoryEntry {
  hash: string;
  subject: string;
}

export function useGitLog() {
  let logs: LogEntry[] = [];
  let fileHistory: FileHistoryEntry[] = [];
  let loading = false;
  let error: Error | null = null;

  const getLog = async (cwd: string, options: LogOptions = {}) => {
    loading = true;
    try {
      const git = useGit(cwd);
      const args = ["log", "--pretty=format:%h|%s|%an|%ad"];

      if (options.limit) args.push(`-n ${options.limit}`);
      if (options.since) args.push(`--since=${options.since}`);
      if (options.until) args.push(`--until=${options.until}`);

      const { stdout } = await git.execute(args);
      logs = stdout
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [hash, subject, author, date] = line.split('|');
          return { hash, subject, author, date };
        });
    } catch (err) {
      error = err as Error;
    } finally {
      loading = false;
    }
    return logs;
  };

  const getFileHistory = async (cwd: string, filePath: string) => {
    loading = true;
    try {
      const git = useGit(cwd);
      const { stdout } = await git.execute(["log", "--follow", "--pretty=format:%h|%s", "--", filePath]);
      fileHistory = stdout
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [hash, subject] = line.split('|');
          return { hash, subject };
        });
    } catch (err) {
      error = err as Error;
    } finally {
      loading = false;
    }
    return fileHistory;
  };

  return {
    logs,
    fileHistory,
    loading,
    error,
    getLog,
    getFileHistory
  };
}