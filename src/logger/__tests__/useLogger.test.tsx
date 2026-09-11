import React from 'react';
import { renderHook } from '@testing-library/react';
import { LDReactContext } from '@launchdarkly/react-sdk';
import { useLogger } from '../useLogger';
import { Logger } from '../';

describe('useLogger', () => {
  let mockLDClient: { variation: jest.Mock };
  let logger: Logger;

  // Wraps the hook in the SDK's React context, as a LaunchDarkly provider would.
  const wrapperFor = (client: unknown) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <LDReactContext.Provider
        value={
          client === null
            ? (null as unknown as React.ContextType<typeof LDReactContext>)
            : ({
                client,
                initializedState: 'success'
              } as unknown as React.ContextType<typeof LDReactContext>)
        }
      >
        {children}
      </LDReactContext.Provider>
    );
    return Wrapper;
  };

  beforeEach(() => {
    mockLDClient = { variation: jest.fn() };

    logger = new Logger({
      consoleLogFlagKey: 'test-console-flag',
      sdkLogFlagKey: 'test-sdk-flag'
    });
  });

  it('should set client when available', () => {
    const setClientSpy = jest.spyOn(logger, 'setLDClient');

    renderHook(() => useLogger(logger), {
      wrapper: wrapperFor(mockLDClient)
    });

    expect(setClientSpy).toHaveBeenCalledWith(mockLDClient);
  });

  it('should return the same logger instance', () => {
    const { result } = renderHook(() => useLogger(logger), {
      wrapper: wrapperFor(mockLDClient)
    });

    expect(result.current).toBe(logger);
  });

  it('should handle a missing provider', () => {
    const setClientSpy = jest.spyOn(logger, 'setLDClient');

    // No LaunchDarkly provider mounted at all.
    expect(() => {
      renderHook(() => useLogger(logger));
    }).not.toThrow();

    expect(setClientSpy).not.toHaveBeenCalled();
  });

  it('should handle null client', () => {
    expect(() => {
      renderHook(() => useLogger(logger), { wrapper: wrapperFor(null) });
    }).not.toThrow();
  });

  it('should clean up client on unmount', () => {
    const setClientSpy = jest.spyOn(logger, 'setLDClient');

    const { unmount } = renderHook(() => useLogger(logger), {
      wrapper: wrapperFor(mockLDClient)
    });
    unmount();

    expect(setClientSpy).toHaveBeenCalledWith(null);
  });
});
