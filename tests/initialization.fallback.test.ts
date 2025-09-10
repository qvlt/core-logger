import { describe, it, expect, vi } from 'vitest';

import { getLogger, initializeLogger, shutdownLogger } from '../src/initialization';
import { Logger } from '../src/logger';

import type { Transport } from '../src/transport/types';

class CaptureTransport implements Transport {
  batches: any[][] = [];
  write(b: any[]) {
    this.batches.push(b);
  }
}

describe('initializeLogger & fallback', () => {
  it('fallback logger writes to console methods without throwing', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const l = getLogger('comp'); // not initialized
    l.info('hello', { y: 1 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('initialized logger uses transports', async () => {
    const t = new CaptureTransport();
    await initializeLogger({ app: 'a', env: 'development', transport: t, flushIntervalMs: 999999, maxBatch: 100 });
    getLogger().info('hi');
    getLogger('x').warn('w');
    (getLogger() as Logger).flush?.(); // ensure flushed
    shutdownLogger();

    expect(t.batches.flat().map((e: any) => e.event)).toEqual(['hi', 'w']);
  });
});
