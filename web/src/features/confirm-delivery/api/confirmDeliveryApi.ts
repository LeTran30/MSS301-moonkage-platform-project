import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { orderStore, type Order } from '@/entities/order';
import { mapOrderDtoToEntity, type OrderDto } from '@/entities/order';

/**
 * The write side of the delivery confirmation (FR-11).
 *
 * The order entity owns the read and the shape of the order; the write lives
 * here because it confirms the receipt, not the order data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * FR-11: the buyer confirms the reception of a delivered order.
 */
export async function confirmOrderReceived(orderId: string): Promise<Order> {
  if (isDemoMode()) {
    const current = orderStore.get().find((o) => o.id === orderId);
    if (current) {
      orderStore.set((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'COMPLETED' } : o))
      );
    }
    return current as Order;
  }
  const res = await apiClient.patch<unknown>(GATEWAY.ORDER.ORDER_UPDATE(orderId), {
    receivedConfirmed: true,
  });
  const dto = unwrap<OrderDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về trạng thái đơn hàng.');
  }
  return mapOrderDtoToEntity(dto);
}
