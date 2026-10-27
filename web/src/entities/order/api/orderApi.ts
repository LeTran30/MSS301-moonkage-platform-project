import { mockResponse, seedStore } from '@/shared/api/mock';
import type { Complaint, Order } from '../model/types';
import { seedComplaints, seedOrders } from './seed';

/** Not on the backend yet: answers from the seed (seed.ts); changes are kept in the demo store. */
export const orderStore = seedStore<Order[]>('buyer-orders', seedOrders);
export const complaintStore = seedStore<Complaint[]>('buyer-complaints', seedComplaints);

export function fetchOrders(): Promise<Order[]> {
  return mockResponse(orderStore.get());
}

export function fetchOrder(orderId: string): Promise<Order | null> {
  return mockResponse(orderStore.get().find((o) => o.id === orderId) ?? null);
}

export function fetchComplaintOfOrder(orderId: string): Promise<Complaint | null> {
  return mockResponse(complaintStore.get().find((c) => c.orderId === orderId) ?? null);
}
