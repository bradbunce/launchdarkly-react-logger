import { Logger } from './index';

/** Singleton instance of the Logger with environment variable configuration */
export const logger = new Logger({
  consoleLogFlagKey: process.env.REACT_APP_LD_CONSOLE_LOG_FLAG_KEY || (() => {
    throw new Error('REACT_APP_LD_CONSOLE_LOG_FLAG_KEY environment variable is not set');
  })(),
  sdkLogFlagKey: process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY || (() => {
    throw new Error('REACT_APP_LD_SDK_LOG_FLAG_KEY environment variable is not set');
  })()
});
