import type { LogEvent } from '../logger';

export interface Transport {
  write(batch: LogEvent[]): Promise<void> | void;
  flush?(): Promise<void> | void;
  destroy?(): void;
}
