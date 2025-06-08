import * as clack from '@clack/prompts';
import { execa } from 'execa';

type CleanupTarget = {
  name: string;
  description: string;
  command: string[];
  confirmMessage: string;
  successMessage: string;
  danger?: boolean;
};

export async function cleanup() {
  const cwd = process.cwd();
  
  const cleanupTargets: CleanupTarget[] = [
    {
      name: 'node_modules',
      description: 'Remove node_modules directory',
      command: ['rm', '-rf', 'node_modules'],
      confirmMessage: 'This will delete the node_modules directory. Continue?',
      successMessage: '✅ Successfully removed node_modules directory',
      danger: true
    },
    {
      name: 'build',
      description: 'Remove build directory',
      command: ['rm', '-rf', 'dist build .next out'],
      confirmMessage: 'This will delete build directories (dist, build, .next, out). Continue?',
      successMessage: '✅ Successfully removed build directories',
      danger: true
    },
    {
      name: 'git-ignored',
      description: 'Clean untracked files (git clean -fdx)',
      command: ['git', 'clean', '-fdx'],
      confirmMessage: 'This will permanently delete all untracked files. Continue?',
      successMessage: '✅ Successfully cleaned untracked files',
      danger: true
    },
    {
      name: 'git-cache',
      description: 'Prune and optimize git repository',
      command: ['git', 'gc', '--prune=now', '--aggressive'],
      confirmMessage: 'This will optimize and prune your git repository. Continue?',
      successMessage: '✅ Successfully optimized git repository'
    },
    {
      name: 'npm-cache',
      description: 'Clear npm cache',
      command: ['npm', 'cache', 'clean', '--force'],
      confirmMessage: 'This will clear npm cache. Continue?',
      successMessage: '✅ Successfully cleared npm cache'
    }
  ];

  try {
    const selectedTarget = await clack.select({
      message: 'Select what to clean up',
      options: cleanupTargets.map(target => ({
        value: target.name,
        label: target.name,
        hint: target.description,
      })),
    });

    if (clack.isCancel(selectedTarget)) {
      clack.cancel('Operation cancelled');
      return;
    }

    const target = cleanupTargets.find(t => t.name === selectedTarget);
    if (!target) return;

    if (target.danger) {
      const confirm = await clack.confirm({
        message: target.confirmMessage,
        initialValue: false
      });

      if (confirm !== true) {
        clack.cancel('Operation cancelled');
        return;
      }
    }

    const spinner = clack.spinner();
    spinner.start(`Cleaning up ${target.name}...`);

    try {
      await execa(target.command[0], target.command.slice(1), { cwd });
      spinner.stop(target.successMessage);
    } catch (error) {
      spinner.stop(`❌ Failed to clean up ${target.name}`);
      throw error;
    }

  } catch (error) {
    clack.log.error(`Error during cleanup: ${error}`);
    process.exit(1);
  }
}
