import { apiClient, type ApiResponse } from '@/shared/api/client';
import { cartApi } from '@/shared/api/gateway';
import type { CartLine } from '../model/cartModel';

/** order-service `CartResponse.Line`. */
interface CartLineDto {
  itemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  available: boolean;
}

/** order-service `CartResponse`: the cart split by Shop, fees to `provinceCode` (AC-09.1). */
interface CartResponseDto {
  provinceCode: string;
  groups: { vendorId: string; items: CartLineDto[] }[];
  totalAmount: number;
}

const toLine = (dto: CartLineDto): CartLine => ({ itemId: dto.itemId, productId: dto.productId, quantity: dto.quantity });

export async function fetchCartLines(provinceCode: string): Promise<CartLine[]> {
  const res = await apiClient.get<ApiResponse<CartResponseDto>>(cartApi, { params: { provinceCode } });
  return res.data.data.groups.flatMap((g) => g.items.map(toLine));
}

/** 409 CART_004 / CART_005 above the stock or at the quote threshold (AC-08.2). */
export async function addCartItem(productId: string, quantity: number): Promise<void> {
  await apiClient.post<ApiResponse<CartLineDto>>(`${cartApi}/items`, { productId, quantity });
}

export async function updateCartItem(itemId: string, quantity: number): Promise<void> {
  await apiClient.patch<ApiResponse<CartLineDto>>(`${cartApi}/items/${encodeURIComponent(itemId)}`, { quantity });
}

export async function removeCartItem(itemId: string): Promise<void> {
  await apiClient.delete(`${cartApi}/items/${encodeURIComponent(itemId)}`);
}
