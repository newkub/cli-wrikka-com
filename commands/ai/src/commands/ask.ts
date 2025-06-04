import { consola } from "consola";
import { useAI } from "../utils/useAI";
import * as clack from "@clack/prompts";

export const ask = async () => {
	try {
		// Get OpenAI API key from environment or prompt
		const apiKey =
			process.env.OPENAI_API_KEY ||
			((await clack.text({
				message: "Enter your OpenAI API key:",
				placeholder: "sk-...",
				validate: (value: string) => {
					if (!value) return "API key is required";
					if (!value.startsWith("sk-")) return "API key should start with sk-";
					return;
				},
			})) as string);

		// Initialize AI
		const ai = useAI({ apiKey });

		// Get user question
		const question = (await clack.text({
			message: "What would you like to ask?",
			validate: (value: string) => {
				if (!value) return "Question is required";
				return;
			},
		})) as string;

		consola.start("Thinking...");

		// Get AI response
		const response = await ai.generateText([
			{ role: "system", content: "You are a helpful AI assistant" },
			{ role: "user", content: question },
		]);

		consola.success("Response:");
		console.log(response);
	} catch (error) {
		if (error instanceof Error) {
			consola.error(error.message);
		}
		process.exit(1);
	}
};

// For testing directly
// ask().catch(console.error);
