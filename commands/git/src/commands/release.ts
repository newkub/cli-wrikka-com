import { intro, outro, select, isCancel, text, confirm, spinner } from "@clack/prompts";
import pc from "picocolors";
import { execa } from "execa";
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface PackageJson {
  name: string;
  version: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
}

// Simple semver increment functions
function incPatch(version: string): string {
  const [major, minor, patch] = version.split('.').map(Number) as [number, number, number];
  return `${major}.${minor}.${patch + 1}`;
}

function incMinor(version: string): string {
  const [major, minor] = version.split('.').map(Number) as [number, number];
  return `${major}.${minor + 1}.0`;
}

function incMajor(version: string): string {
  const [major] = version.split('.').map(Number) as [number];
  return `${major + 1}.0.0`;
}

function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

export async function getReleaseList() {
  try {
    const { stdout } = await execa("gh", ["release", "list", "--limit", "50"]);
    return stdout.split("\n").filter(Boolean);
  } catch (error) {
    console.error(pc.red("Failed to fetch releases:"), error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function listReleases() {
  try {
    const releases = await getReleaseList();
    if (releases.length === 0) {
      console.log(pc.yellow("No releases found in this repository."));
    } else {
      console.log(pc.blue("\nReleases:"));
      releases.forEach((release, index) => {
        console.log(`  ${index + 1}. ${release}`);
      });
    }
  } catch (error) {
    console.error(pc.red("Failed to list releases:"), error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function compareReleases(v1: string, v2: string) {
  try {
    await execa("gh", ["release", "view", v1, "--json", "body"], {
      stdio: "inherit",
    });
    await execa("gh", ["release", "view", v2, "--json", "body"], {
      stdio: "inherit",
    });
  } catch (error) {
    console.error(pc.red("Failed to compare releases:"), error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function rollbackRelease(version: string) {
  try {
    await execa("git", ["checkout", `tags/${version}`]);
    console.log(pc.green(`Rolled back to version ${version}`));
  } catch (error) {
    console.error(pc.red("Failed to rollback release:"), error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function getReleaseNotes(version: string) {
  try {
    const { stdout } = await execa("gh", [
      "release",
      "view",
      version,
      "--json",
      "body",
    ]);
    console.log(pc.blue(`\nRelease notes for ${version}:`));
    console.log(stdout);
  } catch (error) {
    console.error(pc.red("Failed to get release notes:"), error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function createTag() {
  const tagName = await text({
    message: "Enter tag name:",
    validate: (value: unknown) => {
      if (typeof value !== 'string') return "Tag name must be a string";
      if (!value) return "Tag name is required";
      if (!/^[\w.-]+$/i.test(value)) return "Invalid tag name";
    },
  });

  if (isCancel(tagName) || typeof tagName !== 'string') {
    console.error(pc.red('❌ Tag name is required'));
    return;
  }

  const tagMessage = await text({
    message: "Enter tag message (optional):",
  });

  if (isCancel(tagMessage)) {
    console.log(pc.yellow('❌ Tag creation canceled'));
    return;
  }

  try {
    const args = ["tag", "-a", tagName];
    if (tagMessage && typeof tagMessage === 'string') {
      args.push("-m", tagMessage);
    }
    await execa("git", args, { stdio: "inherit" });
    console.log(pc.green(`✅ Successfully created tag ${tagName}`));
  } catch (error) {
    console.error(pc.red("❌ Failed to create tag:"), error instanceof Error ? error.message : error);
  }
}

async function getNextVersion(currentVersion: string): Promise<string> {
  const patchVer = incPatch(currentVersion);
  const minorVer = incMinor(currentVersion);
  const majorVer = incMajor(currentVersion);

  const version = await select({
    message: 'เลือกการอัพเวอร์ชัน:',
    options: [
      { value: patchVer, label: `Patch (${currentVersion} -> ${patchVer}) - For bug fixes` },
      { value: minorVer, label: `Minor (${currentVersion} -> ${minorVer}) - For new features` },
      { value: majorVer, label: `Major (${currentVersion} -> ${majorVer}) - For breaking changes` },
      { value: 'custom', label: 'Custom version' },
    ],
  });

  if (version === 'custom') {
    const customVersion = await text({
      message: 'Enter version number (format: x.y.z):',
      validate: (value) => {
        if (!isValidVersion(value)) {
          return 'Please enter a valid version number (e.g., 1.0.0)';
        }
        if (compareVersions(value, currentVersion) <= 0) {
          return `Version must be greater than ${currentVersion}`;
        }
        return undefined;
      },
    });
    return customVersion as string;
  }

  return version as string;
}

async function updatePackageVersion(version: string) {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
  pkg.version = version;
  writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}
`);
}

async function getChangelog(version: string): Promise<string> {
  try {
    // ใช้ git log เพื่อดึง commit ล่าสุดจนถึง tag ก่อนหน้า
    const { stdout: lastTag } = await execAsync('git describe --tags --abbrev=0');
    const { stdout: commits } = await execAsync(`git log --pretty=format:"%h %s" ${lastTag.trim()}..HEAD`);
    
    if (!commits.trim()) {
      return `## ${version}\n\n- No changes`;
    }

    const commitLines = commits
      .split('\n')
      .filter(line => line.trim())
      .map(line => `- ${line}`)
      .join('\n');

    return `## ${version}\n\n${commitLines}`;
  } catch (error) {
    if (error instanceof Error) {
      console.error(pc.yellow(`⚠️  Failed to get commit history: ${error.message}`));
    }
    return `## ${version}\n\n- Initial release`;
  }
}

export async function releaseNewVersion() {
  const s = spinner();
  
  try {
    // 1. ตรวจสอบ git status
    s.start('Checking git status');
    const { stdout: gitStatus } = await execAsync('git status --porcelain');
    if (gitStatus) {
      const hasUncommittedChanges = await confirm({
        message: 'Found uncommitted changes. Would you like to commit them first?',
        initialValue: true
      });
      
      if (hasUncommittedChanges) {
        const commitMessage = await text({
          message: 'Enter commit message:',
          validate: (value) => value ? undefined : 'Commit message is required'
        });
        
        if (isCancel(commitMessage)) return;
        
        await execa('git', ['add', '.']);
        await execa('git', ['commit', '-m', commitMessage]);
      } else {
        console.log(pc.yellow('⚠️  You have uncommitted changes which may affect the release'));
      }
    }
    s.stop('✅ Git check completed');

    // 2. ดึงข้อมูลเวอร์ชันปัจจุบัน
    s.start('Reading current version');
    const packageJsonPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
    const currentVersion = pkg.version;
    s.stop(`✅ Current version: ${currentVersion}`);

    // 3. ถามเวอร์ชันใหม่
    const nextVersion = await getNextVersion(currentVersion);
    if (isCancel(nextVersion)) {
      outro('ยกเลิกการสร้าง release');
      return;
    }

    // 4. ยืนยันการสร้าง release
    const proceed = await confirm({
      message: `Are you sure you want to create release version ${nextVersion}?`,
      initialValue: true
    });
    
    if (!proceed || isCancel(proceed)) {
      outro('ยกเลิกการสร้าง release');
      return;
    }

    // 5. อัพเดท package.json
    s.start(`Updating version to ${nextVersion}`);
    await updatePackageVersion(nextVersion);
    s.stop('✅ Version updated');

    // 6. Create new commit for this version
    s.start('Creating version commit');
    await execa('git', ['add', 'package.json']);
    await execa('git', ['commit', '-m', `chore(release): v${nextVersion}`]);
    s.stop('✅ Commit created');

    // 7. Create git tag
    s.start('Creating git tag');
    await execa('git', ['tag', `v${nextVersion}`, '-m', `Release v${nextVersion}`]);
    s.stop('✅ Tag created');

    // 8. Create GitHub release
    s.start('Creating GitHub release');
    const changelog = await getChangelog(nextVersion);
    await execa('gh', [
      'release', 
      'create', 
      `v${nextVersion}`, 
      '--title', `v${nextVersion}`, 
      '--notes', changelog
    ]);
    s.stop('✅ GitHub release created');

    // 9. Push to remote
    s.start('Pushing to remote');
    await execa('git', ['push', '--follow-tags']);
    s.stop('✅ Pushed to remote');

    outro(pc.green(`🎉  Successfully released version ${nextVersion}!`));
  } catch (error) {
    s.stop('❌ Error');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(pc.red(`❌ Failed to create release: ${errorMessage}`));
    process.exit(1);
  }
}

export async function manageReleases() {
  intro(pc.bgBlue(pc.white(" Release Management ")));

  try {
    const action = await select({
      message: "Select release action:",
      options: [
        { value: "new", label: "🚀 Release New Version", hint: "Create a new release" },
        { value: "list", label: "📋 List Releases", hint: "Show all releases" },
        { value: "compare", label: "🔍 Compare Releases", hint: "Compare two versions" },
        { value: "rollback", label: "⏪ Rollback Release", hint: "Checkout a specific version" },
        { value: "notes", label: "📝 View Release Notes", hint: "Show notes for a version" },
        { value: "createTag", label: "🏷️ Create Tag", hint: "Create a new tag" },
      ],
    });

    if (isCancel(action)) return;

    switch (action) {
      case "new": {
        await releaseNewVersion();
        break;
      }
      case "list": {
        await listReleases();
        break;
      }
      case "compare": {
        const releases = await getReleaseList();
        if (releases.length === 0) {
          console.log(pc.yellow("No releases found to compare."));
          break;
        }

        const releaseOptions = releases.map((release, index) => ({
          value: release.split("\t")[0],
          label: release,
          hint: `v${index + 1}`
        }));

        const v1 = await select({
          message: "Select first version:",
          options: releaseOptions,
        });
        if (isCancel(v1)) return;

        const v2 = await select({
          message: "Select second version:",
          options: releaseOptions.filter(opt => opt.value !== v1),
        });
        if (isCancel(v2)) return;

        await compareReleases(v1, v2);
        break;
      }
      case "rollback": {
        const version = await text({ message: "Enter version to rollback to:" });
        if (isCancel(version)) return;
        await rollbackRelease(version);
        break;
      }
      case "notes": {
        const ver = await text({ message: "Enter version:" });
        if (isCancel(ver)) return;
        await getReleaseNotes(ver);
        break;
      }
      case "createTag": {
        await createTag();
        break;
      }
    }
  } finally {
    outro("Done");
  }
}

export async function release() {
  await manageReleases();
}
