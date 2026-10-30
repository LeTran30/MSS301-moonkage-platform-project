import { apiClient, type ApiResponse } from '@/shared/api/client';
import { identityApi } from '@/shared/api/gateway';
import { config } from '@/shared/config/env';
import { demoCreateSession, demoGetSession } from './nfcDemo';

/** FR-04 resources of identity-service (`NfcController`). */
const endpoints = {
  sessions: `${identityApi}/nfc/sessions`,
  session: (sessionId: string) => `${identityApi}/nfc/sessions/${encodeURIComponent(sessionId)}`,
};

/** STOMP destination with the result of each NFC card attempt of the logged-in account (orchestrator-service). */
export const nfcQueue = '/user/queue/nfc';

import type {
  NfcPushMessage,
  NfcReasonCode,
  NfcSession,
  NfcSessionState,
  NfcSessionStatus,
} from './types';

export type {
  NfcPushMessage,
  NfcReasonCode,
  NfcSession,
  NfcSessionState,
  NfcSessionStatus,
};

/** Error codes of `ErrorCode` (identity-service) the NFC page reacts to. */
export const NfcErrorCode = {
  alreadyVerified: 'NFC_001',
  locked: 'NFC_002',
  sessionExpired: 'NFC_003',
  sessionNotOwned: 'NFC_004',
} as const;

/** 409 NFC_001 when already verified, 429 NFC_002 while locked. */
export async function createNfcSession(): Promise<NfcSession> {
  if (config.demoMode) return demoCreateSession();
  const response = await apiClient.post<ApiResponse<NfcSession>>(endpoints.sessions);
  return response.data.data;
}

/** 410 when expired, 403 when the session belongs to another account. */
export async function getNfcSession(sessionId: string): Promise<NfcSessionState> {
  if (config.demoMode) return demoGetSession(sessionId);
  const response = await apiClient.get<ApiResponse<NfcSessionState>>(endpoints.session(sessionId));
  return response.data.data;
}

