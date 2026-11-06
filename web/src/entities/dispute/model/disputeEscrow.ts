import type { DisputeDecision } from './disputeDecision';

export interface EscrowResolutionResult {
  buyerRefund: number;
  vendorPayout: number;
  isValid: boolean;
  error?: string;
}

/**
 * Quy tắc cốt lõi AC-49.3:
 * Phân xử tranh chấp đơn hàng ký quỹ Escrow.
 * Số tiền hoàn cho người mua KHÔNG được vượt quá số tiền Escrow đang giữ (maxRefundableAmount).
 *
 * `decision` dùng đúng enum của backend
 * (`com.moonkage.order.enums.DisputeDecision`): FULL_REFUND | PARTIAL_REFUND | REJECTED.
 */
export function resolveEscrowDispute(
  escrowHoldingAmount: number,
  maxRefundableAmount: number,
  decision: DisputeDecision,
  partialRefundInput?: number,
): EscrowResolutionResult {
  if (decision === 'PARTIAL_REFUND') {
    const refund = partialRefundInput ?? 0;
    if (refund < 0 || refund > maxRefundableAmount) {
      return {
        buyerRefund: 0,
        vendorPayout: 0,
        isValid: false,
        error: `Số tiền hoàn (${refund.toLocaleString()}đ) không được vượt quá số tiền Escrow đang giữ (${maxRefundableAmount.toLocaleString()}đ).`,
      };
    }
    return {
      buyerRefund: refund,
      vendorPayout: Math.max(0, escrowHoldingAmount - refund),
      isValid: true,
    };
  }

  if (decision === 'FULL_REFUND') {
    return {
      buyerRefund: maxRefundableAmount,
      vendorPayout: Math.max(0, escrowHoldingAmount - maxRefundableAmount),
      isValid: true,
    };
  }

  // REJECTED
  return {
    buyerRefund: 0,
    vendorPayout: escrowHoldingAmount,
    isValid: true,
  };
}
