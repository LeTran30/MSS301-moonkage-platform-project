import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { disputeApi } from '../api/disputeApi';
import type { DisputeStatus } from './dispute';

/** The admin's disputes, open or decided (FR-49, Q5.0). */
export function useDisputeQueue(status: DisputeStatus) {
  return useQueryData(queryKeys.dispute.queue(status), () => disputeApi.list(status));
}

/** The latest dispute of one order, or `null` when it never had one. */
export function useDisputeByOrder(orderId: string | null) {
  return useQueryData(queryKeys.dispute.byOrder(orderId ?? ''), () =>
    orderId ? disputeApi.getByOrderId(orderId) : Promise.resolve(null),
  );
}
