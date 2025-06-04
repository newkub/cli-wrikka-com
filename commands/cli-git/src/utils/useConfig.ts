import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { cwd } from "node:process";
import { useAI } from "./useAI";

type AIProvider =
	| "openai"
	| "google"
	| "gemini"
	| "claude"
	| "mistral"
	| "llama"
	| "cohere";

// ====================================
// Type Definitions
// ====================================

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface AIModel {
	id: string;
	name: string;
	provider: string;
	maxTokens: number;
	temperature: number;
	contextWindow: number;
}

interface AIConfig {
	enabled: boolean;
	provider: AIProvider;
	model: string;
	maxTokens: number;
	temperature: number;
	availableModels: AIModel[];
}

interface CommitType {
	value: string;
	label: string;
	hint: string;
}

interface CommitValidation {
	minLength: number;
	requiredFormat: string;
}

interface CommitBehavior {
	autoStage: boolean;
	confirmBeforeCommit: boolean;
	showDiffPreview: boolean;
}

interface CommitUI {
	theme: string;
	showSpinners: boolean;
	emoji: boolean;
}

interface CommitConfig {
	types: CommitType[];
	scopes: string[];
	validation: CommitValidation;
	ai: AIConfig;
	behavior: CommitBehavior;
	ui: CommitUI;
}

interface BranchProtection {
	requirePullRequest: boolean;
	requireApproval: boolean;
	requireStatusChecks: boolean;
}

interface BranchConfig {
	namingConvention: string;
	protections: Record<string, BranchProtection>;
	default: string;
}

interface CheckoutConfig {
	trackRemote: boolean;
	autoStash: boolean;
}

interface LogFilters {
	author: string;
	since: string;
	until: string;
}

interface LogConfig {
	format: string;
	graph: boolean;
	filters: LogFilters;
}

interface StageConfig {
	interactive: boolean;
	patch: boolean;
}

interface MergeConfig {
	strategy: string;
	fastForward: string;
}

interface RebaseConfig {
	interactive: boolean;
	autosquash: boolean;
}

interface RemoteConfig {
	defaultPush: string;
	autoFetch: boolean;
}

interface Config {
	ai: AIConfig;
	commit: CommitConfig;
	branch: BranchConfig;
	checkout: CheckoutConfig;
	log: LogConfig;
	stage: StageConfig;
	merge: MergeConfig;
	rebase: RebaseConfig;
	remote: RemoteConfig;
}

// ====================================
// Default Configurations
// ====================================

const defaultCommitConfig: CommitConfig = {
	types: [
		{ value: "feat", label: "Features", hint: "A new feature" },
		{ value: "fix", label: "Bug Fixes", hint: "A bug fix" },
		{
			value: "docs",
			label: "Documentation",
			hint: "Documentation only changes",
		},
		{
			value: "style",
			label: "Styles",
			hint: "Changes that do not affect the meaning of the code",
		},
		{
			value: "refactor",
			label: "Code Refactoring",
			hint: "A code change that neither fixes a bug nor adds a feature",
		},
		{
			value: "perf",
			label: "Performance Improvements",
			hint: "A code change that improves performance",
		},
		{
			value: "test",
			label: "Tests",
			hint: "Adding missing tests or correcting existing tests",
		},
		{
			value: "chore",
			label: "Chores",
			hint: "Changes to the build process or auxiliary tools",
		},
	],
	scopes: [],
	validation: {
		minLength: 10,
		requiredFormat: "^[a-z].*",
	},
	ai: {
		enabled: false,
		provider: "openai",
		model: "gpt-4",
		maxTokens: 100,
		temperature: 0.7,
		availableModels: [],
	},
	behavior: {
		autoStage: false,
		confirmBeforeCommit: true,
		showDiffPreview: true,
	},
	ui: {
		theme: "dark",
		showSpinners: true,
		emoji: true,
	},
};

const defaultBranchConfig: BranchConfig = {
	namingConvention: "feature/{{ticket}}/{{name}}",
	protections: {},
	default: "main",
};

const defaultCheckoutConfig: CheckoutConfig = {
	trackRemote: true,
	autoStash: false,
};

const defaultLogConfig: LogConfig = {
	format: "%h - %an, %ar : %s",
	graph: true,
	filters: {
		author: "",
		since: "",
		until: "",
	},
};

const defaultStageConfig: StageConfig = {
	interactive: true,
	patch: false,
};

const defaultMergeConfig: MergeConfig = {
	strategy: "ort",
	fastForward: "ff",
};

const defaultRebaseConfig: RebaseConfig = {
	interactive: true,
	autosquash: false,
};

const defaultRemoteConfig: RemoteConfig = {
	defaultPush: "upstream",
	autoFetch: true,
};

// Default AI configuration
const getDefaultAIConfig = (): AIConfig => {
	const ai = useAI();
	const availableModels = ai.getAvailableModels();
	const defaultModel =
		availableModels.find((m) => m.provider === "openai") || availableModels[0];

	return {
		enabled: availableModels.length > 0,
		provider: (defaultModel?.provider || "openai") as AIProvider,
		model: defaultModel?.id || "",
		maxTokens: defaultModel?.maxTokens || 2048,
		temperature: defaultModel?.temperature || 0.7,
		availableModels,
	};
};

const defaultConfig: Config = {
	ai: getDefaultAIConfig(),
	commit: defaultCommitConfig,
	branch: defaultBranchConfig,
	checkout: defaultCheckoutConfig,
	log: defaultLogConfig,
	stage: defaultStageConfig,
	merge: defaultMergeConfig,
	rebase: defaultRebaseConfig,
	remote: defaultRemoteConfig,
};

