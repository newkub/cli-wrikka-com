import { State } from '../utils/state';
import { debounce } from '../utils/debounce';

type UnsubscribeFn = () => void;

export function createDebouncer<T>(
  initialValue: T, 
  delay: number
): [(value: T) => void, (handler: (value: T) => void) => UnsubscribeFn] {
  const state = new State(initialValue);
  const debouncedSet = debounce((value: T) => {
    state.set(value);
  }, delay);

  const set = (value: T) => {
    debouncedSet(value);
  };

  const subscribe = (handler: (value: T) => void) => {
    return state.subscribe(handler);
  };

  return [set, subscribe];
}
