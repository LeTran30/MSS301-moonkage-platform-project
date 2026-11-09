import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import type {
  SaveOrderProfilePayload,
  SubmitVendorPayload,
  UpdateVendorPayload,
  VendorDetailDto,
} from '@/entities/vendor';

/**
 * The write side of the vendor settings (AC-27.2, AC-29.2, FR-28, FR-35).
 *
 * The vendor entity owns the read and the shape of the vendor; the writes live
 * here because they change the shop profile, not the vendor data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Replace the vendor's order terms (FR-35). */
export async function saveOrderProfile(
  vendorId: string,
  payload: SaveOrderProfilePayload,
): Promise<void> {
  await apiClient.put(GATEWAY.VENDOR.ORDER_PROFILE(vendorId), payload);
}

/** Replace the whole list of provinces the vendor delivers to (FR-28). */
export async function saveDeliveryAreas(vendorId: string, provinceCodes: string[]): Promise<void> {
  await apiClient.put(GATEWAY.VENDOR.DELIVERY_AREAS(vendorId), {
    provinceCodes,
  });
}

/** The owner's local delivery fee, or the admin's lock decision (FR-28, FR-46). */
export async function updateVendor(
  vendorId: string,
  payload: UpdateVendorPayload,
): Promise<VendorDetailDto | null> {
  const res = await apiClient.patch<unknown>(GATEWAY.VENDOR.BY_ID(vendorId), payload);
  return unwrap<VendorDetailDto>(res);
}

/**
 * AC-27.2: the owner resubmits a profile the admin asked for (NEEDS_INFO or
 * REJECTED) — `PUT /api/vendors/{vendorId}` with the whole profile again.
 *
 * The `documents` keep their current `objectKey`; the backend refuses a key
 * that is neither a temp key nor a current document.
 */
export async function resubmitVendorProfile(
  vendorId: string,
  payload: SubmitVendorPayload,
): Promise<VendorDetailDto | null> {
  const res = await apiClient.put<unknown>(GATEWAY.VENDOR.BY_ID(vendorId), payload);
  return unwrap<VendorDetailDto>(res);
}
