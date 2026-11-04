import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { cartApi } from '../api/cartApi';

/**
 * The cart of the caller for one province (FR-08).
 *
 * The backend groups the cart by shop; the province decides the shipping fee.
 */
export function useCartFor(provinceCode: string) {
  return useQueryData(queryKeys.cart.mine(provinceCode), () => cartApi.getMine(provinceCode));
}
