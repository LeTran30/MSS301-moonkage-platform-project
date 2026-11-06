import { createStore, useStore } from '@/shared/lib';

import { resolveEscrowDispute, type EscrowResolutionResult } from './disputeEscrow';
import { type DisputeDecision } from './disputeDecision';

export { DISPUTE_DECISION_LABELS, type DisputeDecision } from './disputeDecision';

/**
 * Backend `com.moonkage.order.enums.DisputeReason` (FR-12).
 *
 * The UI used Vietnamese labels as the wire value, which the backend never
 * accepts; the labels live in `DISPUTE_REASON_LABELS` now.
 */
export type DisputeReason = 'WRONG_ITEM' | 'DAMAGED' | 'LATE_DELIVERY' | 'WRONG_LOGO' | 'OTHER';

/** Backend `com.moonkage.order.enums.DisputeStatus`: `OPEN | RESOLVED`. */
export type DisputeStatus = 'OPEN' | 'RESOLVED';

/** Backend `com.moonkage.order.enums.DisputeParty`: who filed the evidence. */
export type DisputeParty = 'BUYER' | 'VENDOR';

/** Label hiển thị cho người dùng Việt Nam. */
export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  WRONG_ITEM: 'Bánh sai mẫu / sai số lượng',
  DAMAGED: 'Bánh hoặc bao bì bị hỏng vỡ',
  LATE_DELIVERY: 'Giao trễ hẹn',
  WRONG_LOGO: 'In sai mẫu logo / maket',
  OTHER: 'Lý do khác',
};

/** Một bằng chứng của hai bên (DisputeResponse.Evidence). */
export type DisputeEvidence = {
  party: DisputeParty;
  downloadUrl: string;
  note?: string;
  createdAt?: string;
};

export type Dispute = {
  id: string; // Backend `disputeId` (ví dụ #DISP-088)
  orderId: string;
  buyerId: string;
  buyerName: string;
  vendorId: string;
  vendorName: string;
  reason: DisputeReason;
  description: string;
  images: string[];
  evidences: DisputeEvidence[];
  createdAt: string;
  status: DisputeStatus;
  resolvedAt?: string;
  // Sổ tiền của đơn lúc khiếu nại (AC-49.1, AC-49.3):
  orderTotalAmount: number;
  escrowHoldingAmount: number; // Đang giữ
  disbursedAmount: number; // Đã giải ngân (từ cọc F2)
  maxRefundableAmount: number; // Tối đa hoàn được = escrowHoldingAmount (AC-49.3)
  // Kết quả xử lý bởi Admin
  decision?: DisputeDecision;
  refundAmount?: number;
  adminNote?: string;
  decidedAt?: string;
  /** Phản hồi giải trình của xưởng (hiển thị kèm bằng chứng VENDOR). */
  vendorResponse?: {
    comment: string;
    submittedAt: string;
    evidenceImages?: string[];
  };
};

/**
 * The disputes of the caller.
 *
 * The store starts empty and is filled by `order-service`.
 */
export const disputeStore = createStore<Dispute[]>([]);

export function useDisputes() {
  return useStore(disputeStore);
}

export function useDispute(id: string) {
  const disputes = useDisputes();
  return disputes.find((d) => d.id === id);
}

/**
 * Phán quyết của quản trị trên UI (fallback cục bộ khi backend không trả lời được).
 *
 * Backend `PATCH /api/orders/{orderId}/dispute` với `ResolveDisputeRequest`
 * là đường thật — xem `disputeApi.resolve`.
 */
export function resolveDispute(
  disputeId: string,
  decision: DisputeDecision,
  refundAmount: number,
  adminNote: string,
): EscrowResolutionResult {
  const currentDispute = disputeStore.get().find((d) => d.id === disputeId);
  if (!currentDispute) {
    return {
      buyerRefund: 0,
      vendorPayout: 0,
      isValid: false,
      error: 'Không tìm thấy khiếu nại.',
    };
  }

  const maxRefund = currentDispute.maxRefundableAmount ?? currentDispute.escrowHoldingAmount;
  const resolution = resolveEscrowDispute(
    currentDispute.escrowHoldingAmount,
    maxRefund,
    decision,
    refundAmount,
  );

  if (!resolution.isValid) {
    return resolution;
  }

  disputeStore.set((prev) =>
    prev.map((d) => {
      if (d.id !== disputeId) return d;
      return {
        ...d,
        status: 'RESOLVED',
        decision,
        refundAmount: resolution.buyerRefund,
        disbursedAmount: resolution.vendorPayout,
        adminNote,
        decidedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
      };
    }),
  );

  return resolution;
}
