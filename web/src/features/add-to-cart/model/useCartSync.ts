import { addCartItem, updateCartItem } from '../api/cartWriteApi';

/**
 * Mirror a local cart change on the backend (BR-28).
 *
 * A network failure must not block the local action, so the caller swallows
 * the rejection on purpose.
 */
export function syncCartLineToBackend(itemId: string | undefined, quantity: number): void {
  if (!itemId) return;
  void updateCartItem(itemId, quantity).catch(() => undefined);
}

/** Send a new line to the backend (BR-28). */
export function syncCartAddToBackend(productId: string, quantity: number): void {
  void addCartItem({ productId, quantity }).catch(() => undefined);
}
