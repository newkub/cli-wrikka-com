import { execa } from 'execa';
import pc from 'picocolors';
import { select, text, isCancel, spinner, outro, confirm } from '@clack/prompts';
import useGit from '../utils/useGit';

const COMMIT_TYPES = [
  { value: 'feat', label: '✨ feat', hint: 'A new feature' },
  { value: 'fix', label: '🐛 fix', hint: 'A bug fix' },
  { value: 'docs', label: '📚 docs', hint: 'Documentation only changes' },
  { value: 'style', label: '💎 style', hint: 'Changes that do not affect the meaning of the code' },
  { value: 'refactor', label: '🔨 refactor', hint: 'A code change that neither fixes a bug nor adds a feature' },
  { value: 'perf', label: '🚀 perf', hint: 'A code change that improves performance' },
  { value: 'test', label: '🧪 test', hint: 'Adding missing tests or correcting existing tests' },
  { value: 'build', label: '📦 build', hint: 'Changes that affect the build system or external dependencies' },
  { value: 'ci', label: '⚙️ ci', hint: 'Changes to our CI configuration files and scripts' },
  { value: 'chore', label: '♻️ chore', hint: 'Other changes that don\'t modify src or test files' },
  { value: 'revert', label: '⏪ revert', hint: 'Reverts a previous commit' },
];

async function autoCommit() {
  try {
    const git = useGit();
    
    if (!await git.isGitRepo()) {
      outro(pc.red('Not a git repository'));
      return;
    }

    // Get git status
    const { stdout: statusOutput } = await execa('git', ['status', '--porcelain', '--untracked-files=no']);
    const changedFiles = statusOutput.split('\n').filter(Boolean);

    if (changedFiles.length === 0) {
      outro(pc.green('No changes to commit'));
      return;
    }

    // Group files by directory with full path
    const fileGroups: Record<string, string[]> = {};
    
    for (const file of changedFiles) {
      const status = file.substring(0, 2);
      const filename = file.substring(3); // Remove status prefix
      
      // Skip untracked files
      if (status === '??') continue;
      
      const fullPath = filename;
      const dir = filename.split('/')[0];
      
      if (!fileGroups[dir]) {
        fileGroups[dir] = [];
      }
      fileGroups[dir].push(fullPath);
    }

    // Show files to be committed
    console.log(pc.blue('Files to be committed:'));
    for (const [dir, files] of Object.entries(fileGroups)) {
      console.log(pc.bold(`\n${dir}:`));
      for (const file of files) {
        console.log(`  ${file}`);
      }
    }
    console.log('');

    // Confirm before proceeding
    const proceed = await confirm({
      message: 'Proceed with auto commit?',
      initialValue: true,
    });

    if (isCancel(proceed) || !proceed) {
      outro('Auto commit cancelled');
      return;
    }

    // Stage and commit each group
    for (const [dir, files] of Object.entries(fileGroups)) {
      // Stage files
      const stageSpinner = spinner();
      stageSpinner.start(`Staging ${files.length} files in ${dir}`);
      await execa('git', ['add', ...files]);
      stageSpinner.stop(pc.green(`✓ Staged ${files.length} files in ${dir}`));
      
      // Create commit message
      const commitMessage = `chore(${dir}): update ${files.length} ${files.length > 1 ? 'files' : 'file'}`;
      
      // Commit with animation
      const commitSpinner = spinner();
      commitSpinner.start(`Committing changes in ${dir}`);
      
      try {
        await execa('git', ['commit', '-m', commitMessage]);
        commitSpinner.stop(pc.green(`✓ Committed changes in ${dir}`));
      } catch (error) {
        commitSpinner.stop(pc.red(`✗ Failed to commit changes in ${dir}`));
        throw error;
      }
    }

    outro(pc.green('All changes committed successfully!'));
  } catch (error) {
    outro(pc.red(`Error during auto commit: ${(error as Error).message}`));
  }
}

async function enhanceCommit() {
  try {
    const git = useGit();
    
    if (!await git.isGitRepo()) {
      outro(pc.red('Not a git repository'));
      return;
    }

    // Get git status
    const { stdout: statusOutput } = await execa('git', ['status', '--porcelain']);
    const changedFiles = statusOutput.split('\n').filter(Boolean);

    if (changedFiles.length === 0) {
      outro(pc.green('No changes to commit'));
      return;
    }

    // Show changed files
    console.log(pc.blue('Changed files:'));
    for (const file of changedFiles) {
      console.log(`  ${file}`);
    }
    console.log('');

    // Select commit type
    const commitType = await select({
      message: 'Select commit type',
      options: COMMIT_TYPES,
    });

    if (isCancel(commitType)) {
      outro('Commit cancelled');
      return;
    }

    // Determine scope from changed files
    let scope = '';
    const dirs = new Set<string>();
    
    for (const file of changedFiles) {
      const filename = file.substring(3); // Remove status prefix
      const dir = filename.split('/')[0];
      dirs.add(dir);
    }
    
    if (dirs.size === 1) {
      scope = [...dirs][0];
    }

    // Get commit message
    const message = await text({
      message: 'Enter commit message',
      placeholder: 'Describe your changes',
      validate: (value) => {
        if (!value) return 'Commit message is required';
      },
    });

    if (isCancel(message)) {
      outro('Commit cancelled');
      return;
    }

    // Format commit message
    let commitMessage = commitType;
    if (scope) {
      commitMessage += `(${scope})`;
    }
    commitMessage += `: ${message}`;

    // Show final commit message
    console.log('\n' + pc.bold(pc.blue('Commit message:')));
    console.log(pc.green(commitMessage) + '\n');

    // Confirm before committing
    const proceed = await confirm({
      message: 'Proceed with commit?',
      initialValue: true,
    });

    if (isCancel(proceed) || !proceed) {
      outro('Commit cancelled');
      return;
    }

    // Stage all changes
    const stageSpinner = spinner();
    stageSpinner.start('Staging all changes');
    await execa('git', ['add', '.']);
    stageSpinner.stop(pc.green('✓ Staged all changes'));
    
    // Commit
    const commitSpinner = spinner();
    commitSpinner.start('Committing changes');
    await execa('git', ['commit', '-m', commitMessage]);
    commitSpinner.stop(pc.green(`✓ Committed: ${commitMessage}`));
    
    outro(pc.green(`✓ Committed: ${commitMessage}`));
  } catch (error) {
    outro(pc.red(`Error during commit: ${(error as Error).message}`));
  }
}

export async function commit() {
  const mode = await select({
    message: 'Select commit mode',
    options: [
      { value: 'auto', label: '🚀 Auto Commit', hint: 'Stage and commit changes automatically' },
      { value: 'enhance', label: '✨ Enhance Commit', hint: 'Help format your commit message' },
    ],
  });

  if (isCancel(mode)) {
    outro('Commit cancelled');
    return;
  }

  if (mode === 'auto') {
    await autoCommit();
  } else {
    await enhanceCommit();
  }
}