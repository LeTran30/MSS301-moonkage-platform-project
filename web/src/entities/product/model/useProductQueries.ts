import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { productApi } from '../api/productApi';

/**
 * The products of the catalogue for one province.
 *
 * `provinceCode` is mandatory on the backend (`@RequestParam String provinceCode`),
 * so the delivery province of the session is always sent.
 *
 * The query key includes the province, because the catalogue differs per region.
 */
export function useProductCatalogFor(provinceCode: string) {
  return useQueryData(queryKeys.product.catalog(provinceCode), () =>
    productApi.getProducts(provinceCode),
  );
}

/** One product of the catalogue (FR-03). */
export function useProductDetail(productId: string, provinceCode?: string) {
  return useQueryData(queryKeys.product.detail(productId, provinceCode), () =>
    productApi.getProductById(productId, provinceCode),
  );
}

/**
 * The reviews of a product (AC-11.3).
 *
 * The buyer reads them from catalog-service, so the product page shows every
 * review of the product and not only the ones of one order.
 */
export function useProductReviews(productId: string) {
  return useQueryData(queryKeys.product.reviews(productId), () =>
    productApi.getReviews(productId),
  );
}
