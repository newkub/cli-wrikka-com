import React from 'react';
import { Box, Text, useInput } from 'ink';
import { BasePrompt, type Theme } from './base';

type Option<T = any> = {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type MultiSelectPromptProps<T = any> = {
  message: string;
  options: Option<T>[];
  selected?: T[];
  required?: boolean;
  minSelected?: number;
  maxSelected?: number;
  limit?: number;
  theme?: Partial<Theme>;
  onSubmit: (value: T[]) => void;
  onCancel: () => void;
};

export const MultiSelectPrompt = <T,>({
  message,
  options,
  selected = [],
  required = false,
  minSelected,
  maxSelected,
  limit = 5,
  theme,
  onSubmit,
  onCancel,
}: MultiSelectPromptProps<T>) => {
  const [selectedValues, setSelectedValues] = React.useState<Set<T>>(new Set(selected));
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollOffset, setScrollOffset] = React.useState(0);
  
  // Filter out disabled options
  const enabledOptions = React.useMemo(() => {
    return options.filter(opt => !opt.disabled);
  }, [options]);
  
  // Toggle selection of an option
  const toggleOption = (option: Option<T>) => {
    const newSelectedValues = new Set(selectedValues);
    
    if (newSelectedValues.has(option.value)) {
      newSelectedValues.delete(option.value);
    } else {
      // Check if we've reached maxSelected
      if (maxSelected !== undefined && newSelectedValues.size >= maxSelected) {
        return;
      }
      newSelectedValues.add(option.value);
    }
    
    setSelectedValues(newSelectedValues);
  };
  
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
    } else if (key.space) {
      // Toggle selection on space
      const option = enabledOptions[selectedIndex];
      if (option && !option.disabled) {
        toggleOption(option);
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
    } else if (key.leftArrow || key.rightArrow) {
      // Toggle selection on left/right arrow
      const option = enabledOptions[selectedIndex];
      if (option && !option.disabled) {
        toggleOption(option);
      }
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
  
  // Handle form submission
  const handleSubmit = () => {
    if (minSelected !== undefined && selectedValues.size < minSelected) {
      // Don't submit if we don't have enough selections
      return;
    }
    
    if (maxSelected !== undefined && selectedValues.size > maxSelected) {
      // Don't submit if we have too many selections
      return;
    }
    
    onSubmit(Array.from(selectedValues));
  };
  
  // Get validation error message if any
  const getValidationError = () => {
    if (required && selectedValues.size === 0) {
      return 'At least one option must be selected';
    }
    
    if (minSelected !== undefined && selectedValues.size < minSelected) {
      return `Select at least ${minSelected} option${minSelected > 1 ? 's' : ''}`;
    }
    
    if (maxSelected !== undefined && selectedValues.size > maxSelected) {
      return `Select at most ${maxSelected} option${maxSelected > 1 ? 's' : ''}`;
    }
    
    return undefined;
  };
  
  const validationError = getValidationError();
  
  return (
    <BasePrompt
      message={message}
      required={required}
      theme={theme}
      validate={() => validationError}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      {({ isFocused }) => (
        <Box flexDirection="column">
          {visibleOptions.map((option, index) => {
            const actualIndex = scrollOffset + index;
            const isSelected = selectedValues.has(option.value);
            const isHighlighted = actualIndex === selectedIndex;
            const isDisabled = option.disabled;
            
            return (
              <Box key={actualIndex}>
                <Text
                  color={isDisabled 
                    ? theme?.colors?.text.disabled 
                    : isHighlighted && isFocused 
                      ? theme?.colors?.text.inverted 
                      : theme?.colors?.text.primary
                  }
                  backgroundColor={isHighlighted && isFocused 
                    ? theme?.colors?.primary 
                    : 'transparent'
                  }
                  onPress={() => !isDisabled && toggleOption(option)}
                >
                  {isSelected ? '◉ ' : '◯ '}
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
          
          <Box marginTop={1}>
            <Text color={theme?.colors?.text.secondary}>
              {enabledOptions.length > limit && '↑/↓ to navigate, '}
              Space/←/→ to toggle, Enter to submit, Esc to cancel
              {validationError && (
                <Text color={theme?.colors?.error}>
                  {' '}({validationError})
                </Text>
              )}
            </Text>
          </Box>
          
          {selectedValues.size > 0 && (
            <Box marginTop={1}>
              <Text>Selected: {Array.from(selectedValues).map(v => 
                options.find(o => o.value === v)?.label || String(v)
              ).join(', ')}</Text>
            </Box>
          )}
        </Box>
      )}
    </BasePrompt>
  );
};

export default MultiSelectPrompt;
