import { config } from '../config/env';

/** identity-service is reached through the gateway under its service id (D-1, D-18). */
export const identityApi = '/identity-service/api';

/** STOMP over WebSocket of orchestrator-service, through the gateway; the token goes in the CONNECT frame. */
export const realtimePath = '/ws';

/** ws(s):// URL of a gateway path, from VITE_API_BASE_URL. */
export function websocketUrl(path: string): string {
  const url = new URL(path, config.apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
