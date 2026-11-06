import { useCallback } from 'react';
import { openDispute, type OpenDisputePayload } from '../api/openDisputeApi';
import type { Dispute } from '@/entities/dispute';

/**
 * The buyer opens a dispute on an order (FR-12).
 *
 * The page owns the form; this model owns the write.
 */
export function useOpenDispute() {
  return useCallback(
    (orderId: string, payload: OpenDisputePayload): Promise<Dispute> =>
      openDispute(orderId, payload),
    [],
  );
}
