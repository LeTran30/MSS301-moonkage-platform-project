import { apiClient, GATEWAY, unwrap, unwrapPage } from '@/shared/api';
import { isDemoMode } from '@/shared/config';

/**
 * Wire shape of `com.moonkage.payment.dto.response.RefundResponse`.
 *
 * `MANUAL_REQUIRED` means VNPay refused the refund; the admin settles it by
 * hand and the screen then shows the refund as `SUCCEEDED` (AC-49.3).
 *
 * The name differs from the `RefundDto` of the ledger: that one is the refund
 * booked on an order, this one is the refund the platform has to settle.
 */
export interface ManualRefundDto {
  refundId: string;
  orderId?: string | null;
  disputeId?: string | null;
  paymentId?: string | null;
  reason?: 'DISPUTE' | 'LATE_PAYMENT' | 'DUPLICATE_PAYMENT' | 'QUOTE_EXPIRED';
  amount: number;
  status: 'PENDING' | 'SUCCEEDED' | 'MANUAL_REQUIRED';
  /** Why the gateway refused, when MANUAL_REQUIRED. */
  error?: string | null;
  createdAt?: string;
}

/**
 * The read side of the refunds the admin has to settle (AC-49.3).
 *
 * `GET /api/refunds` answers every refund, including the ones not bound to an
 * order (late or duplicate payment), so the ones the gateway refused can be
 * settled by hand.
 */
export const refundApi = {
  /** The refunds of the platform, newest first. */
  async list(options?: { status?: ManualRefundDto['status'] }): Promise<ManualRefundDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const params = new URLSearchParams();
    // The backend defaults to MANUAL_REQUIRED: the ones that still need a hand.
    params.set('status', options?.status ?? 'MANUAL_REQUIRED');
    params.set('size', '100');
    const res = await apiClient.get<unknown>(`${GATEWAY.PAYMENT.REFUNDS}?${params.toString()}`);
    return unwrapPage<ManualRefundDto>(res);
  },

  /** One refund of the platform. */
  async getById(refundId: string): Promise<ManualRefundDto | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.REFUND_BY_ID(refundId));
    const dto = unwrap<ManualRefundDto>(res);
    return dto ?? null;
  },
};
