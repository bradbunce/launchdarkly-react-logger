import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LDProvider } from '../LaunchDarklyContext';
import { asyncWithLDProvider, useLDClient, basicLogger } from 'launchdarkly-react-client-sdk';
import { logger } from '../../logger';

// Mock the LaunchDarkly SDK
jest.mock('launchdarkly-react-client-sdk', () => ({
  asyncWithLDProvider: jest.fn(),
  useLDClient: jest.fn(),
}));

// Mock the logger to avoid actual logging during tests
jest.mock('../../logger', () => ({
  useLogger: jest.fn(),
  logger: {
    createSdkLogger: jest.fn().mockReturnValue({ level: 'info' }),
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

  const MockComponent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const mockExistingClient = jest.fn().mockImplementation(MockComponent);
  const mockCreateContexts = () => ({ user: 'test-user' });
  const mockOnReady = jest.fn();
  const mockLDClient = { variation: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (asyncWithLDProvider as jest.Mock).mockResolvedValue(MockComponent);
    (useLDClient as jest.Mock).mockReturnValue(mockLDClient);
  });

  describe('with existing client', () => {
    it('should render using existing client', async () => {
      const rendered = render(
        <LDProvider existingClient={mockExistingClient} onReady={mockOnReady}>
          <div>Test Content</div>
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
          <div>Test Content</div>
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
            logger: { level: 'info' },
          },
        });
        expect(logger.createSdkLogger).toHaveBeenCalled();
      });
    });

    it('should throw error when clientSideId is missing', async () => {
      await expect(async () => {
        render(
          <LDProvider createContexts={mockCreateContexts}>
            <div>Test Content</div>
          </LDProvider>
        );
      }).rejects.toThrow('clientSideId is required when not using an existing client');
    });

    it('should throw error when createContexts is missing', async () => {
      await expect(async () => {
        render(
          <LDProvider clientSideId="test-client-id">
            <div>Test Content</div>
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
          loadingComponent={<div>Custom Loading...</div>}
        >
          <div>Test Content</div>
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
          <div>Test Content</div>
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
