import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import type { CreateVendorReviewPayload, VendorReviewDto } from '@/entities/vendor';

/**
 * The write side of the admin's review of a vendor application (FR-45).
 *
 * The vendor entity owns the read and the shape of the vendor; the write lives
 * here because it decides the application, not the vendor data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * The admin's decision on a pending profile (FR-45).
 *
 * Creating a review moves the vendor to the decided status.
 */
export async function createVendorReview(
  vendorId: string,
  payload: CreateVendorReviewPayload,
): Promise<VendorReviewDto | null> {
  const res = await apiClient.post<unknown>(GATEWAY.VENDOR.REVIEWS(vendorId), payload);
  return unwrap<VendorReviewDto>(res);
}
