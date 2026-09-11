// src/index.tsx
import { Logger, LogLevel } from './logger';
import type { LoggerConfig } from './logger';
import { useLogger } from './logger/useLogger';
import { LDProvider } from './context/LaunchDarklyContext';
import { useOptionalLDClient } from './context/useOptionalLDClient';
import type { LDProviderComponent, LDProviderProps } from './types';

// Re-exported from the React Web SDK so consumers can reach the client without
// adding a second import. `useLDClient` throws outside a LaunchDarkly provider;
// `useOptionalLDClient` returns null instead.
export { useLDClient } from '@launchdarkly/react-sdk';

export {
  Logger,
  LogLevel,
  useLogger,
  LDProvider,
  useOptionalLDClient,
  type LoggerConfig,
  type LDProviderComponent,
  type LDProviderProps
};
