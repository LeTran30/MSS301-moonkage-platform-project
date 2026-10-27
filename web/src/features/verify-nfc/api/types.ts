export interface NfcSession {
  sessionId: string;
  /** ISO-8601 instant. */
  expiresAt: string;
}

export type NfcSessionStatus = 'PENDING' | 'VERIFIED';

export interface NfcSessionState extends NfcSession {
  status: NfcSessionStatus;
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
