import { executeGitCommand } from '../utils/useGit';
import pc from 'picocolors';
import { multiselect } from '@clack/prompts';

type ColorFn = (text: string) => string;
type StatusCode = 'M' | 'A' | 'D' | 'R' | 'C' | 'U' | '?' | '!!';

interface StatusStyle {
  color: ColorFn;
  icon: string;
  label: string;
}

const STATUS_STYLES: Record<StatusCode, StatusStyle> = {
  'M': { color: pc.yellow, icon: '✏️',  label: 'modified' },
  'A': { color: pc.green,  icon: '🆕',  label: 'added' },
  'D': { color: pc.red,    icon: '🗑️ ', label: 'deleted' },
  'R': { color: pc.blue,   icon: '🔄',  label: 'renamed' },
  'C': { color: pc.cyan,   icon: '📋',  label: 'copied' },
  'U': { color: pc.magenta,icon: '⚠️',  label: 'unmerged' },
  '?': { color: pc.gray,   icon: '❓',  label: 'untracked' },
  '!!':{ color: pc.gray,   icon: '👁️',  label: 'ignored' }
} as const;

const createBox = (text: string, color: ColorFn): string => {
  const line = '─'.repeat(text.length + 4);
  return [
    `┌${line}┐`,
    `│  ${text}  │`,
    `└${line}┘`
  ].map(line => color(line)).join('\n');
};

const parseGitStatus = (line: string): { status: string; file: string } => {
  const statusCode = line.substring(0, 2).trim() as StatusCode;
  const file = line.substring(3);
  const style = STATUS_STYLES[statusCode] || { color: pc.gray, icon: ' ', label: 'unknown' };
  
  return {
    status: style.color(`${style.icon} ${style.label.padEnd(10)}`),
    file: style.color(file)
  };
};

export async function status() {
  try {
    const result = await executeGitCommand(['status', '--porcelain']);
    
    if (!result?.trim()) {
      console.log(createBox('✓ Working tree clean', pc.green));
      return;
    }

    const changes = result
      .split('\n')
      .filter(Boolean)
      .map(parseGitStatus);

    if (changes.length === 0) {
      console.log(createBox('✓ Working tree clean', pc.green));
      return;
    }

    console.log(pc.bold('Changes:'));
    console.log(pc.dim('(use "git restore <file>..." to discard changes in working directory)'));
    console.log(pc.dim('(use "git add <file>..." to update what will be committed)\n'));
    
    const maxStatusLength = Math.max(...changes.map(c => c.status.length));
    
    // สร้าง options สำหรับ multi-select โดยรวมข้อมูลสถานะเข้าไปใน label
    const options = changes.map(({ status, file }, index) => ({
      value: file,
      label: `${status.padEnd(maxStatusLength)}  ${file}`,
      hint: `(${index + 1})`,
    }));
    
    // ถามผู้ใช้เลือกไฟล์ที่ต้องการจัดการ
    const selectedFiles = (await multiselect({
      message: 'Select files to stage (use space to select, enter to confirm):',
      options,
      required: false,
    })) as string[];

    if (selectedFiles && selectedFiles.length > 0) {
      // เพิ่มไฟล์ที่เลือกเข้า stage
      await executeGitCommand(['add', ...selectedFiles]);
      console.log(`\n${pc.green('✓')} Staged ${selectedFiles.length} files`);
      
      // แสดงสถานะหลังจาก stage แล้ว
      await status();
    } else {
      console.log('\nNo files selected');
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'An unknown error occurred');
  }
}
