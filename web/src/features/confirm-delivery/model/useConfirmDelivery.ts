import { useCallback } from 'react';
import { confirmOrderReceived } from '../api/confirmDeliveryApi';
import type { Order } from '@/entities/order';

/**
 * The buyer confirms the reception of a delivered order (FR-11).
 */
export function useConfirmDelivery() {
  return useCallback(
    (orderId: string): Promise<Order> => confirmOrderReceived(orderId),
    [],
  );
}
