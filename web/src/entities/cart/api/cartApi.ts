import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode, provinceCodeOf } from '@/shared/config';
import { cartStore, type CartState } from '../model/cartStore';
import type { CartItem } from '../model/cartStore';

/**
 * Wire shape of `com.moonkage.order.dto.response.CartResponse`.
 *
 * The cart is split by shop: every group carries its own delivery fee and its lines.
 * `provinceCode` is mandatory on the backend (`@RequestParam String provinceCode`).
 */
export interface CartDto {
  provinceCode?: string;
  groups?: Array<{
    vendorId: string;
    vendorName: string;
    deliverable?: boolean;
    interprovince?: boolean;
    shippingFee?: number | null;
    subtotal?: number;
    items?: Array<{
      itemId: string;
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      available?: boolean;
    }>;
  }>;
  totalAmount?: number;
}

/** Map the backend cart to the UI cart shape. */
export function mapCartDtoToEntity(dto: CartDto): CartState {
  return {
    groups: (dto.groups ?? []).map((group) => ({
      vendorId: group.vendorId,
      vendorName: group.vendorName,
      shippingFee: group.shippingFee ?? 0,
      items: (group.items ?? []).map((line) => ({
        itemId: line.itemId,
        productId: line.productId,
        name: line.productName,
        price: line.unitPrice,
        image: '/images/banh-nuong.jpg',
        vendorId: group.vendorId,
        vendorName: group.vendorName,
        quantity: line.quantity,
        stock: 0,
      })),
    })),
  };
}

export const cartApi = {
  /**
   * The caller's own multi-shop cart.
   *
   * This is the read side of the cart; the writes (`addCartItem`,
   * `updateCartItem`) belong to the `add-to-cart` feature
   * (package-architecture §3 — `api/` of a feature holds the writes).
   */
  async getMine(province?: string): Promise<CartState> {
    if (isDemoMode()) {
      return cartStore.get();
    }
    const params = new URLSearchParams({ provinceCode: provinceCodeOf(province) });
    const res = await apiClient.get<unknown>(`${GATEWAY.ORDER.CART}?${params.toString()}`);
    const dto = unwrap<CartDto>(res);
    return dto ? mapCartDtoToEntity(dto) : { groups: [] };
  },
};

/** Re-export for call sites that build a cart item from a product. */
export type { CartItem };
