import { select, isCancel, confirm } from '@clack/prompts';
import { executeGitCommand, getStashList } from "../utils/useGit";

export async function stash() {
    const action = await select({
        message: 'Select stash action',
        options: [
            { value: 'list', label: 'List stashes' },
            { value: 'apply', label: 'Apply stash' },
            { value: 'drop', label: 'Drop stash' },
        ],
    });

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
    }
}