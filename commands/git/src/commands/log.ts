import { select, isCancel } from '@clack/prompts';
import { executeGitCommand } from '../utils/useGit';

export async function log() {
    const logType = await select({
        message: 'Select log type',
        options: [
            { value: '--oneline', label: 'Simple log' },
            { value: '--graph', label: 'Graph log' },
            { value: '--stat', label: 'Stat log' },
        ],
    });

    if (isCancel(logType)) return;

    const result = await executeGitCommand(['log', logType as string]);
    console.log(result);
}