import { shortCode } from '@/shared/utils';

/** How an order is named on screen: the order ID is a UUID, too long to read or say over the phone. */
export function orderCode(orderId: string): string {
  return shortCode(orderId);
}
