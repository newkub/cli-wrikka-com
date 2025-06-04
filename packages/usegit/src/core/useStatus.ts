import { ref, readonly } from 'vue';
import { execa } from 'execa';

export interface GitStatusEntry {
  status: string;
  file: string;
}

export function useGitStatus() {
  const statusEntries = ref<GitStatusEntry[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function getStatus(cwd: string): Promise<GitStatusEntry[]> {
    loading.value = true;
    try {
      const { stdout } = await execa('git', ["status", "--porcelain"], { cwd });
      statusEntries.value = stdout
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const status = line.substring(0, 2);
          const file = line.substring(3);
          return { status, file };
        });
      return statusEntries.value;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function isClean(cwd: string): Promise<boolean> {
    loading.value = true;
    try {
      const { stdout } = await execa('git', ["status", "--porcelain"], { cwd });
      return stdout.trim() === '';
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    statusEntries: readonly(statusEntries),
    loading: readonly(loading),
    error: readonly(error),
    getStatus,
    isClean
  };
}