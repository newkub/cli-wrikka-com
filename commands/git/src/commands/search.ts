import { execaCommand } from 'execa';
import * as p from '@clack/prompts';
import type { Command } from './index';

type SearchType = 'grep' | 'log-message' | 'log-content' | 'log-author';

interface SearchOption {
  value: SearchType;
  label: string;
  hint: string;
}

export async function search() {
  p.intro('🔍 Git Search');
  
  try {
    // Search options
    const searchOptions: SearchOption[] = [
      { 
        value: 'grep',
        label: '🔍 Search in code (git grep)',
        hint: 'Find text in current codebase using git grep'
      },
      { 
        value: 'log-message', 
        label: '📝 Search commit messages',
        hint: 'Find commits by message content'
      },
      { 
        value: 'log-content', 
        label: '💻 Search in commit changes',
        hint: 'Find commits that changed specific code'
      },
      { 
        value: 'log-author', 
        label: '👤 Search by author',
        hint: 'Find commits by specific author'
      }
    ];

    // Ask for search type
    const searchType = await p.select({
      message: 'What would you like to search for?',
      options: searchOptions,
      initialValue: 'grep',
    });

    if (p.isCancel(searchType)) {
      p.cancel('Search cancelled');
      return;
    }

    // Ask for search query
    const query = await p.text({
      message: 'Enter search term:',
      placeholder: 'Type your search term...',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Please enter a search term';
        }
        if (value.length < 2) {
          return 'Please enter at least 2 characters';
        }
      },
      initialValue: ''
    });

    if (p.isCancel(query)) {
      p.cancel('Search cancelled');
      return;
    }

    let command = '';
    const spinner = p.spinner();
    
    // Build and execute command based on search type
    switch (searchType) {
      case 'grep':
        command = `git grep -nI "${query}"`;
        spinner.start(`Searching for "${query}" in code...`);
        break;
        
      case 'log-message':
        command = `git log --grep="${query}" --pretty=format:'%h - %an, %ar : %s'`;
        spinner.start(`Searching commit messages for "${query}"...`);
        break;
        
      case 'log-content':
        command = `git log -p -S"${query}" --pretty=format:'%h - %an, %ar : %s'`;
        spinner.start(`Searching code changes for "${query}"...`);
        break;
        
      case 'log-author':
        command = `git log --author="${query}" --pretty=format:'%h - %an, %ar : %s'`;
        spinner.start(`Searching commits by author "${query}"...`);
        break;
    }

    try {
      const { stdout, stderr: _stderr, exitCode } = await execaCommand(command, { 
        reject: false,
        shell: true,
        all: true  // Combine stdout and stderr for better error handling
      });
      
      spinner.stop('Search completed');
      
      // Git grep returns exit code 1 when no matches are found
      const noMatches = exitCode === 1 && searchType === 'grep';
      const hasResults = stdout.trim().length > 0;
      
      if (!hasResults || noMatches) {
        p.note(
          `No results found for "${query}" in ${searchType.replace('-', ' ')}`,
          '🔍 No matches found'
        );
        return;
      }

      // Format and display results
      const results = stdout.split('\n').filter(Boolean);
      
      if (searchType === 'grep') {
        // Format grep results with file and line numbers
        const formatted = results.map(line => {
          const [file, lineNum, ...rest] = line.split(':');
          return `📄 ${file}:${lineNum}\n   ${rest.join(':').trim()}`;
        }).join('\n\n');
        
        if (formatted.trim()) {
          p.note(
            `Found ${results.length} ${results.length === 1 ? 'match' : 'matches'}:\n\n${formatted}`,
            '🔍 Search Results'
          );
        } else {
          p.note(
            `No results found for "${query}" in code`,
            '🔍 No matches found'
          );
        }
      } else {
        // Format log results
        if (results.length > 0) {
          p.note(
            `Found ${results.length} ${results.length === 1 ? 'commit' : 'commits'}:\n\n${results.join('\n')}`,
            '📜 Commit Results'
          );
        } else {
          p.note(
            `No commits found for "${query}"`,
            '📜 No commits found'
          );
        }
      }
      
    } catch (error) {
      spinner.stop('Error');
      p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
  } catch (error) {
    p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    p.outro('Search completed');
  }
}

export const searchCommand: Command = {
  value: 'search',
  label: '🔍 Search',
  hint: 'Search in Git (code, commits, authors)',
  handler: search,
};
