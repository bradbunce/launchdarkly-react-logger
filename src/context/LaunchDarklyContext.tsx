import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import { useLogger } from '../logger';
import { LDProviderComponent } from '../types';

interface LDProviderProps {
  children: React.ReactNode;
  onReady?: () => void;
  createContexts: (user: any) => any; // Type this based on your context structure
  clientSideId?: string;
}

const LDContext = createContext<LDProviderComponent | null>(null);

export const LDProvider: React.FC<LDProviderProps> = ({ 
  children, 
  onReady, 
  createContexts,
  clientSideId = process.env.REACT_APP_LD_CLIENTSIDE_ID 
}) => {
  const [LDClient, setLDClient] = useState<LDProviderComponent | null>(null);
  const initializationRef = useRef(false);
  const logger = useLogger();

  useEffect(() => {
    const initializeLDClient = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      try {
        const initialContexts = createContexts(null);
        const LDProviderComponent = await asyncWithLDProvider({
          clientSideID: clientSideId,
          context: initialContexts,
          timeout: 2,
        });

        setLDClient(() => LDProviderComponent);
        onReady?.();
      } catch (error) {
        logger.error('Error initializing LaunchDarkly', { error: (error as Error).message });
      }
    };

    initializeLDClient();
  }, [onReady, logger, createContexts, clientSideId]);

  if (!LDClient) return <div />;

  return (
    <LDContext.Provider value={LDClient}>
      <LDClient>{children}</LDClient>
    </LDContext.Provider>
  );
};

export const useLDClient = () => useContext(LDContext);