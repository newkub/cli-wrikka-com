import { select, text, isCancel, confirm } from "@clack/prompts";
import pc from "picocolors";
import useGit from "../utils/useGit";
import { tryCatch, handleEither } from "../utils/Error";

async function repo() {
  const git = useGit();

  await handleEither(
    tryCatch(async () => {
      const _action = await select({
        message: "Repository Management",
        options: [
          {
            value: "submodules",
            label: "📦 Submodules",
            hint: "Manage git submodules",
          },
          {
            value: "worktrees",
            label: "🌿 Worktrees",
            hint: "Manage git worktrees",
          },
          { value: "back", label: "🔙 Back", hint: "Return to main menu" },
        ],
      });

      if (_action === "submodules") {
        await manageSubmodules(git);
      } else if (_action === "worktrees") {
        await manageWorktrees(git);
      }
    }, { code: 'GIT_ERROR' })
  );
}

async function manageSubmodules(git: ReturnType<typeof useGit>) {
  await handleEither(
    tryCatch(async () => {
      const action = await select({
        message: "Submodules Management",
        options: [
          { value: "add", label: "➕ Add submodule", hint: "Add new submodule" },
          {
            value: "update",
            label: "🔄 Update submodules",
            hint: "Update all submodules",
          },
          {
            value: "list",
            label: "📋 List submodules",
            hint: "Show all submodules",
          },
          { value: "back", label: "🔙 Back", hint: "Return to previous menu" },
        ],
      });

      switch (action) {
        case "add":
          await addSubmodule(git);
          break;
        case "update":
          await updateSubmodules(git);
          break;
        case "list":
          await listSubmodules(git);
          break;
      }
    }, { code: 'GIT_ERROR' })
  );
}

async function manageWorktrees(git: ReturnType<typeof useGit>) {
  await handleEither(
    tryCatch(async () => {
      const action = await select({
        message: "Worktrees Management",
        options: [
          { value: "add", label: "➕ Add worktree", hint: "Create new worktree" },
          { value: "list", label: "📋 List worktrees", hint: "Show all worktrees" },
          {
            value: "remove",
            label: "🗑️ Remove worktree",
            hint: "Delete a worktree",
          },
          { value: "back", label: "🔙 Back", hint: "Return to previous menu" },
        ],
      });

      switch (action) {
        case "add":
          await addWorktree(git);
          break;
        case "list":
          await listWorktrees(git);
          break;
        case "remove":
          await removeWorktree(git);
          break;
      }
    }, { code: 'GIT_ERROR' })
  );
}

// Submodule helper functions
async function addSubmodule(git: ReturnType<typeof useGit>) {
  await handleEither(
    tryCatch(async () => {
      const url = await text({
        message: "Enter submodule URL:",
        validate: (value) => {
          if (!value) return "URL is required";
          if (!value.includes(".git") && !value.includes("github.com") && !value.includes("gitlab.com")) {
            return "Please enter a valid git repository URL";
          }
        },
      });

      if (isCancel(url)) return;

      const path = await text({
        message: "Enter submodule path:",
        validate: (value) => {
          if (!value) return "Path is required";
        },
      });

      if (isCancel(path)) return;

      try {
        const submodule = await git.addSubmodule(String(url), String(path));
        console.log(pc.green(`✓ Added submodule ${submodule.name} at ${submodule.path}`));
      } catch (error) {
        console.log(pc.red(`✗ Failed to add submodule: ${error}`));
      }
    }, { code: 'GIT_ERROR' })
  );
}

async function updateSubmodules(git: ReturnType<typeof useGit>) {
  await handleEither(
    tryCatch(async () => {
      try {
        console.log(pc.blue("Updating submodules..."));
        await git.updateSubmodules();
        console.log(pc.green("✓ All submodules updated successfully"));
      } catch (error) {
        console.log(pc.red(`✗ Failed to update submodules: ${error}`));
      }
    }, { code: 'GIT_ERROR' })
  );
}

