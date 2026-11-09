import { useEffect } from 'react';
import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { vendorCatalogApi } from '../api/vendorCatalogApi';
import { vendorStore } from './vendorStore';

/**
 * The vendors that take custom orders and deliver to the buyer's province, loaded from `quotation-service`.
 *
 * The backend filters suppliers by province, so the list follows the "Giao tới" province of the header. The entity
 * store keeps the last loaded list so every screen (home, list of suppliers, shop page) reads the same data. A
 * province no Shop delivers to empties the list instead of keeping the Shops of the previous province.
 */
export function useVendorCatalog(provinceCode: string): { kind: 'loading' | 'loaded' | 'error' } {
  const state = useQueryData(queryKeys.vendor.catalog(provinceCode), () =>
    vendorCatalogApi.getVendors(provinceCode),
  );

  // Dep là `data`, không phải `state` — xem giải thích ở `useProductCatalog`.
  const data = state.kind === 'loaded' ? state.data : null;
  useEffect(() => {
    if (data) {
      vendorStore.set(data);
    }
  }, [data]);

  if (state.kind === 'loading') return { kind: 'loading' };
  if (state.kind === 'error') return { kind: 'error' };
  return { kind: 'loaded' };
}
