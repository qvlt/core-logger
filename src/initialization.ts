import { Logger, type Level, type LoggerInterface } from './logger';

import type { Transport } from './transport/types';

let loggerInstance: Logger | null = null;
let teardown: (() => void) | null = null;

export async function initializeLogger(config: {
  app: string;
  env: 'development' | 'test' | 'production';
  ver?: string;
  level?: Level;
  sample?: Partial<Record<Level, number>>;
  defaultCtx?: Record<string, unknown>;
  maxBatch?: number;
  flushIntervalMs?: number;
  transport: Transport | Transport[];
}): Promise<void> {
  // Clean up previous instance
  if (teardown) {
    teardown();
  }

  loggerInstance = new Logger(config);

  teardown = () => {
    loggerInstance?.destroy?.();
    loggerInstance = null;
  };
}

export function shutdownLogger(): void {
  // Use the same cleanup path we registered in initializeLogger
  teardown?.();
  loggerInstance = null;
}

export function setDefaultLogContext(patch: Record<string, unknown>): void {
  if (!loggerInstance) throw new Error('Logger not initialized.');
  loggerInstance.setDefaultContext(patch);
}

export function getLogger(component?: string): LoggerInterface {
  if (!loggerInstance) {
    // Return a safe console fallback when logger is not initialized
    const createLogMethod =
      (level: 'debug' | 'info' | 'warn' | 'error') =>
      (event: string, context?: Record<string, unknown>, error?: unknown) => {
        const consoleMethod = (console as unknown as Record<string, (...args: unknown[]) => void>)[level];
        if (consoleMethod) {
          const prefix = component ? `[${component}]` : '';
          consoleMethod(`${prefix} ${event}`, context ?? '', error ?? '');
        }
      };

    const fallbackLogger: LoggerInterface = {
      debug: createLogMethod('debug'),
      info: createLogMethod('info'),
      warn: createLogMethod('warn'),
      error: createLogMethod('error'),
      log: (
        level: 'debug' | 'info' | 'warn' | 'error',
        event: string,
        context?: Record<string, unknown>,
        error?: unknown,
      ) => createLogMethod(level)(event, context, error),
      child: (childComponent: string) => getLogger(childComponent),
      time: async <T>(event: string, f: () => Promise<T>, c?: Record<string, unknown>) => {
        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        try {
          return await f();
        } finally {
          const dur = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
          createLogMethod('info')(`${event}.done`, { durationMs: dur, ...(c ?? {}) });
        }
      },
    };

    return fallbackLogger;
  }
  return component ? loggerInstance.child(component) : loggerInstance;
}

// Opt-in global installation
export function installGlobalGetLogger(): void {
  if (typeof globalThis !== 'undefined') {
    (globalThis as Record<string, unknown>).getLogger = getLogger;
  }
}
