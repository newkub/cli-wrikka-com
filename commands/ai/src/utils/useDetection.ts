import { platform } from 'os';
import { execa } from 'execa';

type EnvironmentInfo = {
    os: 'windows' | 'macos' | 'linux' | 'unknown';
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';
    editor: 'vscode' | 'webstorm' | 'vim' | 'unknown';
    shell: 'powershell' | 'bash' | 'zsh' | 'cmd' | 'unknown';
    terminal: 'windows-terminal' | 'iterm' | 'gnome-terminal' | 'unknown';
    docker: boolean;
    git: boolean;
    nodeVersion: string;
    bunVersion: string;
};

// Lightweight reactive state
class Reactive<T> {
    private _value: T;
    private listeners: Array<(value: T) => void> = [];

    constructor(value: T) {
        this._value = value;
    }

    get value(): T {
        return this._value;
    }

    set value(newValue: T) {
        this._value = newValue;
        for (const listener of this.listeners) {
            listener(newValue);
        }
    }

    subscribe(listener: (value: T) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

function computed<T>(getter: () => T) {
    return {
        get value() { return getter(); }
    };
}

/**
 * Composable for detecting user environment
 * @returns Grouped reactive environment information
 */
export function useDetection() {
    // Reactive state
    const env = new Reactive<EnvironmentInfo>({
        os: 'unknown',
        packageManager: 'unknown',
        editor: 'unknown',
        shell: 'unknown',
        terminal: 'unknown',
        docker: false,
        git: false,
        nodeVersion: 'unknown',
        bunVersion: 'unknown'
    });

    // Computed properties grouped by category
    const os = {
        isWindows: computed(() => env.value.os === 'windows'),
        isMacOS: computed(() => env.value.os === 'macos'),
        isLinux: computed(() => env.value.os === 'linux')
    };

    const shell = {
        isPowerShell: computed(() => env.value.shell === 'powershell'),
        isBash: computed(() => env.value.shell === 'bash'),
        isZsh: computed(() => env.value.shell === 'zsh'),
        isCmd: computed(() => env.value.shell === 'cmd')
    };

    const tools = {
        hasDocker: computed(() => env.value.docker),
        hasGit: computed(() => env.value.git)
    };

    // Detection function
    async function detect() {
        const newEnv: EnvironmentInfo = { ...env.value };
        
        // OS Detection
        const osPlatform = platform();
        if (osPlatform === 'win32') newEnv.os = 'windows';
        else if (osPlatform === 'darwin') newEnv.os = 'macos';
        else if (osPlatform === 'linux') newEnv.os = 'linux';

        // Package Manager Detection
        try {
            if (process.env.npm_execpath) {
                if (process.env.npm_execpath.includes('yarn')) newEnv.packageManager = 'yarn';
                else if (process.env.npm_execpath.includes('pnpm')) newEnv.packageManager = 'pnpm';
                else if (process.env.npm_execpath.includes('bun')) newEnv.packageManager = 'bun';
                else newEnv.packageManager = 'npm';
            }
        } catch {}

        // Editor Detection
        if (process.env.TERM_PROGRAM === 'vscode') newEnv.editor = 'vscode';
        else if (process.env.JETBRAINS_IDE) newEnv.editor = 'webstorm';
        else if (process.env.TERM === 'xterm-256color') newEnv.editor = 'vim';

        // Shell Detection
        if (process.env.PSModulePath || process.env.POWERSHELL_DISTRIBUTION_CHANNEL) {
            newEnv.shell = 'powershell';
        } else if (process.env.SHELL) {
            if (process.env.SHELL.includes('bash')) newEnv.shell = 'bash';
            else if (process.env.SHELL.includes('zsh')) newEnv.shell = 'zsh';
        } else if (process.env.ComSpec) {
            newEnv.shell = 'cmd';
        }

        // Terminal Detection
        if (process.env.WT_SESSION) newEnv.terminal = 'windows-terminal';
        else if (process.env.ITERM_SESSION_ID) newEnv.terminal = 'iterm';
        else if (process.env.GNOME_TERMINAL_SCREEN) newEnv.terminal = 'gnome-terminal';

        // Tool Detection
        try {
            // Check for Docker
            await execa('docker', ['--version']);
            newEnv.docker = true;
        } catch {}

        try {
            // Check for Git
            await execa('git', ['--version']);
            newEnv.git = true;
        } catch {}

        // Version Detection
        try {
            const { stdout: nodeVersion } = await execa('node', ['--version']);
            newEnv.nodeVersion = nodeVersion.trim();
        } catch {}

        try {
            const { stdout: bunVersion } = await execa('bun', ['--version']);
            newEnv.bunVersion = bunVersion.trim();
        } catch {}

        env.value = newEnv;
    }

    // Auto-detect on initialization
    detect();

    return {
        // Grouped returns for easier usage
        env,
        os,
        shell,
        tools,
        versions: {
            node: computed(() => env.value.nodeVersion),
            bun: computed(() => env.value.bunVersion)
        },
        detect
    };
}