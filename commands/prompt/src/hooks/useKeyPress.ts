type EventTargetType = 'document' | 'window' | HTMLElement | null;
type EventType = 'keydown' | 'keyup' | 'keypress';
type UnsubscribeFn = () => void;

type KeyPressOptions = {
  target?: EventTargetType;
  event?: EventType;
  preventDefault?: boolean;
  stopPropagation?: boolean;
};

export function onKeyPress(
  targetKey: string | string[],
  handler: (event: KeyboardEvent) => void,
  options: KeyPressOptions = {}
): UnsubscribeFn {
  const {
    target = 'document',
    event = 'keydown',
    preventDefault = false,
    stopPropagation = false,
  } = options;

  const eventListener = (event: KeyboardEvent) => {
    const keys = Array.isArray(targetKey) ? targetKey : [targetKey];
    const isTargetKey = keys.some(key => 
      event.key === key || event.code === `Key${key.toUpperCase()}`
    );
    
    if (isTargetKey) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      handler(event);
    }
  };

  const targetElement = 
    target === 'document' ? document :
    target === 'window' ? window :
    target;

  if (!targetElement) {
    return () => {};
  }

  // @ts-ignore - TypeScript doesn't like the event listener types
  targetElement.addEventListener(event, eventListener);
  
  return () => {
    // @ts-ignore - TypeScript doesn't like the event listener types
    targetElement.removeEventListener(event, eventListener);
  };
}
