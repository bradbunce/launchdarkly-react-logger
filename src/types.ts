// src/types.ts
import type { ComponentType, ReactNode } from 'react';
import type { LDLogLevel, LDReactClientContext } from '@launchdarkly/react-sdk';

/**
 * A LaunchDarkly React provider component, as returned by the React Web SDK's
 * `createLDReactProvider` / `createLDReactProviderWithClient` factories.
 *
 * `children` is required here to match those factories, which return
 * `FC<{ children: ReactNode }>`. Declaring it optional would make the SDK's own
 * providers unassignable to this type.
 */
export type LDProviderComponent = ComponentType<{ children: ReactNode }>;

/**
 * Props for the LDProvider component
 */
export interface LDProviderProps {
  /** React children */
  children: ReactNode;
  /**
   * The LaunchDarkly provider component for your app, created with
   * `createLDReactProvider()` from `@launchdarkly/react-sdk`.
   */
  provider: LDProviderComponent;
  /** Your SDK log level flag key */
  sdkLogFlagKey: string;
  /** Optional callback for SDK log level changes */
  onLogLevelChange?: (level: LDLogLevel) => void;
  /**
   * Optional custom LaunchDarkly React context, for apps that run more than one
   * LaunchDarkly client. Defaults to the SDK's global `LDReactContext`.
   */
  reactContext?: LDReactClientContext;
}
