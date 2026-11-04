import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import type { RegistrationFeeConfig } from '@/entities/vendor';

/**
 * The write side of the registration fee level (FR-53, Q6.2).
 *
 * The vendor entity owns the read and the shape of the fee; the write lives
 * here because it changes the platform fee, not the vendor data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** The admin sets a new level, in effect from now on (FR-53). */
export async function changeRegistrationFee(
  amount: number
): Promise<RegistrationFeeConfig | null> {
  if (isDemoMode()) {
    return { amount, effectiveFrom: new Date().toISOString() };
  }
  const res = await apiClient.put<unknown>(GATEWAY.VENDOR.REGISTRATION_FEE_CONFIG, { amount });
  return unwrap<RegistrationFeeConfig>(res);
}
