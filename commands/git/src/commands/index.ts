import { branch } from './branch';
import { checkout } from './checkout';
import { cherryPick } from './cherrypick';
import { commit } from './commit';
import { diff } from './diff';
import { fileHistory } from './fileHistory';
import { github } from './github';
import { hooks } from './hooks';
import { commitLog } from './commit-log';
import { rebase as rebaseCommand } from './rebase';
import { release } from './release';
import { remote } from './remote';
import { repo } from './repo';
import { stash } from './stash';
import { status } from './status';
import { tag } from './tag';
import { workspace } from './workspace';

export interface Command {
  value: string;
  label: string;
  hint: string;
  handler: () => Promise<unknown> | undefined;
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
    value: "commit-log",
    label: "📜 Commit Log",
    hint: "View and search commit history",
    handler: commitLog,
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
  {
    value: 'github',
    label: '🐙 GitHub',
    hint: 'GitHub integration commands',
    handler: github,
  },
  {
    value: 'cherry-pick',
    label: '🍒 Cherry Pick',
    hint: 'Apply changes from specific commits',
    handler: cherryPick,
  },
  {
    value: 'status',
    label: '📋 Status',
    hint: 'Show the working tree status',
    handler: status,
  },
];

export {
  branch, checkout, cherryPick, commit, diff, fileHistory, github,
  hooks, commitLog, rebaseCommand as rebase, release, remote, repo, stash, status, tag, workspace
};
