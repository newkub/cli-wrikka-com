import pc from 'picocolors';
import * as p from '@clack/prompts';
import useGit from '../utils/useGit';
import { tryCatch, handleEither } from '../utils/Error';

export async function pullRequest() {
    const git = useGit();
    
    p.intro(pc.blue('🔀 Create Pull Request'));
    
    await handleEither(
        tryCatch(async () => {
            // Get current branch and check if it's not main/master
            const currentBranch = await git.getCurrentBranch();
            if (!currentBranch) {
                p.outro(pc.red('❌ Could not determine current branch'));
                return;
            }
            
            if (['main', 'master'].includes(currentBranch)) {
                p.outro(pc.yellow('⚠️  You are on the main/master branch. Please switch to a feature branch.'));
                return;
            }
            
            // Get base branch (usually main or master)
            const branchesInfo = await git.getBranches();
            const mainBranches = ['main', 'master', 'develop'];
            const availableBranches = branchesInfo.branches || [];
            const baseBranches = availableBranches.filter(branch => 
                mainBranches.includes(branch)
            );
            
            if (baseBranches.length === 0) {
                p.outro(pc.red('❌ Could not find main/master/develop branch'));
                return;
            }
            
            // Select base branch
            const { baseBranch } = await p.group(
                {
                    baseBranch: () =>
                        p.select({
                            message: "Select base branch to merge into",
                            options: baseBranches.map((branch: string) => ({
                                value: branch,
                                label: branch,
                                hint: branch === 'main' || branch === 'master' ? 'production' : 'development'
                            })),
                            initialValue: baseBranches[0],
                        }),
                },
                {
                    onCancel: () => {
                        p.cancel('Operation cancelled');
                        process.exit(0);
                    },
                }
            ) as { baseBranch: string };
            
            // Get PR title and description
            const prInfo = await p.group(
                {
                    title: () =>
                        p.text({
                            message: 'PR title:',
                            validate: value => {
                                if (!value) return 'Title is required';
                            },
                        }),
                    description: () =>
                        p.text({
                            message: 'PR description (optional):',
                            placeholder: 'Describe your changes...',
                        }),
                },
                {
                    onCancel: () => {
                        p.cancel('Operation cancelled');
                        process.exit(0);
                    },
                }
            ) as { title: string; description?: string };
            
            if (!prInfo.title) {
                p.outro(pc.red('❌ PR title is required'));
                return;
            }
            
            // Push the current branch if needed
            const pushSpinner = p.spinner();
            pushSpinner.start('Pushing branch to remote...');
            
            try {
                await git.execute(['push', '-u', 'origin', currentBranch]);
                pushSpinner.stop(pc.green('✓ Branch pushed to remote'));
                
                // Create PR using GitHub CLI if available
                const prSpinner = p.spinner();
                prSpinner.start('Creating pull request...');
                
                try {
                    const prArgs = [
                        'pr', 'create',
                        '--base', baseBranch,
                        '--head', currentBranch,
                        '--title', prInfo.title
                    ];
                    
                    if (prInfo.description) {
                        prArgs.push('--body', prInfo.description);
                    }
                    
                    await git.execute(prArgs);
                    prSpinner.stop(pc.green('✓ Pull request created successfully!'));
                    p.outro(pc.green('🎉 Pull request is ready for review!'));
                } catch (prError: unknown) {
                    prSpinner.stop(pc.yellow('GitHub CLI not found or encountered an error'));
                    
                    if (prError instanceof Error) {
                        p.log.warning(prError.message);
                    }
                    
                    // Fallback to showing the PR URL
                    const repoUrl = await git.getRemoteUrl('origin');
                    if (repoUrl) {
                        const prUrl = `${repoUrl.replace(/\.git$/, '')}/compare/${baseBranch}...${currentBranch}?expand=1`;
                        p.note(prUrl, 'Create PR manually at');
                    } else {
                        p.log.warning('Could not determine repository URL');
                    }
                }
            } catch (error) {
                pushSpinner.stop(pc.red('❌ Failed to push branch'));
                if (error instanceof Error) {
                    p.log.error(error.message);
                }
                
                const continueWithoutPush = await p.confirm({
                    message: 'Would you like to continue without pushing? (You\'ll need to push manually)',
                    initialValue: false,
                });
                
                if (!continueWithoutPush) {
                    p.outro(pc.yellow('Pull request creation cancelled'));
                    return;
                }
                
                // Show manual PR creation instructions
                p.note(
                    `To create a pull request manually:
1. Push your branch: git push -u origin ${currentBranch}
2. Visit the repository on GitHub
3. Click "Compare & pull request"
4. Set base: ${baseBranch} <- compare: ${currentBranch}`,
                    'Manual PR Creation'
                );
            }
        }, { code: 'GIT_ERROR' })
    );
}

export default pullRequest;