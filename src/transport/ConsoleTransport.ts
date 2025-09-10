import { devConsole } from '../util/devConsole';

import type { Transport } from './types';
import type { LogEvent } from '../logger';

export class ConsoleTransport implements Transport {
  write(batch: LogEvent[]) {
    for (const ev of batch) devConsole(ev);
  }
}
