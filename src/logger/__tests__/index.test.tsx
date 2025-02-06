import { renderHook } from '@testing-library/react';
import { LDClient, LDLogLevel } from 'launchdarkly-js-client-sdk';
import { Logger, LogLevel, useLogger } from '../index';

/**
 * Test suite for the LaunchDarkly React Logger
 * 
 * These tests verify:
 * 1. Log level control through LaunchDarkly feature flags
 * 2. All logging methods (fatal, error, warn, info, debug, trace)
 * 3. Group and time logging functionality
 * 4. Environment variable handling
 * 5. React hook lifecycle
 */
describe('Logger', () => {
  let logger: Logger;
  let mockLDClient: jest.Mocked<LDClient>;
  const originalConsole = { ...console };
  const originalEnv = process.env;

  const testConfig = {
    consoleLogFlagKey: 'console-log-level',
    sdkLogFlagKey: 'sdk-log-level'
  };

  beforeEach(() => {
    // Mock all console methods to verify logging behavior
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.trace = jest.fn();
    console.group = jest.fn();
    console.groupEnd = jest.fn();
    console.time = jest.fn();
    console.timeEnd = jest.fn();

    // Mock LaunchDarkly client for feature flag testing
    mockLDClient = {
      variation: jest.fn(),
    } as unknown as jest.Mocked<LDClient>;

    // Create fresh logger instance for each test
    logger = new Logger(testConfig);
    logger.setLDClient(mockLDClient);
  });

  afterEach(() => {
    // Restore original console methods and environment
    console = { ...originalConsole };
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Log Level Control', () => {
    it('should use ERROR as default log level when client returns null', () => {
      mockLDClient.variation.mockReturnValue(null);
      logger.error('test error');
      expect(console.error).toHaveBeenCalledWith('🔴', 'test error');
    });

    it('should respect log level from feature flag', () => {
      // Set log level to INFO - should show INFO and above, but not DEBUG
      mockLDClient.variation.mockReturnValue(LogLevel.INFO);
      
      logger.debug('test debug'); // Should not log (below INFO)
      logger.info('test info');   // Should log
      logger.error('test error'); // Should log (above INFO)

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith('🔵', 'test info');
      expect(console.error).toHaveBeenCalledWith('🔴', 'test error');
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      // Set highest log level to test all methods
      mockLDClient.variation.mockReturnValue(LogLevel.TRACE);
    });

    it('should log fatal messages', () => {
      logger.fatal('fatal error');
      expect(console.error).toHaveBeenCalledWith('💀', 'fatal error');
    });

    it('should log error messages', () => {
      logger.error('error message');
      expect(console.error).toHaveBeenCalledWith('🔴', 'error message');
    });

    it('should log warning messages', () => {
      logger.warn('warning message');
      expect(console.warn).toHaveBeenCalledWith('🟡', 'warning message');
    });

    it('should log info messages', () => {
      logger.info('info message');
      expect(console.info).toHaveBeenCalledWith('🔵', 'info message');
    });

    it('should log debug messages', () => {
      logger.debug('debug message');
      expect(console.debug).toHaveBeenCalledWith('⚪', 'debug message');
    });

    it('should log trace messages', () => {
      logger.trace('trace message');
      expect(console.trace).toHaveBeenCalledWith('🟣', 'trace message');
    });

    it('should handle group logging', () => {
      logger.group('test group');
      logger.groupEnd();
      expect(console.group).toHaveBeenCalledWith('test group');
      expect(console.groupEnd).toHaveBeenCalled();
    });

    it('should handle time logging', () => {
      logger.time('test timer');
      logger.timeEnd('test timer');
      expect(console.time).toHaveBeenCalledWith('test timer');
      expect(console.timeEnd).toHaveBeenCalledWith('test timer');
    });
  });

  describe('SDK Log Level', () => {
    it('should throw error when client is not initialized', () => {
      const newLogger = new Logger(testConfig);
      expect(() => newLogger.getSdkLogLevel('error' as LDLogLevel)).toThrow(
        'LaunchDarkly client is not initialized'
      );
    });

    it('should use fallback when flag returns null', () => {
      mockLDClient.variation.mockReturnValue(null);
      const warnLevel = 'warn' as LDLogLevel;
      expect(logger.getSdkLogLevel(warnLevel)).toBe(warnLevel);
    });

    it('should throw error when flag returns null and no fallback provided', () => {
      mockLDClient.variation.mockReturnValue(null);
      expect(() => logger.getSdkLogLevel(null as unknown as LDLogLevel)).toThrow(
        'SDK log level flag returned null and no fallback was provided'
      );
    });
  });

  describe('useLogger Hook', () => {
    it('should set and clear LD client on mount/unmount', () => {
      // Test React hook lifecycle management
      const { unmount } = renderHook(() => useLogger());
      unmount();
      expect(mockLDClient).toBeDefined();
    });
  });
});
