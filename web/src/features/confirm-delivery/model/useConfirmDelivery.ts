import { useCallback } from 'react';
import { queryClient, queryKeys } from '@/shared/api';
import { confirmOrderReceived } from '../api/confirmDeliveryApi';
import { orderStore, type Order } from '@/entities/order';

/** Query-key prefix of every order list, whatever its filters. */
const ORDER_LIST_PREFIX = ['order', 'list'] as const;

/**
 * The buyer confirms the reception of a delivered order (FR-11).
 *
 * The order detail page reads the order from the query cache, not from
 * `orderStore`: the cached order must take the new status too, or the page
 * keeps showing a DELIVERED order (and its "Đã nhận hàng" button) after the
 * order is COMPLETED.
 */
export function useConfirmDelivery() {
  return useCallback(async (orderId: string): Promise<Order> => {
    const confirmed = await confirmOrderReceived(orderId);
    queryClient.setQueryData<Order | null>(queryKeys.order.detail(orderId), (prev) =>
      prev ? { ...prev, status: confirmed.status } : confirmed,
    );
    orderStore.set((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: confirmed.status } : o)),
    );
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.order.detail(orderId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.order.progress(orderId) }),
      queryClient.invalidateQueries({ queryKey: ORDER_LIST_PREFIX }),
    ]);
    return confirmed;
  }, []);
}
