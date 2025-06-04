import { text, isCancel, cancel, spinner, outro } from '@clack/prompts';
import { useAI } from '../utils/useAI';
import { consola } from 'consola';
import pc from 'picocolors';

export async function code() {
    try {
        const description = await text({
            message: 'Describe the code you want to generate',
            placeholder: 'A React component that fetches and displays user data',
            validate: (value: string) => {
                if (!value?.trim()) return 'Please enter a description';
            }
        });

        if (isCancel(description)) {
            cancel('Operation cancelled.');
            process.exit(0);
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            consola.warn('OPENAI_API_KEY not set. AI code generation is required.');
            return;
        }

        const ai = useAI({ apiKey });
        const loadingSpinner = spinner();
        loadingSpinner.start('Generating code');

        try {
            const response = await ai.generateText([{
                role: 'system',
                content: 'You are a code generation assistant. Respond ONLY with the code block, no explanations. Include all necessary imports and exports.'
            }, {
                role: 'user',
                content: description
            }]);

            let generatedCode = '';
            if (typeof response === 'string') {
                generatedCode = response;
            } else {
                // Handle streaming response
                for await (const chunk of response) {
                    generatedCode += chunk.choices[0]?.delta?.content || '';
                }
            }

            loadingSpinner.stop('Code generated');
            consola.log(pc.blue(generatedCode));
            outro(pc.green('✅ Code generated successfully!'));
        } catch (error) {
            loadingSpinner.stop('Failed to generate code');
            consola.error(`Generation Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    } catch (error) {
        consola.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}