import { useCallback } from 'react';
import { advanceOrder, type UpdateOrderPayload } from '../api/advanceOrderApi';
import type { Order } from '@/entities/order';

/**
 * The vendor moves the order one step forward (FR-32, FR-40, FR-42).
 */
export function useAdvanceOrder() {
  return useCallback(
    (orderId: string, payload: UpdateOrderPayload): Promise<Order> =>
      advanceOrder(orderId, payload),
    [],
  );
}
