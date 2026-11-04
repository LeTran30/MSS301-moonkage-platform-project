import { useEffect } from 'react';
import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { vendorCatalogApi } from '../api/vendorCatalogApi';
import { vendorStore } from './vendorStore';

/**
 * The vendors that take custom orders, loaded from `quotation-service`.
 *
 * The entity store keeps the last loaded list so every screen (home, list of
 * suppliers, shop page) reads the same data.
 */
export function useVendorCatalog(): { kind: 'loading' | 'loaded' | 'error' } {
  const state = useQueryData(queryKeys.vendor.catalog(), () => vendorCatalogApi.getVendors());

  // Dep là `data`, không phải `state` — xem giải thích ở `useProductCatalog`.
  const data = state.kind === 'loaded' ? state.data : null;
  useEffect(() => {
    if (data && data.length > 0) {
      vendorStore.set(data);
    }
  }, [data]);

  if (state.kind === 'loading') return { kind: 'loading' };
  if (state.kind === 'error') return { kind: 'error' };
  return { kind: 'loaded' };
}
