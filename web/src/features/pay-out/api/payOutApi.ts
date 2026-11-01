import { ledgerPath, payoutStore } from '@/entities/payout';
import { apiClient } from '@/shared/api/client';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';

/** FR-48: pays each order's vendor once; the server refuses one that is not payable (dispute, window open). */
export async function payOut(orderIds: string[]): Promise<void> {
  if (!config.demoMode) {
    // one by one: a refusal stops the batch with the server's reason, the orders before it stay paid
    for (const orderId of orderIds) await apiClient.put(`${ledgerPath(orderId)}/payout`);
    return;
  }
  payoutStore.update((list) => list.map((p) => (orderIds.includes(p.orderId) ? { ...p, paid: true } : p)));
  await mockResponse(true);
}
