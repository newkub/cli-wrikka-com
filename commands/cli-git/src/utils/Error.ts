import { Effect } from 'effect';
import pc from 'picocolors';
import { outro } from '@clack/prompts';

type ErrorCode = 
  | 'WORKFLOW_ERROR'
  | 'GIT_ERROR'
  | 'VALIDATION_ERROR'
  | 'CONFIG_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

interface AppError {
  message: string;
  code: ErrorCode;
  isOperational: boolean;
  metadata?: Record<string, unknown>;
}

const createError = (
  message: string, 
  code: ErrorCode = 'UNKNOWN_ERROR',
  isOperational = true,
  metadata?: Record<string, unknown>
): AppError => ({
  message,
  code,
  isOperational,
  metadata
});

const logError = (error: AppError) => {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    ...error
  };
  
  console.error(pc.red('[ERROR]'), errorLog);
  if (error.metadata) {
    console.error(pc.yellow('Metadata:'), error.metadata);
  }
};

const tryCatch = <T>(
  fn: () => Promise<T> | T,
  context?: { code?: ErrorCode; metadata?: Record<string, unknown> }
): Effect.Effect<T, AppError, never> => {
  return Effect.tryPromise({
    try: async () => await fn(),
    catch: (e: unknown) => {
      const error = createError(
        e instanceof Error ? e.message : String(e),
        context?.code || 'UNKNOWN_ERROR',
        true,
        context?.metadata
      );
      logError(error);
      return error;
    }
  });
};

const handleEither = <T>(
  effect: Effect.Effect<T, AppError, never>
): Promise<T> => {
  return Effect.runPromise(
    Effect.catchAll(effect, (error: AppError) => {
      logError(error);
      outro(pc.red(`Error [${error.code}]: ${error.message}`));
      return Effect.sync(() => process.exit(error.isOperational ? 1 : 0)) as Effect.Effect<never, never, never>;
    })
  );
};

export {
  type ErrorCode,
  type AppError,
  createError,
  logError,
  tryCatch,
  handleEither
};
