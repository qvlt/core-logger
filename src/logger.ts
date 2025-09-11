// logging/logger.ts
import type { Transport } from './transport/types';

export type Level = 'debug' | 'info' | 'warn' | 'error';

type BaseCtx = Record<string, unknown>;

export interface LoggerInterface {
  log(lvl: Level, event: string, ctx?: BaseCtx, error?: unknown): void;
  debug(event: string, ctx?: BaseCtx): void;
  info(event: string, ctx?: BaseCtx): void;
  warn(event: string, ctx?: BaseCtx): void;
  error(event: string, ctx?: BaseCtx, error?: unknown): void;
  child(component: string, extra?: BaseCtx): LoggerInterface;
  time<T>(event: string, f: () => Promise<T> | T, c?: BaseCtx): Promise<T>;
}

export type LogEvent = {
  ts: number;
  lvl: Level;
  app?: string;
  env?: string;
  ver?: string;
  component?: string;
  event: string;
  ctx?: BaseCtx;
  err?: { message: string; stack?: string; name?: string; code?: string | number };
  traceId?: string;
  sessionId?: string;
};

type Init = {
  app: string;
  env: 'development' | 'test' | 'production';
  ver?: string;
  level?: Level; // minimum level to emit
  sample?: Partial<Record<Level, number>>; // 0..1 per-level sampling
  defaultCtx?: BaseCtx; // always included
  maxBatch?: number; // configurable batch size
  flushIntervalMs?: number; // interval for flushing queued logs
  transport: Transport | Transport[];
};

