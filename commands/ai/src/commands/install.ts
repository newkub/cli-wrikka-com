import { text, select, spinner, isCancel, cancel } from '@clack/prompts';
import { useNPM } from '../utils/useNPM';
import { consola } from 'consola';

export async function install() {
    try {
        const npm = useNPM();
        
        const packagesInput = await text({
            message: 'Enter package names to install (space separated)',
            placeholder: 'express lodash mongoose',
            validate: (value: string) => {
                if (!value?.trim()) return 'Please enter at least one package';
            }
        });

        if (isCancel(packagesInput)) {
            cancel('Operation cancelled.');
            process.exit(0);
        }

        const packages = packagesInput.trim().split(/\s+/);
        
        const installType = await select({
            message: 'Install as:',
            options: [
                { value: 'dependencies', label: ' Regular dependencies' },
                { value: 'devDependencies', label: ' Dev dependencies' },
                { value: 'global', label: ' Global packages' }
            ],
            initialValue: 'dependencies'
        });

        if (isCancel(installType)) {
            cancel('Operation cancelled.');
            process.exit(0);
        }

        const loadingSpinner = spinner();
        loadingSpinner.start(`Installing ${packages.join(', ')}`);
        
        const { success } = await npm.install(packages, {
            dev: installType === 'devDependencies',
            global: installType === 'global'
        });
        
        if (success) {
            loadingSpinner.stop(' Packages installed successfully');
        } else {
            loadingSpinner.stop('Failed to install packages');
        }
    } catch (error) {
        consola.error(`Installation Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}