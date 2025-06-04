import React from 'react';
import { Text } from 'ink';
import { BasePrompt, type Theme } from './base';

type ConfirmPromptProps = {
  message: string;
  initialValue?: boolean;
  required?: boolean;
  theme?: Partial<Theme>;
  onSubmit: (value: boolean) => void;
  onCancel: () => void;
};

export const ConfirmPrompt: React.FC<ConfirmPromptProps> = ({
  message,
  initialValue = false,
  required = false,
  theme,
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = React.useState(initialValue);
  
  return (
    <BasePrompt
      message={`${message} ${value ? '(Y/n)' : '(y/N)'}`}
      defaultValue={initialValue}
      required={required}
      theme={theme}
      onSubmit={() => onSubmit(value)}
      onCancel={onCancel}
    >
      {({ isFocused, setValue: setPromptValue }) => (
        <Text>
          <Text
            color={value ? 'green' : 'gray'}
            inverse={isFocused && value}
            onPress={() => {
              setValue(true);
              setPromptValue(true);
            }}
          >
            Yes
          </Text>
          <Text> / </Text>
          <Text
            color={!value ? 'red' : 'gray'}
            inverse={isFocused && !value}
            onPress={() => {
              setValue(false);
              setPromptValue(false);
            }}
          >
            No
          </Text>
        </Text>
      )}
    </BasePrompt>
  );
};

export default ConfirmPrompt;
