import type React from 'react';
import { useEffect, useState } from 'react';
import { Text } from 'ink';

type SpinnerProps = {
  /**
   * Type of spinner
   * @default 'dots'
   */
  type?: 'dots' | 'dots2' | 'dots3' | 'dots4' | 'dots5' | 'dots6' | 'dots7' | 'dots8' | 'dots9' | 'dots10' | 'dots11' | 'dots12' | 'line' | 'line2' | 'pipe' | 'simpleDots' | 'simpleDotsScrolling' | 'star' | 'star2' | 'flip' | 'hamburger' | 'growVertical' | 'growHorizontal' | 'balloon' | 'balloon2' | 'noise' | 'bounce' | 'boxBounce' | 'boxBounce2' | 'triangle' | 'arc' | 'circle' | 'squareCorners' | 'circleQuarters' | 'circleHalves' | 'squish' | 'toggle' | 'toggle2' | 'toggle3' | 'toggle4' | 'toggle5' | 'toggle6' | 'toggle7' | 'toggle8' | 'toggle9' | 'toggle10' | 'toggle11' | 'toggle12' | 'toggle13' | 'arrow' | 'arrow2' | 'arrow3' | 'bouncingBar' | 'bouncingBall' | 'smiley' | 'monkey' | 'hearts' | 'clock' | 'earth' | 'moon' | 'runner' | 'pong' | 'shark' | 'dqpb' | 'weather' | 'christmas';
  /**
   * Text to display after the spinner
   */
  label?: string;
  /**
   * Color of the spinner
   * @default 'blue'
   */
  _color?: string;
  /**
   * Speed of the spinner in milliseconds
   * @default 150
   */
  speed?: number;
};

