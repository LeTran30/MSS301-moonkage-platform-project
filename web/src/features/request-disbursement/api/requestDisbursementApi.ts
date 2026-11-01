import { DISBURSEMENT_PURPOSES, disbursementStore, ledgerPath, type Disbursement } from '@/entities/payout';
import { apiClient } from '@/shared/api/client';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';

export type DisbursementPurpose = (typeof DISBURSEMENT_PURPOSES)[number]['code'];

/** FR-41: part of a held deposit, for one purpose; an admin approves it (FR-47). */
export async function requestDisbursement(orderId: string, purpose: DisbursementPurpose, amount: number, heldNow: number) {
  if (!config.demoMode) {
    await apiClient.post(`${ledgerPath(orderId)}/disbursements`, { amount, purpose });
    return;
  }
  const milestone = DISBURSEMENT_PURPOSES.find((p) => p.code === purpose)?.label ?? purpose;
  disbursementStore.update((list) => [{ orderId, milestone, amount, heldAfter: heldNow - amount, state: 'Chờ quản trị duyệt' } as Disbursement, ...list]);
  await mockResponse(true);
}
