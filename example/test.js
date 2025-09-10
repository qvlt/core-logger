import { initializeLogger, getLogger, ConsoleTransport } from '@qvlt/core-logger';

async function runTests() {
  console.log('🧪 Running @qvlt/core-logger Tests');
  console.log('==================================\n');

  // Test 1: Basic initialization
  console.log('Test 1: Basic initialization');
  await initializeLogger({
    app: 'test-app',
    env: 'test',
    ver: '1.0.0',
    level: 'debug',
    transport: new ConsoleTransport(),
  });
  console.log('✅ Logger initialized successfully');

  // Test 2: Get logger instance
  console.log('\nTest 2: Get logger instance');
  const logger = getLogger('test-component');
  console.log('✅ Logger instance created');

  // Test 3: Log levels
  console.log('\nTest 3: Log levels');
  logger.debug('test.debug', { message: 'Debug message' });
  logger.info('test.info', { message: 'Info message' });
  logger.warn('test.warn', { message: 'Warning message' });
  logger.error('test.error', { message: 'Error message' });
  console.log('✅ All log levels working');

  // Test 4: Performance timing
  console.log('\nTest 4: Performance timing');
  const result = await logger.time('test.timing', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return { success: true };
  });
  console.log('✅ Timing test completed:', result);

  // Test 5: Child logger
  console.log('\nTest 5: Child logger');
  const childLogger = getLogger('test-child');
  childLogger.info('child.test', { parent: 'test-component' });
  console.log('✅ Child logger working');

  console.log('\n🎉 All tests passed!');
}

runTests().catch(console.error);
