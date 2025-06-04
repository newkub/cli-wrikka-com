import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Text, useInput, type Key } from 'ink';
import { BasePrompt, type Theme } from './base';

type AutocompleteOption<T = unknown> = {
  value: T;
  label: string;

  
  hint?: string;
};

type AutocompletePromptProps<T = unknown> = {
  message: string;
  source: (query: string) => Promise<AutocompleteOption<T>[]> | AutocompleteOption<T>[];
  limit?: number;
  minQueryLength?: number;
  emptyText?: string;
  required?: boolean;
  theme?: Partial<Theme>;
  onSubmit: (value: T) => void;
  onCancel: () => void;
};

export const AutocompletePrompt = <T,>({
  message,
  source,
  limit = 10,
  minQueryLength = 0,
  emptyText = 'No matches found',
  required = false,
  theme,
  onSubmit,
  onCancel,
}: AutocompletePromptProps<T>) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<AutocompleteOption<T>[]>([]);
  const [_errors, setErrors] = React.useState<Error[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Handle keyboard input
  useInput((input, key) => {
    if (!isOpen) return;
    
    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(prev + 1, options.length - 1));
    } else if (key.upArrow) {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (key.return) {
      if (options[selectedIndex]) {
        handleSelect(options[selectedIndex]);
      }
    }
  }, { isActive: isOpen });
  
  const debouncedQuery = useDebounce<string>(query, 300);
  const isMounted = useRef(true);
  
  // Handle cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Fetch options when query changes
  useEffect(() => {
    if (debouncedQuery.length < minQueryLength) {
      setOptions([]);
      setIsOpen(false);
      return;
    }
    
    let isSubscribed = true;
    setIsLoading(true);
    
    const fetchOptions = async () => {
      try {
        const result = await source(debouncedQuery);
        if (isSubscribed && isMounted.current) {
          setOptions(Array.isArray(result) ? result.slice(0, limit) : []);
          setSelectedIndex(0);
          setIsOpen(true);
          setErrors([]);
        }
      } catch (err) {
        if (isSubscribed && isMounted.current) {
          setErrors([err instanceof Error ? err : new Error(String(err))]);
          setOptions([]);
          setIsOpen(false);
        }
      } finally {
        if (isSubscribed && isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    fetchOptions();
    
    return () => {
      isSubscribed = false;
    };
  }, [debouncedQuery, limit, minQueryLength, source]);
  
  // Handle keyboard input
  useInput((_input: string, key: Key) => {
    if ('escape' in key && key.escape) {
      if (isOpen) {
        setIsOpen(false);
      } else {
        onCancel();
      }
      return;
    }
    
    if (key.return) {
      if (options.length > 0 && selectedIndex >= 0 && selectedIndex < options.length) {
        const selectedOption = options[selectedIndex];
        onSubmit(selectedOption.value);
      } else if (query) {
        // If no option is selected but there's a query, submit the query
        onSubmit(query as unknown as T);
      }
      return;
    }
    
    if (key.upArrow) {
      const newIndex = Math.max(0, selectedIndex - 1);
      setSelectedIndex(newIndex);
      return;
    }
    
    if (key.downArrow) {
      if (!isOpen && query.length >= minQueryLength) {
        setIsOpen(true);
      } else if (options.length > 0) {
        const newIndex = Math.min(options.length - 1, selectedIndex + 1);
        setSelectedIndex(newIndex);
      }
      return;
    }
    
    if (key.tab && isOpen && options.length > 0) {
      const selectedOption = options[selectedIndex];
      setQuery(selectedOption.label);
      setIsOpen(false);
      return;
    }
  });
  
  // Handle option selection
  const handleSelect = useCallback((option: AutocompleteOption<T>) => {
    setQuery(option.label);
    onSubmit(option.value);
  }, [onSubmit]);
  
  // Handle query change
  const _handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setErrors([]);
    if (value.length < minQueryLength) {
      setIsOpen(false);
    }
  }, [minQueryLength]);
  
  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (options.length > 0 && selectedIndex >= 0 && selectedIndex < options.length) {
      const selectedOption = options[selectedIndex];
      onSubmit(selectedOption.value);
    } else if (query) {
      onSubmit(query as T);
    }
  }, [onSubmit, options, query, selectedIndex]);
  
  return (
    <BasePrompt
      message={message}
      required={required}
      theme={theme}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      {({ isFocused }) => (
        <Box flexDirection="column">
          <Box>
            <Text>🔍 </Text>
            <Text>{query || 'Type to search...'}</Text>
          </Box>
          
          {isLoading && (
            <Box marginTop={1}>
              <Text color={theme?.colors?.text.secondary}>Loading...</Text>
            </Box>
          )}
          
          {_errors.length > 0 && (
            <Box marginTop={1}>
              <Text color={theme?.colors?.error}>{_errors[0].message}</Text>
            </Box>
          )}
          
          {isOpen && options.length === 0 && !isLoading && (
            <Box marginTop={1}>
              <Text color={theme?.colors?.text.secondary}>{emptyText}</Text>
            </Box>
          )}
          
          {isOpen && options.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              {options.map((option, optionIndex) => (
                <Box
                  key={option.value ? String(option.value) : option.label}
                  paddingLeft={1}
                  paddingRight={1}
                >
                  <Text
                    inverse={optionIndex === selectedIndex}
                    color={optionIndex === selectedIndex ? theme?.colors?.primary : theme?.colors?.text.primary}
                  >
                    {option.label}
                    {option.hint && (
                      <Text color={optionIndex === selectedIndex ? theme?.colors?.text.inverted : theme?.colors?.text.secondary}>
                        {' '}({option.hint})
                      </Text>
                    )}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
          
          <Box marginTop={1}>
            <Text color={theme?.colors?.text.secondary}>
              {isFocused ? '↑/↓ to navigate, Enter to select, Esc to cancel' : ''}
            </Text>
          </Box>
        </Box>
      )}
    </BasePrompt>
  );
};

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default AutocompletePrompt;
