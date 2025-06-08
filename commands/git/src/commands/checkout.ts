import * as clack from '@clack/prompts';
import { execa } from 'execa';
import useGit from '../utils/useGit';

interface CheckoutTarget {
  type: 'branch' | 'commit' | 'tag';
  name: string;
  isRemote?: boolean;
}

export async function checkout() {
  const _git = useGit();
  const cwd = process.cwd();
  
  try {
    // Get all available targets (branches, tags, commits)
    const [branches, tags, recentCommits] = await Promise.all([
      getBranches(),
      getTags(),
      getRecentCommits(),
    ]);

    // Transform data for the select prompt
    const branchOptions = branches.map(branch => ({
      value: { type: 'branch', name: branch, isRemote: branch.startsWith('remotes/') } as CheckoutTarget,
      label: `${branch.startsWith('remotes/') ? '🌐 ' : '🌿 '}${branch.replace('remotes/', '')}`,
    }));

    const tagOptions = tags.map(tag => ({
      value: { type: 'tag', name: tag } as CheckoutTarget,
      label: `🏷️  ${tag}`,
    }));

    const commitOptions = recentCommits.map(commit => ({
      value: { type: 'commit', name: commit.hash } as CheckoutTarget,
      label: `🔹 ${commit.message} (${commit.hash.slice(0, 7)})`,
      hint: `${commit.date} - ${commit.author}`,
    }));

    const allOptions = [
      ...branchOptions,
      ...tagOptions,
      ...commitOptions,
    ];

    const selected = await clack.select({
      message: 'Select a branch, tag, or commit to checkout',
      options: allOptions,
    });

    if (clack.isCancel(selected)) {
      clack.cancel('Operation cancelled');
      return;
    }

    const target = selected as CheckoutTarget;
    const spinner = clack.spinner();
    
    try {
      spinner.start(`Checking out ${target.type} ${target.name}`);
      
      if (target.type === 'branch' && target.isRemote) {
        // For remote branches, create a local tracking branch
        const branchName = target.name.split('/').slice(2).join('/');
        await execa('git', ['checkout', '-b', branchName, '--track', target.name], { cwd });
      } else if (target.type === 'commit') {
        // For commits, do a detached HEAD checkout
        await execa('git', ['checkout', target.name], { cwd });
      } else {
        // For branches and tags
        await execa('git', ['checkout', target.name], { cwd });
      }
      
      spinner.stop(`✅ Successfully checked out ${target.type} ${target.name}`);
    } catch (error) {
      spinner.stop('❌ Checkout failed');
      throw error;
    }
  } catch (error) {
    clack.outro(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error during checkout'}`);
    process.exit(1);
  }
}

// Helper functions
async function getBranches(): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['branch', '-a', '--format=%(refname:short)']);
    return stdout.split('\n').filter(Boolean);
  } catch (error) {
    throw new Error(`Failed to get branches: ${error}`);
  }
}

async function getTags(): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['tag', '--sort=-creatordate']);
    return stdout.split('\n').filter(Boolean);
  } catch (error) {
    throw new Error(`Failed to get tags: ${error}`);
  }
}

interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

async function getRecentCommits(limit = 10): Promise<CommitInfo[]> {
  try {
    const format = '%H|%s|%an|%ad';
    const { stdout } = await execa('git', [
      'log',
      `-n ${limit}`,
      `--pretty=format:${format}`,
      '--date=short',
    ]);

    return stdout
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
      });
  } catch (error) {
    throw new Error(`Failed to get recent commits: ${error}`);
  }
}
