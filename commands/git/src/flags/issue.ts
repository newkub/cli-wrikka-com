/**
 * เปิดหน้า GitHub Issues ของโปรเจกต์ในเบราว์เซอร์
 */
export async function handleIssue() {
  const GITHUB_ISSUES_URL = 'https://github.com/newkub/cli-wrikka-com/issues';
  
  try {
    console.log('Opening GitHub Issues in your browser...');
    
    // ตรวจสอบระบบปฏิบัติการและใช้คำสั่งที่เหมาะสม
    const { platform } = process;
    let command: string[] = [];
    
    if (platform === 'win32') {
      command = ['cmd', '/c', 'start', GITHUB_ISSUES_URL];
    } else if (platform === 'darwin') {
      command = ['open', GITHUB_ISSUES_URL];
    } else {
      command = ['xdg-open', GITHUB_ISSUES_URL];
    }
    
    const browserProcess = Bun.spawn({
      cmd: command,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    
    await browserProcess.exited;
    console.log('Successfully opened GitHub Issues');
  } catch (error) {
    console.error('Failed to open GitHub Issues:', error);
    console.log(`Please visit manually: ${GITHUB_ISSUES_URL}`);
    process.exit(1);
  }
}
