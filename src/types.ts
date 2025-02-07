// src/types.ts
import { ReactNode, ComponentType } from 'react';
import { LDClient } from 'launchdarkly-react-client-sdk';

/**
 * LaunchDarkly provider component type that includes access to the client
 */
export type LDProviderComponent = ComponentType<{ children?: ReactNode }> & {
  _client?: LDClient;
};

/**
 * Props for the LDProvider component
 */
export interface LDProviderProps {
  /** React children */
  children: ReactNode;
  /** Your LaunchDarkly client instance */
  existingClient: LDProviderComponent;
  /** Your SDK log level flag key */
  sdkLogFlagKey: string;
  /** Optional callback for SDK log level changes */
  onLogLevelChange?: (level: string) => void;
}
