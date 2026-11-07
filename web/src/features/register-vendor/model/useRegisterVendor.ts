import { useCallback } from 'react';
import { registerVendor } from '../api/registerVendorApi';
import { userStore } from '@/entities/user';
import type { SubmitVendorPayload, VendorDetailDto } from '@/entities/vendor';

/**
 * The seller submits the registration profile of the shop (FR-26).
 *
 * `entityType` is `HOUSEHOLD_BUSINESS` or `SOLE_PROPRIETORSHIP` (BR-33); the
 * documents carry the `objectKey` of the files uploaded beforehand. The session
 * then names the new Shop, so the seller channel opens without signing in again.
 */
export function useRegisterVendor() {
  return useCallback(async (payload: SubmitVendorPayload): Promise<VendorDetailDto | null> => {
    const vendor = await registerVendor(payload);
    if (vendor?.id) {
      userStore.set((prev) => ({ ...prev, vendorId: vendor.id, hasShop: true }));
    }
    return vendor;
  }, []);
}
