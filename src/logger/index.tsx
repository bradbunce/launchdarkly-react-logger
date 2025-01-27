import { useEffect } from 'react';
import { LDClient, useLDClient } from 'launchdarkly-react-client-sdk';

export enum LogLevel {
 FATAL = 0,
 ERROR = 1,
 WARN = 2,
 INFO = 3,
 DEBUG = 4,
 TRACE = 5,
}

export class Logger {
 private ldClient: LDClient | null = null;
 private readonly FLAG_KEY = process.env.REACT_APP_LD_CONSOLE_LOG_FLAG_KEY;

 setLDClient(client: LDClient | null): void {
   this.ldClient = client;
 }

 private getCurrentLogLevel(): LogLevel {
   if (!this.FLAG_KEY) {
     throw new Error('REACT_APP_LD_CONSOLE_LOG_FLAG_KEY environment variable is not set');
   }
   return this.ldClient?.variation(this.FLAG_KEY, LogLevel.ERROR) ?? LogLevel.ERROR;
 }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.getCurrentLogLevel();
  }

  fatal(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      console.error('💀', ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error('🔴', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn('🟡', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info('🔵', ...args);
    }
  }

  log(...args: unknown[]): void {
    this.info(...args);
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug('⚪', ...args);
    }
  }

  trace(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.trace('🟣', ...args);
    }
  }

  group(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.groupEnd();
    }
  }

  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();

export const useLogger = (): Logger => {
  const ldClient = useLDClient();

  useEffect(() => {
    if (ldClient) {
      logger.setLDClient(ldClient);
    }
    return () => {
      if (ldClient) {
        logger.setLDClient(null);
      }
    };
  }, [ldClient]);

  return logger;
};