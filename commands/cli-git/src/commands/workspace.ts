import { select, isCancel, text } from "@clack/prompts";
import pc from "picocolors";
import useGit from "../utils/useGit";
import { tryCatch, handleEither } from "../utils/Error";

interface GitStatusItem {
  file: string;
  status: string;
}

async function workspace() {
  const git = useGit();

  await handleEither(
    tryCatch(async () => {
      const action = await select({
        message: "What would you like to do?",
        options: [
          {
            value: "stage",
            label: "Stage files",
            hint: "Add files to staging area",
          },
          {
            value: "unstage",
            label: "Unstage files",
            hint: "Remove files from staging area",
          },
          {
            value: "checkout",
            label: "Checkout",
            hint: "Switch branches or restore files",
          },
          { value: "branch", label: "Branch", hint: "Create or manage branches" },
        ],
      });

      if (isCancel(action)) return;

      switch (action) {
        case "stage": {
          const status = await git.status();
          const unstaged = status
            .filter((item: GitStatusItem) => item.status.trim() !== "")
            .map((item) => item.file);

          if (unstaged.length === 0) {
            console.log(pc.yellow("No files to stage"));
            return;
          }

          const selected = await select({
            message: "Select files to stage",
            options: unstaged.map((file) => ({ value: file, label: file })),
          });

          if (selected && !isCancel(selected)) {
            await git.stageFiles([selected as string]);
            console.log(pc.green(`Staged file '${selected}'`));
          }
          break;
        }

        case "unstage": {
          const stagedFiles = (await git.status())
            .filter(
              (item: GitStatusItem) =>
                item.status.includes("M") || item.status.includes("A"),
            )
            .map((item) => item.file);

          if (stagedFiles.length === 0) {
            console.log(pc.yellow("No files are staged"));
            return;
          }

          const selected = await select({
            message: "Select files to unstage",
            options: stagedFiles.map((file) => ({ value: file, label: file })),
          });

          if (selected && !isCancel(selected)) {
            await git.unstageFiles([selected as string]);
            console.log(pc.green(`Unstaged file '${selected}'`));
          }
          break;
        }

        case "checkout":
          await handleCheckout();
          break;

        case "branch": {
          const branchAction = await select({
            message: "Branch operation",
            options: [
              { value: "create", label: "Create branch" },
              { value: "delete", label: "Delete branch" },
            ],
          });

          if (branchAction === "create") {
            await handleBranchCreate();
          } else if (branchAction === "delete") {
            await handleBranchDelete();
          }
          break;
        }
      }
    }, { code: 'GIT_ERROR' })
  );
}

const handleCheckout = async (): Promise<void> => {
  const git = useGit();

  await handleEither(
    tryCatch(async () => {
      const { branches } = await git.getBranches();
      const filtered = branches.filter((branch: string) => branch !== "* ");

      if (filtered.length === 0) return;

      const selected = await select({
        message: "Select branch to checkout:",
        options: filtered.map((branch) => ({ value: branch, label: branch })),
      });

      if (selected && !isCancel(selected)) {
        await git.execute(["checkout", selected as string]);
        console.log(pc.green(`Switched to branch '${selected}'`));
      }
    }, { code: 'GIT_ERROR' })
  );
};

const handleBranchCreate = async (): Promise<void> => {
  const git = useGit();

  await handleEither(
    tryCatch(async () => {
      const branchName = (await text({
        message: "Enter new branch name:",
        validate: (value: string): string | undefined => {
          if (!value.trim()) return "Branch name cannot be empty";
          return undefined;
        },
      })) as string;

      if (branchName) {
        await git.execute(["checkout", "-b", branchName]);
        console.log(pc.green(`Created branch '${branchName}'`));
      }
    }, { code: 'GIT_ERROR' })
  );
};

const handleBranchDelete = async (): Promise<void> => {
  const git = useGit();

  await handleEither(
    tryCatch(async () => {
      const { branches } = await git.getBranches();
      const filtered = branches.filter((branch: string) => !branch.includes("* "));

      if (filtered.length === 0) {
        console.log(pc.yellow("No branches available to delete"));
        return;
      }

      const selected = await select({
        message: "Select branch to delete:",
        options: filtered.map((branch) => ({ value: branch, label: branch })),
      });

      if (selected && !isCancel(selected)) {
        await git.execute(["branch", "-d", selected as string]);
        console.log(pc.green(`Deleted branch '${selected}'`));
      }
    }, { code: 'GIT_ERROR' })
  );
};

export { workspace };
