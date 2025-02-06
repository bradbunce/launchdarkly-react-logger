import { Logger } from './index';

/**
 * Singleton instance of the Logger
 * 
 * IMPORTANT: The application using this logger MUST provide ALL of these values:
 * 1. LaunchDarkly client-side ID
 * 2. Feature flag key for console log level control
 * 3. Feature flag key for SDK log level control
 * 
 * These are REQUIRED variables - there are no default values or fallbacks.
 * The application must provide all three values through environment variables,
 * configuration files, or any other method that suits their setup.
 */
export const logger = new Logger({
  consoleLogFlagKey: (() => {
    throw new Error('Console log flag key must be provided by the application');
  })(),
  sdkLogFlagKey: (() => {
    throw new Error('SDK log flag key must be provided by the application');
  })()
});
