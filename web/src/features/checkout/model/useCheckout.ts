import { useCallback } from 'react';
import { checkoutOrder } from '../api/checkoutApi';
import type { CheckoutResponse, CreateCheckoutPayload } from '@/entities/order';

/**
 * Pay the whole cart once (FR-08).
 *
 * The backend answers the VNPay page to redirect the buyer to.
 */
export function useCheckout() {
  return useCallback(
    (payload: CreateCheckoutPayload): Promise<CheckoutResponse> => checkoutOrder(payload),
    [],
  );
}
