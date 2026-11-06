import { apiClient, GATEWAY, unwrap } from '@/shared/api';

/**
 * Wire shape of `com.moonkage.identity.kyc.dto.response.CreateNfcSessionResponse`.
 *
 * The session id carries no personal data (AC-04.1): the web shows it as a QR and
 * the Moonkage Verify app sends the card once.
 */
export interface CreateNfcSessionDto {
  sessionId: string;
  expiresAt: string;
}

/**
 * Wire shape of `com.moonkage.identity.kyc.dto.response.NfcSessionStatusResponse`.
 *
 * The backend answers 410 for an expired session and 403 for one owned by another
 * account, so a rejection is an error, not a status.
 */
export interface NfcSessionStatusDto {
  sessionId: string;
  status: 'PENDING' | 'VERIFIED';
  expiresAt: string;
}

/**
 * Wire shape of `com.moonkage.identity.kyc.dto.response.NfcStatusResponse`.
 *
 * Masked data only — the real ID number never leaves the backend.
 */
export interface NfcStatusDto {
  nfcStatus: 'NOT_VERIFIED' | 'VERIFIED' | 'LOCKED';
  legalName?: string | null;
  idNumberMasked?: string | null;
  nfcVerifiedAt?: string | null;
}

/** Why a card was refused (`NfcReasonCode`); the reason codes of the session do not count as attempts. */
export type NfcReasonCode =
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_OWNED'
  | 'SESSION_USED'
  | 'LOCKED'
  | 'BAD_FORMAT'
  | 'CARD_EXPIRED'
  | 'ID_ALREADY_LINKED';

/** Message cho người dùng theo mã lý do của backend. */
export const NFC_REASON_MESSAGES: Record<NfcReasonCode, string> = {
  SESSION_EXPIRED: 'Phiên xác minh đã hết hạn. Vui lòng tạo mã QR mới.',
  SESSION_NOT_OWNED: 'Phiên xác minh không thuộc tài khoản của bạn.',
  SESSION_USED: 'Phiên xác minh này đã được sử dụng.',
  LOCKED: 'Tài khoản đang bị tạm khóa xác minh do quá nhiều lần thử sai.',
  BAD_FORMAT: 'Dữ liệu thẻ không hợp lệ. Vui lòng thử lại với thẻ CCCD gắn chip.',
  CARD_EXPIRED: 'Thẻ CCCD đã hết hạn.',
  ID_ALREADY_LINKED: 'Số CCCD này đã được liên kết với một tài khoản khác.',
};

export const nfcApi = {
  /** The status of the session (fallback when the WebSocket push is missed). */
  async getSession(sessionId: string): Promise<NfcSessionStatusDto> {
    const res = await apiClient.get<unknown>(GATEWAY.IDENTITY.NFC_SESSION_BY_ID(sessionId));
    const dto = unwrap<NfcSessionStatusDto>(res);
    if (!dto) {
      throw new Error('Máy chủ không trả về trạng thái phiên xác minh.');
    }
    return dto;
  },

  /** The NFC status of the signed-in account (masked data only). */
  async getMyStatus(): Promise<NfcStatusDto> {
    const res = await apiClient.get<unknown>(GATEWAY.IDENTITY.NFC_VERIFY_STATUS);
    const dto = unwrap<NfcStatusDto>(res);
    if (!dto) {
      throw new Error('Máy chủ không trả về trạng thái xác minh.');
    }
    return dto;
  },
};
