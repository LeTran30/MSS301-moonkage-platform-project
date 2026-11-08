import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import type { DisbursementDto } from '@/entities/payment';

/**
 * The write side of the admin's review of a disbursement (FR-47).
 *
 * The payment entity owns the read and the shape of the money; the write lives
 * here because it decides the request, not the ledger data
    10| * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Wire shape of `com.moonkage.payment.dto.request.ReviewDisbursementRequest`.
 *
 * `status` is `APPROVED` or `REJECTED` (`DisbursementStatus`); `approvedAmount`
 * approves part of the amount asked, omitting it approves the whole; `reason`
 * is required to reject.
 */
export interface ReviewDisbursementPayload {
  status: 'APPROVED' | 'REJECTED';
  /** null approves the whole amount asked (FR-47). */
  approvedAmount?: number | null;
  reason?: string;
}

/** FR-47: an admin approves or rejects a disbursement request. */
export async function reviewDisbursement(
  orderId: string,
  requestId: string,
  payload: ReviewDisbursementPayload,
): Promise<DisbursementDto | null> {
  // Funnel duyệt giải ngân (FR-47). Chỉ ghi kết quả — không ghi số tiền
  // được duyệt và không ghi lý do từ chối (NFR-03).
  trackEvent(ANALYTICS_EVENTS.approveDisbursement, { status: payload.status });

  const res = await apiClient.patch<unknown>(
    GATEWAY.PAYMENT.LEDGER_DISBURSEMENT_REVIEW(orderId, requestId),
    payload,
  );
  return unwrap<DisbursementDto>(res);
}
