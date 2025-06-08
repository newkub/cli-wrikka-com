import open from 'open';

/**
 * เปิดหน้า GitHub Issues ของโปรเจกต์ในเบราว์เซอร์
 */
export async function handleIssue() {
  const GITHUB_ISSUES_URL = 'https://github.com/newkub/cli-wrikka-com/issues';
  
  try {
    console.log('Opening GitHub Issues in your browser...');
    await open(GITHUB_ISSUES_URL);
    console.log('Successfully opened GitHub Issues');
  } catch (error) {
    console.error('Failed to open GitHub Issues:', error);
    process.exit(1);
  }
}
