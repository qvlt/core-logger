# @qvlt/core-logger

A universal structured logging library for both browser and Node.js environments with a flexible transport layer.

## Features

- **Universal** - Works in both browser and Node.js environments
- **Transport-based architecture** - Choose your output destination
- **Structured logging** with JSON output in production
- **Component-based logging** with child loggers
- **Environment-aware** (development vs production)
- **Performance timing** utilities
- **Global logger instance** management
- **Multiple transport support** - Console, HTTP, stdout, and custom transports

## Installation

```bash
pnpm add @qvlt/core-logger
```

## Usage

### Basic Setup

```typescript
import { initializeLogger, getLogger, ConsoleTransport } from '@qvlt/core-logger';

// Initialize the logger with explicit transport
await initializeLogger({
  app: 'my-app',
  env: 'development', // or 'production' or 'test'
  ver: '1.0.0',
  level: 'debug', // minimum log level
  transport: new ConsoleTransport(), // explicit transport required
});

// Get a logger instance
const logger = getLogger('my-component');

// Log messages
logger.info('user.login', { userId: '123' });
logger.error('api.error', { endpoint: '/users' }, error);
```

### Component-based Logging

```typescript
// Create a child logger for a specific component
const authLogger = getLogger('auth');

authLogger.debug('token.validating', { token: '***' });
authLogger.info('user.authenticated', { userId: '123' });
authLogger.warn('token.expiring', { expiresIn: '5m' });
authLogger.error('auth.failed', { reason: 'invalid_token' }, error);
```

### Performance Timing

```typescript
const result = await logger.time(
  'api.request',
  async () => {
    return await fetch('/api/data');
  },
  { endpoint: '/api/data' },
);
// Logs: "api.request.done" with duration
```

## Transport Layer

The logger uses a transport-based architecture that allows you to choose where your logs are sent. This makes the logger truly universal across browser and Node.js environments.

### Available Transports

#### ConsoleTransport

Pretty-prints logs to the console for development environments.

```typescript
import { ConsoleTransport } from '@qvlt/core-logger';

const logger = new Logger({
  app: 'my-app',
  env: 'development',
  transport: new ConsoleTransport(),
});
```

#### HttpTransport

Sends logs to an HTTP endpoint with browser and Node.js support.

```typescript
import { HttpTransport } from '@qvlt/core-logger';

const logger = new Logger({
  app: 'my-app',
  env: 'production',
  transport: new HttpTransport('/api/logs'),
});
```

**Features:**

- Uses `navigator.sendBeacon` in browsers for reliable delivery
- Falls back to `fetch` for larger payloads or Node.js
- Automatically handles browser vs Node.js environments

#### StdoutTransport

Writes JSONL (JSON Lines) to stdout, perfect for containerized environments.

```typescript
import { StdoutTransport } from '@qvlt/core-logger';

const logger = new Logger({
  app: 'my-app',
  env: 'production',
  transport: new StdoutTransport(),
});
```

**Features:**

- Single-line JSON format for log aggregation systems
- Ideal for Kubernetes, Docker, and cloud environments
- Follows 12-factor app principles

### Multiple Transports

You can use multiple transports simultaneously:

```typescript
import { ConsoleTransport, HttpTransport, StdoutTransport } from '@qvlt/core-logger';

const logger = new Logger({
  app: 'my-app',
  env: 'production',
  transport: [
    new ConsoleTransport(), // Development console
    new HttpTransport('/api/logs'), // HTTP endpoint
    new StdoutTransport(), // Container logs
  ],
});
```

### Custom Transports

Create your own transport by implementing the `Transport` interface:

```typescript
import type { Transport, LogEvent } from '@qvlt/core-logger';

class CustomTransport implements Transport {
  async write(batch: LogEvent[]) {
    // Send to your custom destination
    await sendToCustomService(batch);
  }

  async flush() {
    // Optional: flush any buffered data
  }

  destroy() {
    // Optional: cleanup resources
  }
}

const logger = new Logger({
  app: 'my-app',
  env: 'production',
  transport: new CustomTransport(),
});
```

### Global Logger (opt-in)

If you want to use a global getter, **explicitly** install it after initialization:

```typescript
import { initializeLogger, installGlobalGetLogger } from '@qvlt/core-logger';

await initializeLogger({
  /* ... */
});
installGlobalGetLogger();

const logger = getLogger('global');
logger.info('app.started');
```

### Configuration

### Environment Detection

