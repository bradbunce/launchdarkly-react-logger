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
   - The LaunchDarkly React Web SDK (`@launchdarkly/react-sdk`) installed and configured
   - A LaunchDarkly provider mounted in your app

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
   npm install @bradbunce/launchdarkly-react-logger @launchdarkly/react-sdk
   ```

2. Create Logger:
   ```javascript
   // JavaScript (logger-config.js)
   import { Logger } from '@bradbunce/launchdarkly-react-logger';

   export const logger = new Logger({
     consoleLogFlagKey: 'your-console-flag-key',  // The number flag (0-5)
     sdkLogFlagKey: 'your-sdk-flag-key'          // The string flag
   });
   ```

   ```typescript
   // TypeScript (logger-config.ts) - same code, with type safety
   import { Logger } from '@bradbunce/launchdarkly-react-logger';

   export const logger = new Logger({
     consoleLogFlagKey: 'your-console-flag-key',  // The number flag (0-5)
     sdkLogFlagKey: 'your-sdk-flag-key'          // The string flag
   });
   ```

3. Connect to LaunchDarkly:

   Create your provider with the React Web SDK, then hand it to `LDProvider`.
   `LDProvider` renders your provider and watches the SDK log level flag.

   ```tsx
   // App.tsx (or App.jsx)
   import { createLDReactProvider } from '@launchdarkly/react-sdk';
   import type { LDLogLevel } from '@launchdarkly/react-sdk';
   import { LDProvider } from '@bradbunce/launchdarkly-react-logger';
   import { logger } from './logger-config';

   // Create this once, outside your components
   const AppLDProvider = createLDReactProvider(
     import.meta.env.VITE_LD_CLIENTSIDE_ID,
     { kind: 'user', key: 'user-key' }
   );

   function App() {
     // Optional: Handle SDK log level changes
     const handleLogLevelChange = (level: LDLogLevel) => {
       console.log(`SDK log level changed to: ${level}`);
     };

     return (
       <LDProvider
         provider={AppLDProvider}                     // Required: your LD provider component
         sdkLogFlagKey={logger.config.sdkLogFlagKey}  // Required: SDK log level flag key
         onLogLevelChange={handleLogLevelChange}      // Optional: handle log level changes
       >
         <YourApp />
       </LDProvider>
     );
   }
   ```

   If you already create the client yourself, use
   `createLDReactProviderWithClient(client)` instead — `LDProvider` accepts either.

   Running more than one LaunchDarkly environment? Pass the matching context via
   the optional `reactContext` prop (from `initLDReactContext()`).

## Usage

### Basic Logging

```javascript
// Works in both JavaScript and TypeScript
import { logger } from './logger-config';

// Direct usage (works outside React components)
logger.fatal("Application crash");  // 💀 Shows if flag ≥ 0
logger.error("API error");         // 🔴 Shows if flag ≥ 1
logger.warn("Deprecated usage");   // 🟡 Shows if flag ≥ 2
logger.info("User logged in");     // 🔵 Shows if flag ≥ 3
logger.debug("API response");      // ⚪ Shows if flag ≥ 4
logger.trace("Function called");   // 🟣 Shows if flag ≥ 5

// With React hook (for components - automatically connects to client)
import { useEffect } from 'react';
import { useLogger } from '@bradbunce/launchdarkly-react-logger';
import { logger as baseLogger } from './logger-config';

function Component() {
  // Hook connects logger to your LaunchDarkly client
  const logger = useLogger(baseLogger);

  useEffect(() => {
    logger.info("Component mounted");
  }, [logger]);

  return null;
}
```

Until a LaunchDarkly provider is mounted and the client has flag values, console
logging falls back to the ERROR level rather than throwing — so calling `logger`
outside a provider is safe. (`getSdkLogLevel()` is the one exception: it throws
if no client is attached.)

### Advanced Features

#### Group Related Logs
```javascript
// Works in both JavaScript and TypeScript
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

## API

