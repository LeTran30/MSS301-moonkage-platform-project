import { useAsync } from '@/shared/lib';
import { fetchCakeAttributeLabels } from '../api/cakeAttributeApi';
import { fetchFeaturedProducts, fetchProducts, fetchShopProducts } from '../api/catalogApi';

export function useFeaturedProducts(area: string) {
  return useAsync(() => fetchFeaturedProducts(area), [area]);
}

/** Every product delivered to `area`. */
export function useAreaProducts(area: string) {
  return useAsync(() => fetchProducts(area), [area]);
}

/** The products of one shop delivered to `area`. */
export function useShopProducts(shopId: string, area: string) {
  return useAsync(() => fetchShopProducts(shopId, area), [shopId, area]);
}

/** Labels of the crust and filling codes, in the order vendor-service keeps them. */
export function useCakeAttributeLabels() {
  return useAsync(() => fetchCakeAttributeLabels(), []);
}
