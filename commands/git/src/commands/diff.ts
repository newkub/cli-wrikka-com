import { execa } from 'execa';
import pc from 'picocolors';
import { select, outro } from '@clack/prompts';
import useGit from '../utils/useGit';

type DiffType = 'staged' | 'unstaged' | 'all' | 'cached';

const DIFF_OPTIONS = {
  staged: { arg: '--staged', color: pc.green },
  unstaged: { arg: null, color: pc.red },
  all: { arg: null, color: pc.cyan },
  cached: { arg: '--cached', color: pc.yellow }
};

export async function diff() {
  const git = useGit();
  
  try {
    if (!await git.isGitRepo()) {
      outro(pc.red('Not a git repository'));
      return;
    }

    const { stdout: statusOutput } = await execa('git', ['status', '--porcelain']);
    const changedFiles = statusOutput.split('\n').filter(Boolean);
    
    const counts = {
      staged: changedFiles.filter(f => f.match(/^[A-Z]/)).length,
      unstaged: changedFiles.filter(f => f.match(/^.[A-Z]/)).length,
      all: changedFiles.length
    };

    const diffType = await select({
      message: 'Select diff type',
      options: [
        { 
          value: 'staged', 
          label: `Staged changes ${counts.staged > 0 ? DIFF_OPTIONS.staged.color(`(${counts.staged} files)`) : ''}`,
          hint: DIFF_OPTIONS.staged.color('(git diff --staged)')
        },
        { 
          value: 'unstaged', 
          label: `Unstaged changes ${counts.unstaged > 0 ? DIFF_OPTIONS.unstaged.color(`(${counts.unstaged} files)`) : ''}`,
          hint: DIFF_OPTIONS.unstaged.color('(git diff)')
        },
        { 
          value: 'all', 
          label: `All changes ${counts.all > 0 ? DIFF_OPTIONS.all.color(`(${counts.all} files)`) : ''}`,
          hint: DIFF_OPTIONS.all.color('(git diff HEAD)')
        },
        { 
          value: 'cached', 
          label: `Cached changes`,
          hint: DIFF_OPTIONS.cached.color('(git diff --cached)')
        }
      ]
    }) as DiffType;

    const { arg, color } = DIFF_OPTIONS[diffType];
    const args = ['diff', '--color'];
    if (arg) args.push(arg);

    const { stdout } = await execa('git', args);
    
    if (stdout) {
      console.log(color(stdout));
    } else {
      console.log(pc.gray('No changes found'));
    }
  } catch (error) {
    outro(pc.red('Error: ' + (error as Error).message));
  }
}