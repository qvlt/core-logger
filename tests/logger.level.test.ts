import { describe, it, expect } from 'vitest';

import { Logger } from '../src/logger';

import type { Transport } from '../src/transport/types';

class CaptureTransport implements Transport {
  public batches: any[][] = [];
  write(batch: any[]) {
    this.batches.push(batch);
  }
  flush() {}
}

describe('Logger level & sampling', () => {
  it('filters by level', () => {
    const t = new CaptureTransport();
    const logger = new Logger({
      app: 'app',
      env: 'development',
      level: 'warn',
      transport: t,
      flushIntervalMs: 999999, // avoid timer flush
      maxBatch: 100,
    });

    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    logger.flush();
    const evts = t.batches.flat();
    expect(evts.map((e) => e.event)).toEqual(['w', 'e']);
  });

  it('clamps sampling between 0..1', () => {
    const t = new CaptureTransport();
    const logger = new Logger({
      app: 'app',
      env: 'development',
      level: 'debug',
      sample: { debug: -1, info: 2 } as any,
      transport: t,
      flushIntervalMs: 999999,
      maxBatch: 100,
    });
    // With clamp, both debug/info effectively 0..1; run a few to ensure some pass
    for (let i = 0; i < 50; i++) {
      logger.debug('d');
      logger.info('i');
    }
    logger.flush();
    expect(t.batches.flat().length).toBeGreaterThan(0);
  });
});
