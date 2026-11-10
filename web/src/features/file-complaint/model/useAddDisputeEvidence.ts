import { useCallback } from 'react';
import { addDisputeEvidence } from '../api/openDisputeApi';
import type { Dispute } from '@/entities/dispute';

/**
 * The buyer or the Shop adds one piece of evidence to an open dispute (AC-49.1).
 *
 * The backend tells the two apart by the caller: the buyer's evidence is `BUYER`,
 * the Shop owner's is `VENDOR`.
 */
export function useAddDisputeEvidence() {
  return useCallback(
    (orderId: string, payload: { tempKey: string; note?: string }): Promise<Dispute> =>
      addDisputeEvidence(orderId, payload),
    [],
  );
}
