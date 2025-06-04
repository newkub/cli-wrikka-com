import { State } from '../utils/state';

type UnsubscribeFn = () => void;

export function createToggle(initialState = false): [() => boolean, () => void, (value: boolean) => void, (handler: (value: boolean) => void) => UnsubscribeFn] {
  const state = new State(initialState);
  
  const get = () => state.get();
  const toggle = () => state.set(prev => !prev);
  const set = (value: boolean) => state.set(value);
  const subscribe = (handler: (value: boolean) => void) => state.subscribe(handler);
  
  return [get, toggle, set, subscribe];
}
