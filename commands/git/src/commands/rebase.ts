import { select, isCancel, confirm, text } from '@clack/prompts';
import { execa } from 'execa';
import { getBranches } from '../utils/useGit'; 

async function executeGitCommand(args: string[]): Promise<string> {
  const result = await execa('git', args);
  return result.stdout;
}

async function getCurrentBranch(): Promise<string> {
  const result = await execa('git', ['branch', '--show-current']);
  return result.stdout.trim();
}

type RebaseAction = 'continue' | 'abort' | 'interactive' | 'onto' | 'branch';

export async function rebase() {
  try {
    const action = await select({
      message: 'Select rebase action',
      options: [
        { 
          value: 'interactive', 
          label: '🔀 Interactive Rebase',
          hint: 'Rebase with interactive mode to edit, reword, or squash commits'
        },
        { 
          value: 'continue', 
          label: '▶️ Continue Rebase',
          hint: 'Continue after resolving conflicts'
        },
        { 
          value: 'abort', 
          label: '❌ Abort Rebase',
          hint: 'Cancel the current rebase operation'
        },
        { 
          value: 'onto', 
          label: '🌿 Rebase onto Branch',
          hint: 'Rebase current branch onto another branch'
        },
        { 
          value: 'branch', 
          label: '🌱 Rebase Branch',
          hint: 'Rebase a specific branch onto current branch'
        },
      ],
    }) as RebaseAction;

    if (isCancel(action)) {
      return;
    }

    switch (action) {
      case 'interactive':
        await handleInteractiveRebase();
        break;
      case 'continue':
        await executeGitCommand(['rebase', '--continue']);
        break;
      case 'abort':
        await executeGitCommand(['rebase', '--abort']);
        break;
      case 'onto':
        await handleRebaseOnto();
        break;
      case 'branch':
        await handleRebaseBranch();
        break;
    }
  } catch (error) {
    console.error('❌ Rebase failed:', error);
  }
}

async function handleInteractiveRebase() {
  const baseBranch = await select({
    message: 'Select base branch for interactive rebase',
    options: (await getBranchOptions()),
  });

  if (isCancel(baseBranch)) return;

  const commitCount = await text({
    message: 'How many commits to include in rebase?',
    placeholder: 'e.g., 5',
    defaultValue: '5',
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1) {
        return 'Please enter a valid number greater than 0';
      }
    },
  });

  if (isCancel(commitCount)) return;

  await executeGitCommand([
    'rebase',
    '-i',
    `HEAD~${commitCount}`,
    '--autostash',
  ]);
}

async function handleRebaseOnto() {
  const targetBranch = await select({
    message: 'Select target branch to rebase onto',
    options: (await getBranchOptions()),
  });

  if (isCancel(targetBranch)) return;

  const currentBranch = await getCurrentBranch();
  
  const sure = await confirm({
    message: `Rebase '${currentBranch}' onto '${targetBranch}'?`,
    initialValue: true,
  });

  if (sure && !isCancel(sure)) {
    await executeGitCommand(['rebase', targetBranch]);
  }
}

async function handleRebaseBranch() {
  const branches = await getBranches();
  const currentBranch = await getCurrentBranch();
  
  const branchToRebase = await select({
    message: 'Select branch to rebase',
    options: branches
      .filter((b: string) => b !== currentBranch)
      .map((branch: string) => ({
        value: branch,
        label: branch,
      })),
  });

  if (isCancel(branchToRebase)) return;

  const sure = await confirm({
    message: `Rebase '${branchToRebase}' onto '${currentBranch}'?`,
    initialValue: true,
  });

  if (sure && !isCancel(sure)) {
    await executeGitCommand(['rebase', currentBranch, branchToRebase]);
  }
}

async function getBranchOptions() {
  const branches = await getBranches();
  const currentBranch = await getCurrentBranch();
  
  return branches
    .filter((branch: string) => branch !== currentBranch)
    .map((branch: string) => ({
      value: branch,
      label: branch === currentBranch ? `${branch} (current)` : branch,
    }));
}

export const rebaseCommand = {
  value: 'rebase',
  label: '🌿 Rebase',
  hint: 'Interactive git rebase operations',
  handler: rebase,
};
