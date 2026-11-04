import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { mapOrderDtoToEntity, type OrderDto } from '@/entities/order';
import type { Order } from '@/entities/order';

/**
 * The write side of the vendor's order progress (FR-32, FR-40, FR-42).
 *
 * The order entity owns the read and the shape of the order; the write lives
 * here because it moves the order forward, not the order data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Wire shape of `com.moonkage.order.dto.request.UpdateOrderRequest`.
 *
 * `status` moves the order one step forward; the backend rejects a jump with
 * 409 `INVALID_STATE_TRANSITION` (README §3 — the root checks the transition).
 */
export interface UpdateOrderPayload {
  /** The next status of the order, in the backend's own enum. */
  status: string;
  /** Required when an interprovince buy-now order goes to SHIPPING (AC-32.3). */
  trackingCode?: string;
  /** The note of this step; the backend writes it as a progress update. */
  note?: string;
  /** Photos of this step, uploaded first through `POST /api/orders/uploads`. */
  photoTempKeys?: string[];
}

/**
 * The vendor moves the order one step forward (FR-32, FR-40, FR-42).
 */
export async function advanceOrder(
  orderId: string,
  payload: UpdateOrderPayload
): Promise<Order> {
  if (isDemoMode()) {
    throw new Error('Chuyển bước đơn hàng chỉ có sẵn ở chế độ demo.');
  }
  const res = await apiClient.patch<unknown>(GATEWAY.ORDER.ORDER_UPDATE(orderId), payload);
  const dto = unwrap<OrderDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về trạng thái đơn hàng.');
  }
  return mapOrderDtoToEntity(dto);
}
