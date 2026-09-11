import { useContext } from 'react';
import {
  LDReactContext,
  type LDReactClient,
  type LDReactClientContext
} from '@launchdarkly/react-sdk';

/**
 * Reads the LaunchDarkly client from context without throwing when no provider
 * is mounted.
 *
 * The SDK's own `useLDClient` types its return value as non-nullable, but the
 * underlying React context defaults to `null` — so calling it outside a
 * LaunchDarkly provider throws. The logger should never take an app down, so we
 * read the context directly and let callers handle the absent case.
 *
 * @param reactContext - Optional custom LaunchDarkly React context
 * @returns The LaunchDarkly client, or null when no provider is mounted
 */
export const useOptionalLDClient = (
  reactContext?: LDReactClientContext
): LDReactClient | null => {
  const value = useContext(reactContext ?? LDReactContext);
  return value?.client ?? null;
};
