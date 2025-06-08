import pc from "picocolors";
import * as p from "@clack/prompts";
import useGit from "../utils/useGit";
import { tryCatch, handleEither } from "../utils/Error";

type CherryPickOption = 'pick' | 'continue' | 'abort' | 'list' | 'edit' | 'no-commit' | 'quit';

interface CommitOption {
    value: string;
    label: string;
    hint?: string;
}

interface CherryPickAction {
    value: CherryPickOption;
    label: string;
}

export async function cherryPick() {
    const git = useGit();
    
    p.intro(pc.blue("🍒 Git Cherry-pick"));

    await handleEither(
        tryCatch(async () => {
            // Show available options
            const actionOptions: CherryPickAction[] = [
                { value: 'pick', label: 'Pick commits to cherry-pick' },
                { value: 'continue', label: 'Continue after resolving conflicts' },
                { value: 'abort', label: 'Abort current cherry-pick' },
                { value: 'list', label: 'List available commits' },
                { value: 'edit', label: 'Edit commit message before cherry-pick' },
                { value: 'no-commit', label: 'Cherry-pick without committing' },
                { value: 'quit', label: 'Quit cherry-pick' },
            ];

            const actionResult = await p.select({
                message: "Select an action:",
                options: actionOptions
            }) as CherryPickOption;

            if (p.isCancel(actionResult)) {
                p.cancel("Operation cancelled");
                process.exit(0);
            }

            const action = actionResult as CherryPickOption;

            // Handle different actions
            switch (action as CherryPickOption) {
                case 'quit':
                    p.outro(pc.blue("Cherry-pick operation cancelled"));
                    return;
                    
                case 'continue':
                    await git.execute(["cherry-pick", "--continue"]);
                    p.outro(pc.green("Successfully continued cherry-pick"));
                    return;
                    
                case 'abort':
                    await git.execute(["cherry-pick", "--abort"]);
                    p.outro(pc.yellow("Cherry-pick operation aborted"));
                    return;
                    
                case 'list':
                    // Will show commit list and exit
                    break;
                    
                case 'no-commit':
                case 'edit':
                    // These options will be applied to selected commits
                    break;
                    
                default:
                    // Continue with normal cherry-pick flow for 'pick' and other cases
                    break;
            }

            // Show loading spinner while fetching logs
            const logSpinner = p.spinner();
            logSpinner.start("Fetching commit history...");
            
            const logEntries = await git.getLogs(50);
            
            if (logEntries.length === 0) {
                logSpinner.stop("No commits found");
                p.outro(pc.yellow("No commits found in the repository"));
                return;
            }
            
            logSpinner.stop("Fetched commit history");
            
            // If action is just list, show commits and exit
            if (action === 'list') {
                p.note(
                    logEntries.join("\n"),
                    "Available Commits"
                );
                p.outro(pc.blue("Use 'pick' action to select commits to cherry-pick"));
                return;
            }

            // Format options for select prompt
            const commitOptions: CommitOption[] = logEntries.map((entry: string, index: number) => ({
                value: entry.split(" ")[0], // Extract commit hash
                label: entry,
                hint: `#${index + 1}`,
            }));
            
            // Add action-specific flags
            const cherryPickArgs: string[] = [];
            if (action === 'no-commit') {
                cherryPickArgs.push('--no-commit');
            } else if (action === 'edit') {
                cherryPickArgs.push('--edit');
            }

            // Show commit selector
            const selectedCommits = await p.multiselect({
                message: "Select commits to cherry-pick (use space to select, enter to confirm)",
                options: commitOptions,
                required: true,
            });

            if (p.isCancel(selectedCommits)) {
                p.cancel("Operation cancelled");
                process.exit(0);
            }

            const selectedCommitOptions = selectedCommits as unknown as CommitOption[];
            const commits = selectedCommitOptions.map(commit => commit.value);

            if (commits.length === 0) {
                p.outro(pc.yellow("No commits selected"));
                return;
            }

            // Show confirmation
            const confirm = await p.confirm({
                message: `Cherry-pick ${commits.length} commit(s)?`,
                initialValue: true,
            });

            if (confirm !== true) {
                p.outro(pc.yellow("Operation cancelled"));
                return;
            }

            // Execute git cherry-pick with loading spinner
            const cherryPickSpinner = p.spinner();
            cherryPickSpinner.start(`Cherry-picking ${commits.length} commit(s)...`);
            
            try {
                await git.execute(["cherry-pick", ...cherryPickArgs, ...commits]);
                cherryPickSpinner.stop(pc.green(`✓ Successfully cherry-picked ${commits.length} commit(s)`));
                p.outro(pc.green("Cherry-pick completed successfully!"));
            } catch (error: unknown) {
                cherryPickSpinner.stop(pc.red("Failed to cherry-pick"));
                
                // Log the error for debugging
                if (error instanceof Error) {
                    p.log.error(error.message);
                }
                
                const resolveConflict = await p.confirm({
                    message: "There was a conflict. Would you like to resolve it manually?",
                    initialValue: true,
                });

                if (resolveConflict) {
                    p.note(
                        'After resolving conflicts, run:\n' +
                        '- git cherry-pick --continue (to complete)\n' +
                        '- git cherry-pick --abort (to cancel)',
                        "How to resolve conflicts"
                    );
                    // Don't exit, let the user resolve conflicts
                    return;
                }
                
                await git.execute(["cherry-pick", "--abort"]);
                p.outro(pc.yellow("Cherry-pick aborted"));
                return;
            }
        }, { code: 'GIT_ERROR' })
    );
}
