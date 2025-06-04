import { execa } from 'execa';
import { consola } from 'consola';

export function useNPM() {
  const install = async (packages: string[], options: { dev?: boolean; global?: boolean } = {}) => {
    const args = ['install'];
    
    if (options.dev) args.push('--save-dev');
    if (options.global) args.push('--global');
    
    args.push(...packages);
    
    try {
      const { stdout } = await execa('npm', args, { stdio: 'inherit' });
      return { success: true, output: stdout };
    } catch (error) {
      consola.error(`Failed to install packages: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error };
    }
  };
  
  const uninstall = async (packages: string[]) => {
    try {
      const { stdout } = await execa('npm', ['uninstall', ...packages], { stdio: 'inherit' });
      return { success: true, output: stdout };
    } catch (error) {
      consola.error(`Failed to uninstall packages: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error };
    }
  };
  
  const list = async () => {
    try {
      const { stdout } = await execa('npm', ['list', '--json', '--depth=0'], { stdio: 'pipe' });
      return { success: true, packages: JSON.parse(stdout).dependencies };
    } catch (error) {
      consola.error(`Failed to list packages: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error };
    }
  };

  return {
    install,
    uninstall,
    list
  };
}