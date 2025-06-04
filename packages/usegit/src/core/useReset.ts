import { execa } from "execa";

export interface ResetOptions {
  cwd: string;
  commit?: string;
}

export function useReset() {
  const resetSoft = async ({ cwd, commit = "HEAD" }: ResetOptions) => {
    await execa("git", ["reset", "--soft", commit], { cwd });
    return commit;
  };

  const resetHard = async ({ cwd, commit = "HEAD" }: ResetOptions) => {
    await execa("git", ["reset", "--hard", commit], { cwd });
    return commit;
  };

  const resetMixed = async ({ cwd, commit = "HEAD" }: ResetOptions) => {
    await execa("git", ["reset", "--mixed", commit], { cwd });
    return commit;
  };

  return {
    resetSoft,
    resetHard,
    resetMixed
  };
}