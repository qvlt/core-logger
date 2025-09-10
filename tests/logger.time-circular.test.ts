import { describe, it, expect } from 'vitest';

import { Logger } from '../src/logger';

import type { Transport } from '../src/transport/types';

class CaptureTransport implements Transport {
  public batches: any[][] = [];
  write(batch: any[]) {
    this.batches.push(batch);
  }
}

describe('time() and circular ctx sanitization', () => {
  it('supports sync and async functions', async () => {
    const t = new CaptureTransport();
    const logger = new Logger({ app: 'a', env: 'development', transport: t, flushIntervalMs: 999999, maxBatch: 100 });

    await logger.time('sync.op', () => 42);
    await logger.time('async.op', async () => 99);

    logger.flush();
    const events = t.batches.flat();
    const names = events.map((e: any) => e.event);
    expect(names).toContain('sync.op.done');
    expect(names).toContain('async.op.done');
  });

  it('sanitizes circular context', () => {
    const t = new CaptureTransport();
    const logger = new Logger({ app: 'a', env: 'development', transport: t, flushIntervalMs: 999999, maxBatch: 100 });

    const a: any = { a: 1 };
    a.self = a;
    logger.info('circular', a);
    logger.flush();

    const ev = t.batches.flat()[0];
    expect(ev.ctx.a).toBe(1);
    expect(ev.ctx.self.self).toBe('[Circular]');
  });
});
