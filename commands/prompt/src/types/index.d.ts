// Re-export all types from the main index file
export * from './index';

declare global {
  // Add any global type augmentations here if needed
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined;
    }
  }
}
