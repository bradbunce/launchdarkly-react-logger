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
If your application already has a LaunchDarkly client set up, you can pass it to the LDProvider to avoid creating multiple instances:

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

## Development

### Testing
The project includes a comprehensive test suite that verifies:
- Log level control through LaunchDarkly feature flags
- All logging methods (fatal, error, warn, info, debug, trace)
- Group and time logging functionality
- Environment variable handling
- React hook lifecycle

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
