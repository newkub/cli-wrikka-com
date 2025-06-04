type EventHandler = (...args: unknown[]) => void;
type UnsubscribeFn = () => void;

export class EventEmitter {
  private events: Record<string, EventHandler[]> = {};

  on(event: string, handler: EventHandler): UnsubscribeFn {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(h => h !== handler);
  }

  emit(event: string, ...args: unknown[]): void {
    const handlers = this.events[event];
    if (!handlers) return;
    for (const handler of handlers) {
      handler(...args);
    }
  }
}
