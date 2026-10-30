import { useAsync } from '@/shared/lib';
import { fetchFeaturedProducts, fetchProducts, fetchShopProducts } from '../api/catalogApi';

export function useFeaturedProducts(area: string) {
  return useAsync(() => fetchFeaturedProducts(area), [area]);
}

/** Every product delivered to `area`. */
export function useAreaProducts(area: string) {
  return useAsync(() => fetchProducts(area), [area]);
}

export function useShopProducts(shopId: string) {
  return useAsync(() => fetchShopProducts(shopId), [shopId]);
}
