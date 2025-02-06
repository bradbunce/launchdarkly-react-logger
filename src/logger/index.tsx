import { useEffect } from 'react';
import { LDClient, useLDClient, basicLogger, LDLogLevel } from 'launchdarkly-react-client-sdk';

export interface LoggerConfig {
  consoleLogFlagKey: string;
  sdkLogFlagKey: string;
}

/**
 * Enum representing available log levels in order of severity.
 * Lower values indicate higher severity.
 */
export enum LogLevel {
  /** Most severe level, for unrecoverable errors */
  FATAL = 0,
  /** Error conditions that should be addressed */
  ERROR = 1,
  /** Warning messages for potentially harmful situations */
  WARN = 2,
  /** General informational messages */
  INFO = 3,
  /** Detailed debug information */
  DEBUG = 4,
  /** Most detailed level for fine-grained debugging */
  TRACE = 5,
}

/**
 * Logger class that integrates with LaunchDarkly for dynamic log level control.
 * Uses emoji indicators for visual log level identification.
 */
export class Logger {
  private ldClient: LDClient | null = null;
  private readonly config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Gets the current SDK log level from LaunchDarkly feature flag
   * @param fallback - Fallback log level if flag returns null
   * @returns Current SDK log level
   * @throws Error if no fallback value is provided and flag returns null
   */
  getSdkLogLevel(fallback: LDLogLevel): LDLogLevel {
    if (!this.ldClient) {
      throw new Error('LaunchDarkly client is not initialized');
    }
    const level = this.ldClient.variation(this.config.sdkLogFlagKey, fallback);
    if (level === null && !fallback) {
      throw new Error('SDK log level flag returned null and no fallback was provided');
    }
    return level ?? fallback;
  }

  /**
   * Sets the LaunchDarkly client instance for feature flag evaluation
   * @param client - LaunchDarkly client instance or null to clear
   */
  setLDClient(client: LDClient | null): void {
    this.ldClient = client;
  }

  /**
   * Gets the current console log level from LaunchDarkly feature flag
   * @returns Current LogLevel value
   * @throws Error if REACT_APP_LD_CONSOLE_LOG_FLAG_KEY is not set
   */
  private getCurrentLogLevel(): LogLevel {
    return this.ldClient?.variation(this.config.consoleLogFlagKey, LogLevel.ERROR) ?? LogLevel.ERROR;
  }

  /**
   * Determines if a message at the given level should be logged
   * @param level - Log level to check
   * @returns true if the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= this.getCurrentLogLevel();
  }

  /**
   * Logs a fatal error message (💀)
   * @param args - Arguments to log
   */
  fatal(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      console.error('💀', ...args);
    }
  }

  /**
   * Logs an error message (🔴)
   * @param args - Arguments to log
   */
  error(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error('🔴', ...args);
    }
  }

  /**
   * Logs a warning message (🟡)
   * @param args - Arguments to log
   */
  warn(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn('🟡', ...args);
    }
  }

  /**
   * Logs an info message (🔵)
   * @param args - Arguments to log
   */
  info(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info('🔵', ...args);
    }
  }

  /**
   * Alias for info() method
   * @param args - Arguments to log
   */
  log(...args: unknown[]): void {
    this.info(...args);
  }

  /**
   * Logs a debug message (⚪)
   * @param args - Arguments to log
   */
  debug(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug('⚪', ...args);
    }
  }

  /**
   * Logs a trace message (🟣)
   * @param args - Arguments to log
   */
  trace(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.trace('🟣', ...args);
    }
  }

  /**
   * Creates a new console group
   * @param label - Label for the group
   */
  group(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.group(label);
    }
  }

  /**
   * Ends the current console group
   */
  groupEnd(): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.groupEnd();
    }
  }

  /**
   * Starts a timer for performance measurements
   * @param label - Label to identify the timer
   */
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  /**
   * Ends a timer and logs the duration
   * @param label - Label of the timer to end
   */
  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }
}

/** Singleton instance of the Logger with default configuration */
export const logger = new Logger({
  consoleLogFlagKey: process.env.REACT_APP_LD_CONSOLE_LOG_FLAG_KEY ?? 'console-log-level',
  sdkLogFlagKey: process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY ?? 'sdk-log-level'
});

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
