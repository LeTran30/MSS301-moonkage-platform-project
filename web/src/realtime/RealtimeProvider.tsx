import { Client, type StompSubscription } from '@stomp/stompjs';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { realtime } from '../api/endpoints';
import { useAuth } from '../auth/useAuth';
import { websocketUrl } from '../config';
import { RealtimeContext, type Unsubscribe } from './realtimeContext';

/** Wait before reconnecting after the socket drops (gateway or orchestrator-service restart). */
const RECONNECT_DELAY_MS = 5000;

interface Listener {
  destination: string;
  onMessage: (body: unknown) => void;
  subscription: StompSubscription | null;
}

/**
 * One STOMP connection per logged-in session (orchestrator-service, Software Design 4.8). Listeners are kept here
 * and subscribed again after every reconnect, so a page subscribes once and never deals with the socket.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const token = session?.token ?? null;
  const clientRef = useRef<Client | null>(null);
  const listenersRef = useRef(new Map<number, Listener>());
  const nextIdRef = useRef(0);
  const [connected, setConnected] = useState(false);

  const attach = useCallback((client: Client, listener: Listener) => {
    listener.subscription = client.subscribe(listener.destination, (frame) => {
      try {
        listener.onMessage(JSON.parse(frame.body));
      } catch {
        // a body that is not JSON is not for us
      }
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    const listeners = listenersRef.current;
    const client = new Client({
      brokerURL: websocketUrl(realtime.path),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: RECONNECT_DELAY_MS,
      onConnect: () => {
        listeners.forEach((listener) => attach(client, listener));
        setConnected(true);
      },
      onWebSocketClose: () => {
        listeners.forEach((listener) => {
          listener.subscription = null;
        });
        setConnected(false);
      },
    });
    clientRef.current = client;
    client.activate();
    return () => {
      clientRef.current = null;
      void client.deactivate();
      setConnected(false);
    };
  }, [token, attach]);

  const subscribe = useCallback(
    <T,>(destination: string, onMessage: (body: T) => void): Unsubscribe => {
      const id = nextIdRef.current++;
      const listener: Listener = { destination, onMessage: onMessage as (body: unknown) => void, subscription: null };
      listenersRef.current.set(id, listener);
      const client = clientRef.current;
      if (client?.connected) attach(client, listener);
      return () => {
        listener.subscription?.unsubscribe();
        listenersRef.current.delete(id);
      };
    },
    [attach],
  );

  const value = useMemo(() => ({ connected: Boolean(token) && connected, subscribe }), [token, connected, subscribe]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
