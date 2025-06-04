import OpenAI from "openai";
import { consola } from "consola";

type AIConfig = {
	apiKey: string;
	defaultModel?: string;
	defaultTemperature?: number;
};

type GenerateTextResult = string | AsyncIterable<OpenAI.ChatCompletionChunk>;

export const useAI = (config: AIConfig) => {
	const openai = new OpenAI({
		apiKey: config.apiKey,
	});

	const generateText = async (
		messages: OpenAI.ChatCompletionMessageParam[],
		options?: {
			model?: string;
			temperature?: number;
			stream?: boolean;
		},
	): Promise<GenerateTextResult> => {
		try {
			const response = await openai.chat.completions.create({
				model: options?.model || config.defaultModel || "gpt-4",
				messages,
				temperature: options?.temperature || config.defaultTemperature || 0.7,
				stream: options?.stream,
			});

			if (options?.stream) {
				return response as AsyncIterable<OpenAI.ChatCompletionChunk>;
			}
			return (
				(response as OpenAI.ChatCompletion).choices[0]?.message?.content || ""
			);
		} catch (error) {
			consola.error("AI request failed:", error);
			throw error;
		}
	};

	return {
		generateText,
	};
};

// Example usage:
// const ai = useAI({ apiKey: 'your-key' });
// const response = await ai.generateText([{ role: 'user', content: 'Hello' }]);
