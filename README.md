# LaunchDarkly React Logger

A lightweight, type-safe logging utility for React applications using LaunchDarkly feature flags to control log levels.

## Features
- Dynamic log levels controlled via LaunchDarkly feature flags
- TypeScript support
- React hooks for easy integration
- Emoji-based log level visualization
- Performance measurement utilities
- Debug grouping support
- Comprehensive test coverage

## Requirements
- React ≥18.2.0
- launchdarkly-react-client-sdk ≥3.6.0

## Installation
```bash
npm install @bradbunce/launchdarkly-react-logger
```

## Setup

### 1. Configuration

The logger utility requires three values from your LaunchDarkly setup. These are REQUIRED variables - there are no default values or fallbacks:

1. Client-side ID (for LaunchDarkly SDK initialization)
2. Feature flag key for console log level control
3. Feature flag key for SDK log level control

You MUST create these feature flags in your LaunchDarkly account and provide their keys to the logger. The logger will throw errors if any of these values are not provided. You have two options for providing these values:

#### Option A: Configuration File (Recommended)
Create a configuration file in your application to manage these values:

```typescript
// logger-config.ts
export const loggerConfig = {
  consoleLogFlagKey: 'your-console-log-flag-key',  // Required - no default value
  sdkLogFlagKey: 'your-sdk-log-flag-key'          // Required - no default value
};

// Then use it to configure the logger:
import { Logger } from '@bradbunce/launchdarkly-react-logger';
import { loggerConfig } from './logger-config';

export const logger = new Logger(loggerConfig);
```

This approach allows you to manage these values in a way that best suits your application's setup and build process.

For convenience, we provide example environment files for popular frameworks:
- `.env.example.cra` - Create React App (uses REACT_APP_ prefix)
- `.env.example.vite` - Vite (uses VITE_ prefix)
- `.env.example.nextjs` - Next.js (uses NEXT_PUBLIC_ prefix)

These are just examples - you can configure these values however best fits your application's needs. Choose the appropriate example if it matches your setup, or use them as a reference for your own configuration approach.

#### Option B: Direct Configuration
You can also provide the values directly:

```typescript
import { Logger } from '@bradbunce/launchdarkly-react-logger';

export const logger = new Logger({
  consoleLogFlagKey: 'your-console-log-flag-key',  // Required - no default value
  sdkLogFlagKey: 'your-sdk-log-flag-key'          // Required - no default value
});
```

Note: The logger will throw errors if these values are not provided. This ensures proper configuration and prevents undefined behavior.

The logger is structured in modular files:
- `logger/index.tsx`: Core Logger class and types
- `logger/singleton.ts`: Singleton logger instance requiring flag key configuration
- `logger/useLogger.ts`: React hook for accessing the logger

This modular structure allows for:
- Easy testing with custom logger instances
- Clear separation of concerns
- Flexibility in non-React environments

### 2. LaunchDarkly Configuration
1. Create a console logging feature flag in LaunchDarkly with:
   - Type: Number
   - Name: Your choice (this will be your consoleLogFlagKey)
   - Values: 0-5 corresponding to levels (FATAL=0, ERROR=1, WARN=2, INFO=3, DEBUG=4, TRACE=5)

