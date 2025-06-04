# AI Module

This module provides a unified interface for interacting with various AI services including text and image generation.

## Installation
```bash
npm install @wrikka/ai
```

## Features

### Text Generation
Supported providers:
- OpenAI (GPT models)
- Anthropic (Claude models)
- Gemini (Google AI models)

### Image Generation
Supported providers:
- OpenAI (DALL-E models)
- Gemini (Google AI models)

## Usage

### Basic Usage
```typescript
import { useAI } from '@wrikka/ai';

const ai = useAI();

// Text generation
const text = await ai.generateText({
  provider: 'openai',
  prompt: 'Hello, world!',
  model: 'gpt-3.5-turbo',
  temperature: 0.7
});

// Image generation
const images = await ai.generateImage({
  provider: 'openai',
  prompt: 'A cute cat',
  model: 'dall-e-3',
  size: '1024x1024'
});
```

### Standalone Functions
```typescript
import { generateText, generateImage } from '@wrikka/ai';

// Text generation
const text = await generateText({
  provider: 'anthropic',
  prompt: 'Tell me a joke',
  model: 'claude-3-haiku'
});

// Image generation
const images = await generateImage({
  provider: 'gemini',
  prompt: 'A futuristic city'
});
```

## API Reference

### `useAI()`
Returns an object with two methods:
- `generateText(options: GenTextOptions): Promise<string>`
- `generateImage(options: GenImageOptions): Promise<string[]>`

### `generateText(options: GenTextOptions)`
Generate text using the specified AI provider.

**Options:**
- `provider`: 'openai' | 'anthropic' | 'gemini' (required)
- `prompt`: string (required)
- `model`: string (optional)
- `maxTokens`: number (optional)
- `temperature`: number (optional)

### `generateImage(options: GenImageOptions)`
Generate images using the specified AI provider.

**Options:**
- `provider`: 'openai' | 'gemini' (required)
- `prompt`: string (required)
- `model`: string (optional)
- `size`: string (optional)
- `quality`: 'standard' | 'hd' (optional)

## Environment Variables
- `OPENAI_API_KEY`: Required for OpenAI services
- `ANTHROPIC_API_KEY`: Required for Anthropic services
- `GEMINI_API_KEY`: Required for Gemini services