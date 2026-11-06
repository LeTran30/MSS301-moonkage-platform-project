import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { getAccessToken } from '@/shared/api/tokenVault';
import { provinceCodeOf } from '@/shared/config';
import { type CartState } from '../model/cartTypes';
import type { CartItem } from '../model/cartTypes';

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
        image: '',
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
    /*
     * `GET /api/carts/me` là API của **tài khoản đang đăng nhập**: khách
     * (không có token) không có giỏ nào. Gọi API lúc đó chỉ nhận 401 và làm
     * trang giỏ hiện "Network Error" thay vì trạng thái rỗng — nên bỏ qua
     * request và trả giỏ rỗng ngay.
     */
    if (!getAccessToken()) {
      return { groups: [] };
    }

    const params = new URLSearchParams({
      provinceCode: provinceCodeOf(province),
    });
    const res = await apiClient.get<unknown>(`${GATEWAY.ORDER.CART}?${params.toString()}`);
    const dto = unwrap<CartDto>(res);
    return dto ? mapCartDtoToEntity(dto) : { groups: [] };
  },
};

/** Re-export for call sites that build a cart item from a product. */
export type { CartItem };
