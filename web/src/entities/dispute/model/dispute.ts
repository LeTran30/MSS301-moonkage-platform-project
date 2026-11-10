import type { DisputeDecision } from './disputeDecision';

export { DISPUTE_DECISION_LABELS, type DisputeDecision } from './disputeDecision';

/** Backend `com.moonkage.order.enums.DisputeReason` (FR-12). */
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

/** Một bằng chứng của một bên (DisputeResponse.Evidence). */
export type DisputeEvidence = {
  party: DisputeParty;
  downloadUrl: string;
  note?: string;
  createdAt?: string;
};

/**
 * Một hồ sơ khiếu nại như máy chủ trả về (`DisputeResponse`), kèm số tiền đang
 * giữ của đơn khi người xem đọc được sổ tiền (Shop, quản trị viên).
 */
export type Dispute = {
  /** Backend `disputeId`. */
  id: string;
  orderId: string;
  /** Tên người nhận của đơn — tên người mua đã khai khi đặt. */
  buyerName: string;
  /** Tên Shop lúc đặt; trống với đơn cũ. */
  vendorName: string;
  reason: DisputeReason;
  description: string;
  evidences: DisputeEvidence[];
  createdAt: string;
  status: DisputeStatus;
  resolvedAt?: string;
  /** Tổng tiền đơn: "hoàn toàn bộ" hoàn đúng số này. */
  orderTotalAmount: number;
  /** Số đang giữ trong sổ tiền của đơn; 0 khi người xem không đọc được sổ tiền. */
  escrowHoldingAmount: number;
  /** AC-49.3: hoàn tối đa = số đang giữ. */
  maxRefundableAmount: number;
  decision?: DisputeDecision;
  refundAmount?: number;
  /** Căn cứ phán quyết của quản trị viên (`decisionReason`). */
  adminNote?: string;
};
