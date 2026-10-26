import { useAsync } from '../../../shared/ui';
import { fetchComplaintOfOrder, fetchOrder, fetchOrders } from '../api/ordersApi';

export function useOrders() {
  return useAsync(fetchOrders, []);
}

export function useOrder(orderId: string) {
  return useAsync(() => fetchOrder(orderId), [orderId]);
}

export function useComplaint(orderId: string) {
  return useAsync(() => fetchComplaintOfOrder(orderId), [orderId]);
}
