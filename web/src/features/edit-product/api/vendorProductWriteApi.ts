import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import type {
  SaveVendorProductPayload,
  UpdateVendorProductPayload,
  VendorProductDto,
} from '@/entities/vendor';

/**
 * The write side of a Shop's products (FR-29 to FR-34, FR-46).
 *
 * The vendor entity owns the read and the shape of the product; the writes
 * live here because they change the catalogue of the shop, not the product
 * data (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** FR-29: a new product, on sale at once (BR-24). */
export async function createVendorProduct(
  vendorId: string,
  payload: SaveVendorProductPayload
): Promise<VendorProductDto | null> {
  // Funnel người bán (FR-29). Chỉ ghi mã sản phẩm và hành động — không ghi
  // tên hay giá sản phẩm (NFR-03).
  trackEvent(ANALYTICS_EVENTS.saveProduct, { action: 'create' });

  const res = await apiClient.post<unknown>(GATEWAY.VENDOR.PRODUCTS(vendorId), payload);
  return unwrap<VendorProductDto>(res);
}

/**
 * FR-30, FR-32, FR-33: the whole product again, with the version read before
 * editing (409 VENDOR_027 when someone changed it since).
 */
export async function replaceVendorProduct(
  vendorId: string,
  productId: string,
  payload: SaveVendorProductPayload
): Promise<VendorProductDto | null> {
  trackEvent(ANALYTICS_EVENTS.saveProduct, { action: 'update' });

  const res = await apiClient.put<unknown>(
    GATEWAY.VENDOR.PRODUCT_BY_ID(vendorId, productId),
    payload
  );
  return unwrap<VendorProductDto>(res);
}

/**
 * FR-34 (owner: ON_SALE, HIDDEN) and FR-46 (admin: REMOVED with a reason).
 */
export async function updateVendorProductStatus(
  vendorId: string,
  productId: string,
  payload: UpdateVendorProductPayload
): Promise<VendorProductDto | null> {
  trackEvent(ANALYTICS_EVENTS.changeProductStatus, {
    action: payload.status,
  });

  const res = await apiClient.patch<unknown>(
    GATEWAY.VENDOR.PRODUCT_BY_ID(vendorId, productId),
    payload
  );
  return unwrap<VendorProductDto>(res);
}
