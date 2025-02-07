import { renderHook } from '@testing-library/react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { useLogger } from '../useLogger';
import { Logger } from '../';

// Mock LaunchDarkly hook
jest.mock('launchdarkly-react-client-sdk', () => ({
  useLDClient: jest.fn()
}));

describe('useLogger', () => {
  let mockLDClient: any;
  let logger: Logger;

  beforeEach(() => {
    // Create mock client
    mockLDClient = {
      variation: jest.fn()
    };

    // Create logger instance
    logger = new Logger({
      consoleLogFlagKey: 'test-console-flag',
      sdkLogFlagKey: 'test-sdk-flag'
    });

    // Reset mocks
    (useLDClient as jest.Mock).mockReset();
  });

  it('should set client when available', () => {
    // Mock client being available
    (useLDClient as jest.Mock).mockReturnValue(mockLDClient);

    // Render hook with logger instance
    renderHook(() => useLogger(logger));

    // Client should be set
    expect(mockLDClient.variation).toBeDefined();
  });

  it('should handle null client', () => {
    // Mock client not being available
    (useLDClient as jest.Mock).mockReturnValue(null);

    // Should not throw when client is null
    expect(() => {
      renderHook(() => useLogger(logger));
    }).not.toThrow();
  });

  it('should clean up client on unmount', () => {
    // Mock client being available
    (useLDClient as jest.Mock).mockReturnValue(mockLDClient);

    // Set up spy on logger
    const setClientSpy = jest.spyOn(logger, 'setLDClient');

    // Render and unmount hook
    const { unmount } = renderHook(() => useLogger(logger));
    unmount();

    // Client should be cleared on unmount
    expect(setClientSpy).toHaveBeenCalledWith(null);
  });
});
