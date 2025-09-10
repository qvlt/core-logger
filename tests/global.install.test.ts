import { describe, it, expect } from 'vitest';

import { installGlobalGetLogger, initializeLogger } from '../src/initialization';
import { ConsoleTransport } from '../src/transport/ConsoleTransport';

describe('global getLogger install', () => {
  it('attaches to globalThis', async () => {
    await initializeLogger({ app: 'a', env: 'development', transport: new ConsoleTransport() });
    installGlobalGetLogger();
    // @ts-expect-no-error
    const l = (globalThis as any).getLogger('global');
    expect(typeof l.info).toBe('function');
  });
});
