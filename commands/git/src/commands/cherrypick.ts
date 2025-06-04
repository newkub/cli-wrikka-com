import pc from "picocolors";
import { useFzf } from "@wrikka/tui";
import useGit from "../utils/useGit";
import { tryCatch, handleEither } from "../utils/Error";

export async function cherryPick() {
    const git = useGit();
    const fzf = useFzf();

    await handleEither(
        tryCatch(async () => {
            const logEntries = await git.getLogs(50);
            if (logEntries.length === 0) {
                console.log(pc.yellow("No commits found"));
                return;
            }

            // Create options for FZF selection
            const options = logEntries.map(entry => ({
                label: entry,
                value: entry,
            }));

            // Show FZF selector
            const result = await fzf.runFzf(options, { multi: true });
            
            if (!result) {
                console.log(pc.yellow("No commits selected"));
                return;
            }

            // Process selected commits
            const selected = Array.isArray(result) ? result : [result];
            
            if (selected.length === 0) {
                console.log(pc.yellow("No commits selected"));
                return;
            }

            // Extract commit hashes (assuming format is "hash - message")
            const hashes = selected
                .filter((s): s is string => typeof s === 'string')
                .map(s => s.split(" ")[0]) // Get the hash part
                .filter(Boolean); // Remove any empty strings

            if (hashes.length === 0) {
                console.log(pc.yellow("No valid commit hashes found"));
                return;
            }

            // Execute git cherry-pick
            await git.execute(["cherry-pick", ...hashes]);
            console.log(pc.green(`✓ Successfully cherry-picked ${hashes.length} commits`));
        }, { code: 'GIT_ERROR' })
    );
}