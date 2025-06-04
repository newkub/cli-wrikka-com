import { createServer } from 'vite'
import { join } from 'path'
import * as p from '@clack/prompts'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function getGitFiles() {
  try {
    const files = execSync('git ls-files', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean)
    return files
  } catch (error) {
    console.error('Error getting git files:', error)
    process.exit(1)
  }
}

export async function fileHistory() {
  p.intro('📜 Git File History Viewer')
  
  try {
    const files = await getGitFiles()
    
    const selectedFile = await p.select({
      message: 'Select a file to view its history',
      options: files.map(file => ({
        value: file,
        label: file,
      })),
    }) as string

    p.note(selectedFile, 'Selected file')
    
    const server = await createServer({
      configFile: join(__dirname, 'vite.config.ts'),
      server: {
        port: 5173,
        open: true
      },
      define: {
        'import.meta.env.SELECTED_FILE': JSON.stringify(selectedFile)
      }
    })
    
    await server.listen()
    server.printUrls()
    
    // Keep the process running
    return new Promise(() => {})
    
  } catch (error) {
    if (p.isCancel(error)) {
      p.cancel('Operation cancelled')
      process.exit(0)
    } else {
      console.error('Error:', error)
      process.exit(1)
    }
  }
}