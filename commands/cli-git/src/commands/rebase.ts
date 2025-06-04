import { intro, select, outro, cancel, isCancel } from '@clack/prompts';
import useGit from '../utils/useGit';

function handleCancel<T>(value: T): boolean {
    if (isCancel(value)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }
    return false;
}

export async function rebaseCommand() {
    const git = useGit();
    intro('✨ Git Rebase');

    const action = await select({
        message: 'Select rebase action:',
        options: [
            { value: 'continue', label: 'Continue rebase', hint: 'Continue after resolving conflicts' },
            { value: 'abort', label: 'Abort rebase', hint: 'Cancel the current rebase operation' },
            { value: 'interactive', label: 'Interactive rebase', hint: 'Rebase with interactive mode' },
        ],
    });

    if (handleCancel(action)) return;

    try {
        switch (action) {
            case 'continue':
                await git.continueRebase();
                break;
            case 'abort':
                await git.abortRebase();
                break;
            case 'interactive':
                await git.rebase('--interactive HEAD~1');
                break;
        }
        outro('✅ Rebase completed successfully');
    } catch (error) {
        outro(`❌ Error during rebase: ${error instanceof Error ? error.message : String(error)}`);
    }
}