import { execa } from 'execa';
import * as clack from '@clack/prompts';
import useGit from '../utils/useGit';

export async function branch() {
  const git = useGit();
  const gitRoot = await git.getRootDir();

  const action = await clack.select({
    message: 'Select branch action',
    options: [
      { value: 'list', label: 'List branches' },
      { value: 'create', label: 'Create new branch' },
      { value: 'delete', label: 'Delete branch' },
      { value: 'switch', label: 'Switch branch' },
    ],
  });

  if (clack.isCancel(action)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  switch (action) {
    case 'list':
      await listBranches(gitRoot);
      break;
    case 'create':
      await createBranchPrompt(gitRoot);
      break;
    case 'delete':
      await deleteBranchPrompt(gitRoot);
      break;
    case 'switch':
      await switchBranchPrompt(gitRoot);
      break;
  }
}

async function listBranches(gitRoot: string) {
  try {
    await execa('git', ['branch', '-a'], { stdio: 'inherit', cwd: gitRoot });
  } catch (error: unknown) {
    if (error instanceof Error) {
      clack.outro(`Error listing branches: ${error.message}`);
    } else {
      clack.outro('Error listing branches');
    }
    process.exit(1);
  }
}

async function createBranchPrompt(gitRoot: string) {
  const branchName = await clack.text({
    message: 'Enter new branch name',
    validate: (value) => {
      if (!value) return 'Branch name is required';
    },
  });

  if (clack.isCancel(branchName)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  try {
    await execa('git', ['checkout', '-b', branchName as string], {
      stdio: 'inherit',
      cwd: gitRoot,
    });
    clack.outro(`Branch ${branchName} created successfully!`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      clack.outro(`Error creating branch: ${error.message}`);
    } else {
      clack.outro('Error creating branch');
    }
    process.exit(1);
  }
}

async function deleteBranchPrompt(gitRoot: string) {
  const { stdout } = await execa('git', ['branch'], { cwd: gitRoot });
  const branches = stdout.split('\n').map(b => b.replace('*', '').trim());

  const branchToDelete = await clack.select({
    message: 'Select branch to delete',
    options: branches.map(b => ({ value: b, label: b })),
  });

  if (clack.isCancel(branchToDelete)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  const force = await clack.confirm({
    message: 'Force delete? (use -D instead of -d)',
  });

  try {
    const args = ['branch', force ? '-D' : '-d', branchToDelete as string];
    await execa('git', args, { stdio: 'inherit', cwd: gitRoot });
    clack.outro(`Branch ${branchToDelete} deleted successfully!`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      clack.outro(`Error deleting branch: ${error.message}`);
    } else {
      clack.outro('Error deleting branch');
    }
    process.exit(1);
  }
}

async function switchBranchPrompt(gitRoot: string) {
  const { stdout } = await execa('git', ['branch'], { cwd: gitRoot });
  const branches = stdout.split('\n').map(b => b.replace('*', '').trim());

  const branchToSwitch = await clack.select({
    message: 'Select branch to switch to',
    options: branches.map(b => ({ value: b, label: b })),
  });

  if (clack.isCancel(branchToSwitch)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  try {
    await execa('git', ['checkout', branchToSwitch as string], {
      stdio: 'inherit',
      cwd: gitRoot,
    });
    clack.outro(`Switched to branch ${branchToSwitch}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      clack.outro(`Error switching branch: ${error.message}`);
    } else {
      clack.outro('Error switching branch');
    }
    process.exit(1);
  }
}