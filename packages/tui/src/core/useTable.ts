import { THEME } from './useTheme';

/**
 * Represents a task in the TUI application
 */
export interface Task {
  /** Unique identifier for the task */
  id: number;
  /** Title/description of the task */
  title: string;
  /** Current status of the task */
  status: TaskStatus;
  /** Priority level of the task */
  priority: TaskPriority;
}

/**
 * Possible task status values
 */
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

/**
 * Possible task priority levels
 */
export type TaskPriority = 'Low' | 'Medium' | 'High';

/**
 * Props for rendering a table
 */
export interface TableProps {
  /** Currently selected row index */
  selectedIndex: number;
  /** Currently selected column index */
  selectedCol: number;
  /** Width of the terminal in characters */
  terminalWidth: number;
  /** Callback when a cell is selected */
  onSelect?: (rowIndex: number, colIndex: number) => void;
}

export const TASKS: Task[] = [
  { id: 1, title: 'Implement TUI table', status: 'In Progress', priority: 'High' },
  { id: 2, title: 'Add task navigation', status: 'Pending', priority: 'Medium' },
  { id: 3, title: 'Fix layout issues', status: 'Pending', priority: 'Low' },
  { id: 4, title: 'Test terminal resize', status: 'Completed', priority: 'Medium' },
  { id: 5, title: 'Add more tasks', status: 'Pending', priority: 'Low' },
  { id: 6, title: 'Test scrolling', status: 'Pending', priority: 'Medium' },
  { id: 7, title: 'Improve performance', status: 'In Progress', priority: 'High' },
  { id: 8, title: 'Add search functionality', status: 'Pending', priority: 'Medium' },
];

export function renderTasksTable(props: TableProps) {
  // กำหนดความกว้างของแต่ละคอลัมน์
  const colWidths = [
    8,  // ID
    Math.max(20, Math.floor(props.terminalWidth * 0.4)),  // Title
    15, // Status
    10  // Priority
  ];
  
  const headers = ['ID', 'Title', 'Status', 'Priority'];
  
  // Header
  let headerLine = headers
    .map((header, i) => header.padEnd(colWidths[i]))
    .join(' | ');
  
  let output = `${THEME.accent}${headerLine}${THEME.reset}\n`;
  output += `${THEME.border}${'─'.repeat(props.terminalWidth)}${THEME.reset}\n`;
  
  // Render all rows (scrolling is now handled by the parent component)
  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i];
    const isRowSelected = i === props.selectedIndex;
    
    const row = [
      `${isRowSelected ? '▶ ' : '  '}${task.id}`,
      task.title.length > colWidths[1] - 2 
        ? task.title.substring(0, colWidths[1] - 5) + '...' 
        : task.title,
      task.status,
      task.priority
    ].map((cell, colIndex) => {
      const isCellActive = isRowSelected && colIndex === props.selectedCol;
      const displayText = cell.toString().padEnd(colWidths[colIndex]).slice(0, colWidths[colIndex]);
      
      return isCellActive 
        ? `${THEME.tabActive}${displayText}${THEME.reset}` 
        : displayText;
    }).join(' | ');
    
    output += `${row}\n`;
  }
  
  // Add a simple scroll indicator
  if (TASKS.length > 10) {
    output += `\n${THEME.border}${'─'.repeat(props.terminalWidth)}${THEME.reset}\n`;
    output += `${THEME.text}Scroll: ▲/▼ to navigate${' '.repeat(props.terminalWidth - 20)}`;
  }
  
  output += `\n${THEME.text}←/→: Move | ▲/▼: Move | Enter: Select | Q: Quit${THEME.reset}`;
  return output;
}