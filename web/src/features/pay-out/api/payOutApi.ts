import { payoutStore } from '@/entities/payout';
import { mockResponse } from '@/shared/api/mock';

export function payOut(orderIds: string[]) {
  payoutStore.update((list) => list.map((p) => (orderIds.includes(p.orderId) ? { ...p, paid: true } : p)));
  return mockResponse(true);
}
