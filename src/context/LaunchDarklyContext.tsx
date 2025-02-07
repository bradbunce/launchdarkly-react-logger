import React, { createContext, useContext, useState, useEffect, useRef, ComponentType } from 'react';
import { asyncWithLDProvider, basicLogger, LDLogLevel, LDClient } from 'launchdarkly-react-client-sdk';
import { LDProviderComponent, LDProviderProps } from '../types';

const LDContext = createContext<LDProviderComponent | null>(null);

interface LDProviderExtendedProps extends LDProviderProps {
  onLogLevelChange?: (level: LDLogLevel) => void;
}

const MockComponent: LDProviderComponent = function MockComponent(props) {
  return React.createElement(React.Fragment, null, props.children);
};

const getStoredLogLevel = (): LDLogLevel | null => {
  const storedLogLevel = localStorage.getItem('ld_sdk_log_level');
  return (storedLogLevel && ['error', 'warn', 'info', 'debug'].includes(storedLogLevel)) 
    ? storedLogLevel as LDLogLevel 
    : null;
};

export const LDProvider = ({
  children,
  onReady,
  createContexts,
  clientSideId = process.env.REACT_APP_LD_CLIENTSIDE_ID,
  existingClient,
  loadingComponent = React.createElement('div'),
  onLogLevelChange
}: LDProviderExtendedProps) => {
  const [client, setClient] = useState<LDProviderComponent>(() => MockComponent);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeLDClient = async (logLevel: LDLogLevel = 'info') => {
      try {
        // If an existing client is provided, use it
        if (existingClient) {
          setClient(() => existingClient);
          // Set up flag listener for the existing client
          if (process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY && (existingClient as any)._client) {
            const ldClient = (existingClient as any)._client as LDClient;
            // Track flag evaluations
            ldClient.on(`change:${process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY}`, (value: LDLogLevel) => {
              onLogLevelChange?.(value);
              // Store valid levels for future client initializations
              if (['error', 'warn', 'info', 'debug'].includes(value)) {
                localStorage.setItem('ld_sdk_log_level', value);
              }
            });
          }
          onReady?.();
          return;
        }

        // Validate required props
        if (!clientSideId) {
          throw new Error('clientSideId is required when not using an existing client');
        }
        if (!createContexts) {
          throw new Error('createContexts is required when not using an existing client');
        }

        // Create a new client with specified log level
        const initialContexts = createContexts(null);
        const LDProviderComponent = await asyncWithLDProvider({
          clientSideID: clientSideId,
          context: initialContexts,
          timeout: 2,
          options: {
            logger: basicLogger({ level: logLevel }),
            bootstrap: 'localStorage'
          }
        });

        // Set up flag listener after client is ready
        if (process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY && (LDProviderComponent as any)._client) {
          const ldClient = (LDProviderComponent as any)._client as LDClient;
          // Track flag evaluations
          ldClient.on(`change:${process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY}`, async (value: LDLogLevel) => {
            onLogLevelChange?.(value);
            // Store valid levels and reinitialize client
            if (['error', 'warn', 'info', 'debug'].includes(value)) {
              localStorage.setItem('ld_sdk_log_level', value);
              // Since we own this client, we can handle reinitialization
              await ldClient.close();
              initializeLDClient(value);
            }
          });
        }

        setClient(() => LDProviderComponent as LDProviderComponent);
        onReady?.();
      } catch (error) {
        if (error instanceof Error) {
          setError(error);
        } else {
          setError(new Error('Unknown error initializing LaunchDarkly'));
        }
      }
    };

    // Start with stored level or default to 'info'
    const storedLevel = getStoredLogLevel();
    initializeLDClient(storedLevel || 'info');
  }, [onReady, createContexts, clientSideId, existingClient, onLogLevelChange]);

  if (error) throw error;
  if (client === MockComponent) {
    return loadingComponent;
  }

  return React.createElement(
    LDContext.Provider,
    { value: client },
    React.createElement(client, null, children)
  );
};

export const useLDClient = (): LDProviderComponent | null => useContext(LDContext);
