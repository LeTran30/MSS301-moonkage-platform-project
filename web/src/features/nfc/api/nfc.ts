import { apiClient, type ApiResponse } from '../../../shared/api/client';
import { identityApi } from '../../../shared/api/gateway';
import { config } from '../../../shared/config/env';
import { demoCreateSession, demoGetSession, demoStatus } from './nfcDemo';

/** FR-04 resources of identity-service (`NfcController`). */
const endpoints = {
  sessions: `${identityApi}/nfc/sessions`,
  session: (sessionId: string) => `${identityApi}/nfc/sessions/${encodeURIComponent(sessionId)}`,
  status: `${identityApi}/nfc/status`,
};

/** STOMP destination with the result of each NFC card attempt of the logged-in account (orchestrator-service). */
export const nfcQueue = '/user/queue/nfc';

export interface NfcSession {
  sessionId: string;
  /** ISO-8601 instant. */
  expiresAt: string;
}

export type NfcSessionStatus = 'PENDING' | 'VERIFIED';

export interface NfcSessionState extends NfcSession {
  status: NfcSessionStatus;
}

export type NfcStatus = 'NOT_VERIFIED' | 'VERIFIED' | 'LOCKED';

export interface NfcStatusInfo {
  nfcStatus: NfcStatus;
  legalName: string | null;
  idNumberMasked: string | null;
  nfcVerifiedAt: string | null;
}

/** Why the server refused a card (`NfcReasonCode` of identity-service). */
export type NfcReasonCode =
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_OWNED'
  | 'SESSION_USED'
  | 'LOCKED'
  | 'BAD_FORMAT'
  | 'CARD_EXPIRED'
  | 'ID_ALREADY_LINKED';

/** Pushed on `/user/queue/nfc` after each card attempt (orchestrator-service `NfcResultMessage`). */
export interface NfcPushMessage {
  type: 'VERIFIED' | 'FAILED' | 'LOCKED';
  sessionId: string;
  reasonCode: NfcReasonCode | null;
  attemptsLeft: number | null;
  lockedUntil: string | null;
  occurredAt: string;
}

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

export async function getMyNfcStatus(): Promise<NfcStatusInfo> {
  if (config.demoMode) return demoStatus();
  const response = await apiClient.get<ApiResponse<NfcStatusInfo>>(endpoints.status);
  return response.data.data;
}
