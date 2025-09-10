import type { Transport } from './types';
import type { LogEvent } from '../logger';

export class HttpTransport implements Transport {
  constructor(private endpoint: string) {}

  async write(batch: LogEvent[]) {
    const body = JSON.stringify(batch);

    // Browser: try sendBeacon
    if (typeof navigator !== 'undefined') {
      try {
        // @ts-ignore navigator may not exist in Node
        if (navigator.sendBeacon && body.length < 600_000) {
          // @ts-ignore
          if (navigator.sendBeacon(this.endpoint, new Blob([body], { type: 'application/json' }))) return;
        }
      } catch {
        /* ignore */
      }
    }

    // Node or fallback
    await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }).catch(() => {
      /* drop */
    });
  }
}
