import type { Transport } from './types';
import type { LogEvent } from '../logger';

export class HttpTransport implements Transport {
  constructor(private endpoint: string) {}

  async write(batch: LogEvent[]) {
    const body = JSON.stringify(batch);

    // Browser: try sendBeacon
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator && body.length < 600_000) {
      try {
        const ok = (navigator as Navigator & { sendBeacon: (url: string, data: BodyInit) => boolean }).sendBeacon(
          this.endpoint,
          new Blob([body], { type: 'application/json' })
        );
        if (ok) return;
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
