import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';

/**
 * The write side of the registration fee payment (FR-27, FR-53).
 *
 * The vendor entity owns the read and the shape of the fee; the write lives
 * here because it creates the payment, not the fee data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * The registration fee payment link (FR-27, FR-53): the owner pays the
 * registration fee once the profile is approved.
 *
 * `RegistrationFeePaymentLinkResponse`: the fee level in effect when the
 * payment was created (AC-53.3), and the VNPay page to open.
 */
export async function createRegistrationFeePayment(
  vendorId: string
): Promise<{ paymentId: string; amount: number; paymentUrl: string } | null> {
  if (isDemoMode()) {
    return null;
  }
  const res = await apiClient.post<unknown>(GATEWAY.VENDOR.REGISTRATION_FEE_PAYMENT(vendorId));
  return unwrap<{ paymentId: string; amount: number; paymentUrl: string }>(res);
}
