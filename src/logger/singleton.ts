import { Logger } from './index';

/**
 * Singleton instance of the Logger
 * 
 * IMPORTANT: The application using this logger must provide:
 * 1. LaunchDarkly client-side ID
 * 2. Feature flag key for console log level control
 * 3. Feature flag key for SDK log level control
 * 
 * These values should be defined as environment variables in the application.
 */
export const logger = new Logger({
  consoleLogFlagKey: (() => {
    throw new Error('Console log flag key must be provided by the application');
  })(),
  sdkLogFlagKey: (() => {
    throw new Error('SDK log flag key must be provided by the application');
  })()
});