async function listSubmodules(git: ReturnType<typeof useGit>) {
  await handleEither(
    tryCatch(async () => {
      try {
        const submodules = await git.getSubmodules();
        if (submodules.length === 0) {
          console.log(pc.yellow("No submodules found in this repository"));
          return;
        }

        console.log(pc.blue("\n📦 Submodules:"));
        for (const submodule of submodules) {
          console.log(`  ${pc.green(submodule.name)} - ${submodule.path} (${submodule.commit.substring(0, 8)})`);
        }
      } catch (error) {
        console.log(pc.red(`✗ Failed to list submodules: ${error}`));
      }
    }, { code: 'GIT_ERROR' })
  );
}

// Worktree helper functions
async function addWorktree(git: ReturnType<typeof useGit>) {
  await handleEither(
    tryCatch(async () => {
      const path = await text({
        message: "Enter worktree path:",
        validate: (value) => {
          if (!value) return "Path is required";
        },
      });

      if (isCancel(path)) return;

      const branch = await text({
        message: "Enter branch name:",
        validate: (value) => {
          if (!value) return "Branch name is required";
          if (!/^[\w\-/]+$/.test(value)) return "Invalid branch name";
        },
      });

      if (isCancel(branch)) return;

      const createBranch = await confirm({
        message: "Create new branch?",
        initialValue: true,
      });

      if (isCancel(createBranch)) return;

      try {
        const worktree = await git.addWorktree(String(path), String(branch), createBranch);
        console.log(pc.green(`✓ Added worktree at ${worktree.path} for branch ${worktree.branch}`));
      } catch (error) {
        console.log(pc.red(`✗ Failed to add worktree: ${error}`));
      }
    }, { code: 'GIT_ERROR' })
  );
}

async function listWorktrees(git: ReturnType<typeof useGit>) {
  await handleEither(
    tryCatch(async () => {
      try {
        const worktrees = await git.listWorktrees();
        if (worktrees.length === 0) {
          console.log(pc.yellow("No worktrees found"));
          return;
        }

        console.log(pc.blue("\n🌿 Worktrees:"));
        for (const worktree of worktrees) {
          const branchInfo = worktree.branch ? ` (${worktree.branch})` : worktree.head ? ` (${worktree.head.substring(0, 8)})` : "";
          console.log(`  ${pc.green(worktree.path)}${branchInfo}`);
        }
      } catch (error) {
        console.log(pc.red(`✗ Failed to list worktrees: ${error}`));
      }
    }, { code: 'GIT_ERROR' })
  );
}

async function removeWorktree(git: ReturnType<typeof useGit>) {
  await handleEither(
    tryCatch(async () => {
      try {
        const worktrees = await git.listWorktrees();
        if (worktrees.length <= 1) {
          console.log(pc.yellow("No additional worktrees to remove"));
          return;
        }

        const worktreeOptions = worktrees
          .filter((_, index) => index > 0) // Skip main worktree
          .map(worktree => ({
            value: worktree.path,
            label: worktree.path,
            hint: worktree.branch || worktree.head?.substring(0, 8) || "",
          }));

        const selectedPath = await select({
          message: "Select worktree to remove:",
          options: [
            ...worktreeOptions,
            { value: "back", label: "🔙 Back", hint: "Return to previous menu" },
          ],
        });

        if (selectedPath === "back") return;

        const force = await confirm({
          message: "Force removal? (removes even if worktree has uncommitted changes)",
          initialValue: false,
        });

        if (isCancel(force)) return;

        await git.removeWorktree(String(selectedPath), force);
        console.log(pc.green(`✓ Removed worktree ${String(selectedPath)}`));
      } catch (error: unknown) {
        console.log(pc.red(`✗ Failed to remove worktree: ${String(error ?? 'Unknown error')}`));
      }
    }, { code: 'GIT_ERROR' })
  );
}

export { repo };
