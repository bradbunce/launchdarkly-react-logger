import { useEffect } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { Logger } from './index';

/**
 * React hook for accessing a Logger instance
 * Automatically manages LaunchDarkly client lifecycle
 * @param logger - The Logger instance to use
 * @returns The same Logger instance with client management
 */
export const useLogger = (logger: Logger): Logger => {
  const ldClient = useLDClient();

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
