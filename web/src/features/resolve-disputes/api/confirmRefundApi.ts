import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import type { ManualRefundDto } from '@/entities/payment';

/**
 * The write side of the refunds (AC-49.3).
 *
 * A refund the gateway refused stays `MANUAL_REQUIRED`; the admin settles it
 * by hand and the backend then marks it `SUCCEEDED`
 * (`RefundController.confirmManual`).
 */
export async function confirmManualRefund(refundId: string): Promise<ManualRefundDto | null> {
  if (isDemoMode()) {
    return null;
  }
  const res = await apiClient.patch<unknown>(GATEWAY.PAYMENT.REFUND_BY_ID(refundId));
  const dto = unwrap<ManualRefundDto>(res);
  return dto ?? null;
}
