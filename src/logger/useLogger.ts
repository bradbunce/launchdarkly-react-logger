import { useEffect } from 'react';
import type { LDReactClientContext } from '@launchdarkly/react-sdk';
import { useOptionalLDClient } from '../context/useOptionalLDClient';
import { Logger } from './index';

/**
 * React hook for accessing a Logger instance
 * Automatically manages LaunchDarkly client lifecycle
 * @param logger - The Logger instance to use
 * @param reactContext - Optional custom LaunchDarkly React context, for apps
 *   that run more than one LaunchDarkly client
 * @returns The same Logger instance with client management
 */
export const useLogger = (
  logger: Logger,
  reactContext?: LDReactClientContext
): Logger => {
  const ldClient = useOptionalLDClient(reactContext);

  useEffect(() => {
    if (!ldClient) return;

    // Set up the client
    logger.setLDClient(ldClient);

    return () => {
      logger.setLDClient(null);
    };
  }, [ldClient, logger]);

  return logger;
};
