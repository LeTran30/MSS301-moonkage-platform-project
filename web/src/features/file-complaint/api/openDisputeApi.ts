import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import {
  disputeStore,
  type Dispute,
  type DisputeReason,
} from '@/entities/dispute';
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

  if (isDemoMode()) {
    const dispute: Dispute = {
      id: `DISP-${Date.now().toString().slice(-6)}`,
      orderId,
      buyerId: '',
      buyerName: '',
      vendorId: '',
      vendorName: '',
      reason: payload.reason,
      description: payload.description,
      images: [],
      evidences: (payload.evidences ?? []).map((e) => ({
        party: 'BUYER' as const,
        downloadUrl: e.tempKey,
        note: e.note,
      })),
      createdAt: new Date().toISOString(),
      status: 'OPEN',
      orderTotalAmount: 0,
      escrowHoldingAmount: 0,
      disbursedAmount: 0,
      maxRefundableAmount: 0,
    };
    disputeStore.set((prev) => [dispute, ...prev]);
    return dispute;
  }
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
  payload: { tempKey: string; note?: string }
): Promise<Dispute> {
  if (isDemoMode()) {
    return (
      disputeStore.get().find((d) => d.orderId === orderId) ?? {
        id: `DISP-${Date.now().toString().slice(-6)}`,
        orderId,
        buyerId: '',
        buyerName: '',
        vendorId: '',
        vendorName: '',
        reason: 'OTHER',
        description: '',
        images: [],
        evidences: [],
        createdAt: new Date().toISOString(),
        status: 'OPEN',
        orderTotalAmount: 0,
        escrowHoldingAmount: 0,
        disbursedAmount: 0,
        maxRefundableAmount: 0,
      }
    );
  }
  const res = await apiClient.post<unknown>(GATEWAY.ORDER.DISPUTE_EVIDENCES(orderId), payload);
  const dto = unwrap<DisputeDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về hồ sơ khiếu nại.');
  }
  return mapDisputeDtoToEntity(dto, orderId);
}
