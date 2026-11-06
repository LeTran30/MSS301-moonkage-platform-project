import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import type { CreateDisbursementPayload, DisbursementDto } from '@/entities/payment';

/**
 * The write side of the escrow disbursements (FR-41, FR-47, FR-48).
 *
 * The payment entity owns the read (`getLedgers`, `getDisbursements`) and the
 * shape of the money; the writes live here because they move the money, not
    10| * the ledger data (package-architecture §3 — `api/` of a feature holds the
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
  payload: CreateDisbursementPayload
): Promise<DisbursementDto | null> {
  // Funnel giải ngân (FR-41). Không ghi `amount` — đó là dữ liệu tài chính
  // của đơn hàng (NFR-03).
  trackEvent(ANALYTICS_EVENTS.requestDisbursement, { purpose: payload.purpose });

  if (isDemoMode()) {
    return null;
  }
  const res = await apiClient.post<unknown>(
    GATEWAY.PAYMENT.LEDGER_DISBURSEMENTS(orderId),
    payload
  );
  return unwrap<DisbursementDto>(res);
}
