import pc from "picocolors";
import useFzf from "@wrikka/tui";
import useGit from "../utils/useGit";
import { tryCatch, handleEither } from "../utils/Error";

type FzfOptions = {
    options: Array<{ value: string, label: string }>;
    multiple?: boolean;
};

export async function cherryPick() {
    const git = useGit();

    await handleEither(
        tryCatch(async () => {
            const logEntries = await git.getLogs(50);
            if (logEntries.length === 0) {
                console.log(pc.yellow("No commits found"));
                return;
            }

            const result = await useFzf({
                options: logEntries.map(entry => ({
                    value: entry,
                    label: entry,
                })),
                multiple: true,
            } as FzfOptions);

            const selected = Array.isArray(result) ? result : [result];

            if (selected.length === 0 || !selected[0]) {
                console.log(pc.yellow("No commits selected"));
                return;
            }

            const hashes = selected
                .filter((s): s is string => s !== null)
                .map(s => s.split(" - ")[0]);
            await git.execute(["cherry-pick", ...hashes]);
            console.log(pc.green(`✓ Successfully cherry-picked ${selected.length} commits`));
        }, { code: 'GIT_ERROR' })
    );
}