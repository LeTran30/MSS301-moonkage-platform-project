import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import type { SubmitVendorPayload, VendorDetailDto } from '@/entities/vendor';

/**
 * The write side of the vendor registration (FR-26).
 *
 * The vendor entity owns the read and the shape of the vendor; the write lives
 * here because it registers the shop, not the vendor data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Submit a vendor registration. */
export async function registerVendor(
  payload: SubmitVendorPayload
): Promise<VendorDetailDto | null> {
  if (isDemoMode()) {
    return null;
  }
  const res = await apiClient.post<unknown>(GATEWAY.VENDOR.REGISTER, payload);
  return unwrap<VendorDetailDto>(res);
}