| Export | Description |
| --- | --- |
| `Logger` | The logger class. `new Logger({ consoleLogFlagKey, sdkLogFlagKey })` |
| `LogLevel` | Enum of log levels (`FATAL`=0 … `TRACE`=5) |
| `useLogger(logger, reactContext?)` | Connects a `Logger` to the LaunchDarkly client for the component's lifetime |
| `LDProvider` | Wraps your LD provider and reports SDK log level flag changes |
| `useLDClient` | Re-export of the React Web SDK hook. Throws if no provider is mounted |
| `useOptionalLDClient` | Same, but returns `null` instead of throwing when no provider is mounted |
| `LoggerConfig`, `LDProviderProps`, `LDProviderComponent` | Types |

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
- @launchdarkly/react-sdk ≥4.1.16
- Node.js `^22.18.0 || >=24.11.0`

The published bundle is browser code with no runtime dependencies of its own —
neither React nor the LaunchDarkly SDK declares a Node requirement, so nothing
here constrains your app's runtime. The `engines.node` range is the set of Node
versions on which this package's own toolchain installs and builds without a
single npm warning; it covers every currently supported Node line (22, 24, 26),
and CI runs the full suite on all three.

The range looks oddly specific because it is: `rollup-plugin-dts` depends on
`@babel/code-frame@8`, which declares exactly `^22.18.0 || >=24.11.0`. Widening
our range past that would reintroduce `EBADENGINE` warnings on install.

### Dependency overrides

`npm install` is expected to be completely warning-free. Two `overrides` in
`package.json` keep it that way — both exist only to avoid deprecated transitive
packages, and both should be removed once upstream catches up:

- `test-exclude` → `glob@^13`. `test-exclude@7` pins `glob@^10`; every `glob`
  major below 13 is deprecated. Jest 30 already uses `glob@13`, so this dedupes
  rather than adding a version.
- `jsdom@^27.4.0`. `jest-environment-jsdom@30` pins `jsdom@^26`, which depends on
  `whatwg-encoding` — a package that is deprecated at *every* version in favour of
  `@exodus/bytes`. `jsdom@27.4.0` is the earliest release to make that switch, and
  its own `engines` are looser than the range above, so it costs no compatibility.
  (`jsdom@30` also works but narrows `engines` to `^22.22.2 || ^24.15.0 || >=26.0.0`.)

## Migrating from v1

v2 moves from the legacy `launchdarkly-react-client-sdk` (v3) to the LaunchDarkly
React Web SDK, `@launchdarkly/react-sdk` (v4). The logging API — `Logger`,
`LogLevel`, `useLogger` and every log method — is unchanged. What changed:

- **Peer dependency.** Replace `launchdarkly-react-client-sdk` with
  `@launchdarkly/react-sdk` (≥4.1.16).
- **`LDProvider` takes `provider` instead of `existingClient`.** Pass the
  component returned by `createLDReactProvider()` (or
  `createLDReactProviderWithClient()`). The old prop relied on the SDK's internal
  `_client` property, which no longer exists.
  ```diff
  - <LDProvider existingClient={yourLDClient} sdkLogFlagKey={...}>
  + <LDProvider provider={AppLDProvider} sdkLogFlagKey={...}>
  ```
- **`useLDClient` now returns the LaunchDarkly client**, not the provider
  component. Use `useOptionalLDClient` if you want `null` rather than a throw
  when no provider is mounted.
- **Imports of LD types** such as `LDLogLevel` move to `@launchdarkly/react-sdk`.
- **Node.js `^22.18.0 || >=24.11.0`** is required to build and test this package (was ≥18.2).
- **`logger.config`** is now publicly readable, as the docs always implied.

## TypeScript Support
This utility is written in TypeScript and provides type definitions out of the box. While it works perfectly in JavaScript React apps, TypeScript users get additional benefits:
- Type checking for logger configuration
- Autocomplete for log methods
- Type safety for log level values

## License
MIT
