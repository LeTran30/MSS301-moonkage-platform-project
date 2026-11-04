import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { demoPaymentUrl } from '@/shared/lib';
import { generateEntityId } from '@/shared/utils';
import type { PaymentLinkResponse } from '@/entities/order';

/**
 * The write side of the remainder payment (FR-22).
 *
 * The order entity owns the read and the shape of the order; the write lives
 * here because it creates the payment, not the order data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * FR-22: pay the rest of a delivered custom order. The backend answers the
 * VNPay page to redirect to.
 */
export async function payOrderRemainder(orderId: string): Promise<PaymentLinkResponse> {
  if (isDemoMode()) {
    const demoPaymentId = generateEntityId('pay');
    return {
      paymentId: demoPaymentId,
      paymentUrl: demoPaymentUrl(demoPaymentId),
    };
  }
  const res = await apiClient.post<unknown>(GATEWAY.ORDER.PAY_REMAINDER(orderId));
  const data = unwrap<PaymentLinkResponse>(res);
  if (!data || !data.paymentUrl) {
    throw new Error('Máy chủ không trả về liên kết thanh toán.');
  }
  return data;
}
