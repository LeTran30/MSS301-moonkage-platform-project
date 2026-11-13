import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import type { CreateDisbursementPayload, DisbursementDto } from '@/entities/payment';

/** Retained only after a failed call, so the user's retry names the same business operation. */
const retryKeys = new Map<string, string>();

/**
 * The write side of the escrow disbursements (FR-41, FR-47, FR-48).
 *
 * The payment entity owns the read (`getLedgers`, `getDisbursements`) and the
 * shape of the money; the writes live here because they move the money, not
 * the ledger data (package-architecture §3 — `api/` of a feature holds the
 * writes).
 */

/**
 * FR-41: the vendor owner asks for part of the deposit (or the final
 * payment) of one order; an admin reviews it (FR-47).
 *
 * The backend only takes `{amount, purpose}` (`CreateDisbursementRequest`);
 * `purpose` is one of `MATERIALS`, `PRINTING`, `PACKAGING`, `RESTOCK`.
 */
export async function requestDisbursement(
  orderId: string,
  payload: CreateDisbursementPayload,
): Promise<DisbursementDto | null> {
  // Funnel giải ngân (FR-41). Không ghi `amount` — đó là dữ liệu tài chính
  // của đơn hàng (NFR-03).
  trackEvent(ANALYTICS_EVENTS.requestDisbursement, {
    purpose: payload.purpose,
  });

  const operation = `${orderId}:${payload.amount}:${payload.purpose}`;
  const idempotencyKey = retryKeys.get(operation) ?? globalThis.crypto.randomUUID();
  retryKeys.set(operation, idempotencyKey);
  const res = await apiClient.post<unknown>(
    GATEWAY.PAYMENT.LEDGER_DISBURSEMENTS(orderId),
    payload,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  retryKeys.delete(operation);
  return unwrap<DisbursementDto>(res);
}
