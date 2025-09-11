import { initializeLogger, getLogger, ConsoleTransport, HttpTransport, StdoutTransport } from '@qvlt/core-logger';

async function main() {
  console.log('🚀 @qvlt/core-logger Example');
  console.log('============================\n');

  // Example 1: Basic Console Transport
  console.log('1. Basic Console Transport:');
  await initializeLogger({
    app: 'example-app',
    env: 'development',
    ver: '1.0.0',
    level: 'debug',
    transport: new ConsoleTransport(),
  });

  const logger = getLogger('example');
  logger.info('app.started', { userId: 'user123' });
  logger.debug('config.loaded', { config: { theme: 'dark' } });
  logger.warn('deprecated.feature', { feature: 'old-api' });
  logger.error('api.error', { endpoint: '/users' }, new Error('Connection failed'));

  // Example 2: Performance Timing
  console.log('\n2. Performance Timing:');
  const result = await logger.time(
    'api.request',
    async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { data: 'success' };
    },
    { endpoint: '/api/data' },
  );
  console.log('Result:', result);

  // Example 3: Child Logger
  console.log('\n3. Child Logger:');
  const authLogger = getLogger('auth');
  authLogger.info('user.login', { userId: 'user123', method: 'oauth' });
  authLogger.warn('token.expiring', { expiresIn: '5m' });

  // Example 4: Multiple Transports
  console.log('\n4. Multiple Transports:');
  await initializeLogger({
    app: 'example-app',
    env: 'production',
    ver: '1.0.0',
    level: 'info',
    transport: [new ConsoleTransport(), new StdoutTransport()],
  });

  const multiLogger = getLogger('multi-transport');
  multiLogger.info('multi.transport.test', { message: 'This goes to both console and stdout' });

  console.log('\n✅ Example completed successfully!');
}

main().catch(console.error);
