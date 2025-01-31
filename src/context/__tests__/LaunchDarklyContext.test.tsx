import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { LDProvider } from '../LaunchDarklyContext';
import { asyncWithLDProvider, basicLogger, LDClient, LDLogLevel } from 'launchdarkly-react-client-sdk';
import { LDProviderComponent } from '../../types';

// Mock LaunchDarkly SDK
jest.mock('launchdarkly-react-client-sdk', () => ({
  asyncWithLDProvider: jest.fn(),
  basicLogger: jest.fn(),
  LDClient: jest.fn()
}));

describe('LDProvider', () => {
  const mockOnReady = jest.fn();
  const mockOnLogLevelChange = jest.fn();
  const mockCreateContexts = jest.fn(() => ({ user: 'test-user' }));
  const mockClose = jest.fn(() => Promise.resolve());
  
  type LDEventHandler = (key: string, callback: (...args: any[]) => void, context?: any) => void;
  
  // Create a partial mock of LDClient with just the methods we need
  const mockLDClient = {
    on: jest.fn() as jest.MockedFunction<LDEventHandler>,
    variation: jest.fn(),
    close: mockClose,
    waitUntilReady: jest.fn(),
    waitForInitialization: jest.fn(),
    waitUntilGoalsReady: jest.fn(),
    identify: jest.fn(),
    getContext: jest.fn(),
    track: jest.fn(),
    flush: jest.fn(),
    allFlags: jest.fn()
  } as unknown as LDClient;

  // Create a mock provider component that matches LDProviderComponent type
  const mockLDProviderComponent = Object.assign(
    function TestComponent({ children }: { children?: React.ReactNode }) {
      return <div data-testid="content">{children}</div>;
    },
    { _client: mockLDClient }
  ) as LDProviderComponent;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY = 'sdk-log-level';
    (asyncWithLDProvider as jest.Mock).mockResolvedValue(mockLDProviderComponent);
    (basicLogger as jest.Mock).mockImplementation(({ level }) => ({ level }));
  });

  afterEach(() => {
    delete process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY;
  });

  describe('SDK log level handling', () => {
    it('should use stored log level from localStorage', async () => {
      localStorage.setItem('ld_sdk_log_level', 'debug');

      await act(async () => {
        render(
          <LDProvider
            clientSideId="test-client-id"
            createContexts={mockCreateContexts}
            onReady={mockOnReady}
            onLogLevelChange={mockOnLogLevelChange}
          >
            <div>Test Content</div>
          </LDProvider>
        );
      });

      expect(asyncWithLDProvider).toHaveBeenCalledWith({
        clientSideID: 'test-client-id',
        context: { user: 'test-user' },
        timeout: 2,
        options: {
          logger: { level: 'debug' },
          bootstrap: 'localStorage'
        }
      });
    });

    it('should handle log level flag changes', async () => {
      await act(async () => {
        render(
          <LDProvider
            clientSideId="test-client-id"
            createContexts={mockCreateContexts}
            onReady={mockOnReady}
            onLogLevelChange={mockOnLogLevelChange}
          >
            <div>Test Content</div>
          </LDProvider>
        );
      });

      // Get the flag change handler
      const onCalls = (mockLDClient.on as jest.MockedFunction<LDEventHandler>).mock.calls;
      const flagChangeCall = onCalls.find(call => call[0] === 'change:sdk-log-level');
      const flagChangeHandler = flagChangeCall?.[1] as ((value: LDLogLevel) => void) | undefined;
      expect(flagChangeHandler).toBeDefined();

      // Simulate flag change
      await act(async () => {
        await flagChangeHandler?.('warn');
      });

      // Verify localStorage was updated and callback was called
      expect(localStorage.getItem('ld_sdk_log_level')).toBe('warn');
      expect(mockOnLogLevelChange).toHaveBeenCalledWith('warn');

      // For Option B, verify client was reinitialized
      expect(mockClose).toHaveBeenCalled();
      expect(asyncWithLDProvider).toHaveBeenLastCalledWith({
        clientSideID: 'test-client-id',
        context: { user: 'test-user' },
        timeout: 2,
        options: {
          logger: { level: 'warn' },
          bootstrap: 'localStorage'
        }
      });
    });

    it('should ignore invalid log levels', async () => {
      await act(async () => {
        render(
          <LDProvider
            clientSideId="test-client-id"
            createContexts={mockCreateContexts}
            onReady={mockOnReady}
            onLogLevelChange={mockOnLogLevelChange}
          >
            <div>Test Content</div>
          </LDProvider>
        );
      });

      // Get the flag change handler
      const onCalls = (mockLDClient.on as jest.MockedFunction<LDEventHandler>).mock.calls;
      const flagChangeCall = onCalls.find(call => call[0] === 'change:sdk-log-level');
      const flagChangeHandler = flagChangeCall?.[1] as ((value: LDLogLevel) => void) | undefined;
      expect(flagChangeHandler).toBeDefined();

      // Simulate invalid flag value
      await act(async () => {
        await flagChangeHandler?.('invalid-level' as LDLogLevel);
      });

      // Verify localStorage was not updated but callback was still called
      expect(localStorage.getItem('ld_sdk_log_level')).toBeNull();
      expect(mockOnLogLevelChange).toHaveBeenCalledWith('invalid-level');

      // Verify client was not reinitialized
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('with existing client', () => {
    // Create a mock existing client that matches LDProviderComponent type
    const mockExistingClient = Object.assign(
      function ExistingClient({ children }: { children?: React.ReactNode }) {
        return <div>{children}</div>;
      },
      { _client: mockLDClient }
    ) as LDProviderComponent;

    it('should render using existing client', async () => {
      await act(async () => {
        render(
          <LDProvider
            existingClient={mockExistingClient}
            onReady={mockOnReady}
          >
            <div>Test Content</div>
          </LDProvider>
        );
      });

      expect(mockOnReady).toHaveBeenCalled();
      expect(asyncWithLDProvider).not.toHaveBeenCalled();
    });
  });
});
