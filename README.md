# LaunchDarkly React Logger

A lightweight, type-safe logging utility for React applications using LaunchDarkly feature flags to control log levels.

## Features
- Dynamic log levels controlled via LaunchDarkly feature flags
- TypeScript support
- React hooks for easy integration
- Emoji-based log level visualization
- Performance measurement utilities
- Debug grouping support

## Requirements
- React ≥18.2.0
- launchdarkly-react-client-sdk ≥3.6.0

## Installation
```bash
npm install launchdarkly-react-logger
```

## Setup

### 1. Environment Variables
Add these environment variables to your React application:

```env
# Your LaunchDarkly client-side ID
REACT_APP_LD_CLIENTSIDE_ID=your-client-id

# The feature flag key you created in LaunchDarkly for controlling console log levels
REACT_APP_LD_CONSOLE_LOG_FLAG_KEY=your-flag-key
```

### 2. LaunchDarkly Configuration
1. Create a feature flag in LaunchDarkly with:
   - Type: Number
   - Name: Your choice (use this as REACT_APP_LD_CONSOLE_LOG_FLAG_KEY)
   - Values: 0-5 corresponding to log levels (FATAL=0, ERROR=1, WARN=2, INFO=3, DEBUG=4, TRACE=5)

2. Create your contexts configuration:
```typescript
// contexts.ts
export const createContexts = (user: any) => ({
  // Your context configuration
});
```

### 3. Provider Setup
```typescript
import { LDProvider } from 'launchdarkly-react-logger';
import { createContexts } from './contexts';

function App() {
  return (
    <LDProvider 
      createContexts={createContexts}
      onReady={() => console.log('LaunchDarkly initialized')}
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

## Contributing
Pull requests are welcome. For major changes, please open an issue first.

## License
MIT