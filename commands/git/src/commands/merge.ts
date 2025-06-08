import pc from 'picocolors';
import * as p from '@clack/prompts';
import useGit from '../utils/useGit';
import { tryCatch, handleEither } from '../utils/Error';

export async function merge() {
    const git = useGit();
    
    p.intro(pc.blue('🔀 Git Merge'));
    
    await handleEither(
        tryCatch(async () => {
            // Get branches information
            const branchesInfo = await git.getBranches();
            const currentBranch = branchesInfo.currentBranch;
            const allBranches = branchesInfo.branches;
            
            if (!currentBranch) {
                p.outro(pc.red('❌ Could not determine current branch'));
                return;
            }
            
            if (!allBranches || allBranches.length === 0) {
                p.outro(pc.yellow('ℹ️ No branches found'));
                return;
            }
            
            // Filter out current branch from merge targets
            const branchOptions = allBranches
                .filter(branch => branch !== currentBranch)
                .map(branch => ({
                    value: branch,
                    label: branch,
                    hint: branch === 'main' || branch === 'master' ? 'production' : ''
                }));
                
            if (branchOptions.length === 0) {
                p.outro(pc.yellow('ℹ️ No other branches found to merge'));
                return;
            }
            
            // Select branch to merge
            const { branchToMerge } = await p.group(
                {
                    branchToMerge: () =>
                        p.select({
                            message: `Select branch to merge into ${pc.green(currentBranch)}`,
                            options: branchOptions,
                            initialValue: branchOptions[0].value,
                        }),
                },
                {
                    onCancel: () => {
                        p.cancel('Operation cancelled');
                        process.exit(0);
                    },
                }
            ) as { branchToMerge: string };
            
            if (!branchToMerge) {
                p.outro(pc.yellow('ℹ️ No branch selected'));
                return;
            }
            
            // Confirm merge
            const confirmMerge = await p.confirm({
                message: `Are you sure you want to merge ${pc.green(branchToMerge)} into ${pc.green(currentBranch)}?`,
                initialValue: true,
            });
            
            if (!confirmMerge) {
                p.outro(pc.yellow('Merge cancelled'));
                return;
            }
            
            // Execute merge
            const mergeSpinner = p.spinner();
            mergeSpinner.start(`Merging ${branchToMerge} into ${currentBranch}`);
            
            try {
                await git.execute(['merge', branchToMerge, '--no-ff', '-m', `Merge ${branchToMerge} into ${currentBranch}`]);
                mergeSpinner.stop(pc.green(`✓ Successfully merged ${branchToMerge} into ${currentBranch}`));
                p.outro(pc.green('Merge completed successfully!'));
            } catch (error: unknown) {
                mergeSpinner.stop(pc.red('❌ Merge failed'));
                
                if (error instanceof Error) {
                    p.log.error(error.message);
                }
                
                const resolveConflict = await p.confirm({
                    message: 'There was a merge conflict. Would you like to resolve it manually?',
                    initialValue: true,
                });
                
                if (resolveConflict) {
                    p.note(
                        'After resolving conflicts, run:\n' +
                        '- git add . (to stage resolved files)\n' +
                        '- git commit (to complete the merge)\n' +
                        '- git merge --abort (to cancel the merge)',
                        'How to resolve merge conflicts'
                    );
                } else {
                    await git.execute(['merge', '--abort']);
                    p.outro(pc.yellow('Merge aborted'));
                }
            }
        }, { code: 'GIT_ERROR' })
    );
}

export default merge;