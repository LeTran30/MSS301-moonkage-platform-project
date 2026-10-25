import { createContext } from 'react';

export type Unsubscribe = () => void;

export interface RealtimeContextValue {
  /** The STOMP session is open: pushes arrive, polls can slow down. */
  connected: boolean;
  /** Listens to a destination for as long as the caller wants, across reconnects. */
  subscribe: <T>(destination: string, onMessage: (body: T) => void) => Unsubscribe;
}

/** Without a provider (logged out, tests) nothing is pushed and pages rely on polling. */
export const offlineRealtime: RealtimeContextValue = {
  connected: false,
  subscribe: () => () => {},
};

export const RealtimeContext = createContext<RealtimeContextValue>(offlineRealtime);
