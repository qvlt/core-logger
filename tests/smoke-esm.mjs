import * as pkg from '../dist/index.js';
const { ConsoleTransport } = pkg;
await pkg.initializeLogger({ app: 'a', env: 'development', transport: new ConsoleTransport() });
const l = pkg.getLogger('smoke-esm');
l.info('ok-esm');
pkg.shutdownLogger();
