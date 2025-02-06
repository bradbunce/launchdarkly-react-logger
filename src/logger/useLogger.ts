import { useEffect } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { logger } from './singleton';
import { Logger } from './index';

/**
 * React hook for accessing the Logger instance
 * Automatically manages LaunchDarkly client lifecycle
 * @returns Logger instance
 */
export const useLogger = (): Logger => {
  const ldClient = useLDClient();

  useEffect(() => {
    if (!ldClient) return;

    // Set up the client
    logger.setLDClient(ldClient);

    return () => {
      logger.setLDClient(null);
    };
  }, [ldClient]);

  return logger;
};
