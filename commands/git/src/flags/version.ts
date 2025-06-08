import { readFileSync } from 'fs';
import { join } from 'path';

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
