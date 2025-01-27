// src/types.ts
import { ReactNode } from 'react';
import { LDClient } from 'launchdarkly-react-client-sdk';

export type LDProviderComponent = React.ComponentType<{ children: ReactNode }>;

export interface LDProviderProps {
 children: ReactNode;
 onReady?: () => void;
 createContexts: (user: any) => any; // Update this type based on your context structure
 clientSideId?: string;
}

export interface LoggerContextType {
 ldClient: LDClient | null;
}