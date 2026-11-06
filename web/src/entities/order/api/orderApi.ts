import { apiClient, GATEWAY, unwrap, unwrapList, unwrapPage } from '@/shared/api';

import { useEffect, useState } from 'react';
import { useStore } from '@/shared/lib';
import { orderStore, type Order } from '../model';
import { mapOrderDtoToEntity, mapProgressUpdateDto } from './orderMappers';
import type { CheckoutDto, OrderDto, ProgressUpdate, ProgressUpdateDto } from './orderDto';

/**
 * The read side of the order-service (FR-11, FR-21, FR-32).
 *
 * The writes (checkout, mockup upload, delivery confirmation) live in the
 * features that own them.
 */
export const orderApi = {
  /**
   * The orders the caller takes part in.
   *
   * `vendorId` answers the orders of one shop (the vendor channel), `status` and
   * `kind` narrow the list further (FR-32, AC-44.3).
   */
  async getOrders(options?: {
    vendorId?: string;
    kind?: 'BUY_NOW' | 'CUSTOM_ORDER';
    status?: string;
    missingInvoice?: boolean;
    openDispute?: boolean;
  }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (options?.vendorId) params.set('vendorId', options.vendorId);
    if (options?.kind) params.set('kind', options.kind);
    if (options?.status) params.set('status', options.status);
    if (options?.missingInvoice) params.set('missingInvoice', 'true');
    // FR-49: `disputeStatus=OPEN` keeps only the orders waiting for a decision.
    if (options?.openDispute) params.set('disputeStatus', 'OPEN');
    params.set('size', '100');

    const query = params.toString();
    const res = await apiClient.get<unknown>(
      query ? `${GATEWAY.ORDER.ORDERS}?${query}` : GATEWAY.ORDER.ORDERS,
    );
    return unwrapPage<OrderDto>(res).map(mapOrderDtoToEntity);
  },

  async getOrderById(id: string): Promise<Order | null> {
    const res = await apiClient.get<unknown>(GATEWAY.ORDER.ORDER_BY_ID(id));
    // OrderController.get trả về MỘT `OrderResponse` trong envelope, không phải
    // danh sách: `unwrapList` trả về mảng rỗng và chi tiết đơn luôn trống.
    const dto = unwrap<OrderDto>(res);
    return dto ? mapOrderDtoToEntity(dto) : null;
  },

  /**
   * FR-21: the order's progress history, read only.
   */
  async getProgressUpdates(orderId: string): Promise<ProgressUpdate[]> {
    const res = await apiClient.get<unknown>(GATEWAY.ORDER.PROGRESS_UPDATES(orderId));
    return unwrapList<ProgressUpdateDto>(res).map(mapProgressUpdateDto);
  },

  /**
   * The state of a checkout (FR-09, AC-09.7).
   *
   * `GET /api/checkouts/{checkoutId}` answers the status and the ids of the
   * orders it created, one per Shop, once the payment succeeded. The result
   * page polls it while the status is still `PENDING_PAYMENT`.
   */
  async getCheckout(checkoutId: string): Promise<CheckoutDto | null> {
    const res = await apiClient.get<unknown>(GATEWAY.ORDER.CHECKOUT_BY_ID(checkoutId));
    const dto = unwrap<CheckoutDto>(res);
    return dto ?? null;
  },
};

/**
 * The orders of the caller, kept in the entity store so every screen
 * (account, vendor, overview) reads the same data.
 */
export function useOrders(): Order[] {
  const orders = useStore(orderStore);
  const [, setNonce] = useState(0);

  useEffect(() => {
    let current = true;
    orderApi
      .getOrders()
      .then((loaded) => {
        if (current && loaded.length > 0) {
          orderStore.set(loaded);
          setNonce((n) => n + 1);
        }
      })
      .catch(() => {
        // The screens that load the orders themselves show the error.
      });
    return () => {
      current = false;
    };
  }, []);

  return orders;
}

/** One order of the caller. */
export function useOrder(id: string): Order | undefined {
  const orders = useOrders();
  return orders.find((o) => o.id === id);
}
