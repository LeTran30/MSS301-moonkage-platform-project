import { shortCode } from '@/shared/utils';

/** How a quote request is named on screen, the same way as an order: the ID is a UUID. */
export function requestCode(requestId: string): string {
  return shortCode(requestId);
}
