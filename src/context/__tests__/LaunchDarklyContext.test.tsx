import React from 'react';
import { render, act } from '@testing-library/react';
import { LDProvider } from '../LaunchDarklyContext';
import { LDClient, LDLogLevel } from 'launchdarkly-react-client-sdk';
import { LDProviderComponent } from '../../types';

describe('LDProvider', () => {
  const mockOnLogLevelChange = jest.fn();
  
  type LDEventHandler = (key: string, callback: (...args: any[]) => void, context?: any) => void;
  
  // Create a partial mock of LDClient
  const mockLDClient = {
    on: jest.fn() as jest.MockedFunction<LDEventHandler>,
  } as unknown as LDClient;

  // Create a mock provider component
  const mockExistingClient = Object.assign(
    function ExistingClient({ children }: { children?: React.ReactNode }) {
      return <div data-testid="content">{children}</div>;
    },
    { _client: mockLDClient }
  ) as LDProviderComponent;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children using existing client', () => {
    const { getByTestId } = render(
      <LDProvider
        existingClient={mockExistingClient}
        sdkLogFlagKey="sdk-log-level"
        onLogLevelChange={mockOnLogLevelChange}
      >
        <div>Test Content</div>
      </LDProvider>
    );

    expect(getByTestId('content')).toBeInTheDocument();
  });

  it('should set up flag listener for SDK log level', () => {
    render(
      <LDProvider
        existingClient={mockExistingClient}
        sdkLogFlagKey="sdk-log-level"
        onLogLevelChange={mockOnLogLevelChange}
      >
        <div>Test Content</div>
      </LDProvider>
    );

    // Verify listener was set up
    expect(mockLDClient.on).toHaveBeenCalledWith(
      'change:sdk-log-level',
      expect.any(Function)
    );
  });

  it('should handle valid log level changes', async () => {
    render(
      <LDProvider
        existingClient={mockExistingClient}
        sdkLogFlagKey="sdk-log-level"
        onLogLevelChange={mockOnLogLevelChange}
      >
        <div>Test Content</div>
      </LDProvider>
    );

    // Get the flag change handler
    const onCalls = (mockLDClient.on as jest.MockedFunction<LDEventHandler>).mock.calls;
    const flagChangeCall = onCalls.find((call: [string, Function, any?]) => call[0] === 'change:sdk-log-level');
    const flagChangeHandler = flagChangeCall?.[1] as ((value: LDLogLevel) => void) | undefined;
    expect(flagChangeHandler).toBeDefined();

    // Simulate valid flag change
    await act(async () => {
      flagChangeHandler?.('warn');
    });

    expect(mockOnLogLevelChange).toHaveBeenCalledWith('warn');
  });

  it('should ignore invalid log levels', async () => {
    render(
      <LDProvider
        existingClient={mockExistingClient}
        sdkLogFlagKey="sdk-log-level"
        onLogLevelChange={mockOnLogLevelChange}
      >
        <div>Test Content</div>
      </LDProvider>
    );

    // Get the flag change handler
    const onCalls = (mockLDClient.on as jest.MockedFunction<LDEventHandler>).mock.calls;
    const flagChangeCall = onCalls.find((call: [string, Function, any?]) => call[0] === 'change:sdk-log-level');
    const flagChangeHandler = flagChangeCall?.[1] as ((value: LDLogLevel) => void) | undefined;
    expect(flagChangeHandler).toBeDefined();

    // Simulate invalid flag value
    await act(async () => {
      flagChangeHandler?.('invalid-level' as LDLogLevel);
    });

    expect(mockOnLogLevelChange).not.toHaveBeenCalled();
  });
});
