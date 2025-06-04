// Minimal type definitions for CLI environment
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  }
}

// Minimal DOM types needed for React
declare const process: {
  env: NodeJS.ProcessEnv;
  cwd(): string;
  exit(code?: number): never;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
};

declare const __dirname: string;
declare const __filename: string;

// Minimal DOM types
type EventTarget = {}
interface Event {
  readonly type: string;
  target: EventTarget | null;
  preventDefault(): void;
  stopPropagation(): void;
}

// Minimal HTMLElement interface for React compatibility
interface HTMLElement extends EventTarget {
  addEventListener(
    type: string,
    listener: (event: Event) => void | EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: (event: Event) => void | EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  dispatchEvent(event: Event): boolean;
}

// Minimal Document interface
declare const document: {
  createElement(tagName: string): HTMLElement;
  addEventListener(
    type: string,
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: (event: Event) => void,
    options?: boolean | EventListenerOptions
  ): void;
};

// Minimal Window interface
declare const window: {
  addEventListener(
    type: string,
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: (event: Event) => void,
    options?: boolean | EventListenerOptions
  ): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
};

// Minimal Event interfaces
interface UIEvent extends Event {}
interface MouseEvent extends UIEvent {
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly button: number;
  readonly buttons: number;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  getModifierState(keyArg: string): boolean;
}

interface KeyboardEvent extends UIEvent {
  readonly key: string;
  readonly code: string;
  readonly keyCode: number;
  readonly which: number;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly repeat: boolean;
  readonly isComposing: boolean;
  getModifierState(keyArg: string): boolean;
  readonly location: number;
  readonly charCode: number;
}

interface TouchEvent extends UIEvent {
  readonly altKey: boolean;
  readonly changedTouches: TouchList;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly targetTouches: TouchList;
  readonly touches: TouchList;
}

interface TouchList {
  readonly length: number;
  item(index: number): Touch | null;
  [index: number]: Touch;
}

interface Touch {
  readonly identifier: number;
  readonly target: EventTarget;
  readonly screenX: number;
  readonly screenY: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly rotationAngle: number;
  readonly force: number;
}
