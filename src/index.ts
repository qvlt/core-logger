// Include global type declarations (for when installGlobalGetLogger is used)
import './globals';

// Main exports for the logger package
export { Logger } from './logger';
export {
  getLogger,
  initializeLogger,
  shutdownLogger,
  setDefaultLogContext,
  installGlobalGetLogger,
} from './initialization';
export type { Level, LogEvent } from './logger';

// Transport exports
export { ConsoleTransport, HttpTransport, StdoutTransport } from './transport';
export type { Transport } from './transport/types';
