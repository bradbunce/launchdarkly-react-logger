import React, { createContext, useContext, useEffect } from 'react';
import { LDLogLevel, LDClient } from 'launchdarkly-react-client-sdk';
import { LDProviderComponent } from '../types';

const LDContext = createContext<LDProviderComponent | null>(null);

interface LDProviderProps {
  children: React.ReactNode;
  existingClient: LDProviderComponent;
  onLogLevelChange?: (level: LDLogLevel) => void;
  sdkLogFlagKey: string;
}

export const LDProvider = ({
  children,
  existingClient,
  onLogLevelChange,
  sdkLogFlagKey
}: LDProviderProps) => {
  useEffect(() => {
    // Set up flag listener for SDK log level changes
    if (sdkLogFlagKey && (existingClient as any)._client) {
      const ldClient = (existingClient as any)._client as LDClient;
      ldClient.on(`change:${sdkLogFlagKey}`, (value: LDLogLevel) => {
        if (['error', 'warn', 'info', 'debug'].includes(value)) {
          onLogLevelChange?.(value);
        }
      });
    }
  }, [existingClient, onLogLevelChange, sdkLogFlagKey]);

  return (
    <LDContext.Provider value={existingClient}>
      {React.createElement(existingClient, null, children)}
    </LDContext.Provider>
  );
};

export const useLDClient = (): LDProviderComponent | null => useContext(LDContext);