```typescript
import { ConsoleTransport, HttpTransport, StdoutTransport } from '@qvlt/core-logger';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isNode = typeof process !== 'undefined' && !!process.versions?.node;

// Choose transport based on environment
let transport;
if (isProduction) {
  if (isNode) {
    transport = new StdoutTransport(); // JSONL to stdout for containers
  } else {
    transport = new HttpTransport('/api/logs'); // HTTP for browser production
  }
} else {
  transport = new ConsoleTransport(); // Pretty console for development
}

await initializeLogger({
  app: 'my-app',
  env: isProduction ? 'production' : isTest ? 'test' : 'development',
  level: isProduction ? 'info' : 'debug',
  transport,
});
```

### Advanced Configuration

```typescript
import { ConsoleTransport, HttpTransport, StdoutTransport } from '@qvlt/core-logger';

await initializeLogger({
  app: 'my-app',
  env: 'production',
  ver: '1.0.0',
  level: 'info',
  transport: [
    new ConsoleTransport(), // Development console
    new HttpTransport('/api/logs'), // HTTP endpoint
    new StdoutTransport(), // Container logs
  ],
  maxBatch: 50, // batch size for transport requests
  flushIntervalMs: 10000, // flush interval in milliseconds
  defaultCtx: {
    service: 'api',
    region: 'us-east-1',
  },
  sample: {
    debug: 0.1, // Only log 10% of debug messages
    info: 1.0, // Log all info messages
    warn: 1.0, // Log all warnings
    error: 1.0, // Log all errors
  },
});
```

### Setting Default Context

Use `setDefaultLogContext()` to add context that will be included in all subsequent logs:

```typescript
import { setDefaultLogContext } from '@qvlt/core-logger';

// Add user context to all logs
setDefaultLogContext({ userId: 'u_123', session: 's_abc' });

// Add trace context
setDefaultLogContext({ traceId: 't_xyz', orgId: 'o_456' });
```

**Note:** Child loggers (created with `getLogger('component')`) don't have `setDefaultContext` - use the global helper above instead.

### Transport Configuration

The logger requires explicit transport configuration. You must choose which transports to use:

```typescript
import { ConsoleTransport, HttpTransport, StdoutTransport } from '@qvlt/core-logger';

// Browser development: ConsoleTransport
await initializeLogger({
  app: 'my-app',
  env: 'development',
  transport: new ConsoleTransport(),
});

// Browser production with HTTP endpoint: HttpTransport
await initializeLogger({
  app: 'my-app',
  env: 'production',
  transport: new HttpTransport('/api/logs'),
});

// Node.js production: StdoutTransport
await initializeLogger({
  app: 'my-app',
  env: 'production',
  transport: new StdoutTransport(),
});

// Multiple transports: Console + HTTP
await initializeLogger({
  app: 'my-app',
  env: 'production',
  transport: [new ConsoleTransport(), new HttpTransport('/api/logs')],
});
```

**Note:** You must explicitly configure transports. No default transport is provided to ensure intentional logging configuration.

### Global Installation

The package does not auto-install any globals. To enable a global getter:

```typescript
import { installGlobalGetLogger } from '@qvlt/core-logger';

// Explicitly install global getLogger (opt-in)
installGlobalGetLogger();
```

### Cleanup and Shutdown

Use `shutdownLogger()` to properly clean up resources:

```typescript
// Clean up when your app shuts down
shutdownLogger();
```

This will:

- Clear any pending intervals
- Flush remaining queued logs
- Remove event listeners
- Clean up the logger instance

### Sampling

Control log volume with sampling:

```typescript
await initializeLogger({
  app: 'my-app',
  env: 'production',
  transport: new HttpTransport('/api/logs'),
  sample: {
    debug: 0.1, // Only log 10% of debug messages
    info: 1.0, // Log all info messages
    warn: 1.0, // Log all warnings
    error: 1.0, // Log all errors
  },
});
```

## Log Levels

- `debug` - Detailed debugging information
- `info` - General information messages
- `warn` - Warning messages
- `error` - Error messages

## Production Features

The logger supports various production scenarios:

- **Structured JSON output** for log aggregation
- **Batched transport** for efficient delivery
- **Sampling** to control log volume
- **Session tracking** for request correlation
- **Multiple transport support** for redundancy

## Development Features

The logger provides rich development experience:

- **Pretty console output** with ConsoleTransport
- **Component context** for better debugging
- **Full error details** with stack traces
- **Flexible transport configuration** for testing

## License

MIT
