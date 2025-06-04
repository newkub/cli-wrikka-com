// ======================
// Theme Configuration
// ======================
export const THEME = {
  reset: '\x1b[0m',
  text: '\x1b[38;5;255m',
  accent: '\x1b[38;5;33m',
  border: '\x1b[38;5;240m',
  tabActive: '\x1b[38;5;33m',  // Blue text for active tab
  tabInactive: '\x1b[38;5;250m', // Gray text for inactive tabs
};

export type Theme = typeof THEME;