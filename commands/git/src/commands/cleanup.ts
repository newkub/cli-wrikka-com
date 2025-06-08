import { execaCommand } from 'execa';
import * as p from '@clack/prompts';
import { Command } from './index';

// Add CLI spinner
const spinner = p.spinner();

export async function cleanup() {
  p.intro('🚀 Starting Git cleanup...');
  
  try {
    spinner.start('Fetching remote branches...');
    await execaCommand('git fetch --prune');
    spinner.stop('✅ Fetched remote branches');
    
    spinner.start('Checking for merged branches...');
    const { stdout: mergedBranches } = await execaCommand(
      'git branch -r --merged main | grep -v "^  origin/main" | sed "s|origin/||"'
    ) as { stdout: string };
    
    if (!mergedBranches.trim()) {
      p.outro('✅ No merged branches to clean up');
      return;
    }
    spinner.stop('✅ Found branches to clean');
    
    const branches = mergedBranches
      .split('\n')
      .filter(branch => branch.trim())
      .map(branch => ({
        name: branch.trim(),
        value: branch.trim()
      }));

    const branchOptions = branches.map(branch => ({
      label: branch.name,
      value: branch.value,
    }));

    const selectedBranches = await p.multiselect({
      message: 'Select branches to delete',
      options: branchOptions,
      required: false,
    });
    
    if (p.isCancel(selectedBranches)) {
      p.cancel('Operation cancelled');
      return;
    }
    
    const branchesToDelete = Array.isArray(selectedBranches) ? selectedBranches : [];
    
    if (branchesToDelete.length === 0) {
      p.outro('No branches selected for deletion');
      return;
    }
    
    // Delete selected branches
    for (const branch of branchesToDelete) {
      try {
        spinner.start(`Deleting branch: ${branch}`);
        await execaCommand(`git push origin --delete ${branch}`);
        spinner.stop(`✅ Deleted remote branch: ${branch}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        p.log.warning(`Failed to delete branch ${branch}: ${errorMessage}`);
      }
    }
    
    // Clean up local branches
    spinner.start('Cleaning up local branches...');
    await execaCommand('git branch --merged main | grep -v "^[ *]*main$" | xargs -r git branch -d');
    spinner.stop('✅ Cleaned up local branches');
    
    // Clean up git garbage
    spinner.start('Running git garbage collection...');
    await execaCommand('git gc --auto');
    spinner.stop('✅ Git garbage collection completed');
    
    p.outro('✨ Cleanup completed!');
  } catch (error: unknown) {
    spinner.stop('❌ Error occurred');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    p.cancel(`❌ Error during cleanup: ${errorMessage}`);
  }


}

export const cleanupCommand: Command = {
  value: 'cleanup',
  label: '🧹 Cleanup',
  hint: 'Clean up merged branches and optimize repository',
  handler: cleanup,
};
