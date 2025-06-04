import { execa } from 'execa';
import { useColor } from './useColor';

export interface FzfOption<T = unknown> {
  label: string;
  value: T;
}

export interface UseFzfOptions {
  multi?: boolean;
  height?: number;
  prompt?: string;
}

export function useFzf<T = unknown>() {
  let isLoading = false;
  let error: Error | null = null;
  let selectedItems: T[] = [];

  const runFzf = async (options: FzfOption<T>[], fzfOptions: UseFzfOptions = {}): Promise<T | T[] | null> => {
    isLoading = true;
    error = null;
    
    const getFzfArgs = (opts: UseFzfOptions): string[] => {
      const args: string[] = [];
      if (opts.multi) args.push('--multi');
      if (opts.height) args.push(`--height=${opts.height}`);
      if (opts.prompt) args.push(`--prompt=${opts.prompt}`);
      return args;
    };
    
    const executeCommand = (input: string, args: string[]) => {
      return execa('fzf', args, {
        input,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'inherit'],
        reject: false
      });
    };
    
    const parseResult = (stdout: string, opts: FzfOption<T>[]): T | T[] | null => {
      if (!stdout.trim()) return null;
      
      const selectedLabels = stdout.trim().split('\n');
      const selectedValues = selectedLabels
        .map(label => opts.find(opt => opt.label === label)?.value)
        .filter((val): val is T => val !== undefined);
        
      return fzfOptions.multi ? selectedValues : selectedValues[0] ?? null;
    };
    
    try {
      const fzfArgs = getFzfArgs(fzfOptions);
      const input = options.map(opt => opt.label).join('\n');
      const { stdout, exitCode } = await executeCommand(input, fzfArgs);
      
      if (exitCode !== 0) {
        isLoading = false;
        return null;
      }
      
      const result = parseResult(stdout, options);
      selectedItems = Array.isArray(result) ? result : result ? [result] : [];
      isLoading = false;
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      error = errorObj;
      const color = useColor();
      console.error(color.red(`Error in useFzf: ${errorObj.message}`));
      isLoading = false;
      return null;
    }
  };

  return {
    isLoading,
    error,
    selectedItems,
    runFzf
  };
}