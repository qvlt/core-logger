const pkg = require('../dist/index.cjs');
const { ConsoleTransport } = pkg;
(async () => {
  await pkg.initializeLogger({ app: 'a', env: 'development', transport: new ConsoleTransport() });
  const l = pkg.getLogger('smoke-cjs');
  l.info('ok-cjs');
  pkg.shutdownLogger();
})();
