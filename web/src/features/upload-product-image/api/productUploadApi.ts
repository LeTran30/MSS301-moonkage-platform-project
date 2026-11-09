import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import type { ProductUploadLink } from '@/entities/vendor';

/**
 * The write side of a product image upload (FR-29, AC-29.1).
 *
 * The vendor entity owns the read and the shape of the product; the write
 * lives here because it uploads a file, not the product data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Step 1 of an image upload (FR-29): ask the backend for a signed link, then
 * send the file to `uploadUrl` and keep the `tempKey`.
 *
 * The `tempKey` goes into `imageKeys` of the product that is created or
 * replaced afterwards.
 */
export async function createProductUploadLink(
  vendorId: string,
  contentType: string,
  sizeBytes: number,
): Promise<ProductUploadLink | null> {
  const res = await apiClient.post<unknown>(GATEWAY.VENDOR.PRODUCT_UPLOADS(vendorId), {
    contentType,
    sizeBytes,
  });
  return unwrap<ProductUploadLink>(res);
}
