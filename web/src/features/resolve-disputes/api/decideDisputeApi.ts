import { disputeStore, type Dispute } from '@/entities/dispute';
import { apiClient } from '@/shared/api/client';
import { ordersPath } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { disputeDecisionLabel, type DisputeDecisionCode } from '@/shared/config/disputes';
import { config } from '@/shared/config/env';
import { today } from '@/shared/utils/format';

/**
 * FR-49: the admin's decision. A full refund gives back the order total and a partial one `amount`, both from what
 * the platform still holds (the server checks it).
 */
export async function decideDispute(d: Dispute, decision: DisputeDecisionCode, amount: number, note: string): Promise<void> {
  if (!config.demoMode) {
    await apiClient.patch(`${ordersPath}/${encodeURIComponent(d.orderId)}/dispute`, {
      decision,
      refundAmount: decision === 'PARTIAL_REFUND' ? amount : undefined,
      decisionReason: note,
    });
    return;
  }
  const kind = disputeDecisionLabel(decision);
  disputeStore.update((list) =>
    list.map((x) =>
      x.id === d.id
        ? { ...x, state: 'decided', decision: { kind, amount, note, at: today() }, history: [{ label: 'Quản trị quyết định', at: today() }, ...x.history] }
        : x,
    ),
  );
  await mockResponse(null);
}
