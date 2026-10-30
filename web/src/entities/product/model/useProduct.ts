import { useAsync } from '@/shared/lib';
import { fetchProduct, fetchProductsByIds } from '../api/productApi';

export function useProduct(productId: string) {
  return useAsync(() => fetchProduct(productId), [productId]);
}

export function useProductsByIds(ids: string[]) {
  const key = [...ids].sort().join(',');
  return useAsync(() => fetchProductsByIds(key ? key.split(',') : []), [key]);
}
