import { apiClient, GATEWAY, unwrap, unwrapPage } from '@/shared/api';
import { isDemoMode } from '@/shared/config';

/**
 * Wire shape of `com.moonkage.payment.dto.response.PaymentResponse`.
 *
 * `PENDING` after the VNPay return page only means the IPN has not arrived yet:
 * the result page polls until the status changes (BR-25).
 */
export interface PaymentDto {
  paymentId: string;
  purpose: 'CHECKOUT' | 'DEPOSIT' | 'REMAINDER' | 'REGISTRATION_FEE';
  /** checkoutId, acceptanceId, orderId or vendorId, by purpose. */
  referenceId?: string | null;
  amount: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'DUPLICATE';
  gatewayResponseCode?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
}

/**
 * The read side of a payment (FR-09).
 *
 * The result page polls this endpoint: a payment created by the checkout only
 * becomes `SUCCEEDED` when the VNPay IPN arrives (BR-25).
 */
export const paymentApi = {
  /** The state of one payment of the caller. */
  async getById(paymentId: string): Promise<PaymentDto | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.PAYMENT_BY_ID(paymentId));
    const dto = unwrap<PaymentDto>(res);
    return dto ?? null;
  },

  /**
   * The payment the gateway redirected the payer back to (BR-25).
   *
   * `GET /api/payments/vnpay/return` checks the signature of the query VNPay
   * sent and answers which payment it was; it changes nothing. The result page
   * calls it so it knows the payment id even when the browser lost the state
   * of the checkout.
   */
  async readVnpayReturn(callback: Record<string, string>): Promise<PaymentDto | null> {
    if (isDemoMode()) {
      return null;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(callback)) {
      params.set(key, value);
    }
    const res = await apiClient.get<unknown>(
      `${GATEWAY.PAYMENT.VNPAY_RETURN}?${params.toString()}`
    );
    const dto = unwrap<PaymentDto>(res);
    return dto ?? null;
  },

  /**
   * The payments the caller may read (AC-51.3).
   *
   * `purpose` narrows the list, e.g. `REGISTRATION_FEE` for the registration
   * fees the platform collected.
   */
  async list(options?: { purpose?: PaymentDto['purpose'] }): Promise<PaymentDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const params = new URLSearchParams();
    if (options?.purpose) params.set('purpose', options.purpose);
    params.set('size', '100');
    const res = await apiClient.get<unknown>(`${GATEWAY.PAYMENT.PAYMENTS}?${params.toString()}`);
    return unwrapPage<PaymentDto>(res);
  },
};
