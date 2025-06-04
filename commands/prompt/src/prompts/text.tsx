import React from 'react';
import { Text, useInput, useApp } from 'ink';
import { BasePrompt, type Theme } from './base';

type TextPromptProps = {
  message: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  mask?: string;
  theme?: Partial<Theme>;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export const TextPrompt: React.FC<TextPromptProps> = ({
  message,
  defaultValue = '',
  placeholder = '',
  required = false,
  mask,
  theme,
  onSubmit,
  onCancel,
}) => {
  const { exit } = useApp();
  const [value, setValue] = React.useState(defaultValue);
  const [cursorOffset, setCursorOffset] = React.useState(defaultValue.length);
  
  // Handle text input
  useInput((input, key) => {
    if (key.return) return; // Handled by BasePrompt
    if (key.escape) return; // Handled by BasePrompt
    if (key.delete || key.backspace) {
      // Handle backspace and delete
      if (cursorOffset > 0) {
        const newValue = value.slice(0, cursorOffset - 1) + value.slice(cursorOffset);
        setValue(newValue);
        setCursorOffset(Math.max(0, cursorOffset - 1));
      }
    } else if (key.leftArrow) {
      // Move cursor left
      setCursorOffset(Math.max(0, cursorOffset - 1));
    } else if (key.rightArrow) {
      // Move cursor right
      setCursorOffset(Math.min(value.length, cursorOffset + 1));
    } else if (key.upArrow || key.downArrow) {
      // Ignore up/down arrows
      return;
    } else if (input) {
      // Insert typed character
      const newValue = value.slice(0, cursorOffset) + input + value.slice(cursorOffset);
      setValue(newValue);
      setCursorOffset(cursorOffset + input.length);
    }
  });

  // Handle cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Move cursor to the end of the line when unmounting
      process.stdout.write('\x1B[?25h'); // Show cursor
    };
  }, []);

  // Display value with cursor
  const displayValue = React.useMemo(() => {
    if (mask && value) {
      return mask.repeat(value.length);
    }
    return value;
  }, [value, mask]);

  return (
    <BasePrompt
      message={message}
      defaultValue={defaultValue}
      required={required}
      theme={theme}
      onSubmit={() => onSubmit(value)}
      onCancel={onCancel}
    >
      {({ isFocused }) => (
        <Text>
          {isFocused ? (
            <>
              {displayValue.slice(0, cursorOffset)}
              <Text inverse>{
                displayValue[cursorOffset] || ' '
              }</Text>
              {displayValue.slice(cursorOffset + 1)}
              {displayValue.length === cursorOffset && (
                <Text inverse> </Text>
              )}
            </>
          ) : (
            displayValue || (
              <Text color="gray">{placeholder}</Text>
            )
          )}
        </Text>
      )}
    </BasePrompt>
  );
};

export default TextPrompt;
