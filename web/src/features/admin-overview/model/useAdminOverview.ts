import { useCallback } from 'react';
import { useLedgerList } from '@/entities/payment';
import { useOrderList } from '@/entities/order';
import { useVendorSearch } from '@/entities/vendor';
import type { AsyncStateKind } from '@/shared/ui';

/**
 * The numbers of the admin's desk (Q1.0).
 *
 * Every figure comes from the backend: the escrow from `GET /api/ledgers`
 * (admin: every ledger), the open disputes from `GET /api/orders?disputeStatus=OPEN`
 * (FR-49), the pending profiles from `GET /api/vendors?status=PENDING` (FR-45).
 *
 * The three lists are read by the entity hooks; this feature only joins them.
 */
export function useAdminOverview(): AsyncStateKind<AdminOverview> & { reload: () => void } {
  const ledgers = useLedgerList();
  const openDisputes = useOrderList({ openDispute: true });
  const pendingVendors = useVendorSearch({ status: 'PENDING' });

  const reload = useCallback(
    () => {
      ledgers.reload();
      openDisputes.reload();
      pendingVendors.reload();
    },
    [ledgers, openDisputes, pendingVendors],
  );

  if (ledgers.kind === 'loading' || openDisputes.kind === 'loading' || pendingVendors.kind === 'loading') {
    return { kind: 'loading', reload };
  }
  if (ledgers.kind === 'error') return { kind: 'error', message: ledgers.message, reload };
  if (openDisputes.kind === 'error') return { kind: 'error', message: openDisputes.message, reload };
  if (pendingVendors.kind === 'error') {
    return { kind: 'error', message: pendingVendors.message, reload };
  }

  const ledgerList = ledgers.data;
  const disputeList = openDisputes.data;
  const vendorList = pendingVendors.data;

  const escrowTotal = ledgerList.reduce((acc, l) => acc + (l.held ?? 0), 0);
  const frozenDisputes = ledgerList
    .filter((l) => l.disputeOpen)
    .reduce((acc, l) => acc + (l.held ?? 0), 0);
  const refunded = ledgerList.reduce((acc, l) => acc + (l.refunded ?? 0), 0);

  return {
    kind: 'loaded',
    data: {
      escrowTotal,
      frozenDisputes,
      refunded,
      openDisputes: disputeList,
      pendingVendors: vendorList,
    },
    reload,
  };
}

export interface AdminOverview {
  escrowTotal: number;
  frozenDisputes: number;
  refunded: number;
  openDisputes: unknown[];
  pendingVendors: unknown[];
}
