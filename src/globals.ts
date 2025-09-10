import type { LoggerInterface } from './logger';

declare global {
  var getLogger: {
    (): LoggerInterface;
    (component: string): LoggerInterface;
  };
}

export {};
