import { executeGitCommand } from '../utils/useGit';
import { useFzf } from '@wrikka/tui';
import { select } from '@clack/prompts';

export async function commitLog() {
    const { runFzf } = useFzf();
    
    // ดึง log ทั้งหมดในรูปแบบที่ระบุ format
    const logs = await executeGitCommand([
        'log',
        '--pretty=format:%h %ar %an %s',
        '--date=short',
        '--relative-date',
        '--abbrev-commit',
        '--branches=*',
        '--remotes=origin'
    ]);
    const logLines = logs.split('\n').filter(Boolean);
    
    // ตรวจสอบว่าแต่ละ commit อยู่ใน remote หรือไม่
    const logWithRemoteStatus = await Promise.all(
        logLines.map(async (line) => {
            const hash = line.split(' ')[0];
            const remoteBranches = await executeGitCommand(['branch', '-r', '--contains', hash]);
            const isInRemote = remoteBranches.trim().length > 0;
            const remoteStatus = isInRemote ? '🌐' : '💻';
            return `${hash} ${remoteStatus} ${line.substring(hash.length).trim()}`;
        })
    );
    
    // สร้าง options สำหรับ FZF
    const logOptions = logWithRemoteStatus.map(line => ({
        value: line.split(' ')[0], // ใช้แค่ commit hash
        label: line
    }));

    // ใช้ FZF เลือก commit
    const selected = (await runFzf(logOptions, {
        prompt: 'Select commit> ',
        height: 20
    })) as string;

    if (!selected) return;

    const commitHash = selected.split(' ')[0];
    
    while (true) {
        const action = await select({
            message: `Commit: ${commitHash}`,
            options: [
                { value: 'view', label: 'View Changes' },
                { value: 'revert', label: 'Revert Commit' },
                { value: 'back', label: 'Back to List' },
            ],
        });

        if (action === 'view') {
            const commitDetails = await executeGitCommand(['show', '--stat', commitHash]);
            console.log(commitDetails);
            console.log('\nPress any key to continue...');
            process.stdin.setRawMode(true);
            process.stdin.resume();
            await new Promise(resolve => process.stdin.once('data', resolve));
            process.stdin.setRawMode(false);
        } else if (action === 'revert') {
            const confirm = await select({
                message: `Are you sure you want to revert commit ${commitHash}?`,
                options: [
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                ],
            });
            
            if (confirm === 'yes') {
                await executeGitCommand(['revert', '--no-commit', commitHash]);
                console.log(`Reverted commit ${commitHash}`);
                break;
            }
        } else {
            // Back to list
            break;
        }
    }
    
    // Clear console and show the list again
    console.clear();
    await commitLog();
}