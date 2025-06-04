import useGit from '../useGit';

export interface BranchInfo {
  currentBranch: string;
  allBranches: string[];
}

export function useBranch(cwd: string) {
  let currentBranch = '';
  let rootDir = '';
  let branches: BranchInfo = { 
    currentBranch: '', 
    allBranches: [] 
  };

  const getCurrentBranch = async () => {
    const git = useGit(cwd);
    const { stdout = "" } = await git.execute(["branch", "--show-current"]);
    currentBranch = stdout.trim();
    return currentBranch;
  };

  const getRootDir = async () => {
    const git = useGit(cwd);
    const { stdout = "" } = await git.execute(["rev-parse", "--show-toplevel"]);
    rootDir = stdout.trim();
    return rootDir;
  };

  const getBranches = async () => {
    const git = useGit(cwd);
    const { stdout = "" } = await git.execute(["branch", "--list"]);
    branches = { 
      currentBranch: currentBranch, 
      allBranches: stdout
        .split("\n")
        .map(b => b.trim().replace(/^\*\s+/, ""))
        .filter(Boolean)
    };
    return branches;
  };

  return {
    currentBranch,
    rootDir,
    branches,
    getCurrentBranch,
    getRootDir,
    getBranches
  };
}