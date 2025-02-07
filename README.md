# LaunchDarkly React Logger

A React logging utility that uses LaunchDarkly feature flags to control log levels in real-time.

## What It Does

This utility lets you:
1. Control console logging levels through a LaunchDarkly number flag (0-5)
2. Control LaunchDarkly SDK logging through a string flag ('error'|'warn'|'info'|'debug')
3. Change log levels in real-time without deploying code

### Log Levels

Console logging has 6 levels (controlled by number flag):
- FATAL (0) 💀 - Most severe, unrecoverable errors
- ERROR (1) 🔴 - Error conditions
- WARN (2)  🟡 - Warning messages
- INFO (3)  🔵 - General information
- DEBUG (4) ⚪ - Debug information
- TRACE (5) 🟣 - Fine-grained debugging

Setting the flag to a number shows that level and all levels below it. For example, setting it to 3 (INFO) shows FATAL, ERROR, WARN, and INFO logs.

## Setup

### 1. Create Feature Flags

In your LaunchDarkly project, create two flags:

1. Console Log Level Flag:
   - Type: Number
   - Values: 0-5
   - Example name: 'console-log-level'

2. SDK Log Level Flag:
   - Type: String
   - Values: 'error', 'warn', 'info', 'debug'
   - Example name: 'sdk-log-level'

### 2. Create Logger Instance

Create a single logger instance to be shared across your application:

```typescript
// logger-config.ts
import { Logger } from '@bradbunce/launchdarkly-react-logger';

// Create one logger instance with your flag keys
export const logger = new Logger({
  consoleLogFlagKey: 'your-console-log-flag-key',  // The number flag (0-5)
  sdkLogFlagKey: 'your-sdk-log-flag-key'          // The string flag (error|warn|info|debug)
});
```

Important: Create one logger instance and export it. Don't create multiple instances.

### 3. Set Up Provider

If you already have a LaunchDarkly client:

```typescript
import { LDProvider } from '@bradbunce/launchdarkly-react-logger';
import { LDLogLevel } from 'launchdarkly-react-client-sdk';

function App() {
  // Optional: Handle SDK log level changes
  const handleLogLevelChange = (level: LDLogLevel) => {
    console.log(`SDK log level changed to: ${level}`);
    // Your client will be reinitialized automatically
  };

  return (
    <LDProvider 
      existingClient={yourLDClient}
      onLogLevelChange={handleLogLevelChange}
    >
      <YourApp />
    </LDProvider>
  );
}
```

If you need a new client:

```typescript
import { LDProvider } from '@bradbunce/launchdarkly-react-logger';

function App() {
  return (
    <LDProvider 
      clientSideId="your-client-id"
      createContexts={yourContextsFunction}
    >
      <YourApp />
    </LDProvider>
  );
}
```

## Usage

### Basic Logging

```typescript
import { logger } from './your-logger-config';

// Direct usage
logger.fatal("Application crash");  // 💀
logger.error("API error");         // 🔴
logger.warn("Deprecated usage");   // 🟡
logger.info("User logged in");     // 🔵
logger.debug("API response");      // ⚪
logger.trace("Function called");   // 🟣

// With React hook
import { useLogger } from '@bradbunce/launchdarkly-react-logger';
import { logger } from './logger-config';

function Component() {
  // Hook connects logger to LaunchDarkly client
  const logger = useLogger(logger);
  
  logger.info("Component mounted");
}
```

### Advanced Features

#### Group Related Logs
```typescript
logger.group('API Call');
logger.info('Starting request...');
logger.debug('Request details:', { url, method });
logger.groupEnd();
```

#### Performance Measurements
```typescript
logger.time('operation');
// Your code here
logger.timeEnd('operation');
```

## How It Works

1. Console Logging:
   - Every log call checks the console log level flag
   - Only logs at or below the flag value are shown
   - Change the flag value to show/hide different log levels
   - Changes take effect immediately

2. SDK Logging:
   - Controls LaunchDarkly's internal logging
   - Useful for debugging flag evaluation issues
   - Changes require client reinitialization
   - Provider handles this automatically

## Benefits

1. Dynamic Control:
   - Change log levels without deploying
   - Perfect for debugging production issues
   - No code changes needed

2. Visual Clarity:
   - Emoji indicators for quick level identification
   - Grouped logging for related events
   - Performance timing built in

3. Type Safety:
   - Full TypeScript support
   - Clear interfaces for configuration
   - Compile-time checks for proper usage

## Requirements
- React ≥18.2.0
- launchdarkly-react-client-sdk ≥3.6.0

## License
MIT
