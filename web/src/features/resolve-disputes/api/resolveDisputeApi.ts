import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import { disputeStore, type Dispute } from '@/entities/dispute';
import { mapDisputeDtoToEntity, type DisputeDto } from '@/entities/dispute';
import type { DisputeDecision } from '@/entities/dispute';

/**
 * The write side of the admin's decision on a dispute (FR-49).
 *
 * The dispute entity owns the read and the shape of the dispute; the write
 * lives here because it changes the case, not the dispute data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Wire shape of `com.moonkage.order.dto.request.ResolveDisputeRequest`. */
export interface ResolveDisputePayload {
  decision: DisputeDecision;
  refundAmount?: number;
  decisionReason: string;
}

/** The admin's decision (FR-49). */
export async function resolveDispute(
  orderId: string,
  payload: ResolveDisputePayload
): Promise<Dispute> {
  // Funnel phân xử khiếu nại (FR-49). Chỉ ghi **quyết định** — không ghi
  // `refundAmount` (dữ liệu tài chính) và không ghi `decisionReason` (nội
  // dung tự do, có thể chứa PII) (NFR-03).
  trackEvent(ANALYTICS_EVENTS.resolveDispute, { decision: payload.decision });

  if (isDemoMode()) {
    const current = disputeStore.get().find((d) => d.orderId === orderId);
    if (current) {
      disputeStore.set((prev) =>
        prev.map((d) =>
          d.id === current.id
            ? {
                ...d,
                status: 'RESOLVED',
                decision: payload.decision,
                refundAmount: payload.refundAmount ?? 0,
                adminNote: payload.decisionReason,
                decidedAt: new Date().toISOString(),
                resolvedAt: new Date().toISOString(),
              }
            : d
        )
      );
    }
    return current as Dispute;
  }
  const res = await apiClient.patch<unknown>(GATEWAY.ORDER.DISPUTE(orderId), payload);
  const dto = unwrap<DisputeDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về phán quyết.');
  }
  return mapDisputeDtoToEntity(dto, orderId);
}
