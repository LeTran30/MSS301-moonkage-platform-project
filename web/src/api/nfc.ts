import { apiClient, type ApiResponse } from './client';
import { endpoints } from './endpoints';

/** FR-04 resources of identity-service (`NfcController`). */

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

export const HTTP_GONE = 410;

/** 409 NFC_001 when already verified, 429 NFC_002 while locked. */
export async function createNfcSession(): Promise<NfcSession> {
  const response = await apiClient.post<ApiResponse<NfcSession>>(endpoints.nfcSessions);
  return response.data.data;
}

/** 410 when expired, 403 when the session belongs to another account. */
export async function getNfcSession(sessionId: string): Promise<NfcSessionState> {
  const response = await apiClient.get<ApiResponse<NfcSessionState>>(endpoints.nfcSession(sessionId));
  return response.data.data;
}

export async function getMyNfcStatus(): Promise<NfcStatusInfo> {
  const response = await apiClient.get<ApiResponse<NfcStatusInfo>>(endpoints.nfcStatus);
  return response.data.data;
}
