import { THEME } from './useTheme';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'INFO' | 'WARN' | 'ERROR';
}

export const LOG_ENTRIES: LogEntry[] = [
  { timestamp: '10:30:42', message: 'System initialized', type: 'INFO' },
  { timestamp: '10:31:15', message: 'Loading tasks', type: 'INFO' },
  { timestamp: '10:32:03', message: 'Failed to load chat history', type: 'ERROR' },
  { timestamp: '10:33:47', message: 'Retrying connection', type: 'WARN' },
];

export function renderLogsView(selectedIndex: number, selectedCol: number, terminalWidth: number) {
  const minWidth = 30;
  if (terminalWidth < minWidth) {
    return `${THEME.accent}Terminal too narrow (min ${minWidth} columns)${THEME.reset}\n`;
  }

  let output = `${THEME.accent}Log History${THEME.reset}\n`;
  output += `${THEME.border}${'─'.repeat(terminalWidth)}${THEME.reset}\n`;
  
  LOG_ENTRIES.forEach(entry => {
    const timestamp = `${THEME.text}${entry.timestamp}${THEME.reset}`;
    const typeColor = entry.type === 'ERROR' ? '\x1b[31m' : 
                     entry.type === 'WARN' ? '\x1b[33m' : THEME.text;
    
    const maxMessageLength = terminalWidth - 15;
    const message = entry.message.length > maxMessageLength 
      ? entry.message.substring(0, maxMessageLength - 3) + '...' 
      : entry.message;
    
    output += `${timestamp} [${entry.type}] ${typeColor}${message}${THEME.reset}\n`;
  });
  
  output += `\n${THEME.text}Press Q to return${THEME.reset}`;
  return output;
}