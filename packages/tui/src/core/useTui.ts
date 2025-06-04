import readline from 'readline';
import { EventEmitter } from 'events';
import { renderLogsView } from './useLog';
import { useChat } from './useChat';
import { type Task, renderTasksTable } from './useTable';
import { THEME } from './useTheme';

// ======================
// Interfaces
// ======================
interface Tab {
  name: string;
  content: string;
  icon: string;
  renderContent?: (selectedIndex: number, selectedCol: number, terminalWidth: number) => string;
}

interface TUIInstance {
  close: () => void;
  selectedTaskIndex: number;
  selectedColumn: number;
}

// Initialize chat system
const chat = useChat();

// Add sample chat messages
chat.addMessage({ sender: 'ai', content: 'Welcome to the chat!' });
chat.addMessage({ sender: 'ai', content: 'How can I help you today?' });

// ======================
// Constants
// ======================
const TABS: Tab[] = [
  { 
    name: ' Tasks ', 
    content: '',
    icon: '✓',
    renderContent: (selectedIndex, selectedCol, terminalWidth) => 
      renderTasksTable({ 
        selectedIndex, 
        selectedCol, 
        terminalWidth 
      })
  },
  { 
    name: ' Logs ', 
    content: '',
    icon: '📝',
    renderContent: renderLogsView
  },
  { 
    name: ' Chat ', 
    content: '',
    icon: '💬',
    renderContent: renderChatView
  },
  { 
    name: ' Info ', 
    content: '\n  ► System information\n  ► Version: 1.0.0\n  ► Developed by Wrikka Team\n', 
    icon: 'ℹ️'
  }
];

// State management
class TUIState extends EventEmitter {
  private _currentTabIndex = 0;
  private _selectedTaskIndex = 0;
  private _selectedColumn = 0;
  private _scrollOffset = 0;
  private _terminalHeight = process.stdout.rows || 24;
  private _terminalWidth = process.stdout.columns || 80;

  get currentTabIndex() { return this._currentTabIndex; }
  get selectedTaskIndex() { return this._selectedTaskIndex; }
  get selectedColumn() { return this._selectedColumn; }
  get scrollOffset() { return this._scrollOffset; }
  get terminalHeight() { return this._terminalHeight; }
  get terminalWidth() { return this._terminalWidth; }

  set currentTabIndex(value: number) {
    if (this._currentTabIndex !== value) {
      this._currentTabIndex = value;
      this.emit('tabChanged', value);
    }
  }

  set selectedTaskIndex(value: number) {
    if (this._selectedTaskIndex !== value) {
      this._selectedTaskIndex = value;
      this.emit('selectionChanged', value, this._selectedColumn);
    }
  }

  set selectedColumn(value: number) {
    if (this._selectedColumn !== value) {
      this._selectedColumn = value;
      this.emit('selectionChanged', this._selectedTaskIndex, value);
    }
  }

  set scrollOffset(value: number) {
    if (this._scrollOffset !== value) {
      this._scrollOffset = value;
      this.emit('scrollChanged', value);
    }
  }

  updateTerminalSize() {
    this._terminalHeight = process.stdout.rows || 24;
    this._terminalWidth = process.stdout.columns || 80;
    this.emit('resize', this._terminalWidth, this._terminalHeight);
  }
}

// Initialize state
const state = new TUIState();

// Sample data
const TASKS: Task[] = [
  { id: 1, title: 'Implement TUI table', status: 'In Progress', priority: 'High' },
  { id: 2, title: 'Add task navigation', status: 'Pending', priority: 'Medium' },
  { id: 3, title: 'Fix layout issues', status: 'Pending', priority: 'Low' },
  { id: 4, title: 'Test terminal resize', status: 'Completed', priority: 'Medium' },
  { id: 5, title: 'Add more tasks', status: 'Pending', priority: 'Low' },
  { id: 6, title: 'Test scrolling', status: 'Pending', priority: 'Medium' },
  { id: 7, title: 'Improve performance', status: 'In Progress', priority: 'High' },
  { id: 8, title: 'Add search functionality', status: 'Pending', priority: 'Medium' },
];

// ======================
// Helper Functions
// ======================  
function calculateTabWidth(terminalWidth: number, tabCount: number): number {
  return Math.floor(terminalWidth / tabCount);
}

