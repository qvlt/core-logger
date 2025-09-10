import { describe, it, expect } from 'vitest';

import { Logger } from '../src/logger';
import { StdoutTransport } from '../src/transport/StdoutTransport';

describe('StdoutTransport emits JSONL', () => {
  it('writes a single line per event', () => {
    let buf = '';
    const orig = process.stdout.write;
    (process.stdout.write as any) = (chunk: any) => {
      buf += chunk.toString();
      return true;
    };

    try {
      const logger = new Logger({
        app: 'a',
        env: 'production',
        transport: new StdoutTransport(),
        flushIntervalMs: 999999,
        maxBatch: 100,
      });
      logger.info('hello', { x: 1 });
      logger.flush();

      const lines = buf.trim().split('\n');
      expect(lines.length).toBe(1);
      const obj = JSON.parse(lines[0]);
      expect(obj.event).toBe('hello');
      expect(obj.ctx.x).toBe(1);
    } finally {
      (process.stdout.write as any) = orig;
    }
  });
});
