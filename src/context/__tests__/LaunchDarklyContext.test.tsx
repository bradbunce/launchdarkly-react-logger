import React from 'react';
import { render, act } from '@testing-library/react';
import { LDReactContext, type LDLogLevel } from '@launchdarkly/react-sdk';
import { LDProvider } from '../LaunchDarklyContext';
import type { LDProviderComponent } from '../../types';

describe('LDProvider', () => {
  const mockOnLogLevelChange = jest.fn();
  let mockLDClient: { on: jest.Mock; off: jest.Mock };
  let mockProvider: LDProviderComponent;

  // Returns the handler the component registered for the flag change event.
  const getFlagChangeHandler = (): ((value: unknown) => void) | undefined => {
    const call = mockLDClient.on.mock.calls.find(
      ([event]) => event === 'change:sdk-log-level'
    );
    return call?.[1];
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockLDClient = { on: jest.fn(), off: jest.fn() };

    // Stands in for a provider from `createLDReactProvider()`: it supplies the
    // LaunchDarkly client on the SDK's React context.
    mockProvider = ({ children }) => (
      <LDReactContext.Provider
        value={
          {
            client: mockLDClient,
            initializedState: 'success'
          } as unknown as React.ContextType<typeof LDReactContext>
        }
      >
        <div data-testid="content">{children}</div>
      </LDReactContext.Provider>
    );
  });

  it('should render children inside the supplied provider', () => {
    const { getByTestId, getByText } = render(
      <LDProvider
        provider={mockProvider}
        sdkLogFlagKey="sdk-log-level"
        onLogLevelChange={mockOnLogLevelChange}
      >
        <div>Test Content</div>
      </LDProvider>
    );

    expect(getByTestId('content')).toBeInTheDocument();
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should set up flag listener for SDK log level', () => {
    render(
      <LDProvider
        provider={mockProvider}
        sdkLogFlagKey="sdk-log-level"
        onLogLevelChange={mockOnLogLevelChange}
      >
        <div>Test Content</div>
      </LDProvider>
    );

    expect(mockLDClient.on).toHaveBeenCalledWith(
      'change:sdk-log-level',
      expect.any(Function)
    );
  });

  it('should handle valid log level changes', async () => {
    render(
      <LDProvider
        provider={mockProvider}
        sdkLogFlagKey="sdk-log-level"
        onLogLevelChange={mockOnLogLevelChange}
      >
        <div>Test Content</div>
      </LDProvider>
    );

    const flagChangeHandler = getFlagChangeHandler();
    expect(flagChangeHandler).toBeDefined();

    await act(async () => {
      flagChangeHandler?.('warn' satisfies LDLogLevel);
    });

    expect(mockOnLogLevelChange).toHaveBeenCalledWith('warn');
  });

  it('should ignore invalid log levels', async () => {
    render(
      <LDProvider
        provider={mockProvider}
        sdkLogFlagKey="sdk-log-level"
        onLogLevelChange={mockOnLogLevelChange}
      >
        <div>Test Content</div>
      </LDProvider>
    );

    const flagChangeHandler = getFlagChangeHandler();
    expect(flagChangeHandler).toBeDefined();

    await act(async () => {
      flagChangeHandler?.('invalid-level');
    });

    expect(mockOnLogLevelChange).not.toHaveBeenCalled();
  });

  it('should remove the flag listener on unmount', () => {
    const { unmount } = render(
      <LDProvider
        provider={mockProvider}
        sdkLogFlagKey="sdk-log-level"
        onLogLevelChange={mockOnLogLevelChange}
      >
        <div>Test Content</div>
      </LDProvider>
    );

    const flagChangeHandler = getFlagChangeHandler();
    unmount();

    expect(mockLDClient.off).toHaveBeenCalledWith(
      'change:sdk-log-level',
      flagChangeHandler
    );
  });
});
