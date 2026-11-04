import { useCallback } from 'react';
import { resolveDispute, type ResolveDisputePayload } from '../api/resolveDisputeApi';
import type { Dispute } from '@/entities/dispute';

/**
 * The admin decides a dispute (FR-49).
 *
 * The page owns the form; this model owns the write.
 */
export function useResolveDispute() {
  return useCallback(
    (orderId: string, payload: ResolveDisputePayload): Promise<Dispute> =>
      resolveDispute(orderId, payload),
    [],
  );
}
