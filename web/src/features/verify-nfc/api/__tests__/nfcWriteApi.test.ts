import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNfcSession } from '../nfcWriteApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature verify-nfc - nfcWriteApi (FR-04, AC-04.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createNfcSession() gửi POST đúng endpoint NFC sessions', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        sessionId: 'sess-1',
        expiresAt: '2026-11-02T04:05:00Z',
      }),
    );

    const session = await createNfcSession();
    expect(post).toHaveBeenCalledWith('/identity-service/api/nfc/sessions');
    expect(session.sessionId).toBe('sess-1');
  });
});
