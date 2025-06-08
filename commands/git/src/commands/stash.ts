import { select, isCancel, confirm, text } from '@clack/prompts';
import { executeGitCommand, getStashList } from "../utils/useGit";

export async function stash() {
    const action = await select({
        message: 'Select stash action',
        options: [
            { value: 'list', label: 'List stashes' },
            { value: 'save', label: 'Save stash' },
            { value: 'apply', label: 'Apply stash' },
            { value: 'drop', label: 'Drop stash' },
            { value: 'clear', label: 'Clear all stashes' },
        ],
    }) as 'list' | 'save' | 'apply' | 'drop' | 'clear';

    if (isCancel(action)) return;

    switch (action) {
        case 'list': {
            const stashes = await getStashList();
            console.log(stashes.map(s => `${s.ref} - ${s.message}`).join('\n'));
            break;
        }
        case 'apply': {
            await executeGitCommand(['stash', 'apply']);
            console.log('Stash applied successfully');
            break;
        }
        case 'save': {
            const message = await text({
                message: 'Enter stash message:',
                placeholder: 'WIP: working on feature',
                defaultValue: 'WIP',
                validate: (value) => {
                    if (value.trim().length === 0) {
                        return 'Message cannot be empty';
                    }
                },
            });
            
            if (isCancel(message)) return;
            
            await executeGitCommand(['stash', 'push', '-m', message]);
            console.log('Stash saved successfully');
            break;
        }
        case 'drop': {
            const sure = await confirm({
                message: 'Are you sure you want to drop stash?'
            });
            if (sure && !isCancel(sure)) {
                await executeGitCommand(['stash', 'drop']);
                console.log('Stash dropped successfully');
            }
            break;
        }
        case 'clear': {
            const sure = await confirm({
                message: 'Are you sure you want to clear ALL stashes? This action cannot be undone.'
            });
            if (sure && !isCancel(sure)) {
                await executeGitCommand(['stash', 'clear']);
                console.log('All stashes have been cleared');
            }
            break;
        }
    }
}