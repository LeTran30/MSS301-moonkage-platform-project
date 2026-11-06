import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { vendorProductApi, type VendorProductDto } from '../api/vendorProductApi';

/**
 * The products of one shop, every status (FR-30).
 *
 * The seller sees the products the admin removed, so the list is not filtered.
 */
export function useVendorProducts(vendorId: string) {
  return useQueryData(
    queryKeys.vendor.products(vendorId),
    () =>
      vendorId
        ? vendorProductApi.getProducts(vendorId)
        // Chưa có id gian hàng (tài khoản chưa mở Shop) thì không gọi API:
        // `/api/vendors//products` là URL sai và backend trả lỗi.
        : Promise.resolve([] as VendorProductDto[]),
  );
}

/**
 * One product of a shop, with the `version` a replace must send back
 * (FR-32, FR-33 — the backend answers 409 VENDOR_027 when it changed).
 */
export function useVendorProduct(vendorId: string, productId: string | null) {
  return useQueryData(queryKeys.vendor.product(vendorId, productId), () =>
    productId
      ? vendorProductApi.getProduct(vendorId, productId)
      : Promise.resolve(null as VendorProductDto | null),
  );
}
