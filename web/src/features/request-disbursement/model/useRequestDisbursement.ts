import { useCallback } from 'react';
import { requestDisbursement } from '../api/requestDisbursementApi';
import type { CreateDisbursementPayload, DisbursementDto } from '@/entities/payment';

/**
 * The seller asks for a disbursement of an escrow ledger (FR-45).
 */
export function useRequestDisbursement() {
  return useCallback(
    (
      orderId: string,
      payload: CreateDisbursementPayload
    ): Promise<DisbursementDto | null> => requestDisbursement(orderId, payload),
    [],
  );
}
