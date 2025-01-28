// src/types.ts
import { ReactNode } from 'react';
import { LDClient } from 'launchdarkly-react-client-sdk';

export type LDProviderComponent = React.ComponentType<{ children: ReactNode }>;

export interface LDProviderProps {
  children: ReactNode;
  onReady?: () => void;
  /** Function to create LaunchDarkly contexts. Only used when creating a new client. */
  createContexts?: (user: any) => any;
  /** LaunchDarkly client-side ID. Only required when creating a new client. */
  clientSideId?: string;
  /** Optional existing LaunchDarkly client instance. If provided, clientSideId and createContexts are ignored. */
  existingClient?: LDProviderComponent;
  /** Component to display while LaunchDarkly is initializing. Defaults to an empty div */
  loadingComponent?: ReactNode;
}

export interface LoggerContextType {
 ldClient: LDClient | null;
}
