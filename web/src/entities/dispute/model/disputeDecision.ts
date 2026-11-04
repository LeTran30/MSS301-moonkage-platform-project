/** The escrow decision of the backend (FR-51). */
export type DisputeDecision = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'REJECTED';

/** Label hiển thị cho người dùng Việt Nam. */
export const DISPUTE_DECISION_LABELS: Record<DisputeDecision, string> = {
  FULL_REFUND: 'Hoàn 100% cho người mua',
  PARTIAL_REFUND: 'Hoàn một phần cho người mua',
  REJECTED: 'Bác khiếu nại, giải ngân cho xưởng',
};
