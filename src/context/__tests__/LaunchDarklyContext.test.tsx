/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { FC, PropsWithChildren } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LDProvider } from '../LaunchDarklyContext';
import { asyncWithLDProvider, useLDClient, basicLogger } from 'launchdarkly-react-client-sdk';
import { logger } from '../../logger';

// Mock the LaunchDarkly SDK
jest.mock('launchdarkly-react-client-sdk', () => ({
  asyncWithLDProvider: jest.fn(),
  useLDClient: jest.fn(),
  basicLogger: jest.fn(({ level }) => ({ level })),
}));

// Mock the logger to avoid actual logging during tests
jest.mock('../../logger', () => ({
  useLogger: jest.fn(),
  logger: {
    getSdkLogLevel: jest.fn().mockReturnValue('info'),
  },
}));

describe('LDProvider', () => {
  // Suppress expected React error messages in tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  const MockComponent: FC<PropsWithChildren> = ({ children }) => <>{children}</>;
  const TestContent: FC = () => <div data-testid="content">Test Content</div>;
  const mockExistingClient = jest.fn().mockImplementation(MockComponent);
  const mockCreateContexts = () => ({ user: 'test-user' });
  const mockOnReady = jest.fn();
  const mockLDClient = { 
    variation: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (asyncWithLDProvider as jest.Mock).mockResolvedValue(Object.assign(MockComponent, {
      _client: mockLDClient
    }));
    (useLDClient as jest.Mock).mockReturnValue(mockLDClient);
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('SDK log level handling', () => {
    it('should use stored log level from localStorage', async () => {
      localStorage.setItem('ld_sdk_log_level', 'debug');

      render(
        <LDProvider
          clientSideId="test-client-id"
          createContexts={mockCreateContexts}
        >
          <TestContent />
        </LDProvider>
      );

      await waitFor(() => {
        expect(asyncWithLDProvider).toHaveBeenCalledWith(
          expect.objectContaining({
            options: {
              logger: basicLogger({ level: 'debug' }),
              bootstrap: 'localStorage'
            }
          })
        );
      });
    });

    it('should default to info level when no stored level exists', async () => {
      render(
        <LDProvider
          clientSideId="test-client-id"
          createContexts={mockCreateContexts}
        >
          <TestContent />
        </LDProvider>
      );

      await waitFor(() => {
        expect(asyncWithLDProvider).toHaveBeenCalledWith(
          expect.objectContaining({
            options: {
              logger: basicLogger({ level: 'info' }),
              bootstrap: 'localStorage'
            }
          })
        );
      });
    });

    it('should handle log level flag changes', async () => {
      const mockOnLogLevelChange = jest.fn();
      process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY = 'sdk-log-level';

      render(
        <LDProvider
          clientSideId="test-client-id"
          createContexts={mockCreateContexts}
          onLogLevelChange={mockOnLogLevelChange}
        >
          <TestContent />
        </LDProvider>
      );

      await waitFor(() => {
        // Verify flag listener was set up
        expect(mockLDClient.on).toHaveBeenCalledWith(
          'change:sdk-log-level',
          expect.any(Function)
        );
      });

      // Simulate flag change
      const flagChangeHandler = mockLDClient.on.mock.calls[0][1];
      flagChangeHandler('warn');

      // Verify localStorage was updated and callback was called
      expect(localStorage.getItem('ld_sdk_log_level')).toBe('warn');
      expect(mockOnLogLevelChange).toHaveBeenCalledWith('warn');

      // Clean up
      delete process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY;
    });

    it('should ignore invalid log levels', async () => {
      const mockOnLogLevelChange = jest.fn();
      process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY = 'sdk-log-level';

      render(
        <LDProvider
          clientSideId="test-client-id"
          createContexts={mockCreateContexts}
          onLogLevelChange={mockOnLogLevelChange}
        >
          <TestContent />
        </LDProvider>
      );

      await waitFor(() => {
        // Verify flag listener was set up
        expect(mockLDClient.on).toHaveBeenCalledWith(
          'change:sdk-log-level',
          expect.any(Function)
        );
      });

      // Simulate flag change with invalid level
      const flagChangeHandler = mockLDClient.on.mock.calls[0][1];
      flagChangeHandler('invalid-level');

      // Verify localStorage was not updated but callback was still called
      expect(localStorage.getItem('ld_sdk_log_level')).toBeNull();
      expect(mockOnLogLevelChange).toHaveBeenCalledWith('invalid-level');

      // Clean up
      delete process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY;
    });
  });

  describe('with existing client', () => {
    it('should render using existing client', async () => {
      const rendered = render(
        <LDProvider existingClient={mockExistingClient} onReady={mockOnReady}>
          <TestContent />
        </LDProvider>
      );

      await waitFor(() => {
        expect(rendered.getByText('Test Content')).toBeInTheDocument();
        expect(mockOnReady).toHaveBeenCalled();
      });

      // Should not attempt to create new client
      expect(asyncWithLDProvider).not.toHaveBeenCalled();
    });
  });

  describe('without existing client', () => {
    it('should create new client when required props are provided', async () => {
      const rendered = render(
        <LDProvider
          clientSideId="test-client-id"
          createContexts={mockCreateContexts}
          onReady={mockOnReady}
        >
          <TestContent />
        </LDProvider>
      );

      await waitFor(() => {
        expect(rendered.getByText('Test Content')).toBeInTheDocument();
        expect(mockOnReady).toHaveBeenCalled();
        expect(asyncWithLDProvider).toHaveBeenCalledWith({
          clientSideID: 'test-client-id',
          context: { user: 'test-user' },
          timeout: 2,
          options: {
            logger: basicLogger({ level: 'info' }),
            bootstrap: 'localStorage'
          },
        });
      });
    });

    it('should throw error when clientSideId is missing', async () => {
      await expect(async () => {
        render(
          <LDProvider createContexts={mockCreateContexts}>
            <TestContent />
          </LDProvider>
        );
      }).rejects.toThrow('clientSideId is required when not using an existing client');
    });

    it('should throw error when createContexts is missing', async () => {
      await expect(async () => {
        render(
          <LDProvider clientSideId="test-client-id">
            <TestContent />
          </LDProvider>
        );
      }).rejects.toThrow('createContexts is required when not using an existing client');
    });
  });

  describe('loading state', () => {
    it('should render loading component before initialization', async () => {
      // Mock asyncWithLDProvider to delay resolution
      let resolveClient: (value: typeof MockComponent) => void;
      const clientPromise = new Promise<typeof MockComponent>(resolve => {
        resolveClient = resolve;
      });
      (asyncWithLDProvider as jest.Mock).mockReturnValue(clientPromise);

      const rendered = render(
        <LDProvider
          clientSideId="test-client-id"
          createContexts={mockCreateContexts}
          loadingComponent={React.createElement('div', null, 'Custom Loading...')}
        >
          <TestContent />
        </LDProvider>
      );

      // Loading component should be visible immediately
      expect(rendered.getByText('Custom Loading...')).toBeInTheDocument();

      // Resolve the client
      await act(async () => {
        resolveClient(MockComponent);
        await clientPromise;
      });

      // Content should be visible after initialization
      await waitFor(() => {
        expect(rendered.getByText('Test Content')).toBeInTheDocument();
      });
    });

    it('should render empty div as default loading component', async () => {
      // Mock asyncWithLDProvider to delay resolution
      let resolveClient: (value: typeof MockComponent) => void;
      const clientPromise = new Promise<typeof MockComponent>(resolve => {
        resolveClient = resolve;
      });
      (asyncWithLDProvider as jest.Mock).mockReturnValue(clientPromise);

      const rendered = render(
        <LDProvider clientSideId="test-client-id" createContexts={mockCreateContexts}>
          <TestContent />
        </LDProvider>
      );

      // Default loading component should be an empty div
      const loadingComponent = rendered.container.firstChild;
      expect(loadingComponent).toBeInTheDocument();
      expect(loadingComponent).toMatchInlineSnapshot(`<div />`);

      // Resolve the client
      await act(async () => {
        resolveClient(MockComponent);
        await clientPromise;
      });

      // Content should be visible after initialization
      await waitFor(() => {
        expect(rendered.getByText('Test Content')).toBeInTheDocument();
      });
    });
  });
});
