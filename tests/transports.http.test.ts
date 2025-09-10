import { describe, it, expect, vi, afterEach } from 'vitest';

import { Logger } from '../src/logger';
import { HttpTransport } from '../src/transport/HttpTransport';

// Use a browser-like env for this file
vi.stubGlobal('window', {} as any);
vi.stubGlobal('navigator', {} as any);
vi.stubGlobal(
  'Blob',
  class {
    constructor(_: any[], __: any) {}
  } as any,
);

// Restore all mocks after each test to avoid leaking stubs
afterEach(() => {
  vi.restoreAllMocks();
});

describe('HttpTransport', () => {
  it('uses sendBeacon when available and small', async () => {
    const sendBeacon = vi.fn(() => true);
    (globalThis.navigator as any).sendBeacon = sendBeacon;

    const t = new HttpTransport('/api/logs');
    const logger = new Logger({ app: 'a', env: 'production', transport: t, flushIntervalMs: 999999, maxBatch: 100 });
    logger.info('mini', { x: 1 });
    logger.flush();

    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('falls back to fetch when sendBeacon absent', async () => {
    (globalThis.navigator as any).sendBeacon = undefined;
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    const t = new HttpTransport('/api/logs');
    const logger = new Logger({ app: 'a', env: 'production', transport: t, flushIntervalMs: 999999, maxBatch: 100 });
    logger.info('mini', { x: 1 });
    logger.flush();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
