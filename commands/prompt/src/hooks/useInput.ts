import { useEffect } from 'react';
import { useStdin } from 'ink';

type Key = {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  return: boolean;
  escape: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  pageDown: boolean;
  pageUp: boolean;
  home: boolean;
  end: boolean;
};

type InputHandler = (input: string, key: Key) => void;

type UseInputOptions = {
  isActive?: boolean;
};

export function useInput(
  inputHandler: InputHandler,
  options: UseInputOptions = {}
) {
  const { stdin, setRawMode } = useStdin();
  const { isActive = true } = options;

  useEffect(() => {
    if (!stdin || !isActive) return;

    setRawMode(true);

    const handleData = (data: Buffer) => {
      // Handle special keys
      const str = data.toString();
      
      // Escape sequence handling
      if (str === '\x1B[A') {
        inputHandler('', { upArrow: true } as Key);
        return;
      }
      if (str === '\x1B[B') {
        inputHandler('', { downArrow: true } as Key);
        return;
      }
      if (str === '\x1B[D') {
        inputHandler('', { leftArrow: true } as Key);
        return;
      }
      if (str === '\x1B[C') {
        inputHandler('', { rightArrow: true } as Key);
        return;
      }
      if (str === '\r' || str === '\n') {
        inputHandler('', { return: true } as Key);
        return;
      }
      if (str === '\x1B') {
        inputHandler('', { escape: true } as Key);
        return;
      }
      if (str === '\x7F') {
        inputHandler('', { backspace: true } as Key);
        return;
      }
      if (str === '\t') {
        inputHandler('', { tab: true } as Key);
        return;
      }
      if (str === '\x1B[3~') {
        inputHandler('', { delete: true } as Key);
        return;
      }
      if (str === '\x1B[1~' || str === '\x1B[H') {
        inputHandler('', { home: true } as Key);
        return;
      }
      if (str === '\x1B[4~' || str === '\x1B[F') {
        inputHandler('', { end: true } as Key);
        return;
      }
      if (str === '\x1B[5~') {
        inputHandler('', { pageUp: true } as Key);
        return;
      }
      if (str === '\x1B[6~') {
        inputHandler('', { pageDown: true } as Key);
        return;
      }

      // Regular character input
      if (str.length === 1) {
        inputHandler(str, {} as Key);
      }
    };

    stdin.on('data', handleData);

    return () => {
      stdin.off('data', handleData);
      setRawMode(false);
    };
  }, [stdin, setRawMode, inputHandler, isActive]);
}