// ====================================
// Utility Functions
// ====================================

function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
	const result = { ...target } as Record<string, unknown>;

	for (const key in source) {
		if (
			source[key] !== null &&
			typeof source[key] === "object" &&
			!Array.isArray(source[key])
		) {
			result[key] = deepMerge(
				(result[key] || {}) as Record<string, unknown>,
				source[key] as Record<string, unknown>,
			);
		} else if (source[key] !== undefined) {
			result[key] = source[key];
		}
	}

	return result as T;
}

function readConfigFile(path: string): Config | null {
	try {
		if (!existsSync(path)) {
			return null;
		}
		const content = readFileSync(path, "utf-8");
		return JSON.parse(content);
	} catch (error) {
		console.error("Error reading config file:", error);
		return null;
	}
}

// ====================================
// Config Manager
// ====================================

function createConfigManager(configPath: string = join(cwd(), "kogit.json")) {
	let config: Config = { ...defaultConfig };
	let isUsingDefaults = false;

	const initialize = () => {
		try {
			// Initialize with default config
			const newConfig = { ...defaultConfig };

			// Load saved config if exists
			const savedConfig = readConfigFile(configPath);
			if (savedConfig) {
				// Merge saved config but preserve AI settings
				const { ai: savedAI, ...restSaved } = savedConfig as Config;
				Object.assign(newConfig, deepMerge(defaultConfig, restSaved));

				if (savedAI) {
					newConfig.ai = {
						...defaultConfig.ai,
						...savedAI,
						availableModels: defaultConfig.ai.availableModels,
					};
				}

				isUsingDefaults = false;
			} else {
				isUsingDefaults = true;
			}

			return newConfig;
		} catch (error) {
			console.warn("Failed to initialize config:", error);
			isUsingDefaults = true;
			return { ...defaultConfig };
		}
	};

	// Initialize config
	config = initialize();

	const save = (configToSave: Config): Config => {
		try {
			const dir = dirname(configPath);
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			writeFileSync(configPath, JSON.stringify(configToSave, null, 2), "utf-8");
			return configToSave;
		} catch (error) {
			console.error("Error saving config:", error);
			throw error;
		}
	};

	const update = (updates: DeepPartial<Config>): Config => {
		const newConfig = { ...config };

		// Handle AI config updates
		if (updates.ai) {
			const aiUpdates = updates.ai as Partial<AIConfig>;
			newConfig.ai = {
				...getDefaultAIConfig(),
				...aiUpdates,
				availableModels: getDefaultAIConfig().availableModels,
			};

			// Remove ai from updates to avoid double merging
			const { ai: _, ...restUpdates } = updates;
			Object.assign(newConfig, deepMerge(newConfig, restUpdates));
		} else {
			Object.assign(newConfig, deepMerge(newConfig, updates));
		}

		return save(newConfig);
	};

	const reset = (): Config => {
		const newConfig = { ...defaultConfig };
		isUsingDefaults = true;
		return save(newConfig);
	};

	const get = <K extends keyof Config>(
		key?: K,
	): K extends string ? Config[K] : Config => {
		if (!key) return config as K extends string ? Config[K] : Config;
		return config[key] as K extends string ? Config[K] : Config;
	};

	return {
		get config() {
			return { ...config };
		},
		get,
		update,
		save,
		reset,
		get path() {
			return configPath;
		},
		get isUsingDefaults() {
			return isUsingDefaults;
		},
	};
}

// ====================================
// Composable-like API
// ====================================

interface UseConfigReturn {
	config: Readonly<Config>;
	get: <K extends keyof Config>(
		key?: K,
	) => K extends string ? Config[K] : Config;
	update: (updates: DeepPartial<Config>) => Config;
	reset: () => Config;
	isUsingDefaults: boolean;
	path: string;
	defaults: Readonly<Config>;
}

const configManager = createConfigManager();

export const useConfig = (customPath?: string): UseConfigReturn => {
	const manager = customPath ? createConfigManager(customPath) : configManager;

	return {
		get config() {
			return manager.config;
		},
		get: manager.get,
		update: manager.update,
		reset: manager.reset,
		get isUsingDefaults() {
			return manager.isUsingDefaults;
		},
		get path() {
			return manager.path;
		},
		get defaults() {
			return defaultConfig;
		},
	};
};

// Utility type for config sections
type ConfigSection = keyof Config;

// Type-safe config getter
export function getConfigSection<T extends ConfigSection>(
	section: T,
	customPath?: string,
): Config[T] {
	const config = customPath ? createConfigManager(customPath) : configManager;
	return config.get(section) as Config[T];
}

// Type-safe config updater
export function updateConfigSection<T extends ConfigSection>(
	section: T,
	updates: DeepPartial<Config[T]>,
	customPath?: string,
): Config[T] {
	const config = customPath ? createConfigManager(customPath) : configManager;
	const current = config.get(section) as Config[T];
	const updated = deepMerge(current, updates);
	config.update({ [section]: updated } as unknown as DeepPartial<Config>);
	return updated as Config[T];
}

// Export types
export type {
	Config,
	CommitConfig,
	CommitType,
	AIConfig,
	BranchConfig,
	CheckoutConfig,
	LogConfig,
	StageConfig,
	MergeConfig,
	RebaseConfig,
	RemoteConfig,
	UseConfigReturn,
};
