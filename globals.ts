import type { Logger } from './logger';

declare global {
  function getLogger(): Logger;
  function getLogger(component: string): ReturnType<Logger['child']>;
}

export {};
