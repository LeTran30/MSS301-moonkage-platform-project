import { useEffect } from 'react';
import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { productApi } from '../api/productApi';
import { productStore, taxonomyStore } from './productStore';

/**
 * The products of the catalogue, loaded from `catalog-service`.
 *
 * The entity store keeps the last loaded list so every screen (home, shop page,
 * cart) reads the same data. The store is only *seeded* here; the screens that
 * need an explicit loading/error state use `productApi` directly.
 *
 * `provinceCode` is mandatory on the backend (`@RequestParam String provinceCode`),
 * so the delivery province of the session is always sent. The caller passes it in
 * because an entity must not import another entity (package-architecture §3).
 *
 * The query key is the **same** as the one `useProductCatalogFor` uses, so the
 * bootstrap and the catalogue page share one cache entry: the API is called once,
 * not twice.
 */
export function useProductCatalog(provinceCode: string): {
  kind: 'loading' | 'loaded' | 'error';
} {
  const state = useQueryData(queryKeys.product.catalog(provinceCode), () =>
    productApi.getProducts(provinceCode),
  );

  // Dep phải là `data` chứ không phải `state`: `useQueryData` trả về một object
  // mới mỗi lần render, nên `[state]` sẽ chạy effect mỗi lần render → set store
  // → store thông báo → render lại → vòng lặp vô hạn.
  const products = state.kind === 'loaded' ? state.data : null;
  useEffect(() => {
    if (products && products.length > 0) {
      productStore.set(products);
    }
  }, [products]);

  if (state.kind === 'loading') return { kind: 'loading' };
  if (state.kind === 'error') return { kind: 'error' };
  return { kind: 'loaded' };
}

/**
 * The catalogue of crusts and fillings (FR-54), owned by `vendor-service`.
 *
 * The taxonomy store is seeded so the buyer filter, the seller picker and the
 * admin screen all show the same labels and order.
 */
export function useTaxonomyCatalog(): { kind: 'loading' | 'loaded' | 'error' } {
  const state = useQueryData(queryKeys.product.taxonomy(), () => productApi.getTaxonomy());

  // Xem giải thích ở `useProductCatalog`: dep là `data`, không phải `state`.
  const taxonomy = state.kind === 'loaded' ? state.data : null;
  useEffect(() => {
    if (taxonomy) {
      taxonomyStore.set(taxonomy);
    }
  }, [taxonomy]);

  if (state.kind === 'loading') return { kind: 'loading' };
  if (state.kind === 'error') return { kind: 'error' };
  return { kind: 'loaded' };
}
