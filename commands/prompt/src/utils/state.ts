import { EventEmitter } from './event-emitter';

type UnsubscribeFn = () => void;

export class State<T> {
  private value: T;
  private emitter: EventEmitter;

  constructor(initialValue: T) {
    this.value = initialValue;
    this.emitter = new EventEmitter();
  }

  get(): T {
    return this.value;
  }

  set(newValue: T | ((prev: T) => T)): void {
    const nextValue = typeof newValue === 'function'
      ? (newValue as (prev: T) => T)(this.value)
      : newValue;
    
    if (Object.is(this.value, nextValue)) return;
    
    this.value = nextValue;
    this.emitter.emit('change', this.value);
  }

  subscribe(handler: (value: T) => void): UnsubscribeFn {
    // Immediately call with current value
    handler(this.value);
    // Subscribe to changes
    return this.emitter.on('change', handler);
  }
}
