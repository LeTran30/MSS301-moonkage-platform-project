import { createStore, useStore } from '@/shared/lib';

export type CartItem = {
  /** `itemId` của backend (undefined khi món mới chưa được đồng bộ lên server). */
  itemId?: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  stock: number;
  bulkQuoteThreshold?: number;
};

// FR-08, BR-29: Giỏ hàng tách theo Shop, phí giao từng Shop
export type ShopCartGroup = {
  vendorId: string;
  vendorName: string;
  shippingFee: number;
  items: CartItem[];
};

export type CartState = {
  groups: ShopCartGroup[];
};

// The server holds the cart; the store mirrors it for the header badge.
const INITIAL_CART: CartState = { groups: [] };

export const cartStore = createStore<CartState>(INITIAL_CART, 'moonkage_cart');

export function useCart() {
  return useStore(cartStore);
}

export function useCartTotalCount() {
  const cart = useCart();
  return cart.groups.reduce((acc, g) => acc + g.items.reduce((s, it) => s + it.quantity, 0), 0);
}

/**
 * Đồng bộ giỏ hàng từ backend.
 *
 * Giá và phí giao luôn lấy từ server (nguồn sự thật của FR-08); ngưỡng sỉ của
 * món chỉ có ở phía UI nên được giữ lại khi đồng bộ.
 */
export function syncCart(remote: CartState) {
  cartStore.set((prev) => ({
    groups: remote.groups.map((group) => {
      const local = prev.groups.find((g) => g.vendorId === group.vendorId);
      return {
        ...group,
        items: group.items.map((item) => ({
          ...item,
          bulkQuoteThreshold:
            local?.items.find((it) => it.productId === item.productId)?.bulkQuoteThreshold,
        })),
      };
    }),
  }));
}

/**
 * Add a line to the local cart (FR-08).
 *
 * The store stays pure: the write to the backend belongs to the
 * `add-to-cart` feature, so the model layer never imports the API layer.
 */
export function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1) {
  cartStore.set((prev) => {
    const groups = [...prev.groups];
    const groupIdx = groups.findIndex((g) => g.vendorId === item.vendorId);
    if (groupIdx === -1) {
      groups.push({
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        shippingFee: 25000,
        items: [{ ...item, quantity: qty }],
      });
    } else {
      const g = { ...groups[groupIdx] };
      const items = [...g.items];
      const itemIdx = items.findIndex((it) => it.productId === item.productId);
      if (itemIdx === -1) {
        items.push({ ...item, quantity: qty });
      } else {
        items[itemIdx] = { ...items[itemIdx], quantity: items[itemIdx].quantity + qty };
      }
      g.items = items;
      groups[groupIdx] = g;
    }
    return { groups };
  });
}

/** What the feature needs to mirror the change on the backend. */
export type CartLineChange = { itemId?: string; quantity: number };

/**
 * Change the quantity of one line in the local cart.
 *
 * Returns the `itemId` the server knows (when the line was synced before) so
 * the caller can send the same change to the backend.
 */
export function updateCartQuantity(productId: string, quantity: number): CartLineChange {
  let changedItemId: string | undefined;
  let changedQuantity = quantity;

  cartStore.set((prev) => {
    if (quantity <= 0) {
      const removed = prev.groups.flatMap((g) => g.items).find((it) => it.productId === productId);
      changedItemId = removed?.itemId;
      changedQuantity = 0;
      return {
        groups: prev.groups
          .map((g) => ({ ...g, items: g.items.filter((it) => it.productId !== productId) }))
          .filter((g) => g.items.length > 0),
      };
    }
    const target = prev.groups.flatMap((g) => g.items).find((it) => it.productId === productId);
    changedItemId = target?.itemId;
    return {
      groups: prev.groups.map((g) => ({
        ...g,
        items: g.items.map((it) => (it.productId === productId ? { ...it, quantity } : it)),
      })),
    };
  });

  return { itemId: changedItemId, quantity: changedQuantity };
}

export function clearCart() {
  cartStore.set({ groups: [] });
}
