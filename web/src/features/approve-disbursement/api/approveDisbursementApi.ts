import { disbursementRequestStore, type DisbursementRequest } from '@/entities/payout';
import { mockResponse } from '@/shared/api/mock';

export function decideDisbursement(id: string, approve: boolean, refusal?: string): Promise<DisbursementRequest[]> {
  return mockResponse(
    disbursementRequestStore.update((list) => list.map((d) => (d.id === id ? { ...d, state: approve ? 'approved' : 'refused', refusal } : d))),
  );
}
