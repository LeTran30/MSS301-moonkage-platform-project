import { useCallback } from 'react';
import { registerVendor } from '../api/registerVendorApi';
import type { SubmitVendorPayload, VendorDetailDto } from '@/entities/vendor';

/**
 * The seller submits the registration profile of the shop (FR-26).
 *
 * `entityType` is `HOUSEHOLD_BUSINESS` or `SOLE_PROPRIETORSHIP` (BR-33); the
 * documents carry the `objectKey` of the files uploaded beforehand.
 */
export function useRegisterVendor() {
  return useCallback(
    (payload: SubmitVendorPayload): Promise<VendorDetailDto | null> =>
      registerVendor(payload),
    [],
  );
}
