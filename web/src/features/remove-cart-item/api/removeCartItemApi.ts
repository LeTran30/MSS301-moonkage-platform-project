import { apiClient, GATEWAY } from '@/shared/api';
import { isDemoMode } from '@/shared/config';

/**
 * The write side of the cart (FR-08, BR-28).
 *
 * The cart entity owns the read (`getMine`) and the shape of the cart; the
 * writes live here because they change the buyer's cart, not the cart data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Remove a line from the cart.
 *
 * `DELETE /api/carts/me/items/{itemId}` answers 204, so there is nothing to
 * unwrap.
 */
export async function removeCartItem(itemId: string): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  await apiClient.delete(GATEWAY.ORDER.CART_ITEM(itemId));
}
