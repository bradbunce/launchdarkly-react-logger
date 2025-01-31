import React, { createContext, useContext, useState, useEffect, useRef, ComponentType } from 'react';
import { asyncWithLDProvider, basicLogger, LDLogLevel, LDClient } from 'launchdarkly-react-client-sdk';
import { LDProviderComponent, LDProviderProps } from '../types';
import { logger } from '../logger';

const LDContext = createContext<LDProviderComponent | null>(null);

interface LDProviderExtendedProps extends LDProviderProps {
  onLogLevelChange?: (level: LDLogLevel) => void;
}

const MockComponent: LDProviderComponent = function MockComponent(props) {
  return React.createElement(React.Fragment, null, props.children);
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
  const initializationRef = useRef(false);

  useEffect(() => {
    const initializeLDClient = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      try {
        // If an existing client is provided, use it
        if (existingClient) {
          setClient(() => existingClient);
          // Set up flag listener for the existing client
          if (process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY && (existingClient as any)._client) {
            const ldClient = (existingClient as any)._client as LDClient;
            // Get initial log level
            const storedLogLevel = localStorage.getItem('ld_sdk_log_level');
            const logLevel: LDLogLevel = (storedLogLevel && ['error', 'warn', 'info', 'debug'].includes(storedLogLevel)) 
              ? storedLogLevel as LDLogLevel 
              : 'info';
            // Evaluate the flag to track the evaluation
            const currentLevel = ldClient.variation(process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY, logLevel);
            // Always notify of the evaluation
            onLogLevelChange?.(currentLevel);
            // Only store valid levels
            if (currentLevel && ['error', 'warn', 'info', 'debug'].includes(currentLevel)) {
              localStorage.setItem('ld_sdk_log_level', currentLevel);
            }
            // Listen for changes
            ldClient.on(`change:${process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY}`, (value: LDLogLevel) => {
              // Always notify of the change
              onLogLevelChange?.(value);
              // Only store valid levels
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

        // Get stored log level or default to 'info'
        const storedLogLevel = localStorage.getItem('ld_sdk_log_level');
        const logLevel: LDLogLevel = (storedLogLevel && ['error', 'warn', 'info', 'debug'].includes(storedLogLevel)) 
          ? storedLogLevel as LDLogLevel 
          : 'info';

        // Create a new client
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

        // Set up flag listener after client is initialized
        if (process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY && (LDProviderComponent as any)._client) {
          const ldClient = (LDProviderComponent as any)._client as LDClient;
          // Evaluate the flag to track the evaluation
          const currentLevel = ldClient.variation(process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY, logLevel);
          // Always notify of the evaluation
          onLogLevelChange?.(currentLevel);
          // Only store valid levels
          if (currentLevel && ['error', 'warn', 'info', 'debug'].includes(currentLevel)) {
            localStorage.setItem('ld_sdk_log_level', currentLevel);
          }
          // Listen for changes
          ldClient.on(`change:${process.env.REACT_APP_LD_SDK_LOG_FLAG_KEY}`, (value: LDLogLevel) => {
            // Always notify of the change
            onLogLevelChange?.(value);
            // Only store valid levels
            if (['error', 'warn', 'info', 'debug'].includes(value)) {
              localStorage.setItem('ld_sdk_log_level', value);
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

    initializeLDClient();
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
