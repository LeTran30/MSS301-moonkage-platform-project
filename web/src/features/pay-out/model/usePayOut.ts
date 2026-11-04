import { useCallback } from 'react';
import { payOutLedger } from '../api/payOutApi';
import type { PayoutDto } from '@/entities/payment';

/**
 * The admin pays out a reviewed disbursement (FR-48).
 */
export function usePayOut() {
  return useCallback((orderId: string): Promise<PayoutDto | null> => payOutLedger(orderId), []);
}
