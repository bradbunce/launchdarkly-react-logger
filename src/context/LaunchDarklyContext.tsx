import { useEffect } from 'react';
import type { LDLogLevel, LDReactClientContext } from '@launchdarkly/react-sdk';
import type { LDProviderProps } from '../types';
import { useOptionalLDClient } from './useOptionalLDClient';

const SDK_LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;

const isSdkLogLevel = (value: unknown): value is LDLogLevel =>
  typeof value === 'string' && (SDK_LOG_LEVELS as readonly string[]).includes(value);

interface SdkLogLevelListenerProps {
  sdkLogFlagKey: string;
  onLogLevelChange?: (level: LDLogLevel) => void;
  reactContext?: LDReactClientContext;
}

/**
 * Subscribes to SDK log level flag changes. Rendered inside the LaunchDarkly
 * provider so that the client is available on context.
 */
const SdkLogLevelListener = ({
  sdkLogFlagKey,
  onLogLevelChange,
  reactContext
}: SdkLogLevelListenerProps) => {
  const ldClient = useOptionalLDClient(reactContext);

  useEffect(() => {
    if (!ldClient || !sdkLogFlagKey || !onLogLevelChange) return;

    const handleChange = (value: unknown) => {
      if (isSdkLogLevel(value)) {
        onLogLevelChange(value);
      }
    };

    const event = `change:${sdkLogFlagKey}`;
    ldClient.on(event, handleChange);

    return () => {
      ldClient.off(event, handleChange);
    };
  }, [ldClient, onLogLevelChange, sdkLogFlagKey]);

  return null;
};

/**
 * Wraps your app's LaunchDarkly provider and reports SDK log level flag changes.
 *
 * Pass the provider component created by `createLDReactProvider()` (or
 * `createLDReactProviderWithClient()`) from `@launchdarkly/react-sdk`.
 */
export const LDProvider = ({
  children,
  provider: Provider,
  sdkLogFlagKey,
  onLogLevelChange,
  reactContext
}: LDProviderProps) => (
  <Provider>
    <SdkLogLevelListener
      sdkLogFlagKey={sdkLogFlagKey}
      onLogLevelChange={onLogLevelChange}
      reactContext={reactContext}
    />
    {children}
  </Provider>
);

export { useOptionalLDClient };