function createTabContent(tab: Tab, width: number, isActive: boolean): string {
  const tabContent = ` ${tab.icon}${tab.name} `;
  const padding = Math.max(0, width - tabContent.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  const style = isActive ? THEME.tabActive : THEME.tabInactive;
  return `${style}${' '.repeat(leftPad)}${tabContent}${' '.repeat(rightPad)}`;
}

// ======================
// Main TUI Class
// ======================
function clearScreen(): void {
  // ใช้หลายวิธีร่วมกันเพื่อให้มั่นใจว่าหน้าจอถูกล้างอย่างสมบูรณ์
  process.stdout.write('\x1bc'); // Reset terminal
  process.stdout.write('\x1b[2J'); // Clear entire screen
  process.stdout.write('\x1b[0f'); // Move cursor to top-left
  process.stdout.write('\x1b[3J'); // Clear scrollback buffer
}

function moveCursor(x: number, y: number): void {
  process.stdout.write(`\x1b[${y + 1};${x + 1}H`);
}

function hideCursor(): void {
  process.stdout.write('\x1b[?25l');
}

function showCursor(): void {
  process.stdout.write('\x1b[?25h');
}

export function createTUI(): TUIInstance {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  // ======================
  // Render Functions
  // ======================
  function renderUI(forceFullRender: boolean): void {
    // ถ้าต้องการ render เต็มรูปแบบ ต้องแน่ใจว่าหน้าจอถูกล้าง
    if (forceFullRender) {
      // clearScreen() ถูกเรียกจาก switchTab แล้ว ไม่จำเป็นต้องเรียกซ้ำที่นี่
      // แต่ถ้าเรียก renderUI(true) โดยตรง ต้องล้างหน้าจอ
      // clearScreen();
    }
    
    const terminalHeight = state.terminalHeight;
    const contentHeight = terminalHeight - 2;
    
    // Render tab bar
    if (forceFullRender) {
      moveCursor(0, 0);
      const tabWidth = calculateTabWidth(state.terminalWidth, TABS.length);
      const tabBar = TABS
        .map((tab, i) => createTabContent(tab, tabWidth, i === state.currentTabIndex))
        .join('');
      
      process.stdout.write(`${THEME.border}${tabBar}${THEME.reset}\n`);
    }
    
    // Render content
    const currentTab = TABS[state.currentTabIndex];
    let content = '';
    
    if (currentTab.renderContent) {
      // Only pass the required arguments to maintain type safety
      content = currentTab.renderContent(
        state.selectedTaskIndex, 
        state.selectedColumn, 
        state.terminalWidth
      );
    } else {
      content = currentTab.content;
    }
    
    if (forceFullRender) {
      // Split content into lines and limit to contentHeight
      const contentLines = content.split('\n').slice(0, contentHeight);
      moveCursor(0, 1);
      process.stdout.write(contentLines.join('\n'));
    } else {
      // Only update the changed lines
      const contentLines = content.split('\n');
      const visibleLines = Math.min(contentHeight, contentLines.length);
      
      for (let i = 0; i < visibleLines; i++) {
        moveCursor(0, i + 1);
        process.stdout.write('\x1b[K'); // Clear line
        process.stdout.write(contentLines[i] || '');
      }
    }
    

    // Position cursor at selected cell if in tasks tab
    if (state.currentTabIndex === 0) {
      const row = state.selectedTaskIndex - state.scrollOffset + 2; // +2 for header and 1-based index
      if (row >= 2 && row < terminalHeight - 1) {
        moveCursor(0, row);
      }
    }
  }

  function switchTab(index: number) {
    // เพิ่มเงื่อนไขตรวจสอบว่า tab ที่เลือกไม่ใช่ tab ปัจจุบัน
    if (index >= 0 && index < TABS.length && index !== state.currentTabIndex) {
      state.currentTabIndex = index;
      state.scrollOffset = 0; // Reset scroll when switching tabs
      
      // ล้างหน้าจอก่อนเรียก renderUI เสมอ
      clearScreen();
      renderUI(true);
    } else if (index === state.currentTabIndex) {
      // ถ้าคลิกที่ tab เดิม ให้ refresh UI โดยล้างหน้าจอก่อน
      clearScreen();
      renderUI(true);
    }
  }

  function cleanupAndExit() {
    // Show cursor
    showCursor();
    // Restore terminal settings
    process.stdin.setRawMode(false);
    process.stdin.pause();
    // Clear the screen and exit
    process.stdout.write('\x1b[2J\x1b[0f');
    process.exit(0);
  }

  function handleKeyInput(key: string) {
    if (key === 'q' || key === '\u001b') {
      cleanupAndExit();
    }
    
    // Handle tab switching
    if (key === '\t') {
      switchTab((state.currentTabIndex + 1) % TABS.length);
      return;
    }
    
    // Handle numeric tab switching
    const tabIndex = Number.parseInt(key) - 1;
    if (!Number.isNaN(tabIndex) && tabIndex >= 0 && tabIndex < TABS.length) {
      switchTab(tabIndex);
      return;
    }
    
    if (state.currentTabIndex === 0) {
      const visibleRows = state.terminalHeight - 4; // Account for header, footer, and borders
      let needsRender = false;
      
      // Vertical navigation
      if (key === '\u001b[A') { // Up arrow
        if (state.selectedTaskIndex > 0) {
          state.selectedTaskIndex--;
          
          // Adjust scroll position if needed
          const viewportStart = state.scrollOffset;
          const viewportEnd = viewportStart + visibleRows - 1;
          
          if (state.selectedTaskIndex < viewportStart) {
            state.scrollOffset = state.selectedTaskIndex;
            needsRender = true;
          } else if (state.selectedTaskIndex > viewportEnd) {
            state.scrollOffset = state.selectedTaskIndex - visibleRows + 1;
            needsRender = true;
          }
        }
      } 
      else if (key === '\u001b[B') { // Down arrow
        if (state.selectedTaskIndex < TASKS.length - 1) {
          state.selectedTaskIndex++;
          
          // Adjust scroll position if needed
          const viewportStart = state.scrollOffset;
          const viewportEnd = viewportStart + visibleRows - 1;
          
          if (state.selectedTaskIndex > viewportEnd) {
            state.scrollOffset = state.selectedTaskIndex - visibleRows + 1;
            needsRender = true;
          } else if (state.selectedTaskIndex < viewportStart) {
            state.scrollOffset = state.selectedTaskIndex;
            needsRender = true;
          }
        }
      }
      
      // Horizontal navigation
      if (key === '\u001b[D') state.selectedColumn = Math.max(0, state.selectedColumn - 1);
      if (key === '\u001b[C') state.selectedColumn = Math.min(3, state.selectedColumn + 1);
      
      if (key === '\r') {
        const task = TASKS[state.selectedTaskIndex];
        const value = {
          0: task.id,
          1: task.title,
          2: task.status,
          3: task.priority
        }[state.selectedColumn];
        
        // Show selection at the bottom
        moveCursor(0, state.terminalHeight - 1);
        process.stdout.write('\x1b[K'); // Clear line
        const valueStr = value?.toString() || '';
        const padding = Math.max(0, state.terminalWidth - 10 - valueStr.length);
        process.stdout.write(`${THEME.accent}Selected: ${valueStr}${' '.repeat(padding)}`);
        
        // Reset cursor position
        const row = state.selectedTaskIndex - state.scrollOffset + 2;
        if (row >= 2 && row < state.terminalHeight - 1) {
          moveCursor(0, row);
        }
        return;
      }
      
      // Only re-render if something changed
      if (needsRender) {
        renderUI(true);
      } else {
        // Just update the selection highlight
        renderUI(false);
      }
    }
  }

  // ======================
  // Event Listeners
  // ======================
  function onResize() {
    state.updateTerminalSize();
  }
  
  // Initialize terminal
  function init() {
    // Setup terminal
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    // Hide cursor
    hideCursor();
    
    // Handle process exit
    process.on('exit', () => {
      cleanupAndExit();
      rl.close();
    });
    
    // Setup event listeners
    process.stdin.on('data', handleKeyInput);
    process.stdout.on('resize', onResize);
    
    // Initial render
    state.updateTerminalSize();
    renderUI(true);
  }
  
  // Start the TUI
  init();
  
  return {
    close: () => {
      showCursor();
      process.stdin.setRawMode(false);
      rl.close();
      process.exit(0);
    },
    get selectedTaskIndex() { return state.selectedTaskIndex; },
    get selectedColumn() { return state.selectedColumn; }
  };
}

export type TUI = ReturnType<typeof createTUI>;

interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
}

