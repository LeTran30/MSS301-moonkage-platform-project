import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import type { PayoutDto } from '@/entities/payment';

/**
 * The write side of the payout (FR-48).
 *
 * The payment entity owns the read and the shape of the money; the write lives
 * here because it moves the money, not the ledger data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** FR-48: an admin pays the vendor what is held, once per order. */
export async function payOutLedger(orderId: string): Promise<PayoutDto | null> {
  const res = await apiClient.put<unknown>(GATEWAY.PAYMENT.LEDGER_PAYOUT(orderId));
  return unwrap<PayoutDto>(res);
}
