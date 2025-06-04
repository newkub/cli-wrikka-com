export const useColor = () => {
  const isColorSupported = true;

  const createColor = (open: number, close: number) => {
    return (text: string) => {
      if (!isColorSupported) return text;
      return `\x1b[${open}m${text}\x1b[${close}m`;
    };
  };

  return {
    // Text styles
    bold: createColor(1, 22),
    italic: createColor(3, 23),
    underline: createColor(4, 24),

    // Text colors
    black: createColor(30, 39),
    red: createColor(31, 39),
    green: createColor(32, 39),
    yellow: createColor(33, 39),
    blue: createColor(34, 39),
    magenta: createColor(35, 39),
    cyan: createColor(36, 39),
    white: createColor(37, 39),

    // Background colors
    bgBlack: createColor(40, 49),
    bgRed: createColor(41, 49),
    bgGreen: createColor(42, 49),
    bgYellow: createColor(43, 49),
    bgBlue: createColor(44, 49),
    bgMagenta: createColor(45, 49),
    bgCyan: createColor(46, 49),
    bgWhite: createColor(47, 49),
  };
};