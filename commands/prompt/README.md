# CLI Prompt Library

## Introduction

A powerful and flexible CLI prompt library inspired by clackprompt, providing a rich set of interactive components for building command-line applications with ease. This library offers a clean and intuitive API for creating various types of prompts, handling user input, and displaying information in a user-friendly way.

## Features

- 🎨 **Rich Interactive Prompts**: Text input, confirmations, selections, and more
- 🚀 **Task Management**: Run and track multiple tasks with progress indicators
- 📊 **Data Display**: Beautiful tables and formatted output
- 🔍 **Search & Filter**: Interactive search with customizable results
- 📝 **Form Handling**: Multi-step forms with validation
- 🔒 **Secure Input**: Password fields with masking
- 📂 **File System**: File and directory selection
- 🎚️ **Progress Tracking**: Visual progress bars and spinners
- 📋 **Logging**: Structured logging with different levels
- 🎛️ **Customization**: Highly customizable components

## Installation

```bash
npm install @wrikka/cli
# or
yarn add @wrikka/cli
```

## Basic Usage

```javascript
import { 
  text, 
  confirm, 
  select, 
  multiselect, 
  spinner, 
  tasks, 
  logger, 
  table 
} from '@wrikka/cli';

// Basic text input
const name = await text({
  message: 'What is your name?',
  placeholder: 'Enter your name',
  validate: (value) => value.length < 2 ? 'Name must be at least 2 characters' : undefined
});
```

```javascript
import { text, confirm, select, multiselect, spinner, tasks, logger, table } from '@wrikka/cli';

// Text input
const name = await text({
  message: 'What is your name?',
  placeholder: 'Enter your name',
  validate: (value) => value.length < 2 ? 'Name must be at least 2 characters' : undefined
});

// Confirmation
const proceed = await confirm({
  message: 'Do you want to continue?'
});

// Selection
const color = await select({
  message: 'Choose your favorite color',
  options: [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' }
  ]
});

// Multi-selection
const frameworks = await multiselect({
  message: 'Select frameworks you know',
  options: [
    { value: 'vue', label: 'Vue.js' },
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' }
  ]
});

// Spinner
const spin = spinner('Processing your request...');
await new Promise(resolve => setTimeout(resolve, 2000));
spin.stop('Request completed successfully');

// Tasks
await tasks([
  {
    title: 'Installing dependencies',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return 'Dependencies installed';
    }
  },
  {
    title: 'Building project',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return 'Build successful';
    }
  }
]);

// Table display
table([
  ['Name', 'Age', 'Role'],
  ['John Doe', '28', 'Developer'],
  ['Jane Smith', '34', 'Designer'],
  ['Mike Johnson', '42', 'Manager']
], {
  border: true,
  header: true
});

// Search functionality
const searchResults = await search({
  message: 'Search for a package',
  placeholder: 'Type to search...',
  limit: 5,
  emptyText: 'No results found',
  onSearch: async (query) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const allItems = [
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxtjs', 'express', 'mongoose'
    ];
    return allItems.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    );
  },
  renderItem: (item, { isSelected, isHighlighted }) => {
    return {
      label: item,
      value: item,
      style: isSelected ? 'bg-blue-500 text-white' : ''
    };
  }
});

```

## Input Components

### Text Input

```javascript
const name = await text({
  message: 'What is your name?',
  placeholder: 'Enter your name',
  validate: (value) => value.length < 2 ? 'Name must be at least 2 characters' : undefined
});
```

### Confirmation

```javascript
const proceed = await confirm({
  message: 'Do you want to continue?',
  initialValue: true
});
```

### Selection

```javascript
const color = await select({
  message: 'Choose your favorite color',
  options: [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' }
  ]
});
```

### Multi-selection

```javascript
const frameworks = await multiselect({
  message: 'Select frameworks you know',
  options: [
    { value: 'vue', label: 'Vue.js' },
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' }
  ]
});
```

### Toggle Input

```javascript
const useTypeScript = await toggle({
  message: 'Use TypeScript?', 
  initialValue: true
});
```

### Password Input

```javascript
const password = await password({
  message: 'Enter your password',
  mask: '•',
  validate: (value) => value.length >= 8 ? undefined : 'Password must be at least 8 characters'
});
```

### File Selection

```javascript
const filePath = await fileSelect({
  message: 'Select a file',
  basePath: process.cwd(),
  type: 'file',
  extensions: ['.js', '.ts', '.json']
});
```

### Auto-complete

```javascript
const framework = await autocomplete({
  message: 'Select a framework',
  source: async (query) => {
    const frameworks = ['React', 'Vue', 'Angular', 'Svelte', 'Solid'];
    if (!query) return frameworks;
    return frameworks.filter(f => 
      f.toLowerCase().includes(query.toLowerCase())
    );
  }
});
```

## Progress Indicators

### Progress Bar

```javascript
const progressBar = progress({
  total: 100,
  width: 40,
  title: 'Processing',
  format: '{bar} {percentage}% | {value}/{total}'
});

// Update progress
for (let i = 0; i <= 100; i += 10) {
  await new Promise(resolve => setTimeout(resolve, 200));
  progressBar.update(i);
}
progressBar.stop('Processing complete!');
```

