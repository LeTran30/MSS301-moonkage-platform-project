import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { vendorAdminApi, vendorProductApi, type VendorProductDto } from '@/entities/vendor';

/** A vendor product plus the name of its shop, for the admin's platform-wide list. */
export type AdminProductRow = VendorProductDto & { vendorName: string };

/**
 * Every product of the platform, with the name of its shop (FR-46).
 *
 * `catalog-service` only publishes the `ON_SALE` products; every status lives
 * in `vendor-service` (`GET /api/vendors/{vendorId}/products`). The admin reads
 * the shops first, then the products of each shop.
 */
export function usePlatformProducts() {
  return useQueryData(queryKeys.platformProduct.list(), async (): Promise<AdminProductRow[]> => {
    const vendors = await vendorAdminApi.searchVendors();
    const perVendor = await Promise.all(
      vendors.map(async (vendor): Promise<AdminProductRow[]> => {
        const products = await vendorProductApi.getProducts(vendor.id);
        return products.map((product) => ({ ...product, vendorName: vendor.businessName || '' }));
      }),
    );
    return perVendor.flat();
  });
}
