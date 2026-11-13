import { useCallback } from 'react';
import { payOutLedger } from '../api/payOutApi';
import type { PayoutDto } from '@/entities/payment';

/**
 * The admin pays the final held balance after the order becomes payable (FR-48).
 */
export function usePayOut() {
  return useCallback((orderId: string): Promise<PayoutDto | null> => payOutLedger(orderId), []);
}
