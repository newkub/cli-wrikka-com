#!/usr/bin/env bun
import { select, intro, outro } from '@clack/prompts';
import pc from 'picocolors';
import { ask } from './commands/ask';
import { shellCommand } from './commands/shell-command';
import { install } from './commands/install';
import { code } from './commands/code';

async function main() {
    try {
        intro(pc.bgCyan(pc.black(' 🤖 CLI AI ')));

        const command = await select({
            message: 'What would you like to do?',
            options: [
                {
                    value: 'ask',
                    label: '💬 Ask AI a question',
                    hint: 'Get answers from AI'
                },
                {
                    value: 'shell',
                    label: '💻 Generate shell command',
                    hint: 'Convert natural language to shell commands'
                },
                {
                    value: 'install',
                    label: '📦 Install npm packages',
                    hint: 'Manage npm dependencies'
                },
                {
                    value: 'code',
                    label: '👩‍💻 Generate code',
                    hint: 'Create code from description'
                }
            ],
            initialValue: 'ask',
        });

        if (command === 'ask') {
            await ask();
        } else if (command === 'shell') {
            await shellCommand();
        } else if (command === 'install') {
            await install();
        } else if (command === 'code') {
            await code();
        }

        outro(pc.green('✅ Done!'));
    } catch (error) {
        outro(pc.bgRed(pc.white(' ❌ Error ')));
        console.error(error);
        process.exit(1);
    }
}

main();
