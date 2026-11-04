import { apiClient, GATEWAY } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';

/**
 * The write side of the cart (FR-08, BR-28).
 *
 * The cart entity owns the read (`getMine`) and the shape of the cart; the
 * writes live here because they change the buyer's cart, not the cart data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Add a line. The backend answers the created `CartResponse.Line`. */
export async function addCartItem(item: { productId: string; quantity: number }): Promise<void> {
  // Funnel: "thêm vào giỏ" là bước đo được quan trọng nhất của hành trình
  // mua. Chỉ ghi mã sản phẩm và số lượng — không ghi giá hay tên sản phẩm
  // (NFR-03).
  trackEvent(ANALYTICS_EVENTS.addToCart, {
    product_id: item.productId,
    quantity: item.quantity,
  });

  if (isDemoMode()) {
    return;
  }
  await apiClient.post(GATEWAY.ORDER.CART_ITEMS, item);
}

/** Change the quantity of a line. */
export async function updateCartItem(itemId: string, quantity: number): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  await apiClient.patch(GATEWAY.ORDER.CART_ITEM(itemId), { quantity });
}