2. Create an SDK logging feature flag in LaunchDarkly with:
   - Type: String
   - Name: Your choice (this will be your sdkLogFlagKey)
   - Values: 'error', 'warn', 'info', 'debug' (these control the LaunchDarkly SDK's internal logging)

3. Create your contexts configuration:
```typescript
// contexts.ts
export const createContexts = (user: any) => ({
  // Your context configuration
});
```

### 3. Provider Setup

You can use the LDProvider in one of two ways:

#### Option A: Using an existing LaunchDarkly client (Recommended)
If your application already has a LaunchDarkly client set up, you can pass it to the LDProvider to avoid creating multiple instances. This is the recommended approach as it ensures all flag evaluations are properly tracked through a single client instance.

Important Note: When using Option A, your application must handle SDK log level changes:

```typescript
import { withLDProvider, basicLogger } from 'launchdarkly-react-client-sdk';
import { LDProvider } from 'launchdarkly-react-logger';

function App() {
  // Track your LaunchDarkly client with state
  const [client, setClient] = useState(() => {
    // Initial client setup with stored level
    const storedLevel = localStorage.getItem('ld_sdk_log_level');
    const logLevel = (storedLevel && ['error', 'warn', 'info', 'debug'].includes(storedLevel))
      ? storedLevel
      : 'error';

    return withLDProvider({
      clientSideID: 'your-client-id',
      context: yourContexts,
      options: {
        logger: basicLogger({ level: logLevel })
      }
    })(YourComponent);
  });

  // Handle SDK log level changes
  const handleLogLevelChange = async (value) => {
    if (['error', 'warn', 'info', 'debug'].includes(value)) {
      const ldClient = client._client;
      
      // Close current client
      await ldClient.close();
      
      // Create new client with updated log level
      const newClient = withLDProvider({
        clientSideID: 'your-client-id',
        context: yourContexts,
        options: {
          logger: basicLogger({ level: value })
        }
      })(YourComponent);
      
      // Update your application's client reference
      setClient(newClient);
    }
  };
  
  return (
    <LDProvider 
      existingClient={client}
      onLogLevelChange={handleLogLevelChange}
      onReady={() => console.log('LaunchDarkly logger initialized')}
      loadingComponent={<div>Loading...</div>}
    >
      <YourApp />
    </LDProvider>
  );
}
```

This setup ensures:
1. Your application starts with the stored log level
2. When the SDK log level flag changes:
   - The LDProvider tracks the evaluation in analytics
   - Your application receives the new level via onLogLevelChange
   - Your application closes the current client
   - Your application creates a new client with the updated level
3. The change takes effect immediately since you control the client lifecycle

#### Option B: Creating a new LaunchDarkly client
If you don't have an existing LaunchDarkly client, the LDProvider can create and manage one for you:

```typescript
import { LDProvider } from 'launchdarkly-react-logger';
import { createContexts } from './contexts';

function App() {
  return (
    <LDProvider 
      clientSideId="your-client-id"
      createContexts={createContexts}
      onReady={() => console.log('LaunchDarkly initialized')}
      loadingComponent={<div>Loading LaunchDarkly...</div>}
    >
      <YourApp />
    </LDProvider>
  );
}
```

With Option B:
1. The LDProvider handles the complete lifecycle:
   - Creates client with stored level
   - Tracks flag evaluations
   - Handles client reinitialization when flag changes
2. You don't need to implement any SDK log level handling
3. Changes take effect immediately

## Usage

### Basic Logging

#### Using Your Logger Instance
```typescript
import { logger } from './your-logger-config';

function Component() {
  logger.fatal('Fatal error message'); // 💀
  logger.error('Error message');       // 🔴
  logger.warn('Warning message');      // 🟡
  logger.info('Info message');         // 🔵
  logger.debug('Debug message');       // ⚪
  logger.trace('Trace message');       // 🟣
}
```

#### Using with React Hook
```typescript
import { useLogger } from 'launchdarkly-react-logger';

function Component() {
  const logger = useLogger();
  
  logger.info('Using logger with React hook');
}
```

### Performance Measurements
```typescript
function Component() {
  const logger = useLogger();
  
  useEffect(() => {
    logger.time('operation');
    // Your code here
    logger.timeEnd('operation');
  }, []);
}
```

### Grouped Logs
```typescript
function Component() {
  const logger = useLogger();
  
  logger.group('API Call');
  logger.info('Starting request...');
  logger.debug('Request details:', { url, method });
  logger.groupEnd();
}
```

## Log Levels
Log levels are controlled by your LaunchDarkly feature flags:

1. Console Log Level Flag:
   - Controls application logging (console.log, console.error, etc.)
   - Values: 0-5 corresponding to levels:
     * FATAL (0)
     * ERROR (1)
     * WARN (2)
     * INFO (3)
     * DEBUG (4)
     * TRACE (5)
   - The flag value determines which levels are displayed
   - Example: Setting flag to 3 (INFO) shows FATAL, ERROR, WARN, and INFO logs
   - Evaluated on every log call
   - Each evaluation is tracked in LaunchDarkly analytics

2. SDK Log Level Flag:
   - Controls LaunchDarkly SDK's internal logging
   - Values: 'error', 'warn', 'info', 'debug'
   - Important Note: The SDK's logger can only be configured during client initialization
   
   How it works:
   - Option A (Using existing client):
     * Your application must handle SDK log level changes
     * This utility tracks flag evaluations and triggers onLogLevelChange
     * Your application should close and reinitialize the client with the new level
     * See Option A setup example for implementation details
   
   - Option B (Creating new client):
     * This utility handles the complete process:
       - Starts with stored level
       - Tracks flag evaluations
       - When flag changes to a valid level:
         1. Stores the new level in localStorage
         2. Closes the current client
         3. Creates a new client with updated level
     * Changes take effect immediately
   
   In both cases:
   - Valid log levels: 'error', 'warn', 'info', 'debug'
   - Invalid levels are ignored but still tracked in analytics
   - All evaluations trigger onLogLevelChange callback

## Development

### Testing
The project includes a comprehensive test suite that verifies:
- Log level control through LaunchDarkly feature flags
- All logging methods (fatal, error, warn, info, debug, trace)
- Group and time logging functionality
- Configuration validation
- React hook lifecycle
- SDK log level handling:
  - Log level validation
  - Local storage persistence
  - Dynamic updates through feature flags
  - Invalid log level handling

To run tests:
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

### Building
To build the project:
```bash
npm run build
```

This will generate:
- CommonJS build (dist/index.js)
- ES Module build (dist/index.esm.js)
- TypeScript declarations (dist/index.d.ts)

## Contributing
Pull requests are welcome. For major changes, please open an issue first.

Please ensure tests pass and add tests for any new features.

## License
MIT License

Copyright (c) 2025 Brad Bunce

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