const SPINNERS: Record<string, string[]> = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  dots2: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  dots3: ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'],
  dots4: ['⠄', '⠆', '⠇', '⠋', '⠙', '⠸', '⠰', '⠠', '⠰', '⠸', '⠙', '⠋', '⠇', '⠆'],
  dots5: ['⠋', '⠙', '⠚', '⠒', '⠂', '⠂', '⠒', '⠲', '⠴', '⠦', '⠖', '⠒', '⠐', '⠐', '⠒', '⠓', '⠋'],
  dots6: ['⠁', '⠉', '⠙', '⠚', '⠒', '⠂', '⠂', '⠒', '⠲', '⠴', '⠤', '⠄', '⠄', '⠤', '⠴', '⠲', '⠒', '⠂', '⠂', '⠒', '⠚', '⠙', '⠉', '⠁'],
  dots7: ['⠈', '⠉', '⠋', '⠓', '⠒', '⠐', '⠐', '⠒', '⠖', '⠦', '⠤', '⠠', '⠠', '⠤', '⠦', '⠖', '⠒', '⠐', '⠐', '⠒', '⠓', '⠋', '⠉', '⠈'],
  dots8: ['⠁', '⠁', '⠉', '⠙', '⠚', '⠒', '⠂', '⠂', '⠒', '⠲', '⠴', '⠤', '⠄', '⠄', '⠤', '⠠', '⠠', '⠤', '⠦', '⠖', '⠒', '⠐', '⠐', '⠒', '⠓', '⠋', '⠉', '⠈', '⠈'],
  dots9: ['⢹', '⢺', '⢼', '⣸', '⣇', '⡧', '⡗', '⡏'],
  dots10: ['⢄', '⢂', '⢁', '⡁', '⡈', '⡐', '⡠'],
  dots11: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
  dots12: ['⢀⠀', '⡀⠀', '⠄⠀', '⢂⠀', '⡂⠀', '⠅⠀', '⡃⠀', '⠍⠀', '⡉⠁', '⢉⠁', '⠉⠉', '⠉⠂', '⠉⢀', '⠈⠩', '⠈⡉', '⠋⠁', '⠋⠀', '⠍⢀', '⡋⠀', '⡍⠀', '⡉⠀', '⢈⠀', '⢂⠀', '⡂⠀'],
  line: ['-', '\\', '|', '/'],
  line2: ['⠂', '-', '–', '—', '–', '-'],
  pipe: ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'],
  simpleDots: ['.  ', '.. ', '...', '   '],
  simpleDotsScrolling: ['.  ', '.. ', '...', ' ..', '  .', '   '],
  star: ['✶', '✵', '✴', '✳', '✺', '✹', '✸', '✷', '✶'],
  star2: ['+', 'x', '*'],
  flip: ['_', '_', '_', '-', '`', '`', '\'', '´', '-', '_', '_', '_'],
  hamburger: ['☱', '☲', '☴', '☲'],
  growVertical: ['▁', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃'],
  growHorizontal: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '▊', '▋', '▌', '▍', '▎'],
  balloon: [' ', '.', 'o', 'O', '@', '*', ' '],
  balloon2: ['.', 'o', 'O', '°', 'O', 'o', '.'],
  noise: ['▓', '▒', '░'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  boxBounce: ['▖', '▘', '▝', '▗'],
  boxBounce2: ['▌', '▀', '▐', '▄'],
  triangle: ['◢', '◣', '◤', '◥'],
  arc: ['◜', '◠', '◝', '◞', '◡', '◟'],
  circle: ['◡', '⊙', '◠'],
  squareCorners: ['◰', '◳', '◲', '◱'],
  circleQuarters: ['◴', '◷', '◶', '◵'],
  circleHalves: ['◐', '◓', '◑', '◒'],
  squish: ['╫', '╪'],
  toggle: ['⊶', '⊷'],
  toggle2: ['▫', '▪'],
  toggle3: ['□', '■'],
  toggle4: ['■', '□', '▪', '▫'],
  toggle5: ['▮', '▯'],
  toggle6: ['●', '○'],
  toggle7: ['⦿', '○'],
  toggle8: ['◉', '◎'],
  toggle9: ['㊂', '㊀', '㊁'],
  toggle10: ['⦾', '⦿'],
  toggle11: ['◉', '◯'],
  toggle12: ['⭘', '⭕'],
  toggle13: ['⭕', '⭖'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  arrow2: ['⬆️ ', '↗️ ', '➡️ ', '↘️ ', '⬇️ ', '↙️ ', '⬅️ ', '↖️ '],
  arrow3: ['▹▹▹▹▹', '▸▹▹▹▹', '▹▸▹▹▹', '▹▹▸▹▹', '▹▹▹▸▹', '▹▹▹▹▸'],
  bouncingBar: ['[    ]', '[=   ]', '[==  ]', '[=== ]', '[ ===]', '[  ==]', '[   =]', '[    ]', '[   =]', '[  ==]', '[ ===]', '[====]', '[=== ]', '[==  ]', '[=   ]'],
  bouncingBall: ['( ●    )', '(  ●   )', '(   ●  )', '(    ● )', '(     ●)', '(    ● )', '(   ●  )', '(  ●   )', '( ●    )', '(●     )'],
  smiley: ['😄', '😝'],
  monkey: ['🙈', '🙈', '🙉', '🙊', '🙈', '🙉', '🙊'],
  hearts: ['💛', '💙', '💜', '💚', '❤️'],
  clock: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'],
  earth: ['🌍', '🌎', '🌏'],
  moon: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
  runner: ['🚶', '🏃'],
  pong: ['▐⠂       ▌', '▐⠈       ▌', '▐ ⠂      ▌', '▐ ⠠      ▌', '▐  ⡀     ▌', '▐  ⠠     ▌', '▐   ⠂    ▌', '▐   ⠈    ▌', '▐    ⠂   ▌', '▐    ⠠   ▌', '▐     ⡀  ▌', '▐     ⠠  ▌', '▐      ⠂ ▌', '▐      ⠈ ▌', '▐       ⠂▌', '▐       ⠠▌', '▐       ⡀▌', '▐      ⠠ ▌', '▐      ⠂ ▌', '▐     ⠈  ▌', '▐     ⠂  ▌', '▐    ⠠   ▌', '▐    ⡀   ▌', '▐   ⠠    ▌', '▐   ⠂    ▌', '▐  ⠈     ▌', '▐  ⠂     ▌', '▐ ⠠      ▌', '▐ ⡀      ▌', '▐⠠       ▌'],
  shark: [
    '▐|____________▌',
    '▐_|___________▌',
    '▐__|__________▌',
    '▐___|_________▌',
    '▐____|________▌',
    '▐_____|_______▌',
    '▐______|______▌',
    '▐_______|_____▌',
    '▐________|____▌',
    '▐_________|___▌',
    '▐__________|__▌',
    '▐___________|_▌',
    '▐____________|▌',
    '▐____________/|▌',
    '▐___________/|_▌',
    '▐__________/|__▌',
    '▐_________/|___▌',
    '▐________/|____▌',
    '▐_______/|_____▌',
    '▐______/|______▌',
    '▐_____/|_______▌',
    '▐____/|________▌',
    '▐___/|_________▌',
    '▐__/|__________▌',
    '▐_/|___________▌',
    '▐/|____________▌'
  ],
  dqpb: ['d', 'q', 'p', 'b'],
  weather: ['☀️ ', '☀️ ', '☀️ ', '🌤 ', '⛅️ ', '🌥 ', '☁️ ', '🌧 ', '🌨 ', '🌧 ', '🌨 ', '🌧 ', '🌨 ', '⛈ ', '🌨 ', '🌧 ', '🌨 ', '🌧 ', '🌨 ', '⛅️ ', '🌤 ', '☀️ ', '☀️ '],
  christmas: ['🌲', '🎄'],
};

export const Spinner: FC<SpinnerProps> = ({
  type = 'dots',
  label = '',
  _color = 'blue',
  speed = 150,
}) => {
  const [frame, setFrame] = useState(0);
  const frames = SPINNERS[type] || SPINNERS.dots;
  
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prevFrame: number) => (prevFrame + 1) % frames.length);
    }, speed);
    
    return () => {
      clearInterval(timer);
    };
  }, [frames.length, speed]);
  
  // Color support can be added later if needed
  return `${frames[frame]} ${label}`;
};

export default Spinner;
