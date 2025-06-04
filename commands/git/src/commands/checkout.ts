import { execa } from 'execa';
import * as clack from '@clack/prompts';
import useGit from "../utils/useGit";

export async function checkout() {
  const git = useGit();
  const gitRoot = process.cwd(); // Get current working directory as git root

  try {
    // ตรวจสอบ branch ทั้งหมด
    const { stdout: branchesOutput = '' } = await git.execute(['branch', '-a']);
    const branches = branchesOutput
      .split('\n')
      .map(b => b.replace('*', '').trim())
      .filter((b): b is string => b.length > 0);

    // ตรวจสอบ tags
    const { stdout: tagsOutput = '' } = await execa('git', ['tag'], { cwd: gitRoot });
    const tags = tagsOutput.split('\n').filter((t): t is string => t.length > 0);

    // สร้าง options สำหรับเลือก
    const options = [
      ...branches.map(b => ({ value: b, label: `🌿 Branch: ${b}` })),
      ...tags.map(t => ({ value: t, label: `🏷️ Tag: ${t}` }))
    ];

    if (options.length === 0) {
      clack.outro('No branches or tags found');
      return;
    }

    const target = await clack.select({
      message: 'Select branch or tag to checkout',
      options,
    });

    if (clack.isCancel(target)) {
      clack.cancel('Operation cancelled');
      return;
    }

    const spinner = clack.spinner();
    spinner.start(`Checking out ${target}`);

    await execa('git', ['checkout', target as string], {
      stdio: 'inherit',
      cwd: gitRoot
    });

    spinner.stop(`✅ Successfully checked out ${target}`);

  } catch (error: unknown) {
    const spinner = clack.spinner();
    spinner.stop('❌ Checkout failed');
    if (error instanceof Error) {
      clack.outro(`Error: ${error.message}`);
    } else {
      clack.outro('Error during checkout');
    }
    process.exit(1);
  }
}