interface RenderChatViewOptions {
  selectedIndex: number;
  selectedCol: number;
  terminalWidth: number;
  messages: ChatMessage[];
  theme: {
    accent: string;
    border: string;
    reset: string;
    text: string;
  };
}

function renderHeader(terminalWidth: number, theme: RenderChatViewOptions['theme']): string {
  return `${theme.accent}AI Assistant${theme.reset}\n` +
         `${theme.border}${'─'.repeat(terminalWidth)}${theme.reset}\n`;
}

function renderMessage(msg: ChatMessage, theme: RenderChatViewOptions['theme']): string {
  const isAI = msg.sender === 'ai';
  const sender = isAI ? `${theme.accent}AI:` : `${theme.text}You:`;
  
  // ตัดข้อความให้พอดีกับความกว้าง terminal
  const maxContentLength = 80 - 10;
  const content = msg.content.length > maxContentLength 
    ? `${msg.content.substring(0, maxContentLength - 3)}...` 
    : msg.content;
  
  const bubble = `${sender} ${content}${theme.reset}`;
  const padding = isAI ? 0 : Math.max(0, Math.floor(80 * 0.1));
  
  return `${' '.repeat(padding)}${bubble}\n`;
}

function renderChatView(
  selectedIndex: number, 
  selectedCol: number, 
  terminalWidth: number
): string {
  return renderChatViewFull({
    selectedIndex,
    selectedCol,
    terminalWidth,
    messages: chat.messages,
    theme: THEME
  });
}

function renderChatViewFull({
  terminalWidth,
  messages,
  theme
}: RenderChatViewOptions): string {
  const minWidth = 30;
  if (terminalWidth < minWidth) {
    return `${theme.accent}Terminal too narrow (min ${minWidth} columns)${theme.reset}\n`;
  }

  let output = renderHeader(terminalWidth, theme);
  
  for (const msg of messages) {
    output += renderMessage(msg, theme);
  }
  
  output += `${theme.border}${'─'.repeat(terminalWidth)}${theme.reset}\n`;
  output += `${theme.text}Type your message (Enter to send):${theme.reset}\n`;
  return output;
}

// Start the TUI
createTUI();