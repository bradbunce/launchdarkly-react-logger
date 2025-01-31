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

### 1. Environment Variables
Add these environment variables to your React application:

```env
# Your LaunchDarkly client-side ID
REACT_APP_LD_CLIENTSIDE_ID=your-client-id

# The feature flag key you created in LaunchDarkly for controlling console log levels
REACT_APP_LD_CONSOLE_LOG_FLAG_KEY=your-flag-key

# The feature flag key you created in LaunchDarkly for controlling SDK log levels
REACT_APP_LD_SDK_LOG_FLAG_KEY=your-flag-key
```

### 2. LaunchDarkly Configuration
1. Create a console logging feature flag in LaunchDarkly with:
   - Type: Number
   - Name: Your choice (use this as REACT_APP_LD_CONSOLE_LOG_FLAG_KEY)
   - Values: 0-5 corresponding to log levels (FATAL=0, ERROR=1, WARN=2, INFO=3, DEBUG=4, TRACE=5)

2. Create an SDK logging feature flag in LaunchDarkly with:
   - Type: String
   - Name: Your choice (use this as REACT_APP_LD_SDK_LOG_FLAG_KEY)
   - Values: 'error', 'warn', 'info', 'debug' (these control the LaunchDarkly SDK's internal logging)

2. Create your contexts configuration:
```typescript
// contexts.ts
export const createContexts = (user: any) => ({
  // Your context configuration
});
```

### 3. Provider Setup

You can use the LDProvider in one of two ways:

#### Option A: Using an existing LaunchDarkly client (Recommended)
If your application already has a LaunchDarkly client set up, you can pass it to the LDProvider to avoid creating multiple instances. This is the recommended approach as it ensures all flag evaluations are properly tracked through a single client instance, providing accurate analytics in your LaunchDarkly dashboard:

```typescript
import { LDProvider } from 'launchdarkly-react-logger';
import { withLDProvider } from 'launchdarkly-react-client-sdk';

// Your existing LaunchDarkly client setup
const LDClient = withLDProvider({
  clientSideID: 'your-client-id',
  context: yourContexts
})(YourComponent);

function App() {
  return (
    <LDProvider 
      existingClient={LDClient}
      onReady={() => console.log('LaunchDarkly logger initialized')}
      loadingComponent={<div>Loading...</div>} // Optional custom loading component
    >
      <YourApp />
    </LDProvider>
  );
}
```

#### Option B: Creating a new LaunchDarkly client
If you don't have an existing LaunchDarkly client, the LDProvider can create one for you:

```typescript
import { LDProvider } from 'launchdarkly-react-logger';
import { createContexts } from './contexts';

function App() {
  return (
    <LDProvider 
      clientSideId="your-client-id" // Required when not using existingClient
      createContexts={createContexts} // Required when not using existingClient
      onReady={() => console.log('LaunchDarkly initialized')}
      loadingComponent={<div>Loading LaunchDarkly...</div>} // Optional custom loading component
    >
      <YourApp />
    </LDProvider>
  );
}
```

## Usage

### Basic Logging
```typescript
import { useLogger } from 'launchdarkly-react-logger';

function Component() {
  const logger = useLogger();
  
  logger.fatal('Fatal error message'); // 💀
  logger.error('Error message');       // 🔴
  logger.warn('Warning message');      // 🟡
  logger.info('Info message');         // 🔵
  logger.debug('Debug message');       // ⚪
  logger.trace('Trace message');       // 🟣
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
Log levels are controlled by your LaunchDarkly feature flag (REACT_APP_LD_CONSOLE_LOG_FLAG_KEY):

- FATAL (0)
- ERROR (1)
- WARN (2)
- INFO (3)
- DEBUG (4)
- TRACE (5)

The flag value determines which levels are displayed. For example, setting the flag to 3 (INFO) will show FATAL, ERROR, WARN, and INFO logs, but suppress DEBUG and TRACE logs.

## SDK Logging
The utility also provides runtime control over the LaunchDarkly SDK's internal logging through a feature flag (REACT_APP_LD_SDK_LOG_FLAG_KEY). This allows you to dynamically adjust the SDK's logging verbosity without redeploying your application.

The SDK logger is automatically configured when the LDProvider initializes, using the log level specified by your feature flag. If the flag returns null or is not set, it will use 'info' as the default level.

The two feature flags serve different purposes and are evaluated differently:

1. Console Log Level Flag (REACT_APP_LD_CONSOLE_LOG_FLAG_KEY):
   - Evaluated on every log call to determine if the message should be displayed
   - Each evaluation is sent back to LaunchDarkly through the client (your existing client in Option A, or the new client in Option B)
   - Used to control the visibility of console.log, console.error, etc. messages

2. SDK Log Level Flag (REACT_APP_LD_SDK_LOG_FLAG_KEY):
   - Evaluated in both Option A (existing client) and Option B (new client):
     * Initial evaluation during initialization to configure the client's logger
     * Subsequent evaluations when flag targeting rules change
     * All evaluations (valid and invalid) are tracked in LaunchDarkly analytics
     * All evaluations (valid and invalid) trigger onLogLevelChange callback
     * Only valid levels ('error', 'warn', 'info', 'debug') are stored in localStorage
   - Controls the verbosity of LaunchDarkly SDK's own logging (not your application's logging)
   - Changes to this flag will affect what SDK operations are logged (e.g., flag evaluations, network requests)
   - Invalid log levels are ignored for configuration but still tracked for analytics

Available SDK log levels:
- 'error' - Only log errors
- 'warn' - Log warnings and errors
- 'info' - Log general information, warnings, and errors
- 'debug' - Log debug information and all above levels

For example, you can temporarily enable debug logging in production to troubleshoot SDK-related issues by updating the feature flag value to 'debug'.

## Development

### Testing
The project includes a comprehensive test suite that verifies:
- Log level control through LaunchDarkly feature flags
- All logging methods (fatal, error, warn, info, debug, trace)
- Group and time logging functionality
- Environment variable handling
- React hook lifecycle
- SDK log level handling:
  - Default log level behavior
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
