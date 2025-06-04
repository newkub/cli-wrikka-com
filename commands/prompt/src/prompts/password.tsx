import React from 'react';
import { useInput } from 'ink';
import TextPrompt, { type TextPromptProps } from './text';

type PasswordPromptProps = Omit<TextPromptProps, 'mask' | 'placeholder'> & {
  mask?: string;
  confirm?: boolean;
};

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({
  message,
  mask = '•',
  confirm = false,
  required = true,
  validate,
  onSubmit,
  onCancel,
  ...rest
}) => {
  const [step, setStep] = React.useState<'password' | 'confirm'>('password');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  
  // Handle password submission
  const handleSubmit = (value: string) => {
    if (step === 'password') {
      if (confirm) {
        setPassword(value);
        setStep('confirm');
      } else {
        onSubmit(value);
      }
    } else {
      onSubmit(password);
    }
  };
  
  // Handle validation
  const handleValidate = async (value: string) => {
    if (step === 'password') {
      if (required && !value) {
        return 'Password is required';
      }
      
      if (validate) {
        return await validate(value);
      }
    } else {
      if (value !== password) {
        return 'Passwords do not match';
      }
    }
    
    return undefined;
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (step === 'confirm') {
      setStep('password');
      setConfirmPassword('');
    } else {
      onCancel();
    }
  };
  
  return (
    <TextPrompt
      message={step === 'password' 
        ? message 
        : 'Confirm password'}
      mask={mask}
      required={required}
      validate={handleValidate}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      {...rest}
    />
  );
};

export default PasswordPrompt;
