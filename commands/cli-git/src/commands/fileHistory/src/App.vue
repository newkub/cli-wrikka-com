<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { TransitionGroup } from 'vue'

interface Commit {
  hash: string
  author: string
  date: string
  message: string
  diff: string
  changes?: string
}

const selectedFile = import.meta.env.SELECTED_FILE
const commits = ref<Commit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedCommit = ref<Commit | null>(null)
const viewMode = ref<'split' | 'unified'>('split')

const executeCommand = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const { exec } = require('child_process')
      exec(cmd, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      }, (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error('Command failed:', { cmd, error, stderr })
          reject(new Error(stderr || error.message))
        } else {
          resolve(stdout)
        }
      })
    } catch (err) {
      console.error('Command execution error:', err)
      reject(err)
    }
  })
}

const getGitHistory = async () => {
  try {
    loading.value = true
    error.value = null
    
    if (!selectedFile) {
      error.value = 'No file selected.'
      return
    }
    
    // First, verify git is available and we're in a git repo
    try {
      await executeCommand('git rev-parse --is-inside-work-tree')
    } catch (e) {
      error.value = 'Not a git repository. Please run this command inside a git repository.'
      return
    }
    
    // Get commit history for the selected file
    const cmd = `git log --follow --pretty=format:'%H|%an|%ad|%s' --date=short -- "${selectedFile}"`
    const output = await executeCommand(cmd)
    
    if (!output) {
      error.value = 'No history found for this file.'
      return
    }
    
    // Parse commit history
    const commitLines = output.trim().split('\n').filter(Boolean)
    
    // Process commits in batches to avoid overwhelming the system
    const batchSize = 5
    const allCommits: Commit[] = []
    
    for (let i = 0; i < commitLines.length; i += batchSize) {
      const batch = commitLines.slice(i, i + batchSize)
      const batchPromises = batch.map(async line => {
        try {
          const [hash, author, date, ...messageParts] = line.split('|')
          const message = messageParts.join('|')
          
          // Get the diff for this commit
          let diff = ''
          let changes = ''
          
          try {
            // Get the full diff
            diff = await executeCommand(`git show ${hash} -- "${selectedFile}"`)
            
            // Get the changes in a more readable format
            changes = await executeCommand(`git show ${hash} --pretty=format: --unified=0 -- "${selectedFile}"`)
          } catch (e) {
            console.error(`Error getting diff for commit ${hash}:`, e)
          }
          
          return {
            hash: hash.substring(0, 7),
            fullHash: hash,
            author,
            date,
            message,
            diff,
            changes
          }
        } catch (e) {
          console.error('Error processing commit:', e)
          return null
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      allCommits.push(...batchResults.filter(Boolean) as Commit[])
      
      // Update UI after each batch
      if (allCommits.length > 0) {
        commits.value = [...allCommits]
        if (!selectedCommit.value) {
          selectedCommit.value = allCommits[0]
        }
      }
    }
    
    // Final update with all commits
    commits.value = allCommits
    if (commits.value.length > 0 && !selectedCommit.value) {
      selectedCommit.value = commits.value[0]
    }
    
  } catch (err) {
    console.error('Error in getGitHistory:', err)
    error.value = `Failed to load git history: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    loading.value = false
  }
}

const selectCommit = (commit: Commit) => {
  selectedCommit.value = commit
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'split' ? 'unified' : 'split'
}

interface LineInfo {
  type: 'addition' | 'removal' | 'context' | 'marker'
  content: string
  oldLine?: number | null
  newLine?: number | null
  hasChanges?: boolean
}

const formatDiff = (diff: string) => {
  if (!diff) return '<div class="p-4 text-gray-500">No changes in this commit</div>'
  
  const lines = diff.split('\n')
  const lineInfo: LineInfo[] = []
  let oldLineNumber = 0
  let newLineNumber = 0
  let inHunk = false
  
  // First pass: parse the diff and extract line information
  for (const line of lines) {
    // Skip diff headers
    if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
      continue
    }
    
    // Handle hunk headers
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/)
      if (match) {
        oldLineNumber = parseInt(match[1]) - 1
        newLineNumber = parseInt(match[3]) - 1
        inHunk = true
        lineInfo.push({
          type: 'marker',
          content: line,
          oldLine: null,
          newLine: null
        })
        continue
      }
    }
    
    if (!inHunk) continue
    
    let type: LineInfo['type'] = 'context'
    let content = line
    let hasChanges = false
    
    if (line.startsWith('+') && !line.startsWith('+++')) {
      type = 'addition'
      content = line.substring(1)
      newLineNumber++
      hasChanges = true
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      type = 'removal'
      content = line.substring(1)
      oldLineNumber++
      hasChanges = true
    } else {
      // Context line
      content = line.startsWith(' ') ? line.substring(1) : line
      oldLineNumber++
      newLineNumber++
    }
    
    lineInfo.push({
      type,
      content,
      oldLine: type === 'addition' ? null : oldLineNumber,
      newLine: type === 'removal' ? null : newLineNumber,
      hasChanges
    })
  }
  
  // Second pass: generate HTML based on view mode
  if (viewMode.value === 'unified') {
    return generateUnifiedView(lineInfo)
  } else {
    return generateSplitView(lineInfo)
  }
}

const generateUnifiedView = (lines: LineInfo[]) => {
  let output = '<div class="unified-view">'
  
  lines.forEach((line, index) => {
    if (line.type === 'marker') {
      output += `<div class="hunk-header">${escapeHtml(line.content)}</div>`
      return
    }
    
    const lineClass = `line ${line.type} ${line.hasChanges ? 'has-changes' : ''}`.trim()
    const lineNumber = line.newLine ?? line.oldLine ?? ''
    
    output += `
      <div class="${lineClass}">
        <div class="line-number">${lineNumber}</div>
        <div class="line-content">
          <span class="line-prefix">${line.type === 'addition' ? '+' : line.type === 'removal' ? '-' : ' '}</span>
          <span class="line-text">${syntaxHighlight(escapeHtml(line.content))}</span>
        </div>
      </div>
    `
  })
  
  output += '</div>'
  return output
}

const generateSplitView = (lines: LineInfo[]) => {
  let output = '<div class="split-view">'
  
  // Left side (old content)
  output += '<div class="split-side split-side-old">'
  
  // Right side (new content)
  output += '<div class="split-side split-side-new">'
  
  // Process lines and build both sides
  let leftLineNumber = 0
  let rightLineNumber = 0
  let inHunk = false
  
  for (const line of lines) {
    if (line.type === 'marker') {
      // Close previous hunk if any
      if (inHunk) {
        output += '</div>'.repeat(2)
      }
      
      // Add hunk header
      output += `
        <div class="hunk-header">${escapeHtml(line.content)}</div>
        <div class="hunk-content">
      `
      inHunk = true
      continue
    }
    
    if (!inHunk) continue
    
    // Add to left side (old content)
    if (line.type !== 'addition') {
      const lineClass = `line ${line.type === 'removal' ? 'line-removal' : ''}`.trim()
      output += `
        <div class="${lineClass}">
          <div class="line-number">${line.oldLine ?? ''}</div>
          <div class="line-content">
            <span class="line-text">${line.type === 'removal' ? syntaxHighlight(escapeHtml(line.content)) : '&nbsp;'}</span>
          </div>
        </div>
      `
    } else {
      // Empty placeholder for additions on the left side
      output += '<div class="line"><div class="line-number"></div><div class="line-content">&nbsp;</div></div>'
    }
    
    // Add to right side (new content)
    if (line.type !== 'removal') {
      const lineClass = `line ${line.type === 'addition' ? 'line-addition' : ''}`.trim()
      output += `
        <div class="${lineClass}">
          <div class="line-number">${line.newLine ?? ''}</div>
          <div class="line-content">
            <span class="line-text">${line.type === 'addition' ? syntaxHighlight(escapeHtml(line.content)) : '&nbsp;'}</span>
          </div>
        </div>
      `
    } else {
      // Empty placeholder for removals on the right side
      output += '<div class="line"><div class="line-number"></div><div class="line-content">&nbsp;</div></div>'
    }
  }
  
  // Close the last hunk if any
  if (inHunk) {
    output += '</div>'.repeat(2)
  }
  
  output += '</div>'.repeat(2) // Close split sides
  return output
}

// Simple syntax highlighting for common patterns
const syntaxHighlight = (code: string) => {
  // Highlight strings
  code = code.replace(/"([^"]*)"/g, '<span class="code-string">"$1"</span>')
  
  // Highlight numbers
  code = code.replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>')
  
  // Highlight keywords
  const keywords = ['function', 'if', 'else', 'for', 'while', 'return', 'const', 'let', 'var', 'class', 'import', 'export', 'default', 'from', 'as']
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g')
    code = code.replace(regex, `<span class="code-keyword">${keyword}</span>`)
  })
  
  // Highlight comments (// and /* */)
  code = code.replace(/\/\/(.*)/g, '<span class="code-comment">//$1</span>')
  
  return code
}

// Helper function to escape HTML
const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

onMounted(() => {
  getGitHistory()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <!-- Header -->
    <header class="bg-indigo-600 text-white p-4 shadow-md">
      <div class="container mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h1 class="text-2xl font-bold flex items-center gap-2">
              <span class="i-mdi-git text-2xl"></span>
              Git File History
            </h1>
            <div v-if="selectedFile" class="text-sm bg-indigo-700 px-3 py-1 rounded-full mt-2 inline-flex items-center gap-2">
              <span class="i-mdi-file-document-outline"></span>
              <span class="truncate max-w-xs">{{ selectedFile }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="getGitHistory"
              class="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 rounded-md text-sm transition-colors flex items-center gap-1"
              :disabled="loading"
            >
              <span class="i-mdi-refresh" :class="{ 'animate-spin': loading }"></span>
              Refresh
            </button>
            <button 
              @click="toggleViewMode"
              class="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 rounded-md text-sm transition-colors flex items-center gap-1"
            >
              <span class="i-mdi-code-braces"></span>
              {{ viewMode === 'split' ? 'Unified' : 'Split' }} View
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto p-4 flex flex-col md:flex-row gap-6">
      <!-- Commit List -->
      <aside class="w-full md:w-1/3 lg:w-1/4">
        <div class="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <span class="i-mdi-history"></span>
              Commits
            </h2>
            <span class="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {{ commits.length }} {{ commits.length === 1 ? 'commit' : 'commits' }}
            </span>
          </div>
          
          <div v-if="loading" class="p-4 text-center text-gray-500 flex-1 flex items-center justify-center">
            <div class="animate-pulse flex flex-col items-center gap-2">
              <span class="i-mdi-loading animate-spin text-2xl text-indigo-500"></span>
              <p>Loading commits...</p>
            </div>
          </div>
          
          <div v-else-if="error" class="p-4 text-red-600 flex-1 flex items-center">
            <div class="bg-red-50 border-l-4 border-red-500 p-4 w-full">
              <div class="flex items-center gap-2">
                <span class="i-mdi-alert-circle text-red-500 text-xl"></span>
                <p class="font-medium">Error</p>
              </div>
              <p class="mt-1 text-sm">{{ error }}</p>
              <button 
                @click="getGitHistory"
                class="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span class="i-mdi-refresh"></span>
                Try again
              </button>
            </div>
          </div>
          
          <div v-else-if="commits.length === 0" class="p-4 text-center text-gray-500 flex-1 flex items-center justify-center">
            <div>
              <span class="i-mdi-source-commit-end text-4xl text-gray-300"></span>
              <p class="mt-2">No commits found</p>
            </div>
          </div>
          
          <TransitionGroup 
            v-else
            name="list" 
            tag="div" 
            class="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]"
          >
            <div 
              v-for="commit in commits" 
              :key="commit.hash"
              @click="selectCommit(commit)"
              class="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              :class="{ 'bg-indigo-50': selectedCommit?.hash === commit.hash }"
            >
              <div class="flex justify-between items-start">
                <span 
                  class="font-mono text-sm font-medium px-1.5 py-0.5 rounded"
                  :class="selectedCommit?.hash === commit.hash ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'"
                >
                  {{ commit.hash }}
                </span>
                <span class="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {{ formatDate(commit.date) }}
                </span>
              </div>
              <p class="font-medium mt-1.5 text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {{ commit.message }}
              </p>
              <div class="flex items-center mt-1.5 text-xs text-gray-500">
                <span class="i-mdi-account-outline mr-1"></span>
                {{ commit.author }}
                
                <template v-if="commit.changes">
                  <span class="mx-2">•</span>
                  <span class="flex items-center">
                    <span class="i-mdi-plus text-green-500 mr-1"></span>
                    <span class="text-green-600">{{ (commit.changes.match(/\+[^+]+/g) || []).length }}</span>
                    <span class="i-mdi-minus text-red-500 ml-2 mr-1"></span>
                    <span class="text-red-600">{{ (commit.changes.match(/\-[^\-]+/g) || []).length }}</span>
                  </span>
                </template>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </aside>

      <!-- Commit Details -->
      <div class="flex-1">
        <div v-if="!selectedCommit" class="bg-white rounded-lg shadow-md p-8 text-center text-gray-500 h-full flex items-center justify-center">
          <div>
            <span class="i-mdi-source-commit text-5xl text-gray-200 mb-4 inline-block"></span>
            <p class="text-lg">Select a commit to view changes</p>
            <p class="text-sm mt-1">Click on any commit from the list to see the details</p>
          </div>
        </div>
        
        <Transition name="fade" mode="out-in">
          <div 
            v-if="selectedCommit" 
            class="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col"
          >
            <div class="p-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900 line-clamp-2">
                {{ selectedCommit.message }}
              </h2>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-600">
                <div class="flex items-center">
                  <span class="i-mdi-git text-gray-400 mr-1"></span>
                  <span class="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                    {{ selectedCommit.hash }}
                  </span>
                </div>
                <div class="flex items-center">
                  <span class="i-mdi-account-outline text-gray-400 mr-1"></span>
                  {{ selectedCommit.author }}
                </div>
                <div class="flex items-center">
                  <span class="i-mdi-calendar-outline text-gray-400 mr-1"></span>
                  {{ formatDate(selectedCommit.date) }}
                </div>
                
                <div v-if="selectedCommit.changes" class="flex items-center ml-auto">
                  <span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-l flex items-center">
                    <span class="i-mdi-plus mr-1"></span>
                    {{ (selectedCommit.changes.match(/\+[^+]+/g) || []).length }} added
                  </span>
                  <span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-r border-l border-red-200 flex items-center">
                    <span class="i-mdi-minus mr-1"></span>
                    {{ (selectedCommit.changes.match(/\-[^\-]+/g) || []).length }} removed
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex-1 flex flex-col overflow-hidden">
              <!-- Diff header -->
              <div class="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-700">
                    {{ selectedFile }}
                  </span>
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {{ selectedCommit.hash }}
                  </span>
                </div>
                
                <div class="flex items-center gap-2">
                  <button 
                    @click="viewMode = 'split'"
                    class="px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1"
                    :class="viewMode === 'split' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'"
                  >
                    <span class="i-mdi-view-split-vertical"></span>
                    Split
                  </button>
                  <button 
                    @click="viewMode = 'unified'"
                    class="px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1"
                    :class="viewMode === 'unified' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'"
                  >
                    <span class="i-mdi-view-sequential"></span>
                    Unified
                  </button>
                </div>
              </div>
              
              <!-- Diff content -->
              <div class="flex-1 overflow-auto bg-white">
                <div 
                  class="diff-viewer"
                  :class="{ 'split-view': viewMode === 'split', 'unified-view': viewMode === 'unified' }"
                  v-html="formatDiff(selectedCommit.diff)"
                ></div>
                
                <div v-if="!selectedCommit.diff" class="h-full flex items-center justify-center text-gray-400">
                  <div class="text-center p-8">
                    <span class="i-mdi-file-document-remove-outline text-5xl block mb-4"></span>
                    <p class="text-lg font-medium">No changes in this commit</p>
                    <p class="text-sm mt-1">This commit doesn't modify the file content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </main>
    
    <!-- Loading overlay -->
    <Transition name="fade">
      <div 
        v-if="loading && commits.length === 0" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div class="flex flex-col items-center">
            <span class="i-mdi-loading animate-spin text-4xl text-indigo-500 mb-4"></span>
            <h3 class="text-lg font-medium text-gray-900 mb-1">Loading Git History</h3>
            <p class="text-gray-600 text-center">
              Fetching commit history for
              <span class="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">
                {{ selectedFile }}
              </span>
            </p>
            <p class="text-sm text-gray-500 mt-2">This may take a moment...</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