const levelOrder: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export class Logger implements LoggerInterface {
  private app: string;
  private env: Init['env'];
  private ver?: string;
  private level: Level;
  private sample: Required<Init>['sample'];
  private defaultCtx: BaseCtx;
  private sessionId: string;
  private maxBatch: number;
  private flushIntervalMs: number;
  private transports: Transport[];
  private maxQueue = 10_000; // optional cap

  private queue: LogEvent[] = [];
  private _flushTimer: ReturnType<typeof setInterval> | null = null;
  private _onBeforeUnload?: () => void;
  private _onProcessExit?: () => void;

  constructor(init: Init) {
    this.app = init.app;
    this.env = init.env;
    this.ver = init.ver;
    this.level = init.level ?? (this.env === 'production' ? 'info' : 'debug');
    const clamp = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
    this.sample = {
      debug: 1,
      info: 1,
      warn: 1,
      error: 1,
      ...(init.sample ? Object.fromEntries(Object.entries(init.sample).map(([k, v]) => [k, clamp(v as number)])) : {}),
    } as Required<Init>['sample'];
    this.defaultCtx = init.defaultCtx ?? {};
    this.maxBatch = init.maxBatch ?? 20;
    this.flushIntervalMs = init.flushIntervalMs ?? 5000;
    this.sessionId = Math.random().toString(36).slice(2);
    this.transports = Array.isArray(init.transport) ? init.transport : [init.transport];

    // timers for both browser & Node
    if (typeof window !== 'undefined' && window.addEventListener) {
      this._onBeforeUnload = () => this.flush();
      window.addEventListener('beforeunload', this._onBeforeUnload);
    }
    const setInt = typeof setInterval !== 'undefined' ? setInterval : null;
    if (setInt) this._flushTimer = setInt(() => this.flush(), this.flushIntervalMs);

    // Node graceful shutdown
    if (typeof process !== 'undefined' && typeof process.on === 'function') {
      this._onProcessExit = () => this.destroy();
      process.on('beforeExit', this._onProcessExit);
      process.on('SIGINT', this._onProcessExit);
      process.on('SIGTERM', this._onProcessExit);
    }
  }

  // Convenience methods for the main logger
  debug(event: string, ctx?: BaseCtx): void {
    this.log('debug', event, ctx);
  }

  info(event: string, ctx?: BaseCtx): void {
    this.log('info', event, ctx);
  }

  warn(event: string, ctx?: BaseCtx): void {
    this.log('warn', event, ctx);
  }

  error(event: string, ctx?: BaseCtx, error?: unknown): void {
    this.log('error', event, ctx, error);
  }

  async time<T>(event: string, f: () => Promise<T> | T, c?: BaseCtx): Promise<T> {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      return await f();
    } finally {
      const dur = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
      this.log('info', `${event}.done`, { durationMs: dur, ...(c ?? {}) });
    }
  }

  child(component: string, extra?: BaseCtx): LoggerInterface {
    return {
      log: (lvl: Level, event: string, ctx?: BaseCtx, err?: unknown) =>
        this.log(lvl, event, { component, ...(extra ?? {}), ...(ctx ?? {}) }, err),
      debug: (e: string, c?: BaseCtx) => this.log('debug', e, { component, ...(extra ?? {}), ...(c ?? {}) }),
      info: (e: string, c?: BaseCtx) => this.log('info', e, { component, ...(extra ?? {}), ...(c ?? {}) }),
      warn: (e: string, c?: BaseCtx) => this.log('warn', e, { component, ...(extra ?? {}), ...(c ?? {}) }),
      error: (e: string, c?: BaseCtx, err?: unknown) =>
        this.log('error', e, { component, ...(extra ?? {}), ...(c ?? {}) }, err),
      child: (childComponent: string, childExtra?: BaseCtx) =>
        this.child(`${component}.${childComponent}`, { ...(extra ?? {}), ...(childExtra ?? {}) }),
      time: async <T>(event: string, f: () => Promise<T> | T, c?: BaseCtx) => {
        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        try {
          return await f();
        } finally {
          const dur = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
          this.log('info', `${event}.done`, { component, durationMs: dur, ...(extra ?? {}), ...(c ?? {}) });
        }
      },
    };
  }

  log(lvl: Level, event: string, ctx?: BaseCtx, error?: unknown) {
    if (levelOrder[lvl] < levelOrder[this.level]) return;
    if (Math.random() > (this.sample[lvl] ?? 1)) return;

    // Hoist component/traceId out of ctx (if present) so it goes to the top-level field
    let component: string | undefined;
    let traceId: string | undefined;

    // Type guard for context with component
    if (
      ctx &&
      typeof ctx === 'object' &&
      'component' in ctx &&
      typeof (ctx as Record<string, unknown>).component === 'string'
    ) {
      component = (ctx as Record<string, unknown>).component as string;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { component: _ignored, ...rest } = ctx as Record<string, unknown>;
      ctx = rest as BaseCtx;
    }

    // Type guard for context with traceId
    if (
      ctx &&
      typeof ctx === 'object' &&
      'traceId' in ctx &&
      typeof (ctx as Record<string, unknown>).traceId === 'string'
    ) {
      traceId = (ctx as Record<string, unknown>).traceId as string;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { traceId: _traceId, ...rest } = ctx as Record<string, unknown>;
      ctx = rest as BaseCtx;
    }

    const err = error
      ? {
          message: (error as Error)?.message ?? String(error),
          stack: (error as Error)?.stack,
          name: (error as Error)?.name,
          code: (error as { code?: string | number })?.code,
        }
      : undefined;

    const ev: LogEvent = {
      ts: Date.now(),
      lvl,
      app: this.app,
      env: this.env,
      ver: this.ver,
      component,
      event,
      ctx: sanitizeCtx({ ...this.defaultCtx, ...(ctx ?? {}) }),
      err,
      sessionId: this.sessionId,
      traceId,
    };

    // Queue and flush by size
    this.queue.push(ev);
    if (this.queue.length > this.maxQueue) this.queue.splice(0, this.queue.length - this.maxQueue);
    if (this.queue.length >= this.maxBatch) this.flush();
  }

  flush() {
    if (this.queue.length === 0 || !this.transports?.length) return;
    const batch = this.queue.splice(0, this.queue.length);
    for (const t of this.transports) {
      try {
        void t.write(batch);
      } catch {
        /* ignore */
      }
      try {
        void t.flush?.();
      } catch {
        /* ignore */
      }
    }
  }

  destroy() {
    if (this._flushTimer != null) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }
    this.flush();
    for (const t of this.transports) {
      try {
        t.flush?.();
      } catch {
        /* ignore */
      }
      try {
        t.destroy?.();
      } catch {
        /* ignore */
      }
    }

    if (typeof window !== 'undefined' && this._onBeforeUnload) {
      window.removeEventListener('beforeunload', this._onBeforeUnload);
      this._onBeforeUnload = undefined;
    }
    if (typeof process !== 'undefined' && typeof process.off === 'function' && this._onProcessExit) {
      process.off('beforeExit', this._onProcessExit);
      process.off('SIGINT', this._onProcessExit);
      process.off('SIGTERM', this._onProcessExit);
      this._onProcessExit = undefined;
    }
  }

  setDefaultContext(patch: Record<string, unknown>) {
    this.defaultCtx = { ...this.defaultCtx, ...patch };
  }

  setLevel(level: Level) {
    this.level = level;
    return this;
  }

  setTransports(t: Transport | Transport[]) {
    this.transports = Array.isArray(t) ? t : [t];
    return this;
  }
}

// --- helpers ---
function sanitizeCtx(ctx: BaseCtx): BaseCtx {
  // Avoid circular refs + huge payloads
  const seen = new WeakSet<object>();
  const cap = (v: unknown): unknown => {
    if (v == null) return v;
    if (typeof v === 'string') return v.length > 4000 ? v.slice(0, 4000) + '…' : v;
    if (typeof v !== 'object') return v;
    if (seen.has(v)) return '[Circular]';
    seen.add(v);
    if (Array.isArray(v)) return v.slice(0, 50).map(cap);
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).slice(0, 100))
      out[k] = cap((v as Record<string, unknown>)[k]);
    return out;
  };
  return cap(ctx) as BaseCtx;
}
