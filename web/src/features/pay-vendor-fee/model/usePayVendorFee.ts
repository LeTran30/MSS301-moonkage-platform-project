import { useCallback } from 'react';
import { createRegistrationFeePayment } from '../api/payVendorFeeApi';

/**
 * The seller pays the registration fee that activates the shop (FR-42).
 */
export function usePayVendorFee(vendorId: string) {
  return useCallback(
    () => createRegistrationFeePayment(vendorId),
    [vendorId],
  );
}
