import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Type definitions
interface BaseImageOptions {
  prompt: string;
  model?: string;
  size?: string;
  quality?: 'standard' | 'hd';
}

interface OpenAIImageOptions extends BaseImageOptions {
  provider: 'openai';
}

interface GeminiImageOptions extends BaseImageOptions {
  provider: 'gemini';
}

type GenImageOptions = OpenAIImageOptions | GeminiImageOptions;

// Helper functions
const createOpenAIClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const createGeminiClient = () => new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Generator functions
const generateWithOpenAI = async (options: OpenAIImageOptions): Promise<string[]> => {
  const client = createOpenAIClient();
  const response = await client.images.generate({
    model: options.model || 'dall-e-3',
    prompt: options.prompt,
    size: (options.size || '1024x1024') as '1024x1024' | '1024x1792' | '1792x1024',
    quality: options.quality || 'standard',
    n: 1,
  });
  if (!response.data) return [];
  return response.data.map(img => img.url || '').filter(Boolean);
};

const generateWithGemini = async (options: GeminiImageOptions): Promise<string[]> => {
  const client = createGeminiClient();
  const model = client.getGenerativeModel({ model: options.model || 'gemini-pro-vision' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: options.prompt }] }]
  });
  return [result.response.text()];
};

// Main function
const generateImage = async (options: GenImageOptions): Promise<string[]> => {
  try {
    return options.provider === 'openai' 
      ? await generateWithOpenAI(options)
      : await generateWithGemini(options);
  } catch (error) {
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export {
  generateImage,
  type BaseImageOptions,
  type OpenAIImageOptions,
  type GeminiImageOptions,
  type GenImageOptions
};