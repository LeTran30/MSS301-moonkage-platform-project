import { useAsync } from '@/shared/lib';
import { fetchComplaintOfOrder, fetchOrder, fetchOrders } from '../api/orderApi';

export function useOrders() {
  return useAsync(fetchOrders, []);
}

export function useOrder(orderId: string) {
  return useAsync(() => fetchOrder(orderId), [orderId]);
}

export function useComplaint(orderId: string) {
  return useAsync(() => fetchComplaintOfOrder(orderId), [orderId]);
}