### Spinner

```javascript
const spin = spinner('Processing your request...');
await new Promise(resolve => setTimeout(resolve, 2000));
spin.stop('Request completed successfully');

// Custom spinner
const customSpin = spinner({
  message: 'Custom spinner...',
  spinner: {
    interval: 100,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  }
});

await new Promise(resolve => setTimeout(resolve, 2000));
customSpin.stop('Custom spinner stopped');
```

## Task Management

```javascript
await tasks([
  {
    title: 'Installing dependencies',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return 'Dependencies installed';
    }
  },
  {
    title: 'Building project',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return 'Build successful';
    }
  }
]);
```

## Data Display

### Table

```javascript
table([
  ['Name', 'Age', 'Role'],
  ['John Doe', '28', 'Developer'],
  ['Jane Smith', '34', 'Designer'],
  ['Mike Johnson', '42', 'Manager']
], {
  border: true,
  header: true
});
```

## Search Functionality

```javascript
const searchResults = await search({
  message: 'Search for a package',
  placeholder: 'Type to search...',
  limit: 5,
  emptyText: 'No results found',
  onSearch: async (query) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const allItems = [
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxtjs', 'express', 'mongoose'
    ];
    return allItems.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    );
  },
  renderItem: (item, { isSelected, isHighlighted }) => ({
    label: item,
    value: item,
    style: isSelected ? 'bg-blue-500 text-white' : ''
  })
});
```

## Multi-step Forms

```javascript
const answers = await form([
  {
    type: 'text',
    name: 'name',
    message: 'What is your name?',
    validate: (value) => !!value || 'Name is required'
  },
  {
    type: 'select',
    name: 'role',
    message: 'What is your role?',
    choices: [
      { title: 'Developer', value: 'dev' },
      { title: 'Designer', value: 'designer' },
      { title: 'Manager', value: 'manager' }
    ]
  },
  {
    type: 'multiselect',
    name: 'skills',
    message: 'Select your skills',
    choices: [
      { title: 'JavaScript', value: 'js' },
      { title: 'TypeScript', value: 'ts' },
      { title: 'Node.js', value: 'node' },
      { title: 'React', value: 'react' },
      { title: 'Vue', value: 'vue' }
    ]
  }
]);
```

## Logging

```javascript
// Basic logging
logger.log('This is a log message');
logger.info('This is an info message');
logger.success('Operation completed successfully!');
logger.warn('This is a warning message');
logger.error('This is an error message');

// Grouped logging
logger.group('Installation');
logger.log('Installing dependencies...');
logger.log('Downloading packages...');
logger.groupEnd();
```

## License

MIT
const progressBar = progress({
  total: 100,
  width: 40,
  title: 'Processing',
  format: '{bar} {percentage}% | {value}/{total}'
});

// Update progress in a loop
for (let i = 0; i <= 100; i += 10) {
  await new Promise(resolve => setTimeout(resolve, 200));
  progressBar.update(i);
}
progressBar.stop('Processing complete!');

// Toggle input
const useTypeScript = await toggle({
  message: 'Use TypeScript?', 
  initialValue: true
});

// Password input
const password = await password({
  message: 'Enter your password',
  mask: '•',
  validate: (value) => value.length >= 8 ? undefined : 'Password must be at least 8 characters'
});

// File/folder selection
const filePath = await fileSelect({
  message: 'Select a file',
  basePath: process.cwd(),
  type: 'file',
  extensions: ['.js', '.ts', '.json']
});

// Auto-complete input
const framework = await autocomplete({
  message: 'Select a framework',
  source: async (query) => {
    const frameworks = ['React', 'Vue', 'Angular', 'Svelte', 'Solid'];
    if (!query) return frameworks;
    return frameworks.filter(f => 
      f.toLowerCase().includes(query.toLowerCase())
    );
  }
});

// Grouped logging
logger.group('Installation');
logger.log('Installing dependencies...');
logger.log('Downloading packages...');
logger.groupEnd();

// Warning and error logging
logger.warn('This is a warning message');
logger.error('This is an error message');

// Spinner with custom styles
const customSpin = spinner({
  message: 'Custom spinner...',
  spinner: {
    interval: 100,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  }
});

await new Promise(resolve => setTimeout(resolve, 2000));
customSpin.stop('Custom spinner stopped');

// Multi-step form
const answers = await form([
  {
    type: 'text',
    name: 'name',
    message: 'What is your name?',
    validate: (value) => !!value || 'Name is required'
  },
  {
    type: 'select',
    name: 'role',
    message: 'What is your role?',
    choices: [
      { title: 'Developer', value: 'dev' },
      { title: 'Designer', value: 'designer' },
      { title: 'Manager', value: 'manager' }
    ]
  },
  {
    type: 'multiselect',
    name: 'skills',
    message: 'Select your skills',
    choices: [
      { title: 'JavaScript', value: 'js' },
      { title: 'TypeScript', value: 'ts' },
      { title: 'Node.js', value: 'node' },
      { title: 'React', value: 'react' },
      { title: 'Vue', value: 'vue' }
    ]
  }
]);

logger.success('Form submitted:', answers);