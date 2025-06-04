import { State } from '../utils/state';

type UnsubscribeFn = () => void;

export function createPreviousTracker<T>(initialValue: T): [() => T | undefined, (value: T) => void, (handler: (value: T | undefined) => void) => UnsubscribeFn] {
  let previous: T | undefined;
  let current = initialValue;
  const state = new State<{ previous?: T; current: T }>({ previous, current });

  const get = () => previous;
  
  const set = (newValue: T) => {
    previous = current;
    current = newValue;
    state.set({ previous, current });
  };

  const subscribe = (handler: (value: T | undefined) => void): UnsubscribeFn => {
    return state.subscribe(({ previous }) => handler(previous));
  };

  return [get, set, subscribe];
}
