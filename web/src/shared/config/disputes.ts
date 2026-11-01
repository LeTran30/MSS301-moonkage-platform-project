/** order-service `DisputeReason` (FR-12), in the order the complaint form lists them. */
export const DISPUTE_REASONS = [
  { code: 'DAMAGED', label: 'Hộp hoặc bánh bị hỏng khi nhận' },
  { code: 'WRONG_ITEM', label: 'Thiếu hoặc sai so với đơn' },
  { code: 'LATE_DELIVERY', label: 'Giao trễ so với hẹn' },
  { code: 'WRONG_LOGO', label: 'In sai logo hoặc nội dung' },
  { code: 'OTHER', label: 'Khác' },
] as const;

export type DisputeReasonCode = (typeof DISPUTE_REASONS)[number]['code'];

export const disputeReasonLabel = (code: string) => DISPUTE_REASONS.find((r) => r.code === code)?.label ?? code;

/** order-service `DisputeDecision` (AC-51.2). */
export const DISPUTE_DECISIONS = [
  { code: 'PARTIAL_REFUND', label: 'Hoàn một phần' },
  { code: 'FULL_REFUND', label: 'Hoàn toàn bộ' },
  { code: 'REJECTED', label: 'Không hoàn' },
] as const;

export type DisputeDecisionCode = (typeof DISPUTE_DECISIONS)[number]['code'];

export const disputeDecisionLabel = (code: string) => DISPUTE_DECISIONS.find((d) => d.code === code)?.label ?? code;
