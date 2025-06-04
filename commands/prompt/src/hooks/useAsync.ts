import { State } from '../utils/state';

type Status = 'idle' | 'pending' | 'success' | 'error';
type UnsubscribeFn = () => void;

type AsyncResult<T> = {
  status: Status;
  value: T | null;
  error: Error | null;
};

type AsyncOptions = {
  immediate?: boolean;
};

export function createAsync<T, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: AsyncOptions = {}
) {
  const { immediate = false } = options;
  const state = new State<AsyncResult<T>>({
    status: 'idle',
    value: null,
    error: null,
  });

  const execute = async (...args: Args): Promise<T> => {
    state.set(prev => ({
      ...prev,
      status: 'pending',
      value: null,
      error: null,
    }));
    
    try {
      const result = await asyncFunction(...args);
      state.set({
        status: 'success',
        value: result,
        error: null,
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      state.set({
        status: 'error',
        value: null,
        error,
      });
      throw error;
    }
  };

  // Immediate execution if needed
  if (immediate) {
    execute().catch(() => {});
  }

  const subscribe = (handler: (result: AsyncResult<T>) => void): UnsubscribeFn => {
    return state.subscribe(handler);
  };

  return {
    execute,
    subscribe,
    get state() {
      return state.get();
    },
  };
}
