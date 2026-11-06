import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { ledgerApi, type DisbursementDto, type LedgerDto } from '../api/ledgerApi';

/**
 * The escrow ledgers of the platform.
 *
 * `vendorId` narrows the list to one shop (the seller channel).
 */
export function useLedgerList(options?: { vendorId?: string | null }) {
  const vendorId = options?.vendorId ?? null;
  return useQueryData(queryKeys.ledger.list(vendorId ?? undefined), () =>
    ledgerApi.getLedgers({ vendorId: vendorId ?? undefined }),
  );
}

/** The disbursements of one order. */
export function useDisbursements(orderId: string | null) {
  return useQueryData(queryKeys.ledger.detail(orderId ?? ''), () =>
    orderId
      ? ledgerApi.getDisbursements(orderId)
      : Promise.resolve([] as Awaited<ReturnType<typeof ledgerApi.getDisbursements>>),
  );
}

/**
 * Every disbursement request of the platform, with the ledger it belongs to.
 *
 * The backend lists the requests through the ledgers (FR-41, FR-47): the
 * admin screens read the two lists and join them here, so no screen has to
 * loop over the ledgers itself.
 */
export function useDisbursementRequests(options?: { vendorId?: string | null }) {
  const vendorId = options?.vendorId ?? null;
  return useQueryData(queryKeys.ledger.list(`requests:${vendorId ?? ''}`), async () => {
    const ledgers = await ledgerApi.getLedgers({ vendorId: vendorId ?? undefined });
    const requests: Array<DisbursementDto & { ledger: LedgerDto }> = [];
    for (const ledger of ledgers) {
      const disbursements = await ledgerApi.getDisbursements(ledger.orderId);
      for (const disbursement of disbursements) {
        requests.push({ ...disbursement, ledger });
      }
    }
    return { ledgers, requests };
  });
}
