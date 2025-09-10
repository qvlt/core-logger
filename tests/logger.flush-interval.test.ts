import { vi, describe, it, expect } from 'vitest';

import { Logger } from '../src/logger';

import type { Transport } from '../src/transport/types';

class SpyTransport implements Transport {
  write = vi.fn();
}

describe('flush timer', () => {
  it('flushes on interval', () => {
    vi.useFakeTimers();
    const t = new SpyTransport();
    const logger = new Logger({
      app: 'a',
      env: 'development',
      transport: t,
      flushIntervalMs: 50,
      maxBatch: 100,
    });

    logger.info('tick');
    expect(t.write).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60);
    expect(t.write).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
