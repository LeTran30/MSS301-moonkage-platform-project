import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import { type Dispute, type DisputeReason } from '@/entities/dispute';
import { mapDisputeDtoToEntity, type DisputeDto } from '@/entities/dispute';

/**
 * The write side of a dispute (FR-12, AC-49.1).
 *
 * The dispute entity owns the read (`listOpen`, `getByOrderId`) and the shape
 * of the dispute; the writes live here because they change the case, not the
 * dispute data (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Wire shape of `com.moonkage.order.dto.request.OpenDisputeRequest`. */
export interface OpenDisputePayload {
  reason: DisputeReason;
  description: string;
  evidences?: Array<{ tempKey: string; note?: string }>;
}

/** Open a dispute (FR-12). The buyer may do it while the complaint window is open. */
export async function openDispute(orderId: string, payload: OpenDisputePayload): Promise<Dispute> {
  // Funnel khiếu nại (FR-12). Chỉ ghi **lý do** và số bằng chứng — tuyệt đối
  // không ghi `description` hay nội dung bằng chứng vì đó là dữ liệu tự do
  // của người dùng và có thể chứa PII (NFR-03).
  trackEvent(ANALYTICS_EVENTS.openDispute, {
    reason: payload.reason,
    evidence_count: payload.evidences?.length ?? 0,
  });

  const res = await apiClient.post<unknown>(GATEWAY.ORDER.DISPUTE(orderId), payload);
  const dto = unwrap<DisputeDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về hồ sơ khiếu nại.');
  }
  return mapDisputeDtoToEntity(dto, orderId);
}

/** Add a piece of evidence (AC-49.1) from the buyer or the vendor owner. */
export async function addDisputeEvidence(
  orderId: string,
  payload: { tempKey: string; note?: string },
): Promise<Dispute> {
  const res = await apiClient.post<unknown>(GATEWAY.ORDER.DISPUTE_EVIDENCES(orderId), payload);
  const dto = unwrap<DisputeDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về hồ sơ khiếu nại.');
  }
  return mapDisputeDtoToEntity(dto, orderId);
}
