import { disbursementStore, type Disbursement } from '@/entities/payout';
import { mockResponse } from '@/shared/api/mock';

export function requestDisbursement(orderId: string, milestone: string, amount: number) {
  disbursementStore.update((list) => [{ orderId, milestone, amount, heldAfter: 0, state: 'Chờ quản trị duyệt' } as Disbursement, ...list]);
  return mockResponse(true);
}
