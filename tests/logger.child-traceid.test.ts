import { describe, it, expect } from 'vitest';

import { Logger } from '../src/logger';

import type { Transport } from '../src/transport/types';

class CaptureTransport implements Transport {
  public batches: any[][] = [];
  write(batch: any[]) {
    this.batches.push(batch);
  }
}

describe('child logger & traceId hoisting', () => {
  it('hoists component and traceId out of ctx', () => {
    const t = new CaptureTransport();
    const logger = new Logger({
      app: 'a',
      env: 'development',
      transport: t,
      flushIntervalMs: 999999,
      maxBatch: 100,
    });

    const child = logger.child('auth', { region: 'eu' });
    child.info('login', { traceId: 't-123', k: 'v' });
    logger.flush();

    const ev = t.batches.flat()[0];
    expect(ev.component).toBe('auth');
    expect(ev.traceId).toBe('t-123');
    expect(ev.ctx).toMatchObject({ region: 'eu', k: 'v' });
    expect(ev.ctx.component).toBeUndefined();
    expect(ev.ctx.traceId).toBeUndefined();
  });
});
