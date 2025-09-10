import type { Transport } from './types';
import type { LogEvent } from '../logger';

export class StdoutTransport implements Transport {
  write(batch: LogEvent[]) {
    for (const ev of batch) {
      // single-line JSONL (better for log shippers)
      process.stdout.write(JSON.stringify(ev) + '\n');
    }
  }
}
