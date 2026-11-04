import { useCallback } from 'react';
import { confirmOrderReceived } from '../api/confirmDeliveryApi';
import { orderStore, type Order } from '@/entities/order';

/**
 * The buyer confirms the reception of a delivered order (FR-11).
 */
export function useConfirmDelivery() {
  return useCallback(
    async (orderId: string): Promise<Order> => {
      const confirmed = await confirmOrderReceived(orderId);
      // The order screens read the order list store: show COMPLETED at once.
      if (confirmed) {
        orderStore.set((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: confirmed.status } : o)),
        );
      }
      return confirmed;
    },
    [],
  );
}
