import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import { LDProviderComponent, LDProviderProps } from '../types';

const LDContext = createContext<LDProviderComponent | null>(null);

export const LDProvider: React.FC<LDProviderProps> = ({
  children,
  onReady,
  createContexts,
  clientSideId = process.env.REACT_APP_LD_CLIENTSIDE_ID,
  existingClient,
  loadingComponent = <div />
}) => {
  const [LDClient, setLDClient] = useState<LDProviderComponent | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const initializationRef = useRef(false);

  useEffect(() => {
    const initializeLDClient = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      try {
        // If an existing client is provided, use it
        if (existingClient) {
          setLDClient(() => existingClient);
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

        // Create a new client
        const initialContexts = createContexts(null);
        const LDProviderComponent = await asyncWithLDProvider({
          clientSideID: clientSideId,
          context: initialContexts,
          timeout: 2,
        });

        setLDClient(() => LDProviderComponent);
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
  }, [onReady, createContexts, clientSideId, existingClient]);

  if (error) throw error;
  if (!LDClient) return loadingComponent;

  return (
    <LDContext.Provider value={LDClient}>
      <LDClient>{children}</LDClient>
    </LDContext.Provider>
  );
};

export const useLDClient = () => useContext(LDContext);
