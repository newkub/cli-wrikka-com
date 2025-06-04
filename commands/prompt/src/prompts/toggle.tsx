import React from 'react';
import { Box, Text, useInput } from 'ink';
import { BasePrompt, type Theme } from './base';

type TogglePromptProps = {
  message: string;
  initialValue?: boolean;
  active?: string;
  inactive?: string;
  required?: boolean;
  theme?: Partial<Theme>;
  onSubmit: (value: boolean) => void;
  onCancel: () => void;
};

export const TogglePrompt: React.FC<TogglePromptProps> = ({
  message,
  initialValue = false,
  active = 'Yes',
  inactive = 'No',
  required = false,
  theme,
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = React.useState(initialValue);
  
  // Handle keyboard input
  useInput((input, key) => {
    if (key.return || key.escape) return; // Handled by BasePrompt
    
    if (key.leftArrow || key.rightArrow || key.space) {
      setValue(prev => !prev);
    }
  });
  
  return (
    <BasePrompt
      message={message}
      defaultValue={initialValue}
      required={required}
      theme={theme}
      onSubmit={() => onSubmit(value)}
      onCancel={onCancel}
    >
      {({ isFocused }) => (
        <Box>
          <Box
            borderStyle="round"
            borderColor={isFocused ? theme?.colors?.border.focus : theme?.colors?.border.default}
            paddingX={1}
            onPress={() => setValue(prev => !prev)}
          >
            <Text
              color={value ? theme?.colors?.success : theme?.colors?.text.secondary}
              bold={isFocused}
            >
              {value ? active : inactive}
            </Text>
          </Box>
          
          <Box marginLeft={2}>
            <Text color={theme?.colors?.text.secondary}>
              {isFocused ? '←/→ or Space to toggle, Enter to confirm' : ''}
            </Text>
          </Box>
        </Box>
      )}
    </BasePrompt>
  );
};

export default TogglePrompt;
