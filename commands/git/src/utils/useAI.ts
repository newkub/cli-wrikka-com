export type AIProvider =
	| "openai"
	| "google"
	| "gemini"
	| "claude"
	| "mistral"
	| "llama"
	| "cohere";

export type ModelConfig = {
	id: string;
	name: string;
	provider: AIProvider;
	maxTokens: number;
	temperature: number;
	contextWindow: number;
};

export type UseAIOptions = {
	provider?: AIProvider;
	model?: string;
	apiKey?: string;
	temperature?: number;
	maxTokens?: number;
};

const DEFAULT_MODELS: Record<AIProvider, ModelConfig[]> = {
	openai: [
		{
			id: "gpt-4o",
			name: "GPT-4o",
			provider: "openai",
			maxTokens: 4096,
			temperature: 0.7,
			contextWindow: 128000,
		},
		{
			id: "gpt-4-turbo",
			name: "GPT-4 Turbo",
			provider: "openai",
			maxTokens: 4096,
			temperature: 0.7,
			contextWindow: 128000,
		},
		{
			id: "gpt-4",
			name: "GPT-4",
			provider: "openai",
			maxTokens: 2048,
			temperature: 0.7,
			contextWindow: 8192,
		},
		{
			id: "gpt-3.5-turbo",
			name: "GPT-3.5 Turbo",
			provider: "openai",
			maxTokens: 2048,
			temperature: 0.7,
			contextWindow: 4096,
		},
	],
	google: [
		{
			id: "gemini-1.5-pro",
			name: "Gemini 1.5 Pro",
			provider: "google",
			maxTokens: 8192,
			temperature: 0.7,
			contextWindow: 1048576,
		},
		{
			id: "gemini-1.5-flash",
			name: "Gemini 1.5 Flash",
			provider: "google",
			maxTokens: 8192,
			temperature: 0.7,
			contextWindow: 1048576,
		},
	],
	gemini: [],
	claude: [],
	mistral: [],
	llama: [],
	cohere: [],
};

export interface AIAPI {
	getModelConfig: (modelId: string) => ModelConfig | undefined;
	getAvailableModels: () => ModelConfig[];
	generateText: (prompt: string, modelId?: string) => Promise<string | null>;
	generateTextStream: (
		prompt: string,
		modelId?: string,
	) => AsyncGenerator<string, void, unknown>;
}

export function useAI(options: UseAIOptions = {}): AIAPI {
	const provider: AIProvider = options.provider || "openai";
	const models = DEFAULT_MODELS[provider];
	const defaultModel = models[0]?.id || "";

	const getModelConfig = (modelId: string): ModelConfig | undefined => {
		return models.find((m) => m.id === modelId) || models[0];
	};

	const getAvailableModels = (): ModelConfig[] => {
		return Object.values(DEFAULT_MODELS).flat();
	};

	const generateText = async (
		prompt: string,
		modelId: string = defaultModel,
	): Promise<string | null> => {
		const model = getModelConfig(modelId);
		if (!model) return null;

		// Ensure max_tokens doesn't exceed the model's context window
		const maxTokens = Math.min(
			options.maxTokens ?? model.maxTokens,
			model.contextWindow - 1000, // Leave some room for the prompt
		);

		try {
			const response = await fetch(
				"https://api.openai.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${options.apiKey || process.env.OPENAI_API_KEY}`,
					},
					body: JSON.stringify({
						model: model.id,
						messages: [{ role: "user", content: prompt }],
						temperature: options.temperature ?? model.temperature,
						max_tokens: maxTokens,
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error?.message || "Failed to generate text");
			}

			const data = await response.json();
			return data.choices[0]?.message?.content || null;
		} catch (error) {
			console.error("Failed to generate text:", error);
			return null;
		}
	};

	async function* generateTextStream(
		prompt: string,
		modelId: string = defaultModel,
	): AsyncGenerator<string, void, unknown> {
		const model = getModelConfig(modelId);
		if (!model) return; // Generator function completes without yielding null

		// Ensure max_tokens doesn't exceed the model's context window
		const maxTokens = Math.min(
			options.maxTokens ?? model.maxTokens,
			model.contextWindow - 1000, // Leave some room for the prompt
		);

		try {
			const response = await fetch(
				"https://api.openai.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${options.apiKey || process.env.OPENAI_API_KEY}`,
					},
					body: JSON.stringify({
						model: model.id,
						messages: [{ role: "user", content: prompt }],
						temperature: options.temperature ?? model.temperature,
						max_tokens: maxTokens,
						stream: true,
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					error.error?.message || "Failed to generate text stream",
				);
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error("Failed to read response stream");
			}

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					for (const line of chunk.split("\n")) {
						const trimmedLine = line.trim();
						if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

						if (trimmedLine.startsWith("data: ")) {
							const data = trimmedLine.replace(/^data: /, "");
							try {
								const parsed = JSON.parse(data);
								const content = parsed.choices[0]?.delta?.content;
								if (content) {
									yield content;
								}
							} catch (e) {
								console.error("Error parsing stream data:", e);
							}
						}
					}
				}
			} finally {
				reader.releaseLock();
			}
		} catch (error) {
			console.error("Failed to stream text:", error);
			return;
		}
	}

	const api: AIAPI = {
		getModelConfig,
		getAvailableModels,
		generateText,
		generateTextStream,
	};

	return api;
}
