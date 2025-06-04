import React from 'react';
import { Box, Text, useInput } from 'ink';
import { BasePrompt, type Theme } from './base';

type Option<T = any> = {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type SelectPromptProps<T = any> = {
  message: string;
  options: Option<T>[];
  initialValue?: T;
  required?: boolean;
  limit?: number;
  theme?: Partial<Theme>;
  onSubmit: (value: T) => void;
  onCancel: () => void;
};

export const SelectPrompt = <T,>({
  message,
  options,
  initialValue,
  required = false,
  limit = 5,
  theme,
  onSubmit,
  onCancel,
}: SelectPromptProps<T>) => {
  const [selectedIndex, setSelectedIndex] = React.useState(() => {
    if (initialValue === undefined) return 0;
    const index = options.findIndex(opt => opt.value === initialValue);
    return Math.max(0, index);
  });
  
  const [scrollOffset, setScrollOffset] = React.useState(0);
  
  // Filter out disabled options
  const enabledOptions = React.useMemo(() => {
    return options.filter(opt => !opt.disabled);
  }, [options]);
  
  // Handle keyboard input
  useInput((input, key) => {
    if (key.return || key.escape) return; // Handled by BasePrompt
    
    if (key.upArrow) {
      const newIndex = Math.max(0, selectedIndex - 1);
      setSelectedIndex(newIndex);
      
      // Adjust scroll position
      if (newIndex < scrollOffset) {
        setScrollOffset(newIndex);
      }
    } else if (key.downArrow) {
      const newIndex = Math.min(enabledOptions.length - 1, selectedIndex + 1);
      setSelectedIndex(newIndex);
      
      // Adjust scroll position
      if (newIndex >= scrollOffset + limit) {
        setScrollOffset(Math.max(0, newIndex - limit + 1));
      }
    } else if (key.pageUp) {
      const newIndex = Math.max(0, selectedIndex - limit);
      setSelectedIndex(newIndex);
      setScrollOffset(Math.max(0, scrollOffset - limit));
    } else if (key.pageDown) {
      const newIndex = Math.min(enabledOptions.length - 1, selectedIndex + limit);
      setSelectedIndex(newIndex);
      setScrollOffset(Math.min(
        Math.max(0, enabledOptions.length - limit),
        scrollOffset + limit
      ));
    } else if (key.home) {
      setSelectedIndex(0);
      setScrollOffset(0);
    } else if (key.end) {
      const newIndex = enabledOptions.length - 1;
      setSelectedIndex(newIndex);
      setScrollOffset(Math.max(0, newIndex - limit + 1));
    }
  });
  
  // Get visible options based on scroll position
  const visibleOptions = React.useMemo(() => {
    return enabledOptions.slice(scrollOffset, scrollOffset + limit);
  }, [enabledOptions, scrollOffset, limit]);
  
  // Adjust scroll position when selected index changes
  React.useEffect(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + limit) {
      setScrollOffset(Math.max(0, selectedIndex - limit + 1));
    }
  }, [selectedIndex, scrollOffset, limit]);
  
  // Handle option selection
  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onSubmit(enabledOptions[index].value);
  };
  
  return (
    <BasePrompt
      message={message}
      defaultValue={initialValue}
      required={required}
      theme={theme}
      onSubmit={() => onSubmit(enabledOptions[selectedIndex].value)}
      onCancel={onCancel}
    >
      {({ isFocused }) => (
        <Box flexDirection="column">
          {visibleOptions.map((option, index) => {
            const actualIndex = scrollOffset + index;
            const isSelected = actualIndex === selectedIndex;
            const isDisabled = option.disabled;
            
            return (
              <Box key={actualIndex}>
                <Text
                  color={isDisabled 
                    ? theme?.colors?.text.disabled 
                    : isSelected && isFocused 
                      ? theme?.colors?.text.inverted 
                      : theme?.colors?.text.primary
                  }
                  backgroundColor={isSelected && isFocused 
                    ? theme?.colors?.primary 
                    : 'transparent'
                  }
                  onPress={() => !isDisabled && handleSelect(actualIndex)}
                >
                  {isSelected ? '❯ ' : '  '}
                  {option.label}
                  {option.hint && (
                    <Text color={theme?.colors?.text.secondary}>
                      {' '}({option.hint})
                    </Text>
                  )}
                </Text>
              </Box>
            );
          })}
          
          {enabledOptions.length > limit && (
            <Box marginTop={1}>
              <Text color={theme?.colors?.text.secondary}>
                Use arrow keys to navigate, Enter to select
              </Text>
            </Box>
          )}
        </Box>
      )}
    </BasePrompt>
  );
};

export default SelectPrompt;
