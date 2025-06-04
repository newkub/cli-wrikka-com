import * as React from 'react';
import { Box, Text } from 'ink';
import { useInput } from '../hooks/useInput';
import type { Theme } from '../theme';

type BasePromptProps<T = unknown> = {
  message: string;
  defaultValue?: T;
  required?: boolean;
  validate?: (value: T) => string | undefined | Promise<string | undefined>;
  theme?: Partial<Theme>;
  onSubmit: (value: T) => void;
  onCancel: () => void;
  children: (props: {
    value: T;
    setValue: (value: T) => void;
    error?: string;
    isFocused: boolean;
    theme: Theme;
  }) => React.ReactNode;
};

export function BasePrompt<T = unknown>({
  message,
  defaultValue,
  required = false,
  validate,
  theme: customTheme,
  onSubmit,
  onCancel,
  children,
}: BasePromptProps<T>) {
  const [value, setValue] = React.useState<T>(defaultValue as T);
  const [error, setError] = React.useState<string | undefined>();
  const [_isFocused, _setIsFocused] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Merge custom theme with default theme
  const theme = React.useMemo(() => ({
    ...defaultTheme,
    ...customTheme,
    colors: {
      ...defaultTheme.colors,
      ...customTheme?.colors,
    },
  }), [customTheme]);

  // Handle form submission
  const handleSubmit = React.useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Handle empty required fields
      if (required && (value === undefined || value === null || value === '')) {
        setError('This field is required');
        return;
      }
      
      // Run validation if provided
      if (validate && value !== undefined) {
        const validationError = await validate(value);
        if (validationError) {
          setError(validationError);
          return;
        }
      }
      
      // If we get here, validation passed
      if (value !== undefined) {
        onSubmit(value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSubmit, required, validate, value]);

  // Handle keyboard input
  const handleInput = React.useCallback((input: string, key: { escape?: boolean; return?: boolean }) => {
    if (key.escape) {
      onCancel();
      return;
    }
    
    if (key.return) {
      handleSubmit();
      return;
    }
  }, [handleSubmit, onCancel]);

  useInput(handleInput, { isActive: _isFocused });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>{message}</Text>
        {required && <Text color={theme.colors.error}>*</Text>}
        {error && (
          <Text color={theme.colors.error}>
            {' '}({error})
          </Text>
        )}
      </Box>
      
      <Box
        borderStyle="round"
        borderColor={error ? theme.colors.border.error : _isFocused ? theme.colors.border.focus : theme.colors.border.default}
        paddingX={1}
      >
        {children({
          value,
          setValue: (val) => {
            setValue(val);
            setError(undefined);
          },
          error,
          isFocused: _isFocused,
          theme,
        })}
      </Box>
      
      <Box marginTop={1}>
        <Text color={theme.colors.text.secondary}>
          Press Enter to submit, Esc to cancel
        </Text>
      </Box>
    </Box>
  );
};

// Default theme for the prompt
const defaultTheme: Theme = {
  colors: {
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',
    muted: '#8E8E93',
    text: {
      primary: '#000000',
      secondary: '#8E8E93',
      inverted: '#FFFFFF',
      disabled: '#8E8E93',
      error: '#FF3B30',
      success: '#34C759',
    },
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
    border: {
      default: '#C7C7CC',
      focus: '#007AFF',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      info: '#5AC8FA',
    },
  },
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
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
      relaxed: '1.8',
      loose: '2',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  transitions: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
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

// Re-export Theme type from theme module
export type { Theme } from '../theme';
