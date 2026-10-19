/** Every gateway path the web calls; identity-service is reached under its service id (D-1, D-18). */
const IDENTITY = '/identity-service/api';

export const endpoints = {
  login: `${IDENTITY}/auth/login`,
  nfcSessions: `${IDENTITY}/nfc/sessions`,
  nfcSession: (sessionId: string) => `${IDENTITY}/nfc/sessions/${encodeURIComponent(sessionId)}`,
  nfcStatus: `${IDENTITY}/nfc/status`,
};

/** STOMP over WebSocket of orchestrator-service, through the gateway; the token goes in the CONNECT frame. */
export const realtime = {
  path: '/ws',
  /** Result of each NFC card attempt of the logged-in account. */
  nfcQueue: '/user/queue/nfc',
};

/** What the web encodes in the QR; the Moonkage Verify app reads `moonkage-verify[:vN]:<sessionId>`. */
export const nfcQrPayload = (sessionId: string) => `moonkage-verify:v1:${sessionId}`;
