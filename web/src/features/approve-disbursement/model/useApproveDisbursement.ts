import { useCallback } from 'react';
import { reviewDisbursement, type ReviewDisbursementPayload } from '../api/approveDisbursementApi';
import type { DisbursementDto } from '@/entities/payment';

/**
 * The admin approves or refuses a disbursement request (FR-47).
 */
export function useApproveDisbursement() {
  return useCallback(
    (
      orderId: string,
      requestId: string,
      payload: ReviewDisbursementPayload
    ): Promise<DisbursementDto | null> =>
      reviewDisbursement(orderId, requestId, payload),
    [],
  );
}
