import { useAsync } from '../../../shared/ui';
import {
  createCustomOrder,
  createReadyOrders,
  fetchComplaintOfOrder,
  fetchOrder,
  fetchOrders,
  markRemainingPaid,
} from '../api/ordersApi';
import type { Complaint, CustomOrder, Order, OrderLine, ReadyOrder } from '../api/types';

export type { Complaint, CustomOrder, Order, OrderLine, ReadyOrder };
export { createCustomOrder, createReadyOrders, markRemainingPaid };

export function useOrders() {
  return useAsync(fetchOrders, []);
}

export function useOrder(orderId: string) {
  return useAsync(() => fetchOrder(orderId), [orderId]);
}

export function useComplaint(orderId: string) {
  return useAsync(() => fetchComplaintOfOrder(orderId), [orderId]);
}
