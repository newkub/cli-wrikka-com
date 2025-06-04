export const defaultTheme = {
  // Colors
  colors: {
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',
    muted: '#8E8E93',
    
    // Text colors
    text: {
      primary: '#000000',
      secondary: '#8E8E93',
      inverted: '#FFFFFF',
      disabled: '#8E8E93',
      error: '#FF3B30',
      success: '#34C759',
    },
    
    // Background colors
    background: {
      default: '#FFFFFF',
      selected: '#F2F2F7',
      hover: '#F2F2F7',
      active: '#E5E5EA',
      disabled: '#F2F2F7',
      error: '#FFE5E5',
      success: '#E5F9E5',
      warning: '#FFF4E5',
      info: '#E5F5FF',
    },
    
    // Border colors
    border: {
      default: '#C7C7CC',
      focus: '#007AFF',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      info: '#5AC8FA',
    },
  },
  
  // Spacing
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  
  // Border radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  
  // Typography
  typography: {
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: {
      xs: '11px',
      sm: '13px',
      base: '15px',
      lg: '17px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.6',
      loose: '2',
    },
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  
  // Transitions
  transitions: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export type Theme = typeof defaultTheme;
