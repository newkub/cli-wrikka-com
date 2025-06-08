import { readFileSync } from 'fs';
import { join } from 'path';
import pc from 'picocolors';
import { COMMANDS } from '../commands';

// ฟังก์ชันแสดง help
export function showHelp() {
  // สร้างข้อความ help แบบที่สามารถคัดลอกได้ง่าย
  const helpText = [
    '',
    pc.bold('USAGE:'),
    '  git-cli <command> [options]',
    '',
    pc.bold('AVAILABLE COMMANDS:'),
    ...COMMANDS.map(cmd => `  ${pc.cyan(cmd.value.padEnd(15))} ${cmd.hint || ''}`),
    '',
    pc.bold('GLOBAL OPTIONS:'),
    `  ${pc.cyan('-h, --help')}     Show this help message`,
    `  ${pc.cyan('-v, --version')}  Show version information`,
    '',
    pc.dim('For more information about a command, try: git-cli <command> --help'),
    ''
  ].join('\n');

  console.log(helpText);
  process.exit(0);
}

// ฟังก์ชันแสดงเวอร์ชัน
export function showVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../../../package.json'), 'utf-8'));
    console.log(`${pkg.name} v${pkg.version}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error reading package.json:', error.message);
    }
    console.log('git-cli (version unknown)');
  }
  process.exit(0);
}
