// Re-export all flag-related functions
import { showHelp } from './help';
import { showVersion } from './version';
import { initFlags } from './init';
import { handleFeedback } from './feedback';
import { handleIssue } from './issue';

export {
  showHelp,
  showVersion,
  initFlags,
  handleFeedback,
  handleIssue
};
