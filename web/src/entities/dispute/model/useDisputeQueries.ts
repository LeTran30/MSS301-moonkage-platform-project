import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { disputeApi } from '../api/disputeApi';

/**
 * The open disputes waiting for a decision (FR-49, Q5.0).
 *
 * The backend lists them through the orders that carry a dispute, so the hook
 * hides that detail from the screens.
 */
export function useOpenDisputes() {
  return useQueryData(queryKeys.dispute.open(), () => disputeApi.listOpen());
}

/** The dispute of one order (the backend allows only one open dispute per order). */
export function useDisputeByOrder(orderId: string | null) {
  return useQueryData(queryKeys.dispute.byOrder(orderId ?? ''), () =>
    orderId ? disputeApi.getByOrderId(orderId) : Promise.resolve(null),
  );
}
