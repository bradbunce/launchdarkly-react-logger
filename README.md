# LaunchDarkly React Logger

A React logging utility that uses LaunchDarkly feature flags to control log levels in real-time.

## What It Does

This utility provides dynamic log level control through LaunchDarkly feature flags:

1. Console Logging (0-5):
   ```typescript
   logger.fatal("Application crash");  // 💀 Level 0
   logger.error("API error");         // 🔴 Level 1
   logger.warn("Deprecated usage");   // 🟡 Level 2
   logger.info("User logged in");     // 🔵 Level 3
   logger.debug("API response");      // ⚪ Level 4
   logger.trace("Function called");   // 🟣 Level 5
   ```
   Setting the flag to a number shows that level and all levels below it.
   Example: Setting to 3 (INFO) shows FATAL, ERROR, WARN, and INFO logs.

2. SDK Logging:
   - Controls LaunchDarkly's internal logging
   - Values: 'error', 'warn', 'info', 'debug'
   - Useful for debugging flag evaluation issues

## Prerequisites

1. LaunchDarkly Setup:
   - A LaunchDarkly account
   - LaunchDarkly React SDK installed and configured
   - LaunchDarkly client initialized in your app

2. Create Two Feature Flags:
   ```typescript
   // 1. Console Log Level Flag
   {
     key: 'console-log-level',
     type: 'number',
     values: 0-5  // FATAL=0, ERROR=1, WARN=2, INFO=3, DEBUG=4, TRACE=5
   }

   // 2. SDK Log Level Flag
   {
     key: 'sdk-log-level',
     type: 'string',
     values: ['error', 'warn', 'info', 'debug']
   }
   ```

## Implementation

1. Install:
   ```bash
   npm install @bradbunce/launchdarkly-react-logger
   ```

2. Create Logger:
   ```typescript
   // logger-config.ts
   import { Logger } from '@bradbunce/launchdarkly-react-logger';

   export const logger = new Logger({
     consoleLogFlagKey: 'your-console-flag-key',  // The number flag (0-5)
     sdkLogFlagKey: 'your-sdk-flag-key'          // The string flag
   });
   ```

3. Connect to LaunchDarkly:
   ```typescript
   // App.tsx
   import { LDProvider } from '@bradbunce/launchdarkly-react-logger';
   import { LDLogLevel } from 'launchdarkly-react-client-sdk';
   import { logger } from './logger-config';

   function App() {
     // Your app must have a LaunchDarkly client already set up
     const yourLDClient = ... // Your existing LaunchDarkly client

     // Optional: Handle SDK log level changes
     const handleLogLevelChange = (level: LDLogLevel) => {
       console.log(`SDK log level changed to: ${level}`);
     };

     return (
       <LDProvider 
         existingClient={yourLDClient}        // Required: Your LaunchDarkly client
         sdkLogFlagKey={logger.config.sdkLogFlagKey}  // Required: SDK log level flag key
         onLogLevelChange={handleLogLevelChange}      // Optional: Handle log level changes
       >
         <YourApp />
       </LDProvider>
     );
   }
   ```

## Usage

### Basic Logging

```typescript
import { logger } from './logger-config';

// Direct usage (works outside React components)
logger.fatal("Application crash");  // 💀 Shows if flag ≥ 0
logger.error("API error");         // 🔴 Shows if flag ≥ 1
logger.warn("Deprecated usage");   // 🟡 Shows if flag ≥ 2
logger.info("User logged in");     // 🔵 Shows if flag ≥ 3
logger.debug("API response");      // ⚪ Shows if flag ≥ 4
logger.trace("Function called");   // 🟣 Shows if flag ≥ 5

// With React hook (for components - automatically connects to client)
import { useLogger } from '@bradbunce/launchdarkly-react-logger';
import { logger } from './logger-config';

function Component() {
  // Hook connects logger to your LaunchDarkly client
  const logger = useLogger(logger);
  
  useEffect(() => {
    logger.info("Component mounted");
  }, []);
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
   - Clear interfaces
   - Compile-time checks

## Requirements
- React ≥18.2.0
- launchdarkly-react-client-sdk ≥3.6.0

## License
MIT
