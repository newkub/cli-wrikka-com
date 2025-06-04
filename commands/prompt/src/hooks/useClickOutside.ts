type UnsubscribeFn = () => void;
type ClickOutsideHandler = (event: MouseEvent | TouchEvent) => void;

export function onClickOutside(
  element: HTMLElement,
  handler: ClickOutsideHandler
): UnsubscribeFn {
  const listener = (event: MouseEvent | TouchEvent) => {
    if (!element.contains(event.target as Node)) {
      handler(event);
    }
  };

  document.addEventListener('mousedown', listener);
  document.addEventListener('touchstart', listener);

  return () => {
    document.removeEventListener('mousedown', listener);
    document.removeEventListener('touchstart', listener);
  };
}
