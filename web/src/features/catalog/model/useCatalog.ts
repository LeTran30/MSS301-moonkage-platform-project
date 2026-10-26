import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsync } from '../../../shared/ui';
import { fetchFeaturedProducts, fetchProduct, fetchProducts, fetchProductsByIds, fetchShopProducts } from '../api/catalogApi';
import { applyFilters, parseFilters, toSearchParams, type ProductFilters } from './filters';

export function useFeaturedProducts(area: string) {
  return useAsync(() => fetchFeaturedProducts(area), [area]);
}

export function useProduct(productId: string) {
  return useAsync(() => fetchProduct(productId), [productId]);
}

/** Products of `area` with the URL's filters applied, the filters themselves, and a setter that writes the URL. */
export function useProductSearch(area: string) {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const all = useAsync(() => fetchProducts(area), [area]);

  const setFilters = (next: ProductFilters) => setParams(toSearchParams(next), { replace: true });
  const results = all.kind === 'loaded' ? applyFilters(all.data, filters) : [];

  return { all, filters, setFilters, results };
}

export function useProductsByIds(ids: string[]) {
  const key = [...ids].sort().join(',');
  return useAsync(() => fetchProductsByIds(key ? key.split(',') : []), [key]);
}

export function useShopProducts(shopId: string) {
  return useAsync(() => fetchShopProducts(shopId), [shopId]);
}
