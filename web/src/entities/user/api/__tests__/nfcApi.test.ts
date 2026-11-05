import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nfcApi, NFC_REASON_MESSAGES } from '../nfcApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('User Entity - nfcApi (FR-04, AC-04.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('nfcApi.getSession() đọc trạng thái phiên', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope({
        sessionId: 'sess-1',
        status: 'VERIFIED',
        expiresAt: '2026-11-02T04:05:00Z',
      }),
    );

    const status = await nfcApi.getSession('sess-1');
    expect(get).toHaveBeenCalledWith('/identity-service/api/nfc/sessions/sess-1');
    expect(status.status).toBe('VERIFIED');
  });

  it('nfcApi.getMyStatus() chỉ trả dữ liệu đã che', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope({
        nfcStatus: 'VERIFIED',
        legalName: 'Anh Minh',
        idNumberMasked: '0792••••4567',
        nfcVerifiedAt: '2026-10-20T08:00:00Z',
      }),
    );

    const status = await nfcApi.getMyStatus();
    expect(get).toHaveBeenCalledWith('/identity-service/api/nfc/status');
    expect(status.nfcStatus).toBe('VERIFIED');
    expect(status.idNumberMasked).toBe('0792••••4567');
  });

  it('mọi mã lý do của backend đều có thông điệp tiếng Việt', () => {
    const codes = [
      'SESSION_EXPIRED',
      'SESSION_NOT_OWNED',
      'SESSION_USED',
      'LOCKED',
      'BAD_FORMAT',
      'CARD_EXPIRED',
      'ID_ALREADY_LINKED',
    ] as const;
    for (const code of codes) {
      expect(NFC_REASON_MESSAGES[code]).toBeTruthy();
    }
  });
});
