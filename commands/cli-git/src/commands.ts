import { commit } from "./commands/commit";
import { hooks } from "./commands/hooks";
import { remote } from "./commands/remote";
import { repo } from "./commands/repo";
import { release } from "./commands/release";
import { workspace } from "./commands/workspace";
import { diff } from "./commands/diff";
import { branch } from "./commands/branch";
import { checkout } from "./commands/checkout";
import { log } from './commands/log';
import { stash } from './commands/stash';
import { rebaseCommand } from './commands/rebase';
import { tag } from './commands/tag';
import { fileHistory } from './commands/fileHistory';

export interface Command {
  value: string;
  label: string;
  hint: string;
  handler: () => Promise<void> | void;
}

export const COMMANDS: Command[] = [
  {
    value: "commit",
    label: "📝 Commit",
    hint: "Stage changes and create commits",
    handler: commit,
  },
  {
    value: "remote",
    label: "🌐 Remote",
    hint: "Manage remote repositories",
    handler: remote,
  },
  {
    value: "hooks",
    label: "🪝  Hooks",
    hint: "View and manage Git hooks",
    handler: hooks,
  },
  {
    value: "repo",
    label: "📁 Repo",
    hint: "Manage repository (submodules, worktrees)",
    handler: repo,
  },
  {
    value: "release",
    label: "🚀 Release",
    hint: "Create a new release (tag, GitHub release, npm publish)",
    handler: release,
  },
  {
    value: "workspace",
    label: "🗂️  Workspace",
    hint: "Manage workspace (create, delete, switch)",
    handler: workspace,
  },
  {
    value: "diff",
    label: "🔍 Diff",
    hint: "View git diff with split-diffs",
    handler: diff,
  },
  {
    value: "branch",
    label: "🌿 Branch",
    hint: "Manage branches (list, create, delete)",
    handler: branch,
  },
  {
    value: "checkout",
    label: "🔀 Checkout",
    hint: "Checkout branches or tags",
    handler: checkout,
  },
  {
    value: 'log',
    label: '📜 Log',
    hint: 'View commit history',
    handler: log,
  },
  {
    value: 'stash',
    label: '📦 Stash',
    hint: 'Manage stashes',
    handler: stash,
  },
  {
    value: 'rebase',
    label: '🔄 Rebase',
    hint: 'Perform git rebase operations',
    handler: rebaseCommand,
  },
  {
    value: 'tag',
    label: '🏷️ Tag',
    hint: 'Manage git tags',
    handler: tag,
  },
  {
    value: 'file-history',
    label: '📜 File History',
    hint: 'View file change history in browser',
    handler: fileHistory,
  },
];
