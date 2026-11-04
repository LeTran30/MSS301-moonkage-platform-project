import { useCallback } from 'react';
import { vendorProductApi, type VendorProductDto } from '@/entities/vendor';

/**
 * Load one product of a shop, with the `version` a replace must send back
 * (FR-30, FR-32, FR-33 — the backend answers 409 VENDOR_027 when it changed).
 */
export function useLoadVendorProduct() {
  return useCallback(
    (vendorId: string, productId: string): Promise<VendorProductDto | null> =>
      vendorProductApi.getProduct(vendorId, productId),
    [],
  );
}
