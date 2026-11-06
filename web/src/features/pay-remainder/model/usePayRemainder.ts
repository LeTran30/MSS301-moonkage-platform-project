import { useCallback } from 'react';
import { payOrderRemainder } from '../api/payRemainderApi';
import type { PaymentLinkResponse } from '@/entities/order';

/**
 * FR-22: the buyer pays the rest of a delivered custom order.
 *
 * The backend answers the VNPay page to redirect to.
 */
export function usePayRemainder() {
  return useCallback(
    (orderId: string): Promise<PaymentLinkResponse> => payOrderRemainder(orderId),
    [],
  );
}
