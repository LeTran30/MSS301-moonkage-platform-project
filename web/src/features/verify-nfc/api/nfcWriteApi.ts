import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import type { CreateNfcSessionDto } from '@/entities/user';

/**
 * The write side of the NFC verification (AC-04.1).
 *
 * The user entity owns the read (`getSession`, `getMyStatus`) and the shape of
 * the identity; the write lives here because it opens the session, not the
 * identity data (package-architecture §3 — `api/` of a feature holds the
 * writes).
 */

/** Open a verification session (AC-04.1); the web shows the id as a QR. */
export async function createNfcSession(): Promise<CreateNfcSessionDto> {
  // Funnel xác minh danh tính (FR-04). Không ghi số định danh cá nhân —
  // chỉ ghi rằng phiên xác minh đã mở (NFR-03).
  trackEvent(ANALYTICS_EVENTS.verifyNfc, { step: 'session_opened' });

  if (isDemoMode()) {
    return {
      sessionId: `demo-${Date.now().toString(36)}`,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }
  const res = await apiClient.post<unknown>(GATEWAY.IDENTITY.NFC_SESSIONS);
  const dto = unwrap<CreateNfcSessionDto>(res);
  if (!dto?.sessionId) {
    throw new Error('Máy chủ không trả về phiên xác minh.');
  }
  return dto;
}
