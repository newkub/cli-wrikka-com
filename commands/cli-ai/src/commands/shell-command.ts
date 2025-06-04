import * as clack from "@clack/prompts";
import { consola } from "consola";
import { useDetection } from "../utils/useDetection";
import { useAI } from "../utils/useAI";
import { execa } from "execa";

export async function shellCommand() {
    const { env, shell } = useDetection();
    
    const input = await clack.text({
        message: `What would you like to do? (Detected: ${env.value.os}, ${env.value.shell})`,
        placeholder: "Delete package.json",
    });

    if (clack.isCancel(input)) {
        clack.cancel("Operation cancelled.");
        process.exit(0);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        consola.warn("OPENAI_API_KEY not set. AI command generation is required.");
        return;
    }

    const ai = useAI({ apiKey });
    const spinner = clack.spinner();
    spinner.start("Generating command with AI");

    try {
        const response = await ai.generateText([{
            role: "system",
            content: `You are a shell command generator. The user is on ${env.value.os} using ${env.value.shell}. Respond ONLY with the shell command, no explanations.`
        }, {
            role: "user",
            content: input
        }]);

        let command = input;
        if (typeof response === 'string') {
            command = response;
        } else {
            // Handle streaming response
            let fullResponse = '';
            for await (const chunk of response) {
                fullResponse += chunk.choices[0]?.delta?.content || '';
            }
            command = fullResponse;
        }
        spinner.stop("Command generated");

        // Add shell-specific prefixes if needed
        if (shell.isPowerShell.value && command.startsWith('rm')) {
            command = command.replace('rm', 'Remove-Item');
        }

        // Execute command directly without confirmation
        const execSpinner = clack.spinner();
        execSpinner.start("Executing command");
        
        try {
            const childProcess = execa(command, {
                stdio: 'inherit',
                shell: true
            });
            
            const { exitCode } = await childProcess;
            execSpinner.stop(`Command exited with code ${exitCode}`);
            process.exit(exitCode || 0);
        } catch (error) {
            execSpinner.stop("Failed to execute command");
            consola.error(`Execution Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    } catch (error) {
        spinner.stop("Failed to generate command");
        consola.error(`AI Error: ${error instanceof Error ? error.message : String(error)}`);
    }
}