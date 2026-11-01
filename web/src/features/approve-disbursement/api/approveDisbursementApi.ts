import { disbursementRequestStore, ledgerPath, type DisbursementRequest } from '@/entities/payout';
import { apiClient } from '@/shared/api/client';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';

/** FR-47: approve the whole amount asked, or refuse with a reason. */
export async function decideDisbursement(request: DisbursementRequest, approve: boolean, refusal?: string): Promise<void> {
  if (!config.demoMode) {
    await apiClient.patch(`${ledgerPath(request.orderId)}/disbursements/${encodeURIComponent(request.id)}`, {
      status: approve ? 'APPROVED' : 'REJECTED',
      reason: approve ? undefined : refusal,
    });
    return;
  }
  disbursementRequestStore.update((list) => list.map((d) => (d.id === request.id ? { ...d, state: approve ? 'approved' : 'refused', refusal } : d)));
  await mockResponse(null);
}